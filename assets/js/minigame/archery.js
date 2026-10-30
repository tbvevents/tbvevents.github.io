// Bắn cung: 5 mũi tên, chạm-kéo để nhắm, thả để bắn. Gió đổi hướng (mọi phía) và tốc độ sau mỗi mũi.
// Vòng trong cùng 10 điểm, giảm dần 1 điểm mỗi vòng; ra ngoài bia 0 điểm → tối đa 50,
// khớp với trần điểm trong firestore.rules.
//
// Cảnh vẽ phối cảnh 3D đơn giản: mỗi vật có toạ độ thế giới (X, Y, z) tính theo bán kính bia R0,
// bia ở z = 1, điểm tụ là tâm bia. Lúc ngắm camera đứng yên (bia giữ nguyên cỡ), chỉ còn đầu mũi tên và tâm ngắm;
// khi thả, camera đuổi theo mũi tên tới bia (cam: 0 → camHit) nên vật gần phóng nhanh, vật xa gần như đứng yên
// (parallax). Mọi chuyển động tính theo dt nên mượt ở mọi tần số màn hình.
import * as sfx from './sounds.js';
import { t, getLang } from '../i18n.js';

const ARROWS = 5;
const SHOT_SECONDS = 10;
const FLIGHT = 0.95; // giây mũi tên bay
const HOLD = 0.6; // giây giữ góc nhìn gần sau khi mũi tên cắm
const PAUSE = 1.15; // giây từ lúc cắm tới mũi kế tiếp (gồm cả lúc camera lùi ra)
const MIN_WIND = 0.5;
const MAX_WIND = 5;
const AIM_SENS = 4; // ngón tay đi 4 bán kính bia thì tâm ngắm đi 1 bán kính bia
const GROUND = 1.65; // mặt đất nằm dưới tâm bia bao nhiêu bán kính bia
// màu 10 vòng từ ngoài vào trong: trắng, đen, xanh, đỏ, vàng (mỗi màu 2 vòng)
const RING_COLORS = ['#f4efe6', '#f4efe6', '#2b2f3a', '#2b2f3a', '#2f8fe0', '#2f8fe0', '#e8333a', '#e8333a', '#ffcf3a', '#ffcf3a'];
const INK = '#1d1d1f';

