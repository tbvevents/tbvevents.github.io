// Hứng lì xì: 30 giây, kéo giỏ hứng bao lì xì rơi, né pháo.
// Số vật rơi cố định (40 bao đỏ +1, 8 bao vàng +3, 14 quả pháo −2) nên điểm tối đa đúng bằng 64,
// khớp với trần điểm trong firestore.rules.
const DURATION = 30;
const KINDS = {
  red: { count: 40, points: 1 },
  gold: { count: 8, points: 3 },
  bomb: { count: 14, points: -2 },
};

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'lixi-canvas';
    canvas.setAttribute('aria-label', 'Khu vực chơi Hứng lì xì: kéo ngón tay hoặc dùng phím mũi tên để di chuyển giỏ');
    stage.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    // lịch rơi: rải ngẫu nhiên trong 0.4s..27.4s để vật cuối kịp chạm đáy trước khi hết giờ
    const items = [];
    for (const [kind, { count }] of Object.entries(KINDS)) {
      for (let i = 0; i < count; i++) items.push({ kind, at: 0.4 + Math.random() * 27, x: Math.random(), y: -1, live: false, done: false });
    }
    items.sort((a, b) => a.at - b.at);

    const basket = { x: 0.5, target: 0.5 };
    const keys = { left: false, right: false };
    const floats = [];
    let score = 0;
    let shake = 0;

    const toX = (clientX) => {
      const r = canvas.getBoundingClientRect();
      basket.target = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    };
    const onPointer = (e) => { if (e.type === 'pointerdown' || e.buttons || e.pointerType !== 'mouse') toX(e.clientX); };
    const onMouse = (e) => toX(e.clientX);
    const onKey = (e) => {
      const down = e.type === 'keydown';
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = down;
      else if (e.key === 'ArrowRight' || e.key === 'd') keys.right = down;
      else return;
      e.preventDefault();
    };
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('mousemove', onMouse);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);

    const t0 = performance.now();
    let last = t0;
    let raf = 0;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKey);
      canvas.remove();
    };
    signal.addEventListener('abort', () => { cleanup(); resolve(null); }, { once: true });

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - t0) / 1000;
      const left = Math.max(0, DURATION - t);
      hud.time(Math.ceil(left));

      if (keys.left) basket.target = Math.max(0, basket.target - dt * 1.4);
      if (keys.right) basket.target = Math.min(1, basket.target + dt * 1.4);
      basket.x += (basket.target - basket.x) * Math.min(1, dt * 18);

      const size = Math.max(30, Math.min(48, w * 0.09));
      const bw = Math.max(80, w * 0.22);
      const bx = basket.x * (w - bw) + bw / 2;
      const by = h - 34;
      const fall = (h + size) / (2.6 - (t / DURATION) * 0.9); // rơi nhanh dần: 2.6s → 1.7s

      for (const it of items) {
        if (it.done) continue;
        if (!it.live) {
          if (t < it.at) break;
          it.live = true;
          it.y = -size;
          it.px = size / 2 + it.x * (w - size);
        }
        it.y += fall * dt;
        if (it.y + size * 0.4 >= by - 12 && it.y <= by + 8 && Math.abs(it.px - bx) < bw / 2 + size * 0.2) {
          it.done = true;
          const p = KINDS[it.kind].points;
          score = Math.max(0, score + p);
          hud.score(score);
          floats.push({ x: it.px, y: by - 30, text: p > 0 ? `+${p}` : `${p}`, bad: p < 0, life: 1 });
          if (p < 0) shake = 0.35;
        } else if (it.y > h) {
          it.done = true;
        }
      }

      draw(t, size, bx, by, bw);
      if (left <= 0) { cleanup(); resolve(score); return; }
      raf = requestAnimationFrame(frame);
    }

    function draw(t, size, bx, by, bw) {
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      if (shake > 0) {
        shake -= 1 / 60;
        ctx.translate((Math.random() - 0.5) * 10 * shake, 0);
      }
      for (const it of items) {
        if (!it.live || it.done) continue;
        if (it.kind === 'bomb') drawBomb(it.px, it.y, size, t);
        else drawEnvelope(it.px, it.y, size, it.kind === 'gold');
      }
      drawBasket(bx, by, bw);
      for (const f of floats) {
        if (f.life <= 0) continue;
        f.life -= 1 / 50;
        f.y -= 0.8;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = f.bad ? '#ff6b6b' : '#ffe7a3';
        ctx.font = '800 22px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    function drawEnvelope(x, y, s, gold) {
      const ew = s * 0.72, eh = s;
      ctx.fillStyle = gold ? '#ffcf4a' : '#d0142c';
      roundRect(x - ew / 2, y, ew, eh, 5);
      ctx.fill();
      ctx.fillStyle = gold ? '#e8a400' : '#a50d22';
      ctx.beginPath();
      ctx.moveTo(x - ew / 2, y);
      ctx.lineTo(x, y + eh * 0.38);
      ctx.lineTo(x + ew / 2, y);
      ctx.fill();
      ctx.fillStyle = gold ? '#c8102e' : '#ffcf4a';
      ctx.beginPath();
      ctx.arc(x, y + eh * 0.42, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBomb(x, y, s, t) {
      const bw = s * 0.42, bh = s * 0.85;
      ctx.fillStyle = '#8f1020';
      roundRect(x - bw / 2, y + s * 0.15, bw, bh, 4);
      ctx.fill();
      ctx.fillStyle = '#ffcf4a';
      ctx.fillRect(x - bw / 2, y + s * 0.3, bw, 3);
      ctx.fillRect(x - bw / 2, y + s * 0.82, bw, 3);
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.15);
      ctx.quadraticCurveTo(x + 6, y + 4, x + 3, y);
      ctx.stroke();
      ctx.fillStyle = Math.sin(t * 40) > 0 ? '#fff3a0' : '#ff8a3c';
      ctx.beginPath();
      ctx.arc(x + 3, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBasket(x, y, bw) {
      const grad = ctx.createLinearGradient(0, y - 14, 0, y + 22);
      grad.addColorStop(0, '#ffe69a');
      grad.addColorStop(1, '#e09000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x - bw / 2, y - 12);
      ctx.lineTo(x + bw / 2, y - 12);
      ctx.lineTo(x + bw / 2 - 12, y + 20);
      ctx.lineTo(x - bw / 2 + 12, y + 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(x - bw / 2 + 6, y - 2, bw - 12, 5);
    }

    function roundRect(x, y, rw, rh, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    }

    hud.score(0);
    raf = requestAnimationFrame(frame);
  });
}
