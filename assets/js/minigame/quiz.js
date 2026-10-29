// Đố vui Tết ba miền: 10 câu mỗi lượt, mỗi câu 15 giây.
// Đúng = 5 điểm + thưởng tốc độ tối đa 5 (trả lời trong 3 giây đầu) → tối đa 100.
// Câu hỏi nằm trong quiz-bank.js. Mỗi lượt bốc câu dàn đều qua các chủ đề, ưu tiên câu người chơi chưa gặp.
import * as sfx from './sounds.js';
import { BANK } from './quiz-bank.js';

const COUNT = 10;
const PER_Q = 15;
const FEEDBACK_MS = 1400;

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* Câu đã gặp được nhớ trên máy (hash của nội dung câu) để lượt sau ưu tiên câu mới. */
const SEEN_KEY = 'yep2026.quizSeen';
const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};
function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}
function saveSeen(seen) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* bỏ qua */ }
}

/** 10 câu: lần lượt mỗi chủ đề một câu (chủ đề xáo ngẫu nhiên), câu chưa gặp trước, thiếu mới lấy câu đã gặp. */
function pickQuestions() {
  let seen = loadSeen();

  const roundRobin = (pool) => {
    const byTopic = {};
    for (const x of shuffle([...pool])) (byTopic[x.t] ||= []).push(x);
    const topics = shuffle(Object.keys(byTopic));
    const out = [];
    while (out.length < pool.length) {
      for (const t of topics) if (byTopic[t].length) out.push(byTopic[t].pop());
    }
    return out;
  };
  const fresh = roundRobin(BANK.filter((x) => !seen.has(hash(x.q))));
  const picked = fresh.slice(0, COUNT);
  if (picked.length < COUNT) {
    // gặp gần hết kho: lấy nốt câu chưa gặp, bù bằng câu cũ, rồi bắt đầu vòng mới
    picked.push(...roundRobin(BANK.filter((x) => !picked.includes(x))).slice(0, COUNT - picked.length));
    seen = new Set();
  }

  picked.forEach((x) => seen.add(hash(x.q)));
  saveSeen(seen);
  return shuffle(picked);
}

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const picked = pickQuestions();
    const box = document.createElement('div');
    box.className = 'quiz';
    stage.appendChild(box);

    let score = 0;
    let idx = 0;
    let timer = 0;
    let wait = 0;

    signal.addEventListener('abort', () => {
      clearInterval(timer);
      clearTimeout(wait);
      box.remove();
      resolve(null);
    }, { once: true });

    function ask() {
      if (idx >= picked.length) {
        box.remove();
        resolve(score);
        return;
      }
      const { q, o } = picked[idx];
      const correct = o[0];
      const opts = shuffle([...o]);
      box.innerHTML = `
        <p class="quiz-count">Câu ${idx + 1}/${COUNT}</p>
        <div class="quiz-bar"><span></span></div>
        <h3 class="quiz-q"></h3>
        <div class="quiz-opts">${opts.map(() => '<button type="button" class="quiz-opt"></button>').join('')}</div>`;
      box.querySelector('.quiz-q').textContent = q;
      const buttons = [...box.querySelectorAll('.quiz-opt')];
      buttons.forEach((b, i) => { b.textContent = opts[i]; });
      buttons[0].focus({ preventScroll: true });
      const bar = box.querySelector('.quiz-bar span');

      const t0 = performance.now();
      let answered = false;
      const finish = (choice) => {
        if (answered) return;
        answered = true;
        clearInterval(timer);
        const remaining = Math.max(0, PER_Q - (performance.now() - t0) / 1000);
        buttons.forEach((b) => {
          b.disabled = true;
          if (b.textContent === correct) b.classList.add('is-right');
        });
        if (choice && choice.textContent === correct) {
          score += 5 + Math.min(5, Math.ceil(remaining / 2.4));
          hud.score(score);
          sfx.correct();
        } else {
          choice?.classList.add('is-wrong');
          sfx.wrong();
        }
        idx++;
        wait = setTimeout(ask, FEEDBACK_MS);
      };
      buttons.forEach((b) => b.addEventListener('click', () => finish(b)));

      let lastSec = PER_Q;
      const tick = () => {
        const left = PER_Q - (performance.now() - t0) / 1000;
        const sec = Math.max(0, Math.ceil(left));
        hud.time(sec);
        if (sec !== lastSec) {
          lastSec = sec;
          if (sec > 0 && sec <= 3) sfx.tick();
        }
        bar.style.transform = `scaleX(${Math.max(0, left / PER_Q)})`;
        if (left <= 0) finish(null);
      };
      tick();
      timer = setInterval(tick, 100);
    }

    hud.score(0);
    ask();
  });
}
