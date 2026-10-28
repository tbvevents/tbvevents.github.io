// Nhạc nền: "Xuân ơi xuân đã về" (không lời).
// Trình duyệt chặn tự phát, nên nhạc bắt đầu ở lần chạm/click/phím đầu tiên.
// Đổi file nhạc: sửa thuộc tính src của <audio id="bgm"> trong index.html.
(() => {
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('music-toggle');
  if (!audio || !btn) return;

  const TARGET_VOLUME = 0.45;
  const FADE_MS = 1800;
  let userPaused = false; // người dùng chủ động tắt
  let fadeTimer = null;

  const render = () => {
    const on = !audio.paused;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
  };

  const fadeTo = (to, ms, done) => {
    clearInterval(fadeTimer);
    const from = audio.volume;
    const t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      audio.volume = from + (to - from) * k;
      if (k === 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  };

  const play = () => {
    audio.volume = 0;
    return audio.play().then(() => { fadeTo(TARGET_VOLUME, FADE_MS); render(); }).catch(() => {});
  };
  const pause = () => fadeTo(0, 400, () => { audio.pause(); render(); });

  // Chưa có file nhạc (hoặc lỗi tải) thì ẩn nút, không làm hỏng giao diện.
  audio.addEventListener('error', () => { btn.hidden = true; });
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);

  btn.addEventListener('click', () => {
    if (audio.paused) { userPaused = false; play(); }
    else { userPaused = true; pause(); }
  });

  // Lần tương tác đầu tiên -> tự bật nhạc (trừ khi người dùng đã tắt)
  const events = ['pointerdown', 'touchend', 'keydown'];
  const kickoff = (e) => {
    if (e.target && e.target.closest && e.target.closest('#music-toggle')) return;
    events.forEach((ev) => removeEventListener(ev, kickoff, true));
    if (!userPaused && audio.paused) play();
  };
  events.forEach((ev) => addEventListener(ev, kickoff, true));

  // Tạm dừng khi chuyển tab, tiếp tục khi quay lại
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (!audio.paused) audio.pause(); }
    else if (!userPaused && audio.dataset.started === '1') play();
  });
  audio.addEventListener('playing', () => { audio.dataset.started = '1'; });
})();
