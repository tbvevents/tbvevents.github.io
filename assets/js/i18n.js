// Chuyển ngôn ngữ Tiếng Việt (VI) / English (EN) cho các trang của người chơi (không áp dụng cho admin.html).
//
// Cách dùng trong HTML:
//   data-i18n="key"                       đặt textContent
//   data-i18n-html="key"                  đặt innerHTML (chỉ dùng cho chuỗi trong i18n-strings.js, có thể chứa <b>)
//   data-i18n-list="key"                  chuỗi 'a|b|c' → các thẻ <li>
//   data-i18n-attr="aria-label:key;title:key"   đặt thuộc tính
// Cách dùng trong JS: t('key', { n: 3 }), tn('key', n), L(giá trị { vi, en } trong config.js), onLangChange(cb).
// Ngôn ngữ được nhớ trên máy (localStorage) và dùng chung cho landing page lẫn trang mini game; ?lang=en | ?lang=vi để ép.
import { S } from './i18n-strings.js';

export const LANGS = ['vi', 'en'];
const NAMES = { vi: 'Tiếng Việt', en: 'English' };
const KEY = 'yep2026.lang';
const listeners = new Set();

function readParam() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    return LANGS.includes(q) ? q : null;
  } catch { return null; }
}
function readSaved() {
  try {
    const s = localStorage.getItem(KEY);
    return LANGS.includes(s) ? s : null;
  } catch { return null; }
}
function save(l) {
  try { localStorage.setItem(KEY, l); } catch { /* chế độ riêng tư: bỏ qua */ }
}

const param = readParam();
let lang = param || readSaved() || 'vi';
if (param) save(param);

export const getLang = () => lang;

const fill = (s, p) => (p ? s.replace(/\{(\w+)\}/g, (_, k) => (p[k] ?? '')) : s);

/** Chuỗi theo ngôn ngữ hiện tại. Thiếu bản dịch thì dùng tiếng Việt. */
export function t(key, params) {
  const e = S[key];
  if (!e) {
    console.warn('[i18n] thiếu key:', key);
    return key;
  }
  return fill(e[LANGS.indexOf(lang)] ?? e[0], params);
}

/** Số ít / số nhiều: dùng `key.1` khi n === 1 (nếu có), ngược lại dùng `key`. */
export const tn = (key, n, params) => t(S[`${key}.1`] && n === 1 ? `${key}.1` : key, { n, ...params });

/** Giá trị trong config.js: chuỗi thường giữ nguyên, { vi, en } chọn theo ngôn ngữ. */
export const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.vi ?? '') : v);

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-list]').forEach((el) => {
    el.replaceChildren(...t(el.dataset.i18nList).split('|').map((txt) => {
      const li = document.createElement('li');
      li.textContent = txt;
      return li;
    }));
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((x) => x.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

/** Gọi `cb(lang)` mỗi khi người dùng đổi ngôn ngữ (dùng để vẽ lại phần chữ do JS tạo ra). */
export function onLangChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function apply() {
  const root = document.documentElement;
  root.lang = lang;
  root.dataset.lang = lang;
  applyI18n();
  syncToggle();
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  save(lang);
  apply();
  for (const cb of listeners) {
    try { cb(lang); } catch (err) { console.warn(err); }
  }
}

/* ── nút VI | EN nhỏ, mờ, ở góc dưới bên phải ──
   Ngoài nút nổi còn có thể đặt thêm nút trong hộp thoại (modal che mất nút nổi): <div data-lang-toggle></div> */
function makeToggle(cls) {
  const el = document.createElement('div');
  el.className = cls;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', 'Language / Ngôn ngữ');
  el.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" lang="${l}" aria-label="${NAMES[l]}" title="${NAMES[l]}" translate="no">${l.toUpperCase()}</button>`).join('');
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) setLang(b.dataset.lang);
  });
  return el;
}
function buildToggle() {
  document.body.appendChild(makeToggle('lang-toggle'));
  document.querySelectorAll('[data-lang-toggle]').forEach((host) => host.appendChild(makeToggle('lang-toggle lang-toggle--inline')));
}
function syncToggle() {
  document.querySelectorAll('.lang-toggle [data-lang]').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

buildToggle();
apply();
document.documentElement.classList.add('i18n-ready');
