// Trang mini game: đăng nhập Gmail → nhập MSNV → chọn game → nộp điểm.
import { GAMES } from '../config.js';
import { L, t, tn, onLangChange } from '../i18n.js';
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
  archery: () => import('./archery.js'),
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

  $('#close-label').textContent = L(GAMES.closeLabel);
  if (inAppBrowser) $('#inapp-warn').hidden = false;

  /* ── đăng nhập ── */
  async function doLogin() {
    try {
      await api.signIn();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/popup-blocked') toast(t('mg.toast.popup'));
      else if (err.code === 'auth/unauthorized-domain') toast(t('mg.toast.domain'));
      else toast(t('mg.toast.loginFail'));
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
      toast(t('mg.toast.profile'));
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
      if (!emp) toast(t('mg.toast.msnvNotFound', { msnv }));
      else if (emp.claimed) toast(t('mg.toast.msnvClaimed', { msnv }));
      else {
        pendingMsnv = msnv;
        $('#confirm-name').textContent = emp.name;
        $('#confirm-msnv').textContent = msnv;
        $('#claim-form').hidden = true;
        $('#claim-confirm').hidden = false;
      }
    } catch (err) {
      console.warn(err);
      toast(t('mg.toast.msnvCheckFail'));
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
      toast(t('mg.toast.claimFail'));
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
    $('#closed-note').textContent = t(now() < Date.parse(GAMES.openAt) ? 'mg.closed.notOpen' : 'mg.closed.ended');
    if (score.banned) {
      $('#closed-note').hidden = false;
      $('#closed-note').textContent = t('mg.closed.banned');
    }
    const quizLeft = api.quizPlaysLeft(score);
    $('#game-list').innerHTML = GAMES.list.map((g) => {
      const isQuiz = g.id === 'quiz';
      const left = isQuiz ? (quizLeft ? tn('mg.quiz.left', quizLeft) : t('mg.quiz.out')) : '';
      const enabled = open && !score.banned && (!isQuiz || quizLeft > 0);
      const best = score[g.id] ?? 0; // doc điểm tạo trước khi có game mới thì chưa có field của game đó
      return `
      <li>
        <button class="game-tile" type="button" data-play="${g.id}" title="${L(g.title)}"
          aria-label="${t('mg.tile.aria', { title: L(g.title), best, max: g.max })}${left ? `. ${left}` : ''}" ${enabled ? '' : 'disabled'}>
          <span class="game-icon" aria-hidden="true">${g.icon}</span>
          <span class="game-name">${L(g.short)}</span>
          <span class="game-best"><b>${best}</b>/${g.max}</span>
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

  let rulesGame = null;
  function paintRules(g) {
    $('#rules-icon').textContent = g.icon;
    const rulesText = L(g.rules);
    $('#rules-title').textContent = L(g.title);
    $('#rules-list').innerHTML = rulesText.map(() => '<li></li>').join('');
    [...$('#rules-list').children].forEach((li, i) => { li.textContent = rulesText[i]; });
  }

  function showRules(g) {
    return new Promise((resolve) => {
      rulesGame = g;
      paintRules(g);
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
        rulesGame = null;
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
      toast(t('mg.toast.quizOut'));
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
    $('#hud-title').textContent = L(g.title);
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
      if (err.code !== 'permission-denied') toast(t('mg.toast.connect'));
      else if (id === 'quiz') toast(t('mg.toast.quizDenied'));
      else toast(t('mg.toast.sessionDenied'));
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

  /** Chữ ở màn kết quả phụ thuộc game và ngôn ngữ nên vẽ lại mỗi khi đổi ngôn ngữ. */
  let resultGame = null;
  function renderResultTexts() {
    if (!resultGame) return;
    $('#res-title').textContent = L(resultGame.title);
    const again = $('#btn-again');
    again.textContent = t(again.disabled ? 'mg.res.out' : 'mg.res.again');
  }

  async function showResult(g, result) {
    const best = score[g.id] ?? 0;
    resultGame = g;
    $('#res-score').textContent = result;
    $('#res-max').textContent = g.max;
    $('#res-best').textContent = Math.max(best, result);
    $('#res-record').hidden = true;
    $('#res-saving').hidden = result <= best;
    const again = $('#btn-again');
    again.dataset.play = g.id;
    const outOfQuiz = g.id === 'quiz' && !api.quizPlaysLeft(score);
    again.disabled = outOfQuiz;
    renderResultTexts();
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
      toast(t(err.code === 'permission-denied' ? 'mg.toast.scoreInvalid' : 'mg.toast.scoreFail'));
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

  // đổi ngôn ngữ: vẽ lại phần chữ do JS tạo (họ tên, MSNV, email giữ nguyên vì lấy từ dữ liệu người chơi)
  onLangChange(() => {
    $('#close-label').textContent = L(GAMES.closeLabel);
    renderLobby();
    renderResultTexts();
    if (rulesGame) paintRules(rulesGame); // đang mở bảng luật thì đổi chữ luôn
  });

  $('#btn-again').addEventListener('click', (e) => playGame(e.currentTarget.dataset.play));
  $('#btn-lobby').addEventListener('click', () => show('lobby'));
}
