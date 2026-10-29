// Top 10 mini game trên landing page. Nạp riêng với main.js để lỗi mạng/Firebase không làm hỏng cảnh 3D.
// Họ tên và MSNV trong bảng lấy từ dữ liệu người chơi nên không bị dịch; chỉ các dòng thông báo đổi theo ngôn ngữ.
import { GAMES } from './config.js';
import { L, t, onLangChange } from './i18n.js';

const ol = document.getElementById('top10');
const note = document.getElementById('minigame-note');

if (ol) {
  let status = 'loading'; // loading | soon | error | rows
  let rows = [];
  let renderTop10 = null;

  const paint = () => {
    note.textContent = t('lb.note', { label: L(GAMES.closeLabel) });
    const msg = { loading: 'lb.loading', soon: 'lb.soon', error: 'lb.unavailable' }[status];
    if (msg) ol.innerHTML = `<li class="lb-empty">${t(msg)}</li>`;
    else renderTop10(ol, rows, t('lb.empty'));
  };
  onLangChange(paint);
  paint();

  import('./firebase.js')
    .then((fb) => {
      renderTop10 = fb.renderTop10;
      if (!fb.isConfigured) {
        status = 'soon';
        paint();
        return;
      }
      fb.watchTop10((r) => { rows = r; status = 'rows'; paint(); }, (err) => {
        console.warn('Top 10 unavailable', err);
        status = 'error';
        paint();
      });
    })
    .catch((err) => {
      console.warn('Firebase SDK unavailable', err);
      status = 'error';
      paint();
    });
}
