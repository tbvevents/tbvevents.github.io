// Trang mini game: đăng nhập Gmail → nhập MSNV → chọn game → nộp điểm.
import { GAMES } from '../config.js';
import { isConfigured, watchTop10, renderTop10 } from '../firebase.js';
import { rocketBurst } from '../world/sfx.js';

const $ = (s) => document.querySelector(s);
const screens = ['config', 'login', 'claim', 'lobby', 'play', 'result'];
const show = (name) => screens.forEach((s) => { $(`#s-${s}`).hidden = s !== name; });

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
  let stopTop = null;
  let pendingMsnv = '';
  let playing = null;
  let rankedTotal = -1;

  $('#close-label').textContent = GAMES.closeLabel;
  if (inAppBrowser) $('#inapp-warn').hidden = false;

  /* ── đăng nhập ── */
  $('#btn-login').addEventListener('click', async () => {
    try {
      await api.signIn();
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/popup-blocked') toast('Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.');
      else if (err.code === 'auth/unauthorized-domain') toast('Tên miền chưa được cấp phép trong Firebase Authentication.');
      else toast('Đăng nhập không thành công. Vui lòng thử lại.');
      console.warn(err);
    }
  });
  $('#btn-logout').addEventListener('click', () => api.logOut());

  api.onUser(async (user) => {
    stopScore?.();
    stopScore = null;
    abortGame();
    if (!user) {
      $('#who').hidden = true;
      show('login');
      return;
    }
    $('#who-email').textContent = user.email;
    $('#who').hidden = false;
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
    if (!stopTop) {
      stopTop = watchTop10((rows) => renderTop10($('#lobby-top10'), rows), (err) => console.warn('Top 10 unavailable', err));
    }
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
    $('#game-list').innerHTML = GAMES.list.map((g) => `
      <li class="game-card">
        <span class="game-icon" aria-hidden="true">${g.icon}</span>
        <div>
          <h3>${g.title}</h3>
          <p>${g.desc}</p>
          <p class="game-best">Kỷ lục: <b>${score[g.id]}</b> / ${g.max}</p>
        </div>
        <button class="btn btn-small" type="button" data-play="${g.id}" ${open && !score.banned ? '' : 'disabled'}>Chơi</button>
      </li>`).join('');
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

  async function playGame(id) {
    const g = GAME[id];
    const ctrl = new AbortController();
    playing = ctrl;
    const stage = $('#stage');
    stage.innerHTML = '';
    $('#hud-title').textContent = g.title;
    hud.time('–');
    hud.score(0);
    show('play');

    try {
      // server ghi thời điểm bắt đầu trước khi game chạy (rules dùng để chặn nộp điểm quá nhanh)
      const [mod] = await Promise.all([loaders[id](), api.startSession(id)]);
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
      toast(err.code === 'permission-denied'
        ? 'Lượt chơi chưa được ghi nhận (bắt đầu quá nhanh hoặc ngoài giờ mở game). Thử lại sau vài giây.'
        : 'Có lỗi kết nối. Vui lòng thử lại.');
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
        if (n === 0) { el.remove(); resolve(); return; }
        el.textContent = n--;
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
    $('#btn-again').dataset.play = g.id;
    show('result');
    if (result <= best) return;
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
    for (let i = 0; i < 3; i++) rocketBurst((Math.random() - 0.5) * 0.8, i * 0.25);
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