// số giả ngẫu nhiên cố định để cảnh giống nhau mọi lần chơi
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// cây cối theo toạ độ thế giới; s = bề ngang tán cây (đơn vị bán kính bia)
const SCENERY = (() => {
  const out = [];
  let i = 0;
  for (let X = -40; X <= 40; X += 3.3) {
    const j = i++;
    if (Math.abs(X) < 1.4) continue;
    out.push({ kind: rnd(j) < 0.22 ? 'blossom' : 'tree', X: X + (rnd(j + 50) - 0.5) * 1.2, z: 2.2 + rnd(j + 100) * 1.1, s: 2.2 + rnd(j + 150) * 1.4 });
  }
  out.push(
    { kind: 'bush', X: -2.5, z: 1.15, s: 1.5 },
    { kind: 'bush', X: 2.7, z: 1.1, s: 1.3 },
    { kind: 'tree', X: -4.4, z: 1.4, s: 3.4, lanterns: true },
    { kind: 'blossom', X: 4.7, z: 1.5, s: 3.2, lanterns: true },
    { kind: 'tree', X: -11, z: 1.2, s: 4.4 },
    { kind: 'blossom', X: 11.5, z: 1.25, s: 4.2, lanterns: true },
    { kind: 'bush', X: -3.4, z: 0.92, s: 1.6 },
    { kind: 'bush', X: 3.7, z: 0.9, s: 1.8 },
    { kind: 'tree', X: -5.6, z: 0.72, s: 4 },
    { kind: 'blossom', X: 6.2, z: 0.7, s: 3.8 },
  );
  return out.sort((a, b) => b.z - a.z);
})();
const HEDGE_Z = 3.6;
const MOUNTAINS = [
  { x: -0.08, wd: 0.78, ht: 0.95, c: '#ace5ec' },
  { x: 0.48, wd: 0.66, ht: 0.8, c: '#ace5ec' },
  { x: 0.16, wd: 0.5, ht: 0.62, c: '#93d9e3' },
  { x: 0.66, wd: 0.5, ht: 0.55, c: '#93d9e3' },
];
const CLOUDS = [
  { x: 0.12, y: 0.16, s: 1 }, { x: 0.58, y: 0.08, s: 0.8 }, { x: 0.86, y: 0.26, s: 1.1 }, { x: 0.36, y: 0.3, s: 0.65 },
];

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'archery-canvas';
    canvas.setAttribute('aria-label', t('archery.aria'));
    stage.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // bố cục, tính lại mỗi khi canvas đổi kích thước (xoay máy, thanh địa chỉ co giãn…)
    let w = 0, h = 0, dpr = 1, m = 0;
    let R0 = 0; // bán kính bia khi chưa nhắm (px)
    let F = { x: 0, y: 0 }; // tâm bia = điểm tụ
    let camHit = 0; // vị trí camera khi mũi tên cắm vào bia
    let sky = null;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      m = Math.min(w, h);
      R0 = m * 0.08;
      F = { x: w / 2, y: h * 0.42 };
      // giá bia (cao 2.6 bán kính) phóng to vẫn nằm dưới huy hiệu gió
      camHit = 1 - 1 / Math.max(2.5, Math.min(w * 0.36, h * 0.24) / R0);
      sky = ctx.createLinearGradient(0, 0, 0, F.y);
      sky.addColorStop(0, '#bfeef4');
      sky.addColorStop(1, '#e9fcfb');
    };
    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else addEventListener('resize', resize);

    let cam = 0; // vị trí camera trên trục z
    /** Chiếu điểm thế giới ra màn hình: [x, y, px trên mỗi đơn vị bán kính bia]. */
    const proj = (X, Y, z) => {
      const s = R0 / Math.max(0.001, z - cam);
      return [F.x + X * s, F.y + Y * s, s];
    };
    const groundY = (z) => (z - cam <= 0.004 ? h * 4 : F.y + (GROUND * R0) / (z - cam));

    // gió { a: hướng thổi trong mặt phẳng bia (0 = sang phải, π/2 = xuống), s: tốc độ }.
    // Mỗi mũi đổi chắc chắn: lệch ít nhất 45° và 1.0 tốc độ (không lặp random, để không treo khi test cố định random)
    const nextWind = (prev) => {
      const span = MAX_WIND - MIN_WIND;
      const s = prev ? MIN_WIND + ((prev.s - MIN_WIND + 1 + Math.random() * (span - 2)) % span) : MIN_WIND + Math.random() * span;
      const a = prev ? prev.a + Math.PI / 4 + Math.random() * Math.PI * 1.5 : Math.random() * Math.PI * 2;
      return { a: a % (Math.PI * 2), s: Math.round(s * 10) / 10 };
    };
    // mỗi mũi bắt đầu với tâm ngắm lệch khỏi bia → phải kéo để nhắm
    const newAim = () => {
      const a = Math.random() * Math.PI * 2, r = 0.7 + Math.random() * 0.6;
      return { u: Math.cos(a) * r, v: Math.sin(a) * r };
    };
    let wind = nextWind(null);
    const windShown = { a: wind.a, s: wind.s, pulse: 0 }; // huy hiệu xoay / đếm mượt tới gió mới
    let shot = 0; // số mũi đã bắn
    let score = 0;
    const shotPoints = [];
    let state = 'ready'; // ready | flying | pause | done
    let stateAt = 0;
    let clockStart = 0;
    let lastSec = SHOT_SECONDS;
    let touched = false; // ẩn gợi ý sau lần chạm đầu
    let timedOut = false; // mũi vừa rồi hết giờ chưa bắn
    const hits = []; // điểm cắm trên mặt bia, đơn vị bán kính bia
    let flight = null;
    const floats = [];
    const sparks = [];
    let shake = 0;
    let pose = 0; // 0 = chưa kéo, 1 = đang kéo dây (đầu mũi tên lùi về phía người bắn)
    let bowVis = 1; // 1 = cây cung trong khung hình, 0 = đã trượt ra ngoài
    let jolt = 0; // giá bia giật khi mũi tên cắm
    let stuckAt = -9; // lúc mũi tên gần nhất cắm (để đuôi rung)

    const aim = { on: false, pointer: null, ...newAim(), lx: 0, ly: 0 };
    // rung tay nhẹ để không thể đặt cứng tâm ngắm vào hồng tâm
    const sway = (time) => ({
      u: Math.sin(time * 1.9) * 0.07 + Math.sin(time * 4.3) * 0.025,
      v: Math.cos(time * 2.4) * 0.056,
    });
    const clampAim = () => {
      aim.u = Math.max(-2, Math.min(2, aim.u));
      aim.v = Math.max(-2, Math.min(2, aim.v));
    };

    const startAim = (pointer) => {
      aim.on = true;
      aim.pointer = pointer;
      touched = true;
      sfx.drawBow();
    };
    const onDown = (e) => {
      if (state !== 'ready' || aim.on) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      aim.lx = e.clientX;
      aim.ly = e.clientY;
      startAim(e.pointerId);
    };
    // kéo tương đối, chậm hơn ngón tay để nhắm chính xác được trên bia nhỏ
    const onMove = (e) => {
      if (!aim.on || e.pointerId !== aim.pointer) return;
      const k = R0 * AIM_SENS;
      aim.u += (e.clientX - aim.lx) / k;
      aim.v += (e.clientY - aim.ly) / k;
      aim.lx = e.clientX;
      aim.ly = e.clientY;
      clampAim();
    };
    const onUp = (e) => {
      if (!aim.on || e.pointerId !== aim.pointer) return;
      aim.on = false;
      if (e.type === 'pointerup') fire();
    };
    // bàn phím: mũi tên di chuyển tâm ngắm, Space / Enter bắn
    const keys = { left: false, right: false, up: false, down: false };
    const onKey = (e) => {
      const down = e.type === 'keydown';
      const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
      if (k) {
        keys[k] = down;
        if (down && !aim.on && state === 'ready') startAim('key');
      } else if ((e.key === ' ' || e.key === 'Enter') && down) {
        if (aim.on && aim.pointer === 'key') { aim.on = false; fire(); }
      } else return;
      e.preventDefault();
    };
    const noMenu = (e) => e.preventDefault();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('contextmenu', noMenu);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);

    const t0 = performance.now();
    let last = t0;
    let now = 0;
    let raf = 0;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      removeEventListener('resize', resize);
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKey);
      canvas.remove();
    };
    signal.addEventListener('abort', () => { cleanup(); resolve(null); }, { once: true });

    function fire() {
      if (state !== 'ready') return;
      const s = sway(now);
      // điểm ngắm lúc thả (kèm lệch nhỏ ngẫu nhiên) + gió đẩy tới ~0.45 bán kính bia ở tốc độ 5
      const au = aim.u + s.u + (Math.random() - 0.5) * 0.04;
      const av = aim.v + s.v + (Math.random() - 0.5) * 0.04;
      const du = Math.cos(wind.a) * wind.s * 0.09, dv = Math.sin(wind.a) * wind.s * 0.09;
      const u = au + du, v = av + dv;
      const d = Math.hypot(u, v);
      // điểm xuất phát: đầu mũi tên ở đáy màn hình, quy về toạ độ thế giới ngay trước camera
      const [bx, by] = nockedTip();
      const z0 = cam + 0.15;
      flight = { u, v, au, av, du, dv, points: d >= 1 ? 0 : 10 - Math.floor(d * 10), x0: ((bx - F.x) / R0) * 0.15, y0: ((by - F.y) / R0) * 0.15, z0 };
      timedOut = false;
      setState('flying');
      sfx.release();
    }

    /** Hết giờ mà chưa bắn: mũi đó 0 điểm. */
    function timeout() {
      aim.on = false;
      timedOut = true;
      land({ u: null, v: null, points: 0 });
    }

    function land(f) {
      shot++;
      score += f.points;
      shotPoints.push(f.points);
      hud.score(score);
      // mũi trúng giá gỗ / mặt bia thì cắm lại; bay quá giá thì mất
      if (f.u !== null && Math.abs(f.u) <= 1.25 && f.v >= -1.3 && f.v <= 1.3) {
        hits.push({ u: f.u, v: f.v });
        jolt = 1;
        stuckAt = now;
      }
      const [fx, fy] = f.u === null ? [F.x, F.y] : proj(f.u, f.v, 1);
      const bull = f.points === 10;
      floats.push({
        x: Math.min(w - 60, Math.max(60, fx)),
        y: Math.min(h - 80, Math.max(70, fy - 24)),
        text: f.points ? `+${f.points}` : t('archery.miss'),
        sub: bull ? t('archery.bull') : '',
        bad: !f.points,
        life: 1,
      });
      if (f.points) {
        sfx.hit(f.points);
        if (bull) {
          if (!reduceMotion) shake = 0.4;
          for (let i = 0; i < 26; i++) {
            const a = Math.random() * Math.PI * 2, sp = (0.4 + Math.random()) * m * 0.5;
            sparks.push({ x: fx, y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - m * 0.2, life: 1, c: i % 3 ? '#ffcf3a' : '#ff6b6b' });
          }
        }
      } else sfx.miss();
      setState(shot >= ARROWS ? 'done' : 'pause');
    }

    function setState(s) {
      state = s;
      stateAt = now;
    }

    // cánh hoa đào bay theo gió (trang trí + gợi ý hướng gió)
    const petals = reduceMotion ? [] : Array.from({ length: 16 }, (_, i) => ({ x: rnd(i + 300), y: rnd(i + 400), r: 0.6 + rnd(i + 500) * 0.6, ph: rnd(i + 600) * 6 }));
    let cloudDx = 0;

    function frame(ts) {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      now = (ts - t0) / 1000;
      if (!w || !h) { raf = requestAnimationFrame(frame); return; }

      const ks = dt * 1.3;
      if (keys.left) aim.u -= ks;
      if (keys.right) aim.u += ks;
      if (keys.up) aim.v -= ks;
      if (keys.down) aim.v += ks;
      clampAim();

      if (state === 'ready') {
        const left = Math.max(0, SHOT_SECONDS - (now - clockStart));
        const sec = Math.ceil(left);
        hud.time(sec);
        if (sec !== lastSec) {
          lastSec = sec;
          if (sec > 0 && sec <= 3) sfx.tick();
        }
        if (left <= 0) timeout();
      } else if (state === 'flying' && now - stateAt >= FLIGHT) {
        const f = flight;
        flight = null;
        land(f);
      } else if (state === 'pause' && now - stateAt >= PAUSE) {
        wind = nextWind(wind);
        windShown.pulse = 1;
        Object.assign(aim, newAim());
        clockStart = now;
        lastSec = SHOT_SECONDS;
        setState('ready');
      } else if (state === 'done' && now - stateAt >= PAUSE) {
        cleanup();
        resolve(score);
        return;
      }

      // camera: đứng yên khi ngắm; khi bay thì đuổi theo mũi tên (tăng tốc dần, luôn đi sau mũi tên);
      // vừa cắm thì giữ góc gần một lúc rồi lùi về (hết giờ không bắn thì không cần giữ)
      const hold = (state === 'pause' || state === 'done') && now - stateAt < HOLD && !timedOut;
      if (state === 'flying') {
        const p = Math.min(1, (now - stateAt) / FLIGHT);
        cam = camHit * p ** 1.5;
      } else if (!hold) cam += (0 - cam) * (1 - Math.exp(-dt * 6));
      pose += ((state === 'ready' && aim.on ? 1 : 0) - pose) * (1 - Math.exp(-dt * 10));
      const showBow = (state === 'ready' && !aim.on) || (state === 'pause' && now - stateAt >= HOLD);
      bowVis += ((showBow ? 1 : 0) - bowVis) * (1 - Math.exp(-dt * 8));
      shake = Math.max(0, shake - dt);
      jolt *= Math.exp(-dt * 14);
      // huy hiệu gió: xoay theo đường ngắn nhất, số chạy tới tốc độ mới
      const da = Math.atan2(Math.sin(wind.a - windShown.a), Math.cos(wind.a - windShown.a));
      const kw = 1 - Math.exp(-dt * 6);
      windShown.a += da * kw;
      windShown.s += (wind.s - windShown.s) * kw;
      windShown.pulse = Math.max(0, windShown.pulse - dt * 2.5);
      cloudDx += Math.cos(wind.a) * wind.s * dt * m * 0.012;

      draw(dt);
      raf = requestAnimationFrame(frame);
    }

    /* ───────── vẽ ───────── */
    function draw(dt) {
      const zp = camHit ? cam / camHit : 0; // 0..1 mức tiến vào
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 14 * shake, (Math.random() - 0.5) * 10 * shake);

      // trời, mây, núi: rất xa nên chỉ nhích nhẹ quanh điểm tụ
      ctx.fillStyle = sky;
      ctx.fillRect(-20, -20, w + 40, h + 40);
      const far = 1 + 0.05 * zp;
      ctx.save();
      ctx.translate(F.x, F.y);
      ctx.scale(far, far);
      ctx.translate(-F.x, -F.y);
      drawClouds();
      drawMountains();
      ctx.restore();

      // cỏ: từ chân hàng rào cây xa xuống, kèm các dải cỏ cắt chạy theo camera
      const hedgeBase = groundY(HEDGE_Z);
      ctx.fillStyle = '#74c943';
      ctx.fillRect(-20, hedgeBase - 2, w + 40, h - hedgeBase + 40);
      ctx.fillStyle = '#80d24e';
      for (const [z1, z2] of [[1.6, 1.25], [0.95, 0.75], [0.58, 0.46], [0.36, 0.29], [0.23, 0.185]]) {
        const y1 = groundY(z1), y2 = Math.min(h + 20, groundY(z2));
        if (y1 < h) ctx.fillRect(-20, y1, w + 40, y2 - y1);
      }
      drawHedge();

      // vật sau bia → vạch kẻ → bia → vật trước bia
      for (const o of SCENERY) if (o.z > 1) drawThing(o);
      drawLanes();
      drawTarget();
      for (const o of SCENERY) if (o.z <= 1) drawThing(o);
      if (state === 'flying' && flight) drawFlying();

      drawPetals(dt);
      if (aim.on && state === 'ready') {
        const s = sway(now);
        const [x, y, sc] = proj(aim.u + s.u, aim.v + s.v, 1);
        drawCrosshair(x, y, Math.max(8, Math.min(20, sc * 0.35)));
      }
      ctx.restore();

      drawNocked();
      drawBow();
      drawSparks(dt);
      drawFloats(dt);
      drawWind();
      drawShots();
      if (!touched) drawHint();
    }

    function rr(x, y, rw, rh, r) {
      r = Math.min(r, rw / 2, rh / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    }
    const ink = (sc) => Math.max(1.5, Math.min(4, sc * 0.05));

    function drawClouds() {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const span = w * 1.4;
      for (const c of CLOUDS) {
        const s = m * 0.13 * c.s;
        let x = ((c.x * w + cloudDx) % span + span) % span - w * 0.2;
        const y = F.y * c.y;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.32, 0, Math.PI * 2);
        ctx.arc(x + s * 0.34, y - s * 0.12, s * 0.4, 0, Math.PI * 2);
        ctx.arc(x + s * 0.72, y, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
        rr(x, y - s * 0.05, s * 0.72, s * 0.35, s * 0.17);
        ctx.fill();
      }
    }

    function drawMountains() {
      const base = F.y + R0 * 0.4;
      for (const mt of MOUNTAINS) {
        const x0 = mt.x * w, x1 = x0 + mt.wd * w, top = base - mt.ht * F.y;
        ctx.fillStyle = mt.c;
        ctx.beginPath();
        ctx.moveTo(x0, base);
        ctx.lineTo((x0 + x1) / 2, top);
        ctx.lineTo(x1, base);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawHedge() {
      const [, yb, s] = proj(0, GROUND, HEDGE_Z);
      const r = 0.9 * s;
      ctx.fillStyle = '#3cae46';
      ctx.beginPath();
      for (let X = -60; X <= 60; X += 1.5) {
        const x = F.x + X * s;
        if (x < -r || x > w + r) continue;
        const rj = r * (0.85 + rnd(X * 3 + 900) * 0.4);
        ctx.moveTo(x + rj, yb - rj * 0.9);
        ctx.arc(x, yb - rj * 0.9, rj, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillRect(-20, yb - r, w + 40, r + 2);
    }

    function drawThing(o) {
      if (o.z - cam < 0.05) return; // đã lướt qua camera
      const [x, yb, sc] = proj(o.X, GROUND, o.z);
      const S = o.s * sc;
      if (x + S < -10 || x - S > w + 10 || yb - S * 1.5 > h) return;
      if (o.kind === 'bush') {
        ctx.fillStyle = '#35a845';
        ctx.beginPath();
        ctx.arc(x - S * 0.26, yb - S * 0.22, S * 0.26, 0, Math.PI * 2);
        ctx.arc(x + S * 0.26, yb - S * 0.22, S * 0.26, 0, Math.PI * 2);
        ctx.arc(x, yb - S * 0.36, S * 0.33, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - S * 0.5, yb - S * 0.22, S, S * 0.22);
        ctx.fillStyle = '#5cc94f';
        ctx.beginPath();
        ctx.arc(x - S * 0.08, yb - S * 0.48, S * 0.11, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const blossom = o.kind === 'blossom';
      const trunkH = S * 0.72, canH = S * 0.62, top = yb - trunkH - canH;
      // thân và cành
      ctx.fillStyle = '#a65a42';
      ctx.fillRect(x - S * 0.08, yb - trunkH - canH * 0.2, S * 0.16, trunkH + canH * 0.2);
      ctx.fillRect(x, yb - trunkH * 0.62, S * 0.3, S * 0.07);
      ctx.fillRect(x + S * 0.23, yb - trunkH * 0.95, S * 0.07, trunkH * 0.38);
      // tán
      ctx.fillStyle = blossom ? '#f08cb6' : '#2fb24a';
      rr(x - S / 2, top, S, canH, S * 0.12);
      ctx.fill();
      ctx.fillStyle = blossom ? '#ffc4dc' : '#6fd04c';
      rr(x - S * 0.38, top + canH * 0.14, S * 0.22, canH * 0.18, S * 0.05);
      ctx.fill();
      rr(x + S * 0.02, top + canH * 0.1, S * 0.32, canH * 0.28, S * 0.06);
      ctx.fill();
      if (o.lanterns) {
        for (const [dx, len] of [[-0.3, 0.12], [0.3, 0.2]]) {
          const lx = x + S * dx, ly = top + canH + S * len;
          ctx.strokeStyle = INK;
          ctx.lineWidth = Math.max(1, S * 0.01);
          ctx.beginPath();
          ctx.moveTo(lx, top + canH);
          ctx.lineTo(lx, ly - S * 0.07);
          ctx.stroke();
          ctx.fillStyle = '#e8202e';
          ctx.beginPath();
          ctx.ellipse(lx, ly, S * 0.065, S * 0.08, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffcf3a';
          ctx.fillRect(lx - S * 0.035, ly - S * 0.09, S * 0.07, S * 0.025);
          ctx.fillRect(lx - S * 0.035, ly + S * 0.068, S * 0.07, S * 0.025);
        }
      }
    }

    function drawLanes() {
      const zn = cam + 0.02;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (const [X, hw] of [[0, 0.07], [-1.7, 0.05], [1.7, 0.05]]) {
        const a = proj(X - hw, GROUND, 1), b = proj(X + hw, GROUND, 1);
        const c = proj(X + hw, GROUND, zn), d = proj(X - hw, GROUND, zn);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.lineTo(d[0], d[1]);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawTarget() {
      const [px, py, s] = proj(0, 0, 1);
      // giá bia giật nhẹ khi mũi tên cắm
      const cx = px + Math.sin(now * 70) * jolt * s * 0.05, cy = py + jolt * s * 0.03;
      const lw = ink(s);
      ctx.lineWidth = lw;
      ctx.strokeStyle = INK;
      // bóng dưới chân
      ctx.fillStyle = 'rgba(20,70,20,0.25)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + GROUND * s, 1.5 * s, 0.12 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // chân giá
      ctx.fillStyle = '#7e4630';
      for (const dx of [-0.95, 0.67]) {
        rr(cx + dx * s, cy + 1.2 * s, 0.28 * s, (GROUND - 1.2) * s, 0.05 * s);
        ctx.fill();
        ctx.stroke();
      }
      // giá gỗ vân sọc
      rr(cx - 1.25 * s, cy - 1.3 * s, 2.5 * s, 2.6 * s, 0.1 * s);
      ctx.fillStyle = '#a3613f';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#8d4f33';
      for (let i = 0; i < 6; i++) ctx.fillRect(cx + (-1.1 + i * 0.42) * s, cy - 1.3 * s, 0.1 * s, 2.6 * s);
      ctx.restore();
      ctx.stroke();
      // mặt bia
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = RING_COLORS[i];
        ctx.beginPath();
        ctx.arc(cx, cy, s * (1 - i / 10), 0, Math.PI * 2);
        ctx.fill();
        if (i) {
          ctx.lineWidth = Math.max(0.6, s * 0.012);
          ctx.strokeStyle = i === 2 || i === 3 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';
          ctx.stroke();
        }
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.stroke();
      // mũi vừa cắm thì đuôi còn rung
      const age = now - stuckAt;
      const wob = age < 0.6 ? Math.sin(age * 45) * (1 - age / 0.6) * 0.35 : 0;
      hits.forEach((p, i) => drawStuck(cx + p.u * s, cy + p.v * s, s, i === hits.length - 1 ? wob : 0));
    }

    function drawStuck(x, y, s, wob) {
      // đuôi mũi tên chĩa về phía người bắn (dưới, hơi lệch phải)
      const L = s * 0.32;
      const ex = x + L * (0.35 + wob), ey = y + L * (0.9 - Math.abs(wob) * 0.2);
      ctx.strokeStyle = '#6b3d22';
      ctx.lineWidth = Math.max(1.5, s * 0.045);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#e8202e';
      const f = s * 0.09;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + f, ey - f * 0.2);
      ctx.lineTo(ex + f * 0.6, ey + f);
      ctx.closePath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - f * 0.5, ey + f * 0.9);
      ctx.lineTo(ex + f * 0.3, ey + f * 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, s * 0.03), 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = 'butt';
    }

    /**
     * Vị trí mũi tên trên đường bay (toạ độ thế giới), p = 0..1: bay thẳng tới điểm ngắm, gió đẩy lệch
     * tăng dần (p²) nên đường bay cong và cắm đúng điểm ngắm + gió; vồng lên vì trọng lực; thân rung lúc mới rời dây.
     */
    function flightPos(p) {
      const f = flight;
      const wob = Math.sin(p * 26) * 0.06 * (1 - p);
      return [
        f.x0 + (f.au - f.x0) * p + f.du * p * p + wob,
        f.y0 + (f.av - f.y0) * p + f.dv * p * p - Math.sin(p * Math.PI) * 0.8,
        f.z0 + (1 - f.z0) * p,
      ];
    }

    function drawFlying() {
      const p = Math.min(1, (now - stateAt) / FLIGHT);
      // vệt gió mờ phía sau
      ctx.lineCap = 'round';
      for (let i = 3; i >= 1; i--) {
        const a = proj(...flightPos(Math.max(0, p - i * 0.045)));
        const b = proj(...flightPos(Math.max(0, p - (i - 1) * 0.045)));
        ctx.strokeStyle = `rgba(255,255,255,${0.32 - i * 0.08})`;
        ctx.lineWidth = Math.max(1, b[2] * 0.06);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      const tail = proj(...flightPos(p));
      const tip = proj(...flightPos(Math.min(1, p + 0.06)));
      const sc = tail[2];
      ctx.strokeStyle = '#6b3d22';
      ctx.lineWidth = Math.max(1.5, sc * 0.05);
      ctx.beginPath();
      ctx.moveTo(tail[0], tail[1]);
      ctx.lineTo(tip[0], tip[1]);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // lông đuôi nhìn từ phía sau: 3 cánh toả ra, xoay khi bay
      ctx.fillStyle = '#e8202e';
      const f = sc * 0.14, spin = p * 12;
      for (const a0 of [-Math.PI / 2, Math.PI / 6, (Math.PI * 5) / 6]) {
        const a = a0 + spin;
        ctx.beginPath();
        ctx.moveTo(tail[0], tail[1]);
        ctx.lineTo(tail[0] + Math.cos(a - 0.25) * f, tail[1] + Math.sin(a - 0.25) * f);
        ctx.lineTo(tail[0] + Math.cos(a + 0.25) * f, tail[1] + Math.sin(a + 0.25) * f);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawPetals(dt) {
      if (!petals.length) return;
      ctx.fillStyle = '#ffb3cf';
      // bay theo véc-tơ gió (mọi hướng), thêm chút rơi và chao
      const wx = Math.cos(wind.a) * wind.s, wy = Math.sin(wind.a) * wind.s;
      for (const p of petals) {
        p.ph += dt * 2;
        p.x += (wx * 0.04 + Math.sin(p.ph) * 0.012) * dt;
        p.y += (0.02 + wy * 0.03 + Math.cos(p.ph * 0.7) * 0.01) * dt;
        p.x = ((p.x % 1.2) + 1.2) % 1.2;
        p.y = ((p.y % 1) + 1) % 1;
        const x = p.x * w - w * 0.1, y = p.y * h;
        ctx.beginPath();
        ctx.ellipse(x, y, m * 0.009 * p.r, m * 0.005 * p.r, p.ph, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawCrosshair(x, y, r) {
      for (const [c, lw] of [['rgba(29,29,31,0.55)', 4.5], ['#ffffff', 2]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.moveTo(x - r * 1.6, y);
        ctx.lineTo(x - r * 0.45, y);
        ctx.moveTo(x + r * 0.45, y);
        ctx.lineTo(x + r * 1.6, y);
        ctx.moveTo(x, y - r * 1.6);
        ctx.lineTo(x, y - r * 0.45);
        ctx.moveTo(x, y + r * 0.45);
        ctx.lineTo(x, y + r * 1.6);
        ctx.stroke();
      }
    }

    /** Cung đặt bên phải; lúc ngắm / bắn thì trượt hẳn ra góc dưới phải, chỉ còn đầu mũi tên. */
    function bowPos() {
      const out = 1 - bowVis;
      return [w - m * 0.11 + out * m * 0.55, h * 0.52 + out * h * 0.35];
    }

    /** Đầu mũi tên lúc kéo dây: giữa đáy màn hình, càng kéo càng lùi xuống (về phía người bắn). */
    function nockedTip() {
      const s = sway(now);
      return [w / 2 + s.u * m * 0.15, h - m * 0.26 + pose * m * 0.07 + s.v * m * 0.1];
    }

    function drawNocked() {
      if (state !== 'ready' || pose < 0.02) return;
      const [tx, ty] = nockedTip();
      // chĩa về phía tâm ngắm
      const s = sway(now);
      const [cx, cy] = proj(aim.u + s.u, aim.v + s.v, 1);
      const ang = Math.atan2(cy - ty, cx - tx);
      const th = Math.max(10, m * 0.035), head = Math.max(26, m * 0.1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, pose * 1.5);
      ctx.translate(tx, ty);
      ctx.rotate(ang);
      // thân gỗ chạy ra khỏi đáy màn hình
      ctx.lineCap = 'butt';
      ctx.strokeStyle = INK;
      ctx.lineWidth = th + 5;
      ctx.beginPath();
      ctx.moveTo(-head * 0.6, 0);
      ctx.lineTo(-h, 0);
      ctx.stroke();
      ctx.strokeStyle = '#8a4a2c';
      ctx.lineWidth = th;
      ctx.stroke();
      // mũi thép
      ctx.fillStyle = '#9aa3ad';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(head * 0.35, 0);
      ctx.lineTo(-head * 0.75, -head * 0.36);
      ctx.lineTo(-head * 0.6, 0);
      ctx.lineTo(-head * 0.75, head * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(head * 0.3, 0);
      ctx.lineTo(-head * 0.68, -head * 0.3);
      ctx.lineTo(-head * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawBow() {
      if (bowVis < 0.02) return;
      const [gx, gy] = bowPos();
      const th = Math.max(14, m * 0.055); // độ dày cánh cung
      const g = h * 0.07; // nửa chiều dài tay cầm
      const reach = Math.max(h * 0.62, 260);
      const limb = (dir) => {
        ctx.beginPath();
        ctx.moveTo(gx, gy + dir * g);
        ctx.bezierCurveTo(gx + th * 0.2, gy + dir * (g + reach * 0.35), gx + th * 1.5, gy + dir * reach * 0.75, gx + th * 2.6, gy + dir * reach);
      };
      // dây cung (phía sau cánh)
      const tipX = gx + th * 2.6;
      const nock = [tipX + th * 0.4, gy];
      ctx.strokeStyle = '#3b3b3b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tipX, gy - reach);
      ctx.lineTo(nock[0], nock[1]);
      ctx.lineTo(tipX, gy + reach);
      ctx.stroke();
      // cánh cung: viền đen rồi đỏ san hô
      ctx.lineCap = 'round';
      for (const dir of [-1, 1]) {
        limb(dir);
        ctx.strokeStyle = INK;
        ctx.lineWidth = th + 6;
        ctx.stroke();
        ctx.strokeStyle = '#ff6159';
        ctx.lineWidth = th;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = th * 0.22;
        ctx.save();
        ctx.translate(-th * 0.22, 0);
        limb(dir);
        ctx.stroke();
        ctx.restore();
      }
      ctx.lineCap = 'butt';
      // tay cầm nâu + 2 khớp nối đỏ
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      rr(gx - th * 0.45, gy - g, th * 0.9, g * 2, th * 0.2);
      ctx.fillStyle = '#a65a42';
      ctx.fill();
      ctx.stroke();
      for (const dir of [-1, 1]) {
        rr(gx - th * 0.8, gy + dir * g - th * 0.4, th * 1.6, th * 0.8, th * 0.35);
        ctx.fillStyle = '#ff6159';
        ctx.fill();
        ctx.stroke();
      }
      // mũi tên nằm trên tay đỡ khi đang sẵn sàng
      if (state === 'ready') {
        const ax = gx - m * 0.06, ay = gy;
        ctx.strokeStyle = INK;
        ctx.lineWidth = th * 0.34 + 4;
        ctx.beginPath();
        ctx.moveTo(gx + th * 0.6, gy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.strokeStyle = '#8a4a2c';
        ctx.lineWidth = th * 0.34;
        ctx.stroke();
        ctx.fillStyle = '#8f98a3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ax - th * 0.5, ay);
        ctx.lineTo(ax + th * 0.15, ay - th * 0.45);
        ctx.lineTo(ax + th * 0.15, ay + th * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    function drawSparks(dt) {
      for (const p of sparks) {
        if (p.life <= 0) continue;
        p.life -= dt * 1.4;
        p.vy += m * 1.2 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
    }

    function drawFloats(dt) {
      const fs = Math.max(26, Math.min(48, m * 0.09));
      ctx.textAlign = 'center';
      for (const f of floats) {
        if (f.life <= 0) continue;
        f.life -= dt * 0.9;
        f.y -= dt * 40;
        const pop = 1 + Math.max(0, f.life - 0.8) * 2.5;
        ctx.globalAlpha = Math.min(1, Math.max(0, f.life) * 2);
        ctx.font = `900 ${Math.round(fs * pop)}px "Be Vietnam Pro", sans-serif`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = INK;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.bad ? '#ff6b6b' : '#ffe14d';
        ctx.fillText(f.text, f.x, f.y);
        if (f.sub) {
          ctx.font = `800 ${Math.round(fs * 0.55)}px "Be Vietnam Pro", sans-serif`;
          ctx.strokeText(f.sub, f.x, f.y + fs * 0.7);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(f.sub, f.x, f.y + fs * 0.7);
        }
      }
      ctx.globalAlpha = 1;
    }

    /** Huy hiệu gió giữa phía trên: mũi tên chỉ hướng gió thổi + tốc độ có 1 chữ số thập phân. */
    function drawWind() {
      const fs = Math.max(13, Math.min(20, m * 0.042));
      const val = windShown.s.toFixed(1);
      const num = getLang() === 'vi' ? val.replace('.', ',') : val;
      ctx.font = `800 ${fs}px "Be Vietnam Pro", sans-serif`;
      const label = t('archery.wind');
      const tw = Math.max(ctx.measureText(label).width, ctx.measureText(num).width * 1.3);
      const ph = fs * 2.7, ir = ph * 0.4;
      const pw = ph * 0.5 + ir * 2 + fs * 0.6 + tw + ph * 0.35;
      const x = (w - pw) / 2, y = 10;
      // nảy nhẹ khi gió đổi
      const pop = 1 + Math.sin(windShown.pulse * Math.PI) * 0.12;
      ctx.save();
      ctx.translate(w / 2, y + ph / 2);
      ctx.scale(pop, pop);
      ctx.translate(-w / 2, -(y + ph / 2));
      rr(x, y, pw, ph, ph / 2);
      ctx.fillStyle = 'rgba(70,84,92,0.62)';
      ctx.fill();
      const cx = x + ph * 0.5, cy = y + ph / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, ir, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,48,54,0.55)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffcf3a';
      ctx.stroke();
      // mũi tên chỉ hướng gió thổi, xoay mượt khi gió đổi
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(windShown.a);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(2.5, ir * 0.2);
      ctx.beginPath();
      ctx.moveTo(-ir * 0.5, 0);
      ctx.lineTo(ir * 0.45, 0);
      ctx.moveTo(ir * 0.1, -ir * 0.35);
      ctx.lineTo(ir * 0.5, 0);
      ctx.lineTo(ir * 0.1, ir * 0.35);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      const tx = cx + ir + fs * 0.6;
      ctx.font = `800 ${Math.round(fs * 0.85)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillText(label, tx, cy - fs * 0.15);
      ctx.font = `900 ${Math.round(fs * 1.15)}px "Be Vietnam Pro", sans-serif`;
      ctx.fillText(num, tx, cy + fs * 1.05);
      ctx.restore();
    }

    /**
     * 5 ô điểm từng mũi ở phía trên (đáy màn hình dành cho đầu mũi tên): màn rộng thì ở góc trên trái
     * cùng hàng với huy hiệu gió, màn hẹp thì nằm giữa ngay dưới huy hiệu.
     */
    function drawShots() {
      const r = Math.max(13, Math.min(19, m * 0.04));
      const rowW = ARROWS * r * 2 + (ARROWS - 1) * 6;
      const badgeH = Math.max(13, Math.min(20, m * 0.042)) * 2.7;
      const wide = w >= 600;
      const x0 = wide ? 14 : (w - rowW) / 2;
      const y = wide ? 10 + badgeH / 2 : 10 + badgeH + 10 + r;
      ctx.textAlign = 'center';
      ctx.font = `800 ${Math.round(r * 0.95)}px "Be Vietnam Pro", sans-serif`;
      for (let i = 0; i < ARROWS; i++) {
        const x = x0 + r + i * (r * 2 + 6);
        const p = shotPoints[i];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = p === undefined ? 'rgba(29,29,31,0.35)' : p ? 'rgba(29,29,31,0.75)' : 'rgba(150,20,30,0.8)';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = i === shot && state !== 'done' ? '#ffcf3a' : 'rgba(255,255,255,0.7)';
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(p === undefined ? '' : String(p), x, y + r * 0.34);
      }
    }

    function drawHint() {
      const fs = Math.max(14, Math.min(20, m * 0.045));
      ctx.font = `800 ${fs}px "Be Vietnam Pro", sans-serif`;
      const text = `☝ ${t('archery.hint')}`;
      const tw = ctx.measureText(text).width;
      const x = w / 2, y = h * 0.74;
      ctx.globalAlpha = 0.75 + Math.sin(now * 4) * 0.25;
      rr(x - tw / 2 - fs, y - fs * 1.3, tw + fs * 2, fs * 2.3, fs * 1.15);
      ctx.fillStyle = 'rgba(29,29,31,0.6)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(text, x, y + fs * 0.05);
      ctx.globalAlpha = 1;
    }

    hud.score(0);
    hud.time(SHOT_SECONDS);
    raf = requestAnimationFrame(frame);
  });
}
