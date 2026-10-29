// ⚙️ Event details — edit here, the page fills itself from these values.
// Values marked TODO are placeholders: replace them with the confirmed information.
// 🌐 Chữ hiển thị viết dạng { vi: 'Tiếng Việt', en: 'English' } để người dùng chuyển ngôn ngữ được.
//    Một chuỗi thường (không có vi/en) vẫn dùng được: nó sẽ hiện giống nhau ở cả hai ngôn ngữ.
export const EVENT = {
  name: 'Year End Party 2026',
  company: { vi: 'Terumo BCT Việt Nam', en: 'Terumo BCT Vietnam' },
  theme: { vi: 'Chào Xuân Đinh Mùi 2027', en: 'Welcome Spring, Year of the Goat 2027' },

  // TODO: confirm date & time (ISO 8601 with Vietnam timezone)
  partyDate: '2027-01-15T17:30:00+07:00',
  partyDateLabel: { vi: 'Thứ Sáu, 15.01.2027 · 17:30', en: 'Friday, 15 Jan 2027 · 17:30' },

  // TODO: confirm venue
  venue: { vi: 'Công ty Terumo BCT Việt Nam', en: 'Terumo BCT Vietnam Company' },
  address: { vi: 'Công ty Terumo BCT Việt Nam', en: 'Terumo BCT Vietnam Company' },

  // Mùng 1 Tết Đinh Mùi
  tetDate: '2027-02-06T00:00:00+07:00',

  dressCode: { vi: 'Áo dài / trang phục truyền thống, điểm nhấn đỏ – vàng', en: 'Áo dài / traditional attire, with red and gold accents' },

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
  closeLabel: { vi: '23:59 ngày 14.01.2027', en: '23:59 on 14 Jan 2027' },
  // true: hiện MSNV dạng 12***8 trên bảng xếp hạng
  maskMsnv: false,
  // số lượt Đố vui mỗi ngày (giờ VN) — giữ khớp với quizDailyPlays() trong firestore.rules
  quizDailyPlays: 3,
  list: [
    {
      id: 'lixi', icon: '🧧', max: 64,
      title: { vi: 'Hứng lì xì', en: 'Catch the Lucky Money' },
      short: { vi: 'Lì xì', en: 'Lucky money' },
      rules: {
        vi: [
          'Kéo/chạm ngón tay (hoặc phím ← →) để di chuyển giỏ.',
          'Bao lì xì đỏ +1 điểm, bao vàng +3 điểm.',
          'Né pháo nổ: hứng trúng bị −2 điểm.',
          'Thời gian 30 giây, tối đa 64 điểm.',
        ],
        en: [
          'Drag your finger (or use the ← → keys) to move the basket.',
          'A red envelope is +1 point, a gold one is +3 points.',
          'Dodge the firecrackers: catching one costs −2 points.',
          '30 seconds on the clock, 64 points maximum.',
        ],
      },
    },
    {
      id: 'quiz', icon: '🏮', max: 100,
      title: { vi: 'Đố vui Tết ba miền', en: 'Tết Quiz across three regions' },
      short: { vi: 'Đố vui', en: 'Quiz' },
      rules: {
        vi: [
          '10 câu hỏi ngẫu nhiên, mỗi câu 15 giây.',
          'Trả lời đúng được 5 điểm.',
          'Thưởng tốc độ tối đa 5 điểm: trả lời càng nhanh càng nhiều. Tối đa 100 điểm.',
          'Mỗi ngày 3 lượt; thoát giữa chừng vẫn tính 1 lượt.',
        ],
        en: [
          '10 random questions, 15 seconds each.',
          'A correct answer scores 5 points.',
          'Speed bonus of up to 5 points: the faster you answer, the more you get. 100 points maximum.',
          '3 plays per day; quitting midway still counts as 1 play.',
        ],
      },
    },
    {
      id: 'memory', icon: '🌸', max: 100,
      title: { vi: 'Lật thẻ ghép đôi', en: 'Memory Match' },
      short: { vi: 'Lật thẻ', en: 'Memory' },
      rules: {
        vi: [
          'Lật 2 thẻ mỗi lượt, ghép đủ 8 cặp biểu tượng Tết.',
          'Càng ít lượt lật, càng nhanh thì càng nhiều điểm.',
          'Giới hạn 90 giây; hết giờ được 4 điểm mỗi cặp đã ghép.',
          'Tối đa 100 điểm.',
        ],
        en: [
          'Flip 2 cards per turn and match all 8 pairs of Tết symbols.',
          'The fewer flips and the faster you are, the more points you earn.',
          '90 seconds limit; when time runs out you get 4 points per matched pair.',
          '100 points maximum.',
        ],
      },
    },
  ],
};

// TODO: confirm the programme
export const AGENDA = [
  {
    time: '17:30',
    title: { vi: 'Đón khách · Check-in', en: 'Welcome · Check-in' },
    desc: { vi: 'Chụp ảnh tại cổng hoa đào – hoa mai, nhận lì xì may mắn', en: 'Take photos at the peach and apricot blossom gate and receive a lucky red envelope' },
  },
  {
    time: '18:30',
    title: { vi: 'Khai mạc', en: 'Opening' },
    desc: { vi: 'Múa lân chào xuân & phát biểu của Ban Giám đốc', en: 'A lion dance to welcome spring and remarks from the Board of Directors' },
  },
  {
    time: '19:00',
    title: { vi: 'Tiệc tất niên', en: 'Year-end banquet' },
    desc: { vi: 'Ẩm thực ba miền: bánh chưng, bánh tét, mứt Tết…', en: 'Cuisine from all three regions: bánh chưng, bánh tét, Tết candied fruit…' },
  },
  {
    time: '19:45',
    title: { vi: 'Văn nghệ các phòng ban', en: 'Department performances' },
    desc: { vi: 'Những tiết mục đặc sắc từ đồng nghiệp', en: 'Outstanding acts from your colleagues' },
  },
  {
    time: '20:30',
    title: { vi: 'Vinh danh 2026', en: '2026 Awards' },
    desc: { vi: 'Tri ân những cá nhân & tập thể xuất sắc', en: 'Honouring outstanding individuals and teams' },
  },
  {
    time: '21:00',
    title: { vi: 'Bốc thăm may mắn', en: 'Lucky draw' },
    desc: { vi: 'Hàng loạt giải thưởng hấp dẫn đón năm mới', en: 'Plenty of attractive prizes to welcome the new year' },
  },
  {
    time: '21:45',
    title: { vi: 'Countdown & bế mạc', en: 'Countdown & closing' },
    desc: { vi: 'Cùng nhau đếm ngược, bắn pháo hoa chào 2027', en: 'Count down together and watch the fireworks welcome 2027' },
  },
];
