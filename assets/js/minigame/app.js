// Trang mini game: đăng nhập Gmail → nhập MSNV → chọn game → nộp điểm.
import { GAMES } from '../config.js';
import { isConfigured } from '../firebase.js';
import * as sfx from './sounds.js';

const $ = (s) => document.querySelector(s);
const screens = ['config', 'login', 'claim', 'lobby', 'play', 'result'];
const musicBtn = $('#music-toggle');
const show = (name) => {
  screens.forEach((s) => { $(`#s-${s}`).hidden = s !== name; });
  // đang chơi: ẩn header để vùng chơi chiếm gần hết màn hình
  const playingNow = name === 'play';
  document.body.classList.toggle('is-playing', playingNow);
  // nút nhạc nằm trong HUD khi chơi để không che vùng chơi, ngoài ra nổi ở góc màn hình
  if (!musicBtn) return;
  if (playingNow) $('.hud').appendChild(musicBtn);
  else if (musicBtn.parentElement !== document.body) document.body.appendChild(musicBtn);
};
const RULES_SECONDS = 10;

const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 4200);
}

const GAME = Object.fromEntries(GAMES.list.map((g) => [g.id, g]));
const loaders = {
  lixi: () => import('./lixi.js'),
  quiz: () => import('./quiz.js'),
  memory: () => import('./memory.js'),
};

const now = () => Date.now();
const isOpen = () => now() >= Date.parse(GAMES.openAt) && now() < Date.parse(GAMES.closeAt);
const inAppBrowser = /FBAN|FBAV|Instagram|Zalo|Line\/|MicroMessenger|TikTok/i.test(navigator.userAgent);

if (!isConfigured) {
  show('config');
} else {
  start();
}

