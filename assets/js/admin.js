// Trang quản trị: nạp danh sách nhân viên, gỡ liên kết Gmail ↔ MSNV, loại kết quả, xuất bảng điểm.
// Quyền admin do firestore.rules kiểm tra (collection admins), trang này chỉ là giao diện.
import {
  doc, getDoc, getDocs, writeBatch, updateDoc, collection, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { isConfigured, db } from './firebase.js';

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

  api.onUser(async (user) => {
    if (!user) { $('#who').hidden = true; show('a-login'); return; }
    $('#who-email').textContent = user.email;
    $('#who').hidden = false;
    const ok = await getDoc(doc(db, 'admins', user.email)).then((s) => s.exists()).catch(() => false);
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

  /* ── 2 · tra cứu & gỡ liên kết ── */
  $('#lookup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msnv = api.normalizeMsnv($('#lookup-msnv').value);
    const out = $('#lookup-result');
    const emp = await getDoc(doc(db, 'employees', msnv));
    if (!emp.exists()) { out.innerHTML = `<p>Không có MSNV <b>${esc(msnv)}</b> trong danh sách.</p>`; return; }
    const { name, claimedBy = null } = emp.data();
    if (!claimedBy) { out.innerHTML = `<p><b>${esc(name)}</b> — chưa liên kết Gmail.</p>`; return; }
    const [u, s] = await Promise.all([getDoc(doc(db, 'users', claimedBy)), getDoc(doc(db, 'scores', claimedBy))]);
    out.innerHTML = `
      <p><b>${esc(name)}</b> — liên kết với <b>${esc(u.data()?.email ?? '(không rõ)')}</b>, tổng điểm ${s.data()?.total ?? 0}.</p>
      <div class="actions"><button class="btn btn-ghost btn-small" id="btn-unlink" type="button">Gỡ liên kết (xoá điểm)</button></div>`;
    $('#btn-unlink').addEventListener('click', async () => {
      if (!confirm(`Gỡ liên kết MSNV ${msnv} khỏi ${u.data()?.email}? Điểm của MSNV này sẽ bị xoá.`)) return;
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', claimedBy));
      batch.delete(doc(db, 'scores', claimedBy));
      batch.update(doc(db, 'employees', msnv), { claimedBy: null });
      await batch.commit();
      out.innerHTML = `<p>Đã gỡ liên kết <b>${esc(msnv)}</b>. Nhân viên có thể đăng nhập và nhận lại.</p>`;
    });
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
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Hạng', 'MSNV', 'Họ tên', 'Hứng lì xì', 'Đố vui', 'Lật thẻ', 'Tổng', 'Cập nhật', 'Bị loại']]
      .concat(scores.map((s, i) => [i + 1, s.msnv, s.name, s.lixi, s.quiz, s.memory, s.total, fmt(s.updatedAt), s.banned ? 'x' : '']))
      .map((r) => r.map(cell).join(','));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `yep2026-bang-diem-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
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
