// ⚙️ Event details — edit here, the page fills itself from these values.
// Values marked TODO are placeholders: replace them with the confirmed information.
export const EVENT = {
  name: 'Year End Party 2026',
  company: 'Terumo BCT Việt Nam',
  theme: 'Chào Xuân Đinh Mùi 2027',

  // TODO: confirm date & time (ISO 8601 with Vietnam timezone)
  partyDate: '2027-01-15T17:30:00+07:00',
  partyDateLabel: 'Thứ Sáu, 15.01.2027 · 17:30',

  // TODO: confirm venue
  venue: 'Công ty Terumo BCT Việt Nam',
  address: 'Công ty Terumo BCT Việt Nam',

  // Mùng 1 Tết Đinh Mùi
  tetDate: '2027-02-06T00:00:00+07:00',

  dressCode: 'Áo dài / trang phục truyền thống, điểm nhấn đỏ – vàng',

  // TODO: link to the registration form (Microsoft Forms, Google Forms…). Leave '' to hide the button.
  rsvpUrl: '',

  // Optional: public URL of a Spline scene (Spline → Export → Code → "scene.splinecode").
  // When set, it is shown in the "Chương trình" section. Leave '' to hide.
  splineScene: '',
};

// 🎮 Mini game — Firebase (gói Spark miễn phí). Xem hướng dẫn cài đặt trong README.md.
// Config web app của Firebase là thông tin công khai; bảo mật nằm ở firestore.rules.
// TODO: dán config từ Firebase Console → Project settings → Your apps → Web app. Để trống thì mini game tự ẩn.
export const FIREBASE = {
  apiKey: 'AIzaSyBihIVni2Sz_zJ9DF9wSvXpdm7sKTHjtis',
  authDomain: 'tbv-mini-games.firebaseapp.com',
  projectId: 'tbv-mini-games',
  appId: '1:211721936171:web:2a1f1ab70a9f83b1dc396e',
};

// ⚠️ Thời gian và trần điểm cũng được ghi cứng trong firestore.rules — sửa ở đây thì sửa cả bên đó.
export const GAMES = {
  openAt: '2026-10-28T00:00:00+07:00',
  closeAt: '2027-01-15T00:00:00+07:00',
  closeLabel: '23:59 ngày 14.01.2027',
  // true: hiện MSNV dạng 12***8 trên bảng xếp hạng
  maskMsnv: false,
  // số lượt Đố vui mỗi ngày (giờ VN) — giữ khớp với quizDailyPlays() trong firestore.rules
  quizDailyPlays: 3,
  list: [
    {
      id: 'lixi', title: 'Hứng lì xì', short: 'Lì xì', icon: '🧧', max: 64,
      rules: [
        'Kéo/chạm ngón tay (hoặc phím ← →) để di chuyển giỏ.',
        'Bao lì xì đỏ +1 điểm, bao vàng +3 điểm.',
        'Né pháo nổ: hứng trúng bị −2 điểm.',
        'Thời gian 30 giây, tối đa 64 điểm.',
      ],
    },
    {
      id: 'quiz', title: 'Đố vui Tết ba miền', short: 'Đố vui', icon: '🏮', max: 100,
      rules: [
        '10 câu hỏi ngẫu nhiên, mỗi câu 15 giây.',
        'Trả lời đúng được 5 điểm.',
        'Thưởng tốc độ tối đa 5 điểm: trả lời càng nhanh càng nhiều. Tối đa 100 điểm.',
        'Mỗi ngày 3 lượt; thoát giữa chừng vẫn tính 1 lượt.',
      ],
    },
    {
      id: 'memory', title: 'Lật thẻ ghép đôi', short: 'Lật thẻ', icon: '🌸', max: 100,
      rules: [
        'Lật 2 thẻ mỗi lượt, ghép đủ 8 cặp biểu tượng Tết.',
        'Càng ít lượt lật, càng nhanh thì càng nhiều điểm.',
        'Giới hạn 90 giây; hết giờ được 4 điểm mỗi cặp đã ghép.',
        'Tối đa 100 điểm.',
      ],
    },
  ],
};

// TODO: confirm the programme
export const AGENDA = [
  { time: '17:30', title: 'Đón khách · Check-in', desc: 'Chụp ảnh tại cổng hoa đào – hoa mai, nhận lì xì may mắn' },
  { time: '18:30', title: 'Khai mạc', desc: 'Múa lân chào xuân & phát biểu của Ban Giám đốc' },
  { time: '19:00', title: 'Tiệc tất niên', desc: 'Ẩm thực ba miền: bánh chưng, bánh tét, mứt Tết…' },
  { time: '19:45', title: 'Văn nghệ các phòng ban', desc: 'Những tiết mục đặc sắc từ đồng nghiệp' },
  { time: '20:30', title: 'Vinh danh 2026', desc: 'Tri ân những cá nhân & tập thể xuất sắc' },
  { time: '21:00', title: 'Bốc thăm may mắn', desc: 'Hàng loạt giải thưởng hấp dẫn đón năm mới' },
  { time: '21:45', title: 'Countdown & bế mạc', desc: 'Cùng nhau đếm ngược, bắn pháo hoa chào 2027' },
];
