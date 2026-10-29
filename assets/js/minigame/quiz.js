// Đố vui Tết ba miền: 10 câu ngẫu nhiên, mỗi câu 15 giây.
// Đúng = 5 điểm + thưởng tốc độ tối đa 5 (trả lời trong 3 giây đầu) → tối đa 100.
// Đáp án đúng luôn là phần tử đầu tiên của `o`; thứ tự hiển thị được xáo trộn.
const BANK = [
  { q: 'Tháp Rùa nằm giữa hồ nào?', o: ['Hồ Gươm', 'Hồ Tây', 'Hồ Trúc Bạch', 'Hồ Thiền Quang'] },
  { q: 'Cây cầu sơn đỏ dẫn vào đền Ngọc Sơn tên là gì?', o: ['Cầu Thê Húc', 'Cầu Long Biên', 'Cầu Chương Dương', 'Cầu Nhật Tân'] },
  { q: 'Làng hoa đào nổi tiếng nhất Hà Nội là?', o: ['Nhật Tân', 'Bát Tràng', 'Vạn Phúc', 'Đông Hồ'] },
  { q: 'Hồ Gươm còn có tên gọi nào khác?', o: ['Hồ Hoàn Kiếm', 'Hồ Bảy Mẫu', 'Hồ Ba Bể', 'Hồ Xuân Hương'] },
  { q: 'Ngọ Môn là cổng chính của công trình nào?', o: ['Hoàng thành Huế', 'Văn Miếu – Quốc Tử Giám', 'Thành nhà Hồ', 'Dinh Độc Lập'] },
  { q: 'Dòng sông thơ mộng chảy qua thành phố Huế là?', o: ['Sông Hương', 'Sông Hàn', 'Sông Hoài', 'Sông Sài Gòn'] },
  { q: 'Kỳ Đài ở Huế dùng để làm gì?', o: ['Treo cờ', 'Đánh chuông', 'Thả đèn trời', 'Quan sát sao'] },
  { q: 'Tà áo dài tím mộng mơ gắn liền với thành phố nào?', o: ['Huế', 'Hải Phòng', 'Cần Thơ', 'Vũng Tàu'] },
  { q: 'Cầu Rồng ở Đà Nẵng bắc qua sông nào?', o: ['Sông Hàn', 'Sông Hương', 'Sông Thu Bồn', 'Sông Đà'] },
  { q: 'Cầu Rồng phun lửa, phun nước vào lúc nào?', o: ['Tối thứ Bảy và Chủ nhật', 'Mỗi buổi sáng', 'Chỉ đêm giao thừa', 'Tối thứ Hai hằng tuần'] },
  { q: 'Chùa Cầu ở Hội An còn có tên là?', o: ['Lai Viễn Kiều', 'Trường Tiền', 'Thê Húc', 'Tràng Tiền'] },
  { q: 'Du khách thả hoa đăng ở Hội An trên dòng sông nào?', o: ['Sông Hoài', 'Sông Hàn', 'Sông Hương', 'Sông Cầu'] },
  { q: 'Phố cổ Hội An nổi tiếng với hình ảnh nào?', o: ['Đèn lồng sắc màu', 'Tuyết rơi', 'Ruộng bậc thang', 'Cối xay gió'] },
  { q: 'Tòa nhà Landmark 81 nằm ở thành phố nào?', o: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Nha Trang'] },
  { q: 'Đường hoa Tết nổi tiếng nhất TP. Hồ Chí Minh là?', o: ['Đường Nguyễn Huệ', 'Phố Hàng Ngang', 'Đường Trần Phú', 'Phố Tràng Tiền'] },
  { q: 'Khu chợ có tháp đồng hồ, biểu tượng của TP. Hồ Chí Minh là?', o: ['Chợ Bến Thành', 'Chợ Đồng Xuân', 'Chợ Hàn', 'Chợ Đông Ba'] },
  { q: 'Năm 2027 là năm con gì theo âm lịch?', o: ['Dê (Mùi)', 'Ngựa (Ngọ)', 'Khỉ (Thân)', 'Gà (Dậu)'] },
  { q: 'Mùng 1 Tết Đinh Mùi rơi vào ngày dương lịch nào?', o: ['06/02/2027', '17/02/2027', '29/01/2027', '26/01/2027'] },
  { q: 'Loài hoa đặc trưng ngày Tết ở miền Nam là?', o: ['Mai vàng', 'Hoa đào', 'Hoa sen', 'Cúc họa mi'] },
  { q: 'Loài hoa đặc trưng ngày Tết ở miền Bắc là?', o: ['Hoa đào', 'Mai vàng', 'Hướng dương', 'Hoa ly'] },
  { q: 'Bánh chưng hình vuông tượng trưng cho điều gì?', o: ['Đất', 'Trời', 'Mặt trăng', 'Biển cả'] },
  { q: 'Miền Nam thường gói loại bánh hình trụ nào ngày Tết?', o: ['Bánh tét', 'Bánh chưng', 'Bánh bò', 'Bánh cuốn'] },
  { q: 'Người đầu tiên bước vào nhà sau giao thừa gắn với tục gì?', o: ['Xông đất', 'Hái lộc', 'Khai bút', 'Gói bánh'] },
  { q: 'Ông Công ông Táo được tiễn về trời vào ngày nào?', o: ['23 tháng Chạp', '30 tháng Chạp', 'Mùng 1 Tết', 'Rằm tháng Giêng'] },
  { q: 'Ông Táo cưỡi con vật gì để về chầu trời?', o: ['Cá chép', 'Ngựa', 'Rồng', 'Hạc'] },
  { q: '"Thịt mỡ, dưa hành, câu đối đỏ / Cây nêu, tràng pháo, …"', o: ['bánh chưng xanh', 'mứt gừng thơm', 'rượu nếp cay', 'hoa đào hồng'] },
  { q: 'Ông đồ cho chữ ngày Tết viết bằng gì?', o: ['Bút lông và mực tàu', 'Bút bi', 'Phấn trắng', 'Bút chì'] },
  { q: 'Nhân vật vui nhộn cầm quạt đi cùng đoàn múa lân là ai?', o: ['Ông Địa', 'Ông Táo', 'Thạch Sanh', 'Thánh Gióng'] },
  { q: 'Bao lì xì truyền thống thường có màu gì?', o: ['Đỏ', 'Trắng', 'Đen', 'Tím'] },
  { q: 'Câu chúc "An Khang Thịnh Vượng" mong điều gì?', o: ['Bình an và sung túc', 'Thi đỗ đạt', 'Mưa thuận gió hòa', 'Sống lâu trăm tuổi'] },
  { q: '"Mâm ngũ quả" theo nghĩa gốc có bao nhiêu loại quả?', o: ['5', '3', '7', '9'] },
  { q: 'Tục khai bút đầu năm mang ý nghĩa gì?', o: ['Cầu học hành, công việc hanh thông', 'Cầu mưa', 'Tiễn năm cũ', 'Cầu được mùa cá'] },
];

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

export function play(stage, hud, signal) {
  return new Promise((resolve) => {
    const picked = shuffle([...BANK]).slice(0, COUNT);
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
        } else if (choice) {
          choice.classList.add('is-wrong');
        }
        idx++;
        wait = setTimeout(ask, FEEDBACK_MS);
      };
      buttons.forEach((b) => b.addEventListener('click', () => finish(b)));

      const tick = () => {
        const left = PER_Q - (performance.now() - t0) / 1000;
        hud.time(Math.max(0, Math.ceil(left)));
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
