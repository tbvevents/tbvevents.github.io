// Bắn cung: 5 mũi tên, chạm-kéo để nhắm, thả để bắn. Gió ngẫu nhiên mỗi mũi đẩy lệch ngang.
// Vòng trong cùng 10 điểm, giảm dần 1 điểm mỗi vòng; ra ngoài bia 0 điểm → tối đa 50,
// khớp với trần điểm trong firestore.rules.
import * as sfx from './sounds.js';
import { t } from '../i18n.js';

const ARROWS = 5;
const SHOT_SECONDS = 10;
const FLIGHT = 0.55; // giây mũi tên bay
const PAUSE = 0.85; // giây xem kết quả trước mũi kế tiếp
const MAX_WIND = 5;
// màu 10 vòng từ ngoài vào trong: trắng, đen, xanh, đỏ, vàng (mỗi màu 2 vòng)
const RING_COLORS = ['#f4efe6', '#f4efe6', '#2a2a2e', '#2a2a2e', '#2f7fd8', '#2f7fd8', '#d8202e', '#d8202e', '#ffcf4a', '#ffcf4a'];

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'archery-canvas';
    canvas.setAttribute('aria-label', t('archery.aria'));
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

    // toạ độ bia tính lại mỗi khung hình theo kích thước canvas; điểm chạm lưu tương đối theo bia
    const target = () => {
      const r = Math.max(60, Math.min(w * 0.42, h * 0.3));
      return { x: w / 2, y: Math.max(r + 56, h * 0.4), r };
    };
    const bow = () => ({ x: w / 2, y: h - 46 });

    const newWind = () => Math.round((Math.random() * 2 - 1) * MAX_WIND);
    let wind = newWind();
    let shot = 0; // số mũi đã bắn
    let score = 0;
    let state = 'ready'; // ready | flying | pause | done
    let stateAt = 0; // thời điểm bắt đầu trạng thái hiện tại (giây)
    let clockStart = 0; // đồng hồ bắn của mũi hiện tại
    let lastSec = SHOT_SECONDS;
    const hits = []; // { u, v } theo bán kính bia (0,0 = hồng tâm)
    let flight = null; // { u, v, points }
    const floats = [];

    // nhắm: tâm ngắm nằm phía trên ngón tay để ngón tay không che bia
    const aim = { on: false, x: 0, y: 0, pointer: null };
    const lift = () => Math.min(90, h * 0.14);
    const setAim = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      aim.x = Math.min(w, Math.max(0, clientX - r.left));
      aim.y = Math.min(h, Math.max(0, clientY - r.top - lift()));
    };
    // rung tay nhẹ để không thể đặt cứng tâm ngắm vào hồng tâm
    const sway = (time) => {
      const a = target().r * 0.07;
      return { x: Math.sin(time * 1.9) * a + Math.sin(time * 4.3) * a * 0.35, y: Math.cos(time * 2.4) * a * 0.8 };
    };

    const onDown = (e) => {
      if (state !== 'ready' || aim.on) return;
      e.preventDefault();
      aim.on = true;
      aim.pointer = e.pointerId;
      canvas.setPointerCapture?.(e.pointerId);
      setAim(e.clientX, e.clientY);
      sfx.drawBow();
    };
    const onMove = (e) => { if (aim.on && e.pointerId === aim.pointer) setAim(e.clientX, e.clientY); };
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
        if (down && !aim.on && state === 'ready') {
          const tg = target();
          aim.on = true;
          aim.pointer = 'key';
          aim.x = tg.x;
          aim.y = tg.y + tg.r * 1.4;
          sfx.drawBow();
        }
      } else if ((e.key === ' ' || e.key === 'Enter') && down) {
        if (aim.on && aim.pointer === 'key') { aim.on = false; fire(); }
      } else return;
      e.preventDefault();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKey);

    const t0 = performance.now();
    let last = t0;
    let now = 0;
    let raf = 0;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKey);
      canvas.remove();
    };
    signal.addEventListener('abort', () => { cleanup(); resolve(null); }, { once: true });

    function fire() {
      if (state !== 'ready') return;
      const tg = target();
      const s = sway(now);
      // gió đẩy lệch ngang tới ~0.45 bán kính bia ở cấp mạnh nhất, kèm lệch nhỏ ngẫu nhiên
      const x = aim.x + s.x + wind * tg.r * 0.09 + (Math.random() - 0.5) * tg.r * 0.04;
      const y = aim.y + s.y + (Math.random() - 0.5) * tg.r * 0.04;
      const u = (x - tg.x) / tg.r;
      const v = (y - tg.y) / tg.r;
      const d = Math.hypot(u, v);
      flight = { u, v, points: d >= 1 ? 0 : 10 - Math.floor(d * 10) };
      setState('flying');
      sfx.release();
    }

    /** Hết giờ mà chưa bắn: mũi đó 0 điểm. */
    function timeout() {
      aim.on = false;
      flight = null;
      land({ u: null, v: null, points: 0 });
    }

    function land(f) {
      shot++;
      score += f.points;
      hud.score(score);
      const tg = target();
      if (f.u !== null) hits.push({ u: f.u, v: f.v });
      const fx = f.u === null ? tg.x : tg.x + f.u * tg.r;
      const fy = f.u === null ? tg.y : tg.y + f.v * tg.r;
      floats.push({ x: Math.min(w - 40, Math.max(40, fx)), y: Math.min(h - 60, Math.max(40, fy - 20)), text: f.points ? `+${f.points}` : t('archery.miss'), bad: !f.points, life: 1 });
      if (f.points) sfx.hit(f.points);
      else sfx.miss();
      setState(shot >= ARROWS ? 'done' : 'pause');
    }

    function setState(s) {
      state = s;
      stateAt = now;
    }

    function frame(ts) {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      now = (ts - t0) / 1000;

      if (keys.left) aim.x = Math.max(0, aim.x - dt * 220);
      if (keys.right) aim.x = Math.min(w, aim.x + dt * 220);
      if (keys.up) aim.y = Math.max(0, aim.y - dt * 220);
      if (keys.down) aim.y = Math.min(h, aim.y + dt * 220);

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
        wind = newWind();
        clockStart = now;
        lastSec = SHOT_SECONDS;
        setState('ready');
      } else if (state === 'done' && now - stateAt >= PAUSE) {
        cleanup();
        resolve(score);
        return;
      }

      draw();
      raf = requestAnimationFrame(frame);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const tg = target();
      drawTarget(tg);
      for (const p of hits) drawStuck(tg.x + p.u * tg.r, tg.y + p.v * tg.r);
      drawBow(bow(), aim.on && state === 'ready');
      if (state === 'flying' && flight) drawFlying(tg);
      if (aim.on && state === 'ready') {
        const s = sway(now);
        drawCrosshair(aim.x + s.x, aim.y + s.y);
      }
      drawWind();
      drawQuiver();
      for (const f of floats) {
        if (f.life <= 0) continue;
        f.life -= 1 / 60;
        f.y -= 0.6;
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = f.bad ? '#ff6b6b' : '#ffe7a3';
        ctx.font = '800 26px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1;
      }
    }

    function drawTarget({ x, y, r }) {
      // chân giá đỡ
      ctx.strokeStyle = '#7a4a22';
      ctx.lineWidth = Math.max(4, r * 0.06);
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y + r * 0.6);
      ctx.lineTo(x - r * 0.75, y + r * 1.35);
      ctx.moveTo(x + r * 0.5, y + r * 0.6);
      ctx.lineTo(x + r * 0.75, y + r * 1.35);
      ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const rr = r * (1 - i / 10);
        ctx.fillStyle = RING_COLORS[i];
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = i === 2 || i === 3 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, r * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }

    function drawStuck(x, y) {
      // mũi tên cắm trên bia nhìn từ phía sau: đuôi lông vũ chĩa xuống phải
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y + 16);
      ctx.stroke();
      ctx.fillStyle = '#c8102e';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 13);
      ctx.lineTo(x + 16, y + 14);
      ctx.lineTo(x + 12, y + 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1b0b14';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFlying(tg) {
      const b = bow();
      const p = Math.min(1, (now - stateAt) / FLIGHT);
      const e = 1 - (1 - p) * (1 - p);
      const tx = tg.x + flight.u * tg.r;
      const ty = tg.y + flight.v * tg.r;
      // quỹ đạo hơi vồng lên, mũi tên nhỏ dần khi bay xa
      const x = b.x + (tx - b.x) * e;
      const y = b.y + (ty - b.y) * e - Math.sin(p * Math.PI) * tg.r * 0.25;
      const len = 46 * (1 - e * 0.65);
      const ang = Math.atan2(ty - b.y, tx - b.x);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 3 * (1 - e * 0.5);
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.fillStyle = '#c0c4cc';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(-len, -3, len * 0.22, 6);
      ctx.restore();
    }

    function drawBow({ x, y }, drawn) {
      const s = Math.max(70, Math.min(w * 0.22, 120));
      const pull = drawn ? 22 : 0;
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x - s / 2, y + 8);
      ctx.quadraticCurveTo(x, y - 34, x + s / 2, y + 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,246,230,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - s / 2, y + 8);
      ctx.lineTo(x, y + 8 + pull);
      ctx.lineTo(x + s / 2, y + 8);
      ctx.stroke();
      if (drawn) {
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 8 + pull);
        ctx.lineTo(x, y - 30);
        ctx.stroke();
      }
    }

    function drawCrosshair(x, y) {
      ctx.strokeStyle = '#fff6e6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.moveTo(x - 22, y);
      ctx.lineTo(x - 6, y);
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + 22, y);
      ctx.moveTo(x, y - 22);
      ctx.lineTo(x, y - 6);
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x, y + 22);
      ctx.stroke();
    }

    function drawWind() {
      const x = 16, y = 26;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(x - 8, y - 18, 138, 30, 10);
      ctx.fill();
      ctx.fillStyle = '#ffe7a3';
      ctx.font = '600 14px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${t('archery.wind')} ${Math.abs(wind)}`, x, y + 2);
      if (!wind) return;
      // mũi tên chỉ hướng gió, dài theo độ mạnh
      const ax = x + 92, len = 8 + Math.abs(wind) * 5, dir = Math.sign(wind);
      const x0 = ax - (dir * len) / 2, x1 = ax + (dir * len) / 2;
      ctx.strokeStyle = '#ffe7a3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, y - 3);
      ctx.lineTo(x1, y - 3);
      ctx.moveTo(x1 - dir * 6, y - 9);
      ctx.lineTo(x1, y - 3);
      ctx.lineTo(x1 - dir * 6, y + 3);
      ctx.stroke();
    }

    function drawQuiver() {
      // các mũi còn lại sáng, đã bắn thì mờ
      for (let i = 0; i < ARROWS; i++) {
        const x = w - 20 - i * 14, y = 12;
        ctx.globalAlpha = i < ARROWS - shot ? 1 : 0.25;
        ctx.strokeStyle = '#ffe7a3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 26);
        ctx.stroke();
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(x - 3, y + 20, 6, 8);
        ctx.fillStyle = '#c0c4cc';
        ctx.beginPath();
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x - 3, y + 2);
        ctx.lineTo(x + 3, y + 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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
    hud.time(SHOT_SECONDS);
    raf = requestAnimationFrame(frame);
  });
}
