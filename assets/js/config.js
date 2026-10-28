// ⚙️ Event details — edit here, the page fills itself from these values.
// Values marked TODO are placeholders: replace them with the confirmed information.
export const EVENT = {
  name: 'Year End Party 2026',
  company: 'Terumo BCT Việt Nam',
  theme: 'Chào Xuân Đinh Mùi 2027',

  // TODO: confirm date & time (ISO 8601 with Vietnam timezone)
  partyDate: '2027-01-22T17:30:00+07:00',
  partyDateLabel: 'Thứ Sáu, 22.01.2027 · 17:30',

  // TODO: confirm venue
  venue: 'Đang cập nhật',
  address: 'Địa điểm sẽ được thông báo sớm',

  // Mùng 1 Tết Đinh Mùi
  tetDate: '2027-02-06T00:00:00+07:00',

  dressCode: 'Áo dài / trang phục truyền thống, điểm nhấn đỏ – vàng',

  // TODO: link to the registration form (Microsoft Forms, Google Forms…). Leave '' to hide the button.
  rsvpUrl: '',

  // Optional: public URL of a Spline scene (Spline → Export → Code → "scene.splinecode").
  // When set, it is shown in the "Chương trình" section. Leave '' to hide.
  splineScene: '',
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
