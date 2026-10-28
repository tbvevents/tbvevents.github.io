// Chạm / nhấp vào BẦU TRỜI (nửa trên màn hình) để bắn pháo hoa.
// Dùng Pointer Events nên chạy chung cho chuột, cảm ứng (điện thoại, máy tính bảng) và bút.
//
// Chỉ tính là một "cú nhấn" khi:
//  - nhấn + nhả ngón/chuột gần như tại chỗ (không kéo, không vuốt để cuộn trang, không zoom hai ngón),
//  - ngắn (không phải nhấn giữ),
//  - không rơi vào nút/liên kết/thẻ nội dung,
//  - và nằm ở nửa trên của khung nhìn (skyRatio).
// Bắn ở lúc NHẢ tay (pointerup): đây cũng là thời điểm trình duyệt di động cho phép phát âm thanh.
const INTERACTIVE = 'a, button, input, textarea, select, label, summary, [role="button"], [contenteditable], .card, nav, header, footer, .music-toggle';
const MAX_TAP_MS = 700;
const HINT_TEXT = 'Chạm vào bầu trời (nửa trên màn hình) để bắn pháo hoa ✦';

export function initSkyTap({ onSky, skyRatio = 0.5, cooldown = 140 } = {}) {
  const root = document.documentElement;
  let tap = null;
  let lastFire = 0;
  let hintCount = 0;
  let hintEl = null;
  let hintTimer = 0;

  const isSky = (y) => y <= window.innerHeight * skyRatio;
  const isBlank = (el) => el instanceof Element && !el.closest(INTERACTIVE);
  const slopOf = (type) => (type === 'mouse' ? 6 : 14); // ngưỡng rung tay: ngón tay cần rộng hơn chuột

  function ripple(x, y) {
    const el = document.createElement('div');
    el.className = 'sky-ripple';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function showHint() {
    if (hintCount >= 2) return; // nhắc tối đa 2 lần, tránh phiền
    hintCount++;
    if (!hintEl) {
      hintEl = document.createElement('div');
      hintEl.className = 'sky-hint';
      hintEl.setAttribute('role', 'status');
      hintEl.textContent = HINT_TEXT;
      document.body.appendChild(hintEl);
    }
    requestAnimationFrame(() => hintEl.classList.add('is-on'));
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hintEl.classList.remove('is-on'), 2800);
  }

  addEventListener('pointerdown', (e) => {
    // ngón thứ hai (pinch/zoom), chuột phải/giữa, hoặc chạm vào phần tử tương tác -> bỏ qua
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || !isBlank(e.target)) {
      tap = null;
      return;
    }
    tap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), sy: window.scrollY, type: e.pointerType };
  }, { passive: true });

  addEventListener('pointermove', (e) => {
    if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > slopOf(tap.type)) tap = null;
    // máy tính: đổi con trỏ thành chữ thập khi rê chuột lên vùng bầu trời
    if (e.pointerType === 'mouse') root.classList.toggle('sky-hover', isSky(e.clientY) && isBlank(e.target));
  }, { passive: true });

  addEventListener('pointerup', (e) => {
    const t = tap;
    tap = null;
    if (!t || e.pointerId !== t.id) return;
    if (performance.now() - t.t > MAX_TAP_MS) return; // nhấn giữ
    if (Math.abs(window.scrollY - t.sy) > 6) return; // trang vừa cuộn
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > slopOf(t.type)) return;

    if (!isSky(t.y)) { showHint(); return; } // nhấn ở nửa dưới: chỉ nhắc nhẹ
    const now = performance.now();
    if (now - lastFire < cooldown) return; // chống bấm dồn dập
    lastFire = now;
    ripple(t.x, t.y);
    if (onSky) onSky(t.x, t.y);
  }, { passive: true });

  // trình duyệt tiếp quản cử chỉ (cuộn, zoom, mở menu...) -> huỷ
  addEventListener('pointercancel', () => { tap = null; }, { passive: true });
  addEventListener('blur', () => { tap = null; });
  addEventListener('scroll', () => { tap = null; }, { passive: true });
  document.addEventListener('mouseleave', () => root.classList.remove('sky-hover'));
}
