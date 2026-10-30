// Hiệu ứng âm thanh mini game, tổng hợp bằng Web Audio (dùng chung AudioContext với pháo hoa ở sfx.js):
// không cần file âm thanh, không lo bản quyền. Âm thanh không bao giờ được làm hỏng game, nên mọi lỗi đều bị nuốt.
import { getAudio, rocketBurst } from '../world/sfx.js';

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };

/** Một nốt có đường bao: lên nhanh rồi tắt dần. */
function tone(freq, { at = 0, dur = 0.18, type = 'triangle', vol = 0.25, slide = 0 } = {}) {
  try {
    const a = getAudio();
    if (!a) return;
    const { ctx, master } = a;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch { /* bỏ qua */ }
}

/** Tiếng nhiễu ngắn qua bộ lọc (lật thẻ, tiếng nổ). */
function noiseHit({ at = 0, dur = 0.06, type = 'bandpass', freq = 2000, q = 1, vol = 0.3 } = {}) {
  try {
    const a = getAudio();
    if (!a) return;
    const { ctx, master, noise } = a;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t, Math.random(), dur + 0.02);
  } catch { /* bỏ qua */ }
}

/* ── chung ── */
/** Đếm 3-2-1 trước khi chơi, và đếm lùi những giây cuối. */
export const tick = () => tone(NOTE.A5, { dur: 0.12, type: 'square', vol: 0.08 });
/** Hiệu lệnh bắt đầu. */
export const go = () => tone(NOTE.C6, { dur: 0.35, type: 'square', vol: 0.1 });
/** Kết thúc lượt (không phá kỷ lục). */
export function finish() {
  tone(NOTE.G5, { dur: 0.2 });
  tone(NOTE.E5, { at: 0.14, dur: 0.2 });
  tone(NOTE.C5, { at: 0.28, dur: 0.45 });
}
/** Phá kỷ lục: kèn chiến thắng + pháo hoa. */
export function record() {
  [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(f, { at: i * 0.11, dur: 0.22, vol: 0.22 }));
  tone(NOTE.E6, { at: 0.46, dur: 0.7, vol: 0.2 });
  tone(NOTE.C6, { at: 0.46, dur: 0.7, vol: 0.16, type: 'sine' });
  [0.75, 1.05, 1.4].forEach((d) => rocketBurst((Math.random() - 0.5) * 0.8, d));
}

/* ── Hứng lì xì ── */
export function coin() {
  tone(NOTE.A5 * 1.5, { dur: 0.08, type: 'square', vol: 0.07 });
  tone(NOTE.E6, { at: 0.06, dur: 0.22, vol: 0.18 });
}
export function goldCoin() {
  [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].forEach((f, i) => tone(f, { at: i * 0.05, dur: 0.2, vol: 0.15 }));
}
export function bomb() {
  noiseHit({ dur: 0.35, type: 'lowpass', freq: 900, vol: 0.6 });
  tone(140, { dur: 0.4, type: 'sine', vol: 0.5, slide: -100 });
}

/* ── Đố vui ── */
export function correct() {
  tone(NOTE.E6, { dur: 0.12, vol: 0.2 });
  tone(NOTE.A5 * 2, { at: 0.1, dur: 0.3, vol: 0.2 });
}
export function wrong() {
  tone(220, { dur: 0.32, type: 'sawtooth', vol: 0.09, slide: -80 });
}

/* ── Lật thẻ ── */
export const flip = () => noiseHit({ dur: 0.05, freq: 3200, q: 2, vol: 0.25 });
export function match() {
  tone(NOTE.G5, { dur: 0.12, vol: 0.18 });
  tone(NOTE.C6, { at: 0.08, dur: 0.28, vol: 0.18 });
}
export function mismatch() {
  tone(NOTE.E5, { dur: 0.12, type: 'sine', vol: 0.14 });
  tone(NOTE.C5 * 0.9, { at: 0.1, dur: 0.2, type: 'sine', vol: 0.12 });
}

/* ── Bắn cung ── */
/** Chạy fn với AudioContext; lỗi hoặc trình duyệt không hỗ trợ thì trả về null. */
function withAudio(fn) {
  try {
    const a = getAudio();
    return a ? fn(a) : null;
  } catch { return null; }
}
/** Nguồn nhiễu lặp vô hạn (tiếng dây căng, tiếng gió). */
function noiseLoop(ctx, noise, t) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  src.start(t, Math.random());
  return src;
}
/** Tắt dần một nhánh âm thanh rồi dừng các nguồn của nó; gọi nhiều lần cũng không sao. */
function fader(ctx, out, sources) {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    try {
      const e = ctx.currentTime;
      out.gain.cancelScheduledValues(e);
      out.gain.setValueAtTime(out.gain.value, e);
      out.gain.linearRampToValueAtTime(0, e + 0.08);
      sources.forEach((s) => s.stop(e + 0.1));
    } catch { /* bỏ qua */ }
  };
}

/** Kéo dây: dây căng cao dần + gỗ cung kẽo kẹt, kéo dài tới khi thả. Trả về hàm dừng. */
export function bowDraw() {
  return withAudio(({ ctx, master, noise }) => {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(master);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.22, t + 0.1);
    env.gain.exponentialRampToValueAtTime(0.07, t + 0.9);
    env.connect(out);
    // dây căng: nhiễu qua bộ lọc hẹp, cao dần
    const str = noiseLoop(ctx, noise, t);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 7;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(1500, t + 0.9);
    str.connect(f);
    f.connect(env);
    // kẽo kẹt: răng cưa trầm bị rung biên độ
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(62, t);
    osc.frequency.linearRampToValueAtTime(92, t + 0.9);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const og = ctx.createGain();
    og.gain.value = 0.18;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 16;
    const lg = ctx.createGain();
    lg.gain.value = 0.16;
    lfo.connect(lg);
    lg.connect(og.gain);
    osc.connect(lp);
    lp.connect(og);
    og.connect(env);
    osc.start(t);
    lfo.start(t);
    return fader(ctx, out, [str, osc, lfo]);
  }) || (() => {});
}

