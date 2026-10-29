// Firebase dùng chung cho landing page, trang mini game và trang admin.
// Chỉ nạp Firestore ở đây; Authentication nằm trong minigame/api.js để landing page nhẹ hơn.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, query, orderBy, limit, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { FIREBASE, GAMES } from './config.js';

export const isConfigured = Boolean(FIREBASE.apiKey && FIREBASE.projectId);
export const app = isConfigured ? initializeApp(FIREBASE) : null;
export const db = app ? getFirestore(app) : null;

/** MSNV đã nhận trên máy này (để tô sáng dòng của mình trên bảng xếp hạng). */
export const MY_MSNV_KEY = 'yep2026.msnv';
export function myMsnv() {
  try { return localStorage.getItem(MY_MSNV_KEY) || ''; } catch { return ''; }
}

export const maskMsnv = (m) => (GAMES.maskMsnv && m.length > 3 ? `${m.slice(0, 2)}${'*'.repeat(m.length - 3)}${m.slice(-1)}` : m);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Top 10 realtime; bằng điểm thì ai đạt trước xếp trên. Trả về hàm huỷ theo dõi.
 * Cần composite index scores (total desc, updatedAt asc) — xem README.
 */
export function watchTop10(cb, onError) {
  const q = query(collection(db, 'scores'), where('total', '>', 0), orderBy('total', 'desc'), orderBy('updatedAt', 'asc'), limit(10));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))), onError);
}

/** Vẽ Top 10 vào một <ol>. */
export function renderTop10(ol, rows) {
  const me = myMsnv();
  if (!rows.length) {
    ol.innerHTML = '<li class="lb-empty">Chưa có ai ghi điểm — hãy là người đầu tiên!</li>';
    return;
  }
  ol.innerHTML = rows.map((r, i) => `
    <li class="lb-row${r.msnv === me ? ' is-me' : ''}${i < 3 ? ` is-top${i + 1}` : ''}">
      <span class="lb-rank">${i + 1}</span>
      <span class="lb-name">${esc(r.name)}<small>${esc(maskMsnv(r.msnv))}</small></span>
      <b class="lb-score">${r.total}</b>
    </li>`).join('');
}
