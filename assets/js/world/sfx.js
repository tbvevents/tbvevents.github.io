// Âm thanh pháo hoa tổng hợp bằng Web Audio API: không cần file âm thanh, không lo bản quyền.
// Chỉ phát khi người dùng chủ động bấm bắn pháo hoa (xem main.js), pháo hoa tự động vẫn im lặng.
let ctx = null;
let master = null;
let noise = null;
let active = 0;

/** Dùng một AudioContext có sẵn (ví dụ OfflineAudioContext khi kiểm thử). */
export function useAudioContext(c) {
  ctx = c;
  const comp = c.createDynamicsCompressor(); // chống vỡ tiếng khi nhiều quả nổ cùng lúc
  master = c.createGain();
  master.gain.value = 0.55;
  master.connect(comp);
  comp.connect(c.destination);
  noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

function ready() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    useAudioContext(new AC());
  }
  if (ctx.state === 'suspended' && ctx.resume) {
    const r = ctx.resume();
    if (r && r.catch) r.catch(() => {});
  }
  return true;
}

function noiseSource(t, dur) {
  const s = ctx.createBufferSource();
  s.buffer = noise;
  s.start(t, Math.random() * 1.5, dur);
  return s;
}

/** Gain có đường bao: 0 -> peak (attack) -> 0 (giảm dần theo hàm mũ). */
function envelope(t, attack, peak, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

/** Lên nhanh, giữ gần hết thời gian bay rồi tắt hẳn khi quả pháo nổ. */
function sustained(t, attack, peak, end, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(peak * end, t + dur);
  g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
  return g;
}

function out(node, pan = 0) {
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p);
    p.connect(master);
  } else {
    node.connect(master);
  }
}

/** Tiếng "vút" khi quả pháo bay lên (kéo dài `dur` giây). */
export function rocketLaunch(dur = 1.2, delay = 0) {
  try {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const pan = (Math.random() - 0.5) * 0.5;

    const hiss = noiseSource(t, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(450, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + dur);
    const hg = sustained(t, 0.15, 0.5, 0.45, dur);
    hiss.connect(bp);
    bp.connect(hg);
    out(hg, pan);

    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(700, t);
    whistle.frequency.exponentialRampToValueAtTime(2400, t + dur);
    const wg = sustained(t, 0.1, 0.07, 0.5, dur);
    whistle.connect(wg);
    out(wg, pan);
    whistle.start(t);
    whistle.stop(t + dur + 0.05);
  } catch (e) { /* âm thanh không bao giờ được làm hỏng hoạt ảnh */ }
}

/** Tiếng nổ "đùng" + lách tách của pháo hoa. */
export function rocketBurst(pan = (Math.random() - 0.5) * 0.5, delay = 0) {
  try {
    if (!ready()) return;
    const t = ctx.currentTime + delay;
    const crowded = active >= 5;
    active++;
    setTimeout(() => { active--; }, 1800);

    // thân tiếng nổ: sóng sin trầm tụt tần số
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    const f0 = 130 + Math.random() * 40;
    boom.frequency.setValueAtTime(f0, t);
    boom.frequency.exponentialRampToValueAtTime(36, t + 0.5);
    const bg = envelope(t, 0.006, crowded ? 0.5 : 0.9, 0.65);
    boom.connect(bg);
    out(bg, pan);
    boom.start(t);
    boom.stop(t + 0.8);

    // cú nổ "bốp": noise qua lowpass
    const thump = noiseSource(t, 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + 0.35);
    const tg = envelope(t, 0.004, 0.8, 0.38);
    thump.connect(lp);
    lp.connect(tg);
    out(tg, pan);

    // lách tách: nhiều tiếng click ngắn rải rác, thưa dần
    if (crowded) return;
    const n = 12 + Math.floor(Math.random() * 10);
    for (let i = 0; i < n; i++) {
      const at = t + 0.1 + Math.pow(Math.random(), 1.6) * 1.2;
      const len = 0.012 + Math.random() * 0.03;
      const click = noiseSource(at, len + 0.02);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2200 + Math.random() * 2500;
      const cg = envelope(at, 0.002, 0.22 * (1 - (at - t) / 1.6), len);
      click.connect(hp);
      hp.connect(cg);
      out(cg, pan + (Math.random() - 0.5) * 0.4);
    }
  } catch (e) { /* bỏ qua */ }
}
