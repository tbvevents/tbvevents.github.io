// Trang quản trị: nạp / sửa / xoá nhân viên, gỡ liên kết Gmail ↔ MSNV, loại kết quả, xuất bảng điểm.
// Quyền admin do firestore.rules kiểm tra (collection admins), trang này chỉ là giao diện.
import {
  doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, updateDoc, collection, query, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { isConfigured, db } from './firebase.js';
import { BANK, TOPICS } from './minigame/quiz-bank.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const show = (id) => ['a-login', 'a-denied', 'a-panel'].forEach((s) => { $(`#${s}`).hidden = s !== id; });

const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 4200);
}

if (!isConfigured) {
  document.querySelector('.mg-main').innerHTML = '<section class="card mg-card"><h2>Chưa cấu hình</h2><p>Điền <code>FIREBASE</code> trong assets/js/config.js trước.</p></section>';
} else {
  start();
}

async function start() {
  const api = await import('./minigame/api.js');

  $('#btn-login').addEventListener('click', () => api.signIn().catch((e) => toast(e.message)));
  $('#btn-logout').addEventListener('click', () => api.logOut());

  let myEmail = '';
  let myRoot = false;
  api.onUser(async (user) => {
    myEmail = user?.email ?? '';
    myRoot = false;
    if (!user) { $('#who').hidden = true; show('a-login'); return; }
    $('#who-email').textContent = user.email;
    $('#who').hidden = false;
    const snap = await getDoc(doc(db, 'admins', user.email)).catch(() => null);
    const ok = !!snap?.exists();
    // admin gốc: tạo tay trong Console nên không có addedBy
    myRoot = ok && !snap.data().addedBy;
    $('#admin-add').hidden = !myRoot;
    show(ok ? 'a-panel' : 'a-denied');
  });

  /* ── 1 · nạp CSV ── */
  let rows = [];
  $('#csv').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { valid, invalid } = parseCsv(await file.text(), api.normalizeMsnv);
    rows = valid;
    $('#csv-preview').innerHTML = `Hợp lệ: <b>${valid.length}</b> nhân viên.`
      + (valid.length ? ` VD: ${valid.slice(0, 3).map((r) => `${esc(r.msnv)} – ${esc(r.name)}`).join('; ')}.` : '')
      + (invalid.length ? `<br>Bỏ qua ${invalid.length} dòng không hợp lệ (dòng ${invalid.slice(0, 10).join(', ')}${invalid.length > 10 ? '…' : ''}).` : '');
    $('#btn-import').disabled = !valid.length;
  });

  $('#btn-import').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      // tối đa 500 thao tác mỗi batch
      for (let i = 0; i < rows.length; i += 450) {
        const batch = writeBatch(db);
        for (const r of rows.slice(i, i + 450)) batch.set(doc(db, 'employees', r.msnv), { name: r.name }, { merge: true });
        await batch.commit();
        $('#csv-preview').textContent = `Đã nạp ${Math.min(i + 450, rows.length)} / ${rows.length}…`;
      }
      toast(`Đã nạp ${rows.length} nhân viên.`);
    } catch (err) {
      console.warn(err);
      toast('Nạp thất bại: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  });

  /* ── 2 · tra cứu, sửa, xoá & gỡ liên kết ── */
  /** Đổi họ tên; nếu đã có điểm thì đổi luôn tên trên bảng điểm. Trả về false nếu tên trống. */
  async function renameEmployee(msnv, claimedBy, newName) {
    const name = String(newName ?? '').trim();
    if (!name) { toast('Họ tên không được để trống.'); return false; }
    const batch = writeBatch(db);
    batch.update(doc(db, 'employees', msnv), { name });
    if (claimedBy && (await getDoc(doc(db, 'scores', claimedBy))).exists()) batch.update(doc(db, 'scores', claimedBy), { name });
    await batch.commit();
    toast(`Đã đổi tên ${msnv} thành ${name}.`);
    return true;
  }

  /** Xoá nhân viên (hỏi xác nhận trước); nếu đã liên kết Gmail thì xoá luôn tài khoản và điểm. */
  async function removeEmployee(msnv, name, claimedBy) {
    const msg = claimedBy
      ? `Xoá nhân viên ${name} (${msnv})? MSNV này đã liên kết Gmail — liên kết và điểm cũng sẽ bị xoá.`
      : `Xoá nhân viên ${name} (${msnv})?`;
    if (!confirm(msg)) return false;
    const batch = writeBatch(db);
    batch.delete(doc(db, 'employees', msnv));
    if (claimedBy) {
      batch.delete(doc(db, 'users', claimedBy));
      batch.delete(doc(db, 'scores', claimedBy));
    }
    await batch.commit();
    toast(`Đã xoá ${msnv}.`);
    return true;
  }

  $('#lookup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msnv = api.normalizeMsnv($('#lookup-msnv').value);
    const out = $('#lookup-result');
    const emp = await getDoc(doc(db, 'employees', msnv));
    if (!emp.exists()) { out.innerHTML = `<p>Không có MSNV <b>${esc(msnv)}</b> trong danh sách.</p>`; return; }
    const { name, claimedBy = null } = emp.data();
    const [u, s] = claimedBy
      ? await Promise.all([getDoc(doc(db, 'users', claimedBy)), getDoc(doc(db, 'scores', claimedBy))])
      : [null, null];
    out.innerHTML = `
      <p><b>${esc(name)}</b> — ${claimedBy
        ? `liên kết với <b>${esc(u.data()?.email ?? '(không rõ)')}</b>, tổng điểm ${s.data()?.total ?? 0}.`
        : 'chưa liên kết Gmail.'}</p>
      <div class="claim-form"><div class="row">
        <input id="edit-name" value="${esc(name)}" autocomplete="off" aria-label="Họ tên" />
        <button class="btn btn-small" id="btn-rename" type="button">Lưu tên</button>
      </div></div>
      <div class="actions">
        ${claimedBy ? '<button class="btn btn-ghost btn-small" id="btn-unlink" type="button">Gỡ liên kết (xoá điểm)</button>' : ''}
        <button class="btn btn-ghost btn-small" id="btn-remove" type="button">Xoá nhân viên</button>
      </div>`;
    $('#btn-rename').addEventListener('click', () => renameEmployee(msnv, claimedBy, $('#edit-name').value).catch((err) => toast(err.message)));
    $('#btn-remove').addEventListener('click', async () => {
      try {
        if (await removeEmployee(msnv, name, claimedBy)) out.innerHTML = `<p>Đã xoá <b>${esc(msnv)}</b> khỏi danh sách.</p>`;
      } catch (err) { toast(err.message); }
    });
    $('#btn-unlink')?.addEventListener('click', async () => {
      if (!confirm(`Gỡ liên kết MSNV ${msnv} khỏi ${u.data()?.email}? Điểm của MSNV này sẽ bị xoá.`)) return;
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', claimedBy));
      batch.delete(doc(db, 'scores', claimedBy));
      batch.update(doc(db, 'employees', msnv), { claimedBy: null });
      await batch.commit();
      out.innerHTML = `<p>Đã gỡ liên kết <b>${esc(msnv)}</b>. Nhân viên có thể đăng nhập và nhận lại.</p>`;
    });
  });

  /* ── danh sách nhân viên ── */
  let emps = [];
  const empBody = $('#emp-table tbody');

  async function loadEmps() {
    const [es, us] = await Promise.all([getDocs(collection(db, 'employees')), getDocs(collection(db, 'users'))]);
    const emails = new Map(us.docs.map((d) => [d.id, d.data().email]));
    emps = es.docs
      .map((d) => ({ msnv: d.id, name: d.data().name, claimedBy: d.data().claimedBy ?? null }))
      .map((x) => ({ ...x, email: x.claimedBy ? emails.get(x.claimedBy) ?? '(không rõ)' : '' }))
      .sort((a, b) => a.msnv.localeCompare(b.msnv, 'vi', { numeric: true }));
    $('#emp-table').hidden = false;
    $('#emp-filter-wrap').hidden = false;
    renderEmps();
  }

  function renderEmps() {
    const q = $('#emp-filter').value.trim().toLowerCase();
    const list = q ? emps.filter((x) => x.msnv.toLowerCase().includes(q) || x.name.toLowerCase().includes(q)) : emps;
    $('#emp-summary').textContent = `${emps.length} nhân viên, ${emps.filter((x) => x.claimedBy).length} đã liên kết Gmail`
      + (q ? ` · đang hiện ${list.length}` : '') + '.';
    empBody.innerHTML = list.map((x) => `
      <tr>
        <td>${esc(x.msnv)}</td><td>${esc(x.name)}</td><td>${esc(x.email)}</td>
        <td>
          <button class="btn btn-ghost btn-small" type="button" data-act="edit" data-msnv="${esc(x.msnv)}">Sửa</button>
          <button class="btn btn-ghost btn-small" type="button" data-act="del" data-msnv="${esc(x.msnv)}">Xoá</button>
        </td>
      </tr>`).join('');
  }

  $('#btn-emp-load').addEventListener('click', () => loadEmps().catch((e) => toast(e.message)));
  $('#emp-filter').addEventListener('input', renderEmps);

  empBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-msnv]');
    if (!btn) return;
    const x = emps.find((y) => y.msnv === btn.dataset.msnv);
    try {
      let changed = false;
      if (btn.dataset.act === 'edit') {
        const name = prompt(`Họ tên mới cho ${x.msnv}:`, x.name);
        if (name === null || name.trim() === x.name) return;
        changed = await renameEmployee(x.msnv, x.claimedBy, name);
      } else {
        changed = await removeEmployee(x.msnv, x.name, x.claimedBy);
      }
      if (changed) await loadEmps();
    } catch (err) {
      toast(err.message);
    }
  });

  /* ── quản trị viên ── */
  const adminBody = $('#admin-table tbody');

  async function loadAdmins() {
    const snap = await getDocs(collection(db, 'admins'));
    const list = snap.docs.map((d) => ({ email: d.id, ...d.data() })).sort((a, b) => a.email.localeCompare(b.email));
    adminBody.innerHTML = list.map((a) => `
      <tr>
        <td>${esc(a.email)}${a.email === myEmail ? ' <i>(bạn)</i>' : ''}</td>
        <td>${esc(a.addedBy ?? '(Console)')}</td><td>${fmt(a.addedAt)}</td>
        <td>${a.email === myEmail || !myRoot ? '' : `<button class="btn btn-ghost btn-small" type="button" data-email="${esc(a.email)}">Xoá quyền</button>`}</td>
      </tr>`).join('');
    $('#admin-table').hidden = false;
  }

  $('#btn-admin-load').addEventListener('click', () => loadAdmins().catch((e) => toast(e.message)));

  $('#admin-add').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!myRoot) return;
    const email = $('#admin-email').value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email không hợp lệ.'); return; }
    try {
      if ((await getDoc(doc(db, 'admins', email))).exists()) { toast(`${email} đã là admin.`); return; }
      await setDoc(doc(db, 'admins', email), { addedBy: myEmail, addedAt: serverTimestamp() });
      $('#admin-email').value = '';
      toast(`Đã cấp quyền admin cho ${email}.`);
      await loadAdmins();
    } catch (err) {
      toast('Thêm thất bại: ' + err.message);
    }
  });

  adminBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-email]');
    if (!btn) return;
    const email = btn.dataset.email;
    if (!myRoot || email === myEmail || !confirm(`Xoá quyền admin của ${email}?`)) return;
    try {
      await deleteDoc(doc(db, 'admins', email));
      toast(`Đã xoá quyền admin của ${email}.`);
      await loadAdmins();
    } catch (err) {
      toast('Xoá thất bại: ' + err.message);
    }
  });

  /* ── 3 · bảng điểm ── */
  let scores = [];
  const tbody = $('#score-table tbody');
  const fmt = (ts) => (ts?.toDate ? ts.toDate().toLocaleString('vi-VN') : '');

  async function load() {
    const snap = await getDocs(query(collection(db, 'scores'), orderBy('total', 'desc')));
    scores = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    tbody.innerHTML = scores.map((s, i) => `
      <tr class="${s.banned ? 'is-banned' : ''}">
        <td>${i + 1}</td><td>${esc(s.msnv)}</td><td>${esc(s.name)}</td>
        <td>${s.lixi}</td><td>${s.quiz}</td><td>${s.memory}</td><td><b>${s.total}</b></td>
        <td>${fmt(s.updatedAt)}</td>
        <td><button class="btn btn-ghost btn-small" type="button" data-uid="${s.uid}">${s.banned ? 'Khôi phục' : 'Loại'}</button></td>
      </tr>`).join('');
    $('#btn-export').disabled = !scores.length;
  }

  $('#btn-load').addEventListener('click', () => load().catch((e) => toast(e.message)));

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-uid]');
    if (!btn) return;
    const s = scores.find((x) => x.uid === btn.dataset.uid);
    // loại: tổng về 0 để rời bảng xếp hạng, điểm từng game giữ lại để đối chiếu
    const patch = s.banned ? { banned: false, total: s.lixi + s.quiz + s.memory } : { banned: true, total: 0 };
    if (!s.banned && !confirm(`Loại kết quả của ${s.name} (${s.msnv})?`)) return;
    await updateDoc(doc(db, 'scores', s.uid), patch);
    await load();
  });

  $('#btn-export').addEventListener('click', () => {
    downloadCsv(`yep2026-bang-diem-${new Date().toISOString().slice(0, 10)}.csv`,
      [['Hạng', 'MSNV', 'Họ tên', 'Hứng lì xì', 'Đố vui', 'Lật thẻ', 'Tổng', 'Cập nhật', 'Bị loại']]
        .concat(scores.map((s, i) => [i + 1, s.msnv, s.name, s.lixi, s.quiz, s.memory, s.total, fmt(s.updatedAt), s.banned ? 'x' : ''])));
  });

  /* ── 4 · ngân hàng câu hỏi ── */
  const counts = Object.entries(TOPICS).map(([k, label]) => `${label} ${BANK.filter((x) => x.t === k).length}`);
  $('#bank-summary').textContent = `${BANK.length} câu — ${counts.join(' · ')}`;
  $('#btn-bank').addEventListener('click', () => {
    const table = $('#bank-table');
    table.querySelector('tbody').innerHTML = BANK.map((x, i) => `
      <tr>
        <td>${i + 1}</td><td>${esc(TOPICS[x.t] ?? x.t)}</td><td>${esc(x.q)}</td>
        <td class="is-right">${esc(x.o[0])}</td><td>${x.o.slice(1).map(esc).join('<br>')}</td>
      </tr>`).join('');
    table.hidden = false;
  });
  $('#btn-bank-export').addEventListener('click', () => {
    downloadCsv('yep2026-ngan-hang-cau-hoi.csv',
      [['#', 'Chủ đề', 'Câu hỏi', 'Đáp án đúng', 'Sai 1', 'Sai 2', 'Sai 3']]
        .concat(BANK.map((x, i) => [i + 1, TOPICS[x.t] ?? x.t, x.q, ...x.o])));
  });
}

/** Tải mảng các dòng xuống thành file CSV mở được bằng Excel (UTF-8 có BOM). */
function downloadCsv(filename, rows) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** CSV/TSV hai cột MSNV, Họ tên. Trả về các dòng hợp lệ và số dòng bị bỏ qua. */
function parseCsv(text, normalize) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const first = lines.find((l) => l.trim()) || '';
  const sep = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
  const valid = [];
  const invalid = [];
  const seen = new Set();
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const [rawId = '', name = ''] = line.split(sep).map((c) => c.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
    const msnv = normalize(rawId);
    if (i === lines.indexOf(first) && /msnv|mã|ma so|id/i.test(rawId)) return; // dòng tiêu đề
    if (!/^[A-Z0-9_-]{1,20}$/.test(msnv) || !name || seen.has(msnv)) { invalid.push(i + 1); return; }
    seen.add(msnv);
    valid.push({ msnv, name });
  });
  return { valid, invalid };
}