async function start() {
  const api = await import('./api.js');
  let profile = null;
  let score = null;
  let stopScore = null;
  let pendingMsnv = '';
  let playing = null;
  let rankedTotal = -1;

  $('#close-label').textContent = GAMES.closeLabel;
  if (inAppBrowser) $('#inapp-warn').hidden = false;

  /* ── đăng nhập ── */
  async function doLogin() {
    try {
      await api.signIn();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/popup-blocked') toast('Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.');
      else if (err.code === 'auth/unauthorized-domain') toast('Tên miền chưa được cấp phép trong Firebase Authentication.');
      else toast('Đăng nhập không thành công. Vui lòng thử lại.');
      console.warn(err);
    }
  }
  $('#btn-login').addEventListener('click', doLogin);
  $('#btn-top-login').addEventListener('click', doLogin);
  $('#btn-logout').addEventListener('click', () => api.logOut());

  api.onUser(async (user) => {
    stopScore?.();
    stopScore = null;
    abortGame();
    closeRules?.();
    // góc phải header: chưa đăng nhập → nút Đăng nhập; đã đăng nhập → email + Đăng xuất
    $('#who').hidden = !user;
    $('#btn-top-login').hidden = Boolean(user);
    if (!user) {
      show('login');
      return;
    }
    $('#who-email').textContent = user.email;
    try {
      profile = await api.getProfile(user.uid);
    } catch (err) {
      console.warn(err);
      toast('Không tải được hồ sơ. Kiểm tra kết nối mạng.');
      return;
    }
    if (!profile) {
      resetClaim();
      show('claim');
      return;
    }
    api.rememberMsnv(profile.msnv);
    enterLobby(user.uid);
  });

  /* ── nhận MSNV ── */
  function resetClaim() {
    pendingMsnv = '';
    $('#claim-form').hidden = false;
    $('#claim-confirm').hidden = true;
    $('#msnv').value = '';
  }

  $('#claim-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msnv = api.normalizeMsnv($('#msnv').value);
    if (!msnv) return;
    const btn = e.submitter || e.currentTarget.querySelector('button');
    btn.disabled = true;
    try {
      const emp = await api.lookupEmployee(msnv);
      if (!emp) toast(`Không tìm thấy MSNV ${msnv} trong danh sách. Kiểm tra lại hoặc liên hệ BTC.`);
      else if (emp.claimed) toast(`MSNV ${msnv} đã được liên kết với một Gmail khác. Vui lòng liên hệ BTC.`);
      else {
        pendingMsnv = msnv;
        $('#confirm-name').textContent = emp.name;
        $('#confirm-msnv').textContent = msnv;
        $('#claim-form').hidden = true;
        $('#claim-confirm').hidden = false;
      }
    } catch (err) {
      console.warn(err);
      toast('Không kiểm tra được MSNV. Vui lòng thử lại.');
    } finally {
      btn.disabled = false;
    }
  });

  $('#btn-not-me').addEventListener('click', resetClaim);
  $('#btn-confirm').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api.claimMsnv(pendingMsnv, $('#confirm-name').textContent);
      profile = await api.getProfile(api.auth.currentUser.uid);
      enterLobby(api.auth.currentUser.uid);
    } catch (err) {
      console.warn(err);
      toast('Không liên kết được MSNV (có thể vừa có người khác nhận). Vui lòng liên hệ BTC.');
      resetClaim();
    } finally {
      btn.disabled = false;
    }
  });

  /* ── sảnh ── */
  function enterLobby(uid) {
    show('lobby');
    stopScore = api.watchMyScore(uid, (s) => {
      score = s;
      renderLobby();
    });
  }

  function renderLobby() {
    if (!score) return;
    $('#me-name').textContent = score.name;
    $('#me-msnv').textContent = score.msnv;
    $('#me-total').textContent = score.total;
    const open = isOpen();
    $('#closed-note').hidden = open;
    $('#closed-note').textContent = now() < Date.parse(GAMES.openAt)
      ? 'Mini game chưa mở. Hẹn bạn quay lại sớm!'
      : 'Đã hết thời gian tính điểm. Cảm ơn bạn đã tham gia!';
    if (score.banned) {
      $('#closed-note').hidden = false;
      $('#closed-note').textContent = 'Kết quả của bạn đang được BTC xem xét. Vui lòng liên hệ BTC.';
    }
    const quizLeft = api.quizPlaysLeft(score);
    $('#game-list').innerHTML = GAMES.list.map((g) => {
      const isQuiz = g.id === 'quiz';
      const left = isQuiz ? (quizLeft ? `Còn ${quizLeft} lượt hôm nay` : 'Hết lượt — mai quay lại') : '';
      const enabled = open && !score.banned && (!isQuiz || quizLeft > 0);
      return `
      <li>
        <button class="game-tile" type="button" data-play="${g.id}" title="${g.title}"
          aria-label="${g.title} — kỷ lục ${score[g.id]} trên ${g.max}${left ? `. ${left}` : ''}" ${enabled ? '' : 'disabled'}>
          <span class="game-icon" aria-hidden="true">${g.icon}</span>
          <span class="game-name">${g.short}</span>
          <span class="game-best"><b>${score[g.id]}</b>/${g.max}</span>
          ${left ? `<span class="game-left${quizLeft ? '' : ' is-out'}">${left}</span>` : ''}
        </button>
      </li>`;
    }).join('');
    // mỗi lần đếm hạng tốn 1 lượt đọc, nên chỉ đếm lại khi tổng điểm đổi
    if (score.total !== rankedTotal) {
      rankedTotal = score.total;
      api.myRank(score.total).then((r) => { $('#me-rank').textContent = r ? `#${r}` : '—'; }).catch(() => {});
    }
  }

  $('#game-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play]');
    if (btn) playGame(btn.dataset.play);
  });

  /* ── chơi ── */
  const hud = {
    time: (s) => { $('#hud-time').textContent = s; },
    score: (n) => { $('#hud-score').textContent = n; },
  };

  function abortGame() {
    playing?.abort();
    playing = null;
  }

  $('#btn-exit').addEventListener('click', () => {
    abortGame();
    show('lobby');
  });

  /* ── popup luật chơi: đóng bằng nút, ✕, Esc, bấm ra ngoài, hoặc tự đóng sau 10 giây ── */
  const rules = $('#rules');
  let closeRules = null;
  $('#rules-start').addEventListener('click', () => closeRules?.());
  $('#rules-close').addEventListener('click', () => closeRules?.());
  rules.addEventListener('cancel', (e) => { e.preventDefault(); closeRules?.(); });
  rules.addEventListener('click', (e) => { if (e.target === rules) closeRules?.(); });

  function showRules(g) {
    return new Promise((resolve) => {
      $('#rules-icon').textContent = g.icon;
      $('#rules-title').textContent = g.title;
      $('#rules-list').innerHTML = g.rules.map(() => '<li></li>').join('');
      [...$('#rules-list').children].forEach((li, i) => { li.textContent = g.rules[i]; });
      const timerEl = $('#rules-timer');
      const t0 = performance.now();
      const tick = () => {
        const left = Math.max(0, RULES_SECONDS - (performance.now() - t0) / 1000);
        $('#rules-sec').textContent = Math.ceil(left);
        timerEl.style.setProperty('--p', left / RULES_SECONDS);
        if (left <= 0) closeRules();
      };
      const timer = setInterval(tick, 100);
      closeRules = () => {
        closeRules = null;
        clearInterval(timer);
        rules.close();
        resolve();
      };
      tick();
      rules.showModal();
      $('#rules-start').focus();
    });
  }

  async function playGame(id) {
    const g = GAME[id];
    if (id === 'quiz' && !api.quizPlaysLeft(score)) {
      toast('Bạn đã hết lượt Đố vui hôm nay. Hẹn bạn ngày mai!');
      show('lobby');
      return;
    }
    const modReady = loaders[id](); // nạp trước module game trong lúc đọc luật
    modReady.catch(() => {});
    await showRules(g);
    if (!api.auth.currentUser) return;

    const ctrl = new AbortController();
    playing = ctrl;
    const stage = $('#stage');
    stage.innerHTML = '';
    $('#hud-title').textContent = g.title;
    hud.time('–');
    hud.score(0);
    show('play');

    try {
      // phiên chơi bắt đầu sau khi đóng popup, nên thời gian đọc luật không tính vào thời gian chơi tối thiểu trong rules
      const [mod] = await Promise.all([modReady, api.startSession(id, score)]);
      if (ctrl.signal.aborted) return;
      await countdown(stage, ctrl.signal);
      if (ctrl.signal.aborted) return;
      const result = await mod.play(stage, hud, ctrl.signal);
      if (result === null || ctrl.signal.aborted) return;
      playing = null;
      await showResult(g, result);
    } catch (err) {
      console.warn(err);
      if (ctrl.signal.aborted) return;
      if (err.code !== 'permission-denied') toast('Có lỗi kết nối. Vui lòng thử lại.');
      else if (id === 'quiz') toast('Bạn đã hết lượt Đố vui hôm nay, hoặc vừa bắt đầu lượt khác. Thử lại sau vài giây.');
      else toast('Lượt chơi chưa được ghi nhận (bắt đầu quá nhanh hoặc ngoài giờ mở game). Thử lại sau vài giây.');
      show('lobby');
    }
  }

  function countdown(stage, signal) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'countdown-big';
      stage.appendChild(el);
      let n = 3;
      const step = () => {
        if (signal.aborted) { el.remove(); resolve(); return; }
        if (n === 0) { el.remove(); sfx.go(); resolve(); return; }
        el.textContent = n--;
        sfx.tick();
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
        setTimeout(step, 800);
      };
      step();
    });
  }

  async function showResult(g, result) {
    const best = score[g.id];
    $('#res-title').textContent = g.title;
    $('#res-score').textContent = result;
    $('#res-max').textContent = g.max;
    $('#res-best').textContent = Math.max(best, result);
    $('#res-record').hidden = true;
    $('#res-saving').hidden = result <= best;
    const again = $('#btn-again');
    again.dataset.play = g.id;
    const outOfQuiz = g.id === 'quiz' && !api.quizPlaysLeft(score);
    again.disabled = outOfQuiz;
    again.textContent = outOfQuiz ? 'Hết lượt hôm nay' : 'Chơi lại';
    show('result');
    if (result <= best) { sfx.finish(); return; }
    try {
      await api.submitScore(g.id, result, score);
      $('#res-saving').hidden = true;
      $('#res-record').hidden = false;
      celebrate();
    } catch (err) {
      console.warn(err);
      $('#res-saving').hidden = true;
      toast(err.code === 'permission-denied'
        ? 'Điểm không được ghi nhận vì không hợp lệ hoặc đã hết giờ tính điểm.'
        : 'Không lưu được điểm. Kiểm tra kết nối mạng.');
    }
  }

  function celebrate() {
    sfx.record();
    const box = $('#confetti');
    box.innerHTML = Array.from({ length: 40 }, () => {
      const c = ['#ffcf4a', '#c8102e', '#ff8fb8', '#fff6e6'][Math.floor(Math.random() * 4)];
      return `<i style="left:${Math.random() * 100}%;background:${c};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.6 + Math.random()}s"></i>`;
    }).join('');
    setTimeout(() => { box.innerHTML = ''; }, 3200);
  }

  $('#btn-again').addEventListener('click', (e) => playGame(e.currentTarget.dataset.play));
  $('#btn-lobby').addEventListener('click', () => show('lobby'));
}
