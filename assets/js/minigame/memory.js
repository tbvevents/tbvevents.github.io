// Lật thẻ ghép đôi: 8 cặp biểu tượng Tết trong 90 giây.
// Hoàn thành: 100 − 2 điểm mỗi lượt lật thừa (quá 12 lượt) − 1 điểm mỗi giây quá 30 giây, tối thiểu 20.
// Hết giờ chưa xong: 4 điểm mỗi cặp đã ghép.
const SYMBOLS = [
  ['🌸', 'Hoa đào'], ['🌼', 'Hoa mai'], ['🧧', 'Lì xì'], ['🏮', 'Đèn lồng'],
  ['🐐', 'Dê vàng'], ['🎆', 'Pháo hoa'], ['🐉', 'Rồng'], ['🍊', 'Quả quýt'],
];
const LIMIT = 90;
const FREE_MOVES = 12;
const FREE_SECONDS = 30;

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const deck = [...SYMBOLS, ...SYMBOLS]
      .map((s) => ({ s, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map(({ s }) => s);

    const grid = document.createElement('div');
    grid.className = 'memory';
    grid.innerHTML = deck.map(([icon, label], i) => `
      <button type="button" class="mem-card" data-i="${i}" aria-label="Thẻ ${i + 1}, úp">
        <span class="mem-face mem-back" aria-hidden="true"></span>
        <span class="mem-face mem-front" aria-hidden="true">${icon}</span>
      </button>`).join('');
    stage.appendChild(grid);
    const cards = [...grid.querySelectorAll('.mem-card')];

    let open = [];
    let moves = 0;
    let pairs = 0;
    let busy = false;
    let flipBack = 0;
    const t0 = performance.now();

    const elapsed = () => (performance.now() - t0) / 1000;
    const liveScore = () => Math.max(20, 100 - 2 * Math.max(0, moves - FREE_MOVES) - Math.max(0, Math.floor(elapsed() - FREE_SECONDS)));

    const end = (score) => {
      clearInterval(timer);
      clearTimeout(flipBack);
      setTimeout(() => { grid.remove(); resolve(score); }, 700);
    };

    const timer = setInterval(() => {
      const left = LIMIT - elapsed();
      hud.time(Math.max(0, Math.ceil(left)));
      hud.score(pairs * 4);
      if (left <= 0) {
        cards.forEach((c) => { c.disabled = true; });
        end(pairs * 4);
      }
    }, 200);

    signal.addEventListener('abort', () => {
      clearInterval(timer);
      clearTimeout(flipBack);
      grid.remove();
      resolve(null);
    }, { once: true });

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.mem-card');
      if (!card || busy || card.classList.contains('is-open')) return;
      const i = +card.dataset.i;
      card.classList.add('is-open');
      card.setAttribute('aria-label', `Thẻ ${i + 1}, ${deck[i][1]}`);
      open.push(card);
      if (open.length < 2) return;

      moves++;
      const [a, b] = open;
      open = [];
      if (deck[+a.dataset.i][0] === deck[+b.dataset.i][0]) {
        a.classList.add('is-matched');
        b.classList.add('is-matched');
        a.disabled = b.disabled = true;
        pairs++;
        hud.score(pairs * 4);
        if (pairs === SYMBOLS.length) end(liveScore());
      } else {
        busy = true;
        flipBack = setTimeout(() => {
          for (const c of [a, b]) {
            c.classList.remove('is-open');
            c.setAttribute('aria-label', `Thẻ ${+c.dataset.i + 1}, úp`);
          }
          busy = false;
        }, 750);
      }
    });

    hud.score(0);
  });
}
