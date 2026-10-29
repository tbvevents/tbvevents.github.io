// Top 10 mini game trên landing page. Nạp riêng với main.js để lỗi mạng/Firebase không làm hỏng cảnh 3D.
import { GAMES } from './config.js';

const ol = document.getElementById('top10');
const note = document.getElementById('minigame-note');

if (ol) {
  note.textContent = `Hạn chót tính điểm: ${GAMES.closeLabel}`;
  import('./firebase.js')
    .then(({ isConfigured, watchTop10, renderTop10 }) => {
      if (!isConfigured) {
        ol.innerHTML = '<li class="lb-empty">Mini game sẽ mở sớm — hãy quay lại nhé!</li>';
        return;
      }
      watchTop10((rows) => renderTop10(ol, rows), (err) => {
        console.warn('Top 10 unavailable', err);
        ol.innerHTML = '<li class="lb-empty">Chưa tải được bảng xếp hạng.</li>';
      });
    })
    .catch((err) => {
      console.warn('Firebase SDK unavailable', err);
      ol.innerHTML = '<li class="lb-empty">Chưa tải được bảng xếp hạng.</li>';
    });
}
