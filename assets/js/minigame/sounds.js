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