/** Thả dây: tiếng "tưng" của dây cung + tiếng bật. */
export function release() {
  tone(98, { dur: 0.45, type: 'triangle', vol: 0.4, slide: -25 });
  tone(196, { dur: 0.28, type: 'sine', vol: 0.16 });
  tone(392, { at: 0.005, dur: 0.12, type: 'triangle', vol: 0.08 });
  noiseHit({ dur: 0.05, type: 'highpass', freq: 3000, vol: 0.4 });
}

/** Mũi tên xé gió: tiếng vút trầm dần theo đường bay, lệch trái/phải theo hướng bay. */
export function whoosh(dur, pan = 0) {
  withAudio(({ ctx, master, noise }) => {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(2800, t);
    f.frequency.exponentialRampToValueAtTime(450, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.06, t + dur * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    // Safari cũ không có StereoPanner thì phát giữa
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(0, t);
      p.pan.linearRampToValueAtTime(Math.max(-1, Math.min(1, pan)), t + dur);
      g.connect(p);
      p.connect(master);
    } else g.connect(master);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  });
}

/** Cắm vào bia: tiếng phập + nốt cao dần theo điểm. */
export function hit(points) {
  tone(130, { dur: 0.2, type: 'sine', vol: 0.55, slide: -75 });
  noiseHit({ dur: 0.1, type: 'lowpass', freq: 600, vol: 0.55 });
  if (points < 10) tone(NOTE.C5 * (1 + points / 10), { at: 0.06, dur: 0.25, vol: 0.18 });
}
/** Đuôi mũi tên rung sau khi cắm: "boing" nhỏ. */
export function wobble() {
  withAudio(({ ctx, master }) => {
    const t = ctx.currentTime + 0.04;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 240;
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(26, t);
    lfo.frequency.linearRampToValueAtTime(14, t + 0.45);
    const depth = ctx.createGain();
    depth.gain.value = 35;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.5);
    lfo.stop(t + 0.5);
  });
}
/** Hồng tâm: chuông ngân + tiếng vỗ tay. */
export function bullseye() {
  [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].forEach((f, i) => tone(f, { at: 0.08 + i * 0.07, dur: 0.35, vol: 0.16 }));
  tone(NOTE.C7, { at: 0.4, dur: 0.9, type: 'sine', vol: 0.1 });
  for (let i = 0; i < 70; i++) {
    const at = 0.25 + Math.random() * Math.random() * 1.6; // dày ở đầu, thưa dần
    noiseHit({ at, dur: 0.018, type: 'bandpass', freq: 1200 + Math.random() * 2400, q: 1.5, vol: 0.06 + Math.random() * 0.08 });
  }
}
/** Cắm vào giá gỗ ngoài vòng bia: tiếng gõ gỗ. */
export function boardHit() {
  noiseHit({ dur: 0.09, type: 'bandpass', freq: 850, q: 5, vol: 0.6 });
  tone(180, { dur: 0.12, type: 'sine', vol: 0.3, slide: -60 });
  tone(260, { at: 0.12, dur: 0.4, type: 'sine', vol: 0.1, slide: -110 });
}
/** Trượt hẳn (rơi xuống cỏ) hoặc hết giờ: tiếng sột soạt + "ồ…" trầm xuống. */
export function miss() {
  noiseHit({ dur: 0.25, type: 'lowpass', freq: 350, vol: 0.35 });
  tone(440, { at: 0.1, dur: 0.55, type: 'sine', vol: 0.12, slide: -190 });
  tone(330, { at: 0.1, dur: 0.55, type: 'sine', vol: 0.08, slide: -140 });
}
/** Lắp mũi tên mới lên dây. */
export function nock() {
  noiseHit({ dur: 0.04, type: 'bandpass', freq: 2200, q: 2, vol: 0.9 });
  tone(1250, { at: 0.03, dur: 0.05, type: 'square', vol: 0.08 });
  tone(900, { at: 0.07, dur: 0.06, type: 'triangle', vol: 0.12 });
}

/**
 * Tiếng gió nền suốt ván, to/nhỏ theo tốc độ gió, có từng cơn.
 * set(tốc độ) khi gió đổi (kèm một cơn gió giật), stop() khi kết thúc.
 */
export function windAmbience(speed) {
  const api = withAudio(({ ctx, master, noise }) => {
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(master);
    const src = noiseLoop(ctx, noise, t);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0;
    // từng cơn gió: dao động chậm cộng vào âm lượng
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.35;
    const lg = ctx.createGain();
    lg.gain.value = 0;
    lfo.connect(lg);
    lg.connect(g.gain);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    lfo.start(t);
    const set = (s, gust = true) => {
      try {
        const e = ctx.currentTime;
        const base = 0.012 + s * 0.011;
        g.gain.cancelScheduledValues(e);
        g.gain.setValueAtTime(g.gain.value, e);
        if (gust) g.gain.linearRampToValueAtTime(base * 2.6, e + 0.35); // cơn gió giật khi đổi
        g.gain.linearRampToValueAtTime(base, e + (gust ? 1.1 : 0.4));
        lg.gain.setTargetAtTime(base * 0.5, e, 0.3);
        f.frequency.setTargetAtTime(380 + s * 130, e, 0.3);
      } catch { /* bỏ qua */ }
    };
    set(speed, false);
    return { set, stop: fader(ctx, out, [src, lfo]) };
  });
  return api || { set() {}, stop() {} };
}
