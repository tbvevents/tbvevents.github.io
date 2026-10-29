// Toàn bộ chữ hiển thị cho giao diện, mỗi dòng là một cặp [Tiếng Việt, English].
// Sửa nội dung: tìm đúng key, sửa phần tương ứng. Có thể dùng {tên} làm chỗ điền giá trị.
// Chữ trong HTML (index.html, minigame.html) chỉ là bản dự phòng khi JS chưa chạy — bản chính thức nằm ở đây.
// Nội dung sự kiện (ngày giờ, địa điểm, chương trình, luật chơi) nằm trong config.js dưới dạng { vi, en }.
// Họ tên người chơi, MSNV và email lấy từ dữ liệu nên không bao giờ bị dịch.
export const S = {
  /* ───────── dùng chung ───────── */
  'music.on': ['Bật nhạc nền', 'Turn background music on'],
  'music.off': ['Tắt nhạc nền', 'Turn background music off'],
  'music.toggle': ['Bật/tắt nhạc nền', 'Toggle background music'],
  'sky.hint': ['Chạm vào bầu trời (nửa trên màn hình) để bắn pháo hoa ✦', 'Tap the sky (top half of the screen) to launch fireworks ✦'],

  /* ───────── landing page (index.html) ───────── */
  'meta.title': ['Year End Party 2026 · Terumo BCT Việt Nam', 'Year End Party 2026 · Terumo BCT Vietnam'],
  'meta.desc': [
    'Year End Party 2026 của Terumo BCT Việt Nam — Chào Xuân Đinh Mùi 2027. Du xuân qua Hà Nội, Huế, Đà Nẵng, Hội An và TP. Hồ Chí Minh.',
    'Year End Party 2026 of Terumo BCT Vietnam — Welcome Spring, Year of the Goat 2027. A Tết journey through Hanoi, Huế, Da Nang, Hoi An and Ho Chi Minh City.',
  ],
  'meta.ogDesc': ['Chào Xuân Đinh Mùi 2027 — Tết ba miền về chung một nhà.', 'Welcome Spring, Year of the Goat 2027 — Tết from all three regions under one roof.'],
  'loader': ['Đang treo đèn lồng, chuẩn bị pháo hoa…', 'Hanging the lanterns, preparing the fireworks…'],
  'brand.company': ['Terumo BCT Việt Nam', 'Terumo BCT Vietnam'],
  'brand.register': ['Đăng ký', 'Register'],
  'register.full': ['Đăng ký tham dự', 'Register to attend'],
  'register.soon': ['Form đăng ký sẽ được mở sớm', 'The registration form will open soon'],

  'nav.label': ['Hành trình', 'Journey'],
  'nav.0': ['Đón Tết', 'Welcome Tết'],
  'nav.1': ['Hà Nội', 'Hanoi'],
  'nav.2': ['Huế', 'Huế'],
  'nav.3': ['Đà Nẵng', 'Da Nang'],
  'nav.4': ['Hội An', 'Hoi An'],
  'nav.5': ['TP. HCM', 'HCMC'],
  'nav.6': ['Chương trình', 'Agenda'],
  'nav.7': ['Mini game', 'Mini games'],
  'nav.8': ['Hẹn gặp', 'See you'],

  'hero.invite': ['trân trọng kính mời', 'cordially invites you'],
  'hero.lead': [
    'Khép lại một năm 2026 rực rỡ, cùng nhau du xuân qua năm thành phố — mang Tết ba miền về chung một mái nhà.',
    'Let’s close a brilliant 2026 together and spring-travel through five cities — bringing Tết from all three regions under one roof.',
  ],
  'chip.time': ['Thời gian', 'Date & time'],
  'chip.venue': ['Địa điểm', 'Venue'],
  'hero.start': ['Bắt đầu hành trình', 'Start the journey'],
  'hero.scroll': ['Cuộn để du xuân', 'Scroll to explore'],

  'hn.wish': ['Phúc', 'Bliss'],
  'hn.kicker': ['01 · Miền Bắc', '01 · Northern Vietnam'],
  'hn.title': ['Hà Nội', 'Hanoi'],
  'hn.sub': ['Thủ đô ngàn năm văn hiến', 'The thousand-year-old capital of culture'],
  'hn.p': [
    'Sắc đào Nhật Tân nhuộm hồng phố cổ, Tháp Rùa lung linh giữa Hồ Gươm, cầu Thê Húc đỏ thắm và ông đồ già cho chữ bên hè phố — một cái Tết đậm chất Hà thành.',
    'Nhật Tân peach blossoms tint the Old Quarter pink, the Turtle Tower shimmers in the middle of Hoàn Kiếm Lake, the crimson Thê Húc Bridge glows, and an old calligrapher writes wishes on the pavement — a Tết full of Hanoi character.',
  ],
  'hn.tags': ['Hồ Gươm|Tháp Rùa|Cầu Thê Húc|Hoa đào|Ông đồ', 'Hoàn Kiếm Lake|Turtle Tower|Thê Húc Bridge|Peach blossom|Calligrapher'],

  'hue.wish': ['An', 'Peace'],
  'hue.kicker': ['02 · Miền Trung', '02 · Central Vietnam'],
  'hue.title': ['Huế', 'Huế'],
  'hue.sub': ['Cố đô trầm mặc', 'The contemplative old imperial capital'],
  'hue.p': [
    'Ngọ Môn uy nghi rực rỡ đèn hoa, thuyền rồng lướt trên dòng Hương và tà áo dài tím mộng mơ — xuân về Huế mang nét trang nghiêm của chốn cung đình.',
    'The majestic Ngọ Môn Gate glows with lanterns and flowers, dragon boats glide along the Perfume River and dreamy purple áo dài sway past — spring in Huế carries the solemn grace of the imperial court.',
  ],
  'hue.tags': ['Ngọ Môn|Kỳ Đài|Sông Hương|Áo dài tím', 'Ngọ Môn Gate|Flag Tower|Perfume River|Purple áo dài'],

  'dn.wish': ['Thịnh', 'Thrive'],
  'dn.kicker': ['03 · Miền Trung', '03 · Central Vietnam'],
  'dn.title': ['Đà Nẵng', 'Da Nang'],
  'dn.sub': ['Thành phố đáng sống', 'The liveable city'],
  'dn.p': [
    'Cầu Rồng vươn mình đổi sắc trên sông Hàn và phun lửa chào năm mới — như khí thế bứt phá mà chúng ta mang theo vào 2027.',
    'The Dragon Bridge stretches over the Hàn River, changing colours and breathing fire to greet the new year — the same breakthrough spirit we carry into 2027.',
  ],
  'dn.tags': ['Cầu Rồng|Sông Hàn|Rồng phun lửa', 'Dragon Bridge|Hàn River|Fire-breathing dragon'],

  'ha.wish': ['Lộc', 'Luck'],
  'ha.kicker': ['04 · Miền Trung', '04 · Central Vietnam'],
  'ha.title': ['Hội An', 'Hoi An'],
  'ha.sub': ['Phố cổ đèn lồng', 'The ancient town of lanterns'],
  'ha.p': [
    'Chùa Cầu cổ kính, những dãy nhà tường vàng và muôn ngàn đèn lồng sắc màu; hoa đăng thả trôi trên sông Hoài gửi gắm ước nguyện đầu xuân.',
    'The ancient Japanese Covered Bridge, rows of golden-walled houses and countless colourful lanterns; flower lanterns drift down the Hoài River carrying wishes for the new spring.',
  ],
  'ha.tags': ['Chùa Cầu|Đèn lồng|Hoa đăng|Phố cổ', 'Covered Bridge|Lanterns|Flower lanterns|Old town'],

  'hcm.wish': ['Phát', 'Wealth'],
  'hcm.kicker': ['05 · Miền Nam', '05 · Southern Vietnam'],
  'hcm.title': ['TP. Hồ Chí Minh', 'Ho Chi Minh City'],
  'hcm.sub': ['Thành phố không ngủ', 'The city that never sleeps'],
  'hcm.p': [
    'Đường hoa Nguyễn Huệ rộn ràng sắc mai vàng, Landmark 81 và Bitexco bừng sáng, tiếng trống lân giòn giã khắp phố phường.',
    'Nguyễn Huệ Flower Street bursts with golden apricot blossoms, Landmark 81 and Bitexco light up, and lion-dance drums echo through the streets.',
  ],
  'hcm.tags': ['Landmark 81|Bitexco|Chợ Bến Thành|Đường hoa|Múa lân', 'Landmark 81|Bitexco|Bến Thành Market|Flower street|Lion dance'],

  'prog.kicker': ['06 · Đêm tiệc', '06 · Party night'],
  'prog.title': ['Chương trình', 'Agenda'],
  'prog.sub': ['Một đêm — Tết ba miền hội tụ', 'One night — Tết from all three regions, together'],

  'mgs.wish': ['Vui', 'Fun'],
  'mgs.kicker': ['07 · Mini game', '07 · Mini games'],
  'mgs.title': ['Bảng vàng', 'Hall of Fame'],
  'mgs.sub': ['Top 10 cao thủ du xuân', 'Top 10 spring-journey champions'],
  'mgs.play': ['Chơi ngay', 'Play now'],
  'lb.loading': ['Đang tải bảng xếp hạng…', 'Loading the leaderboard…'],
  'lb.note': ['Hạn chót tính điểm: {label}', 'Scoring deadline: {label}'],
  'lb.soon': ['Mini game sẽ mở sớm — hãy quay lại nhé!', 'The mini games will open soon — please come back!'],
  'lb.unavailable': ['Chưa tải được bảng xếp hạng.', 'The leaderboard could not be loaded.'],
  'lb.empty': ['Chưa có ai ghi điểm — hãy là người đầu tiên!', 'No scores yet — be the first!'],

  'rsvp.kicker': ['08 · Hẹn gặp bạn', '08 · See you there'],
  'rsvp.title': ['Đếm ngược đến đêm tiệc', 'Countdown to the party'],
  'cd.d': ['Ngày', 'Days'],
  'cd.h': ['Giờ', 'Hours'],
  'cd.m': ['Phút', 'Minutes'],
  'cd.s': ['Giây', 'Seconds'],
  'tet.left': ['Còn {n} ngày nữa là Tết Đinh Mùi 2027', 'Only {n} days until Tết 2027, the Year of the Goat'],
  'tet.left.1': ['Còn {n} ngày nữa là Tết Đinh Mùi 2027', 'Only {n} day until Tết 2027, the Year of the Goat'],
  'tet.now': ['Chúc Mừng Năm Mới Đinh Mùi 2027!', 'Happy New Year 2027, Year of the Goat!'],
  'dt.time': ['Thời gian', 'Date & time'],
  'dt.venue': ['Địa điểm', 'Venue'],
  'dt.dress': ['Dress code', 'Dress code'],
  'dt.theme': ['Chủ đề', 'Theme'],
  'btn.calendar': ['Thêm vào lịch', 'Add to calendar'],
  'rsvp.wishline': ['An Khang · Thịnh Vượng · Vạn Sự Như Ý', 'Peace & Health · Prosperity · May All Go as You Wish'],
  'footer.hint': ['Chạm / nhấp vào bầu trời (nửa trên màn hình) để bắn pháo hoa ✦', 'Tap / click the sky (top half of the screen) to launch fireworks ✦'],
  'ics.dress': ['Dress code', 'Dress code'],

  /* ───────── chữ trong cảnh 3D ───────── */
  'scene.sign': ['CHÚC MỪNG NĂM MỚI 2027', 'HAPPY NEW YEAR 2027'],
  'scene.scroll': ['Phúc Lộc', 'Joy Luck'],

  /* ───────── trang mini game (minigame.html) ───────── */
  'mg.meta.title': ['Mini game · YEP 2026 · Terumo BCT Việt Nam', 'Mini games · YEP 2026 · Terumo BCT Vietnam'],
  'mg.meta.desc': [
    'Mini game Year End Party 2026 — chơi, ghi điểm và lọt Top 10 cao thủ du xuân.',
    'Year End Party 2026 mini games — play, score and make the Top 10 spring-journey champions.',
  ],
  'mg.logout': ['Đăng xuất', 'Log out'],
  'mg.login': ['Đăng nhập', 'Log in'],

  'mg.cfg.kicker': ['Mini game', 'Mini games'],
  'mg.cfg.title': ['Sắp mở', 'Opening soon'],
  'mg.cfg.p': ['Mini game đang được chuẩn bị. Hẹn bạn quay lại sớm!', 'The mini games are being prepared. See you back soon!'],
  'mg.cfg.back': ['Về trang sự kiện', 'Back to the event page'],

  'mg.login.kicker': ['Mini game · Du xuân ba miền', 'Mini games · Spring journey across three regions'],
  'mg.login.title': ['Chơi game, rinh quà Tết', 'Play games, win Tết prizes'],
  'mg.login.intro': [
    '3 trò chơi nhỏ, mỗi trò tính lượt có điểm cao nhất. Tổng điểm cao nhất lọt <b>Top 10</b> trên trang sự kiện.',
    '3 little games, each keeping your best score. The highest totals make the <b>Top 10</b> on the event page.',
  ],
  'mg.login.deadline': ['Hạn chót tính điểm:', 'Scoring deadline:'],
  'mg.login.inapp': [
    'Bạn đang mở trang trong ứng dụng (Zalo, Messenger…). Google không cho đăng nhập ở đây — hãy bấm <b>⋯</b> và chọn <b>Mở bằng trình duyệt</b> (Chrome/Safari).',
    'You’re viewing this page inside an app (Zalo, Messenger…). Google doesn’t allow sign-in here — tap <b>⋯</b> and choose <b>Open in browser</b> (Chrome/Safari).',
  ],
  'mg.login.google': ['Đăng nhập bằng Google', 'Sign in with Google'],
  'mg.login.fine': [
    'Khi tham gia, bạn đồng ý để <b>họ tên và mã số nhân viên</b> của mình hiển thị trên bảng xếp hạng công khai của sự kiện. Gmail chỉ dùng để đăng nhập và không hiển thị.',
    'By taking part, you agree that your <b>name and employee ID</b> are shown on the event’s public leaderboard. Your Gmail is used only to sign in and is never displayed.',
  ],

  'mg.claim.step': ['Bước 2 / 2', 'Step 2 / 2'],
  'mg.claim.title': ['Mã số nhân viên', 'Employee ID'],
  'mg.claim.label': ['Nhập MSNV của bạn (chỉ cần làm một lần)', 'Enter your employee ID (one-time step)'],
  'mg.claim.placeholder': ['VD: 12345', 'e.g. 12345'],
  'mg.claim.check': ['Kiểm tra', 'Check'],
  'mg.claim.youAre': ['Bạn là', 'You are'],
  'mg.claim.id': ['MSNV', 'ID'],
  'mg.claim.fine': [
    'Mỗi MSNV chỉ liên kết được với một Gmail và không đổi lại được (trừ khi BTC hỗ trợ).',
    'Each employee ID can be linked to only one Gmail account and can’t be changed back (unless the organizers help).',
  ],
  'mg.claim.yes': ['Đúng, đó là tôi', 'Yes, that’s me'],
  'mg.claim.no': ['Không phải', 'Not me'],

  'mg.lobby.hello': ['Xin chào', 'Hello'],
  'mg.lobby.id': ['MSNV', 'ID'],
  'mg.lobby.total': ['Tổng điểm', 'Total score'],
  'mg.lobby.rank': ['Hạng', 'Rank'],
  'mg.lobby.choose': ['Chọn trò chơi', 'Choose a game'],
  'mg.lobby.board': ['Xem bảng xếp hạng Top 10 →', 'View the Top 10 leaderboard →'],

  'mg.play.exit': ['✕ Thoát', '✕ Exit'],
  'mg.res.record': ['🎉 Kỷ lục mới!', '🎉 New record!'],
  'mg.res.saving': ['Đang lưu điểm…', 'Saving your score…'],
  'mg.res.best': ['Kỷ lục của bạn:', 'Your best:'],
  'mg.res.again': ['Chơi lại', 'Play again'],
  'mg.res.out': ['Hết lượt hôm nay', 'No plays left today'],
  'mg.res.lobby': ['Về sảnh', 'Back to lobby'],

  'mg.rules.closeAria': ['Đóng và bắt đầu chơi', 'Close and start playing'],
  'mg.rules.kicker': ['Luật chơi', 'How to play'],
  'mg.rules.start': ['Bắt đầu ngay', 'Start now'],

  'mg.closed.notOpen': ['Mini game chưa mở. Hẹn bạn quay lại sớm!', 'The mini games haven’t opened yet. See you back soon!'],
  'mg.closed.ended': ['Đã hết thời gian tính điểm. Cảm ơn bạn đã tham gia!', 'Scoring has ended. Thank you for taking part!'],
  'mg.closed.banned': ['Kết quả của bạn đang được BTC xem xét. Vui lòng liên hệ BTC.', 'Your results are being reviewed by the organizers. Please contact them.'],
  'mg.quiz.left': ['Còn {n} lượt hôm nay', '{n} plays left today'],
  'mg.quiz.left.1': ['Còn {n} lượt hôm nay', '{n} play left today'],
  'mg.quiz.out': ['Hết lượt — mai quay lại', 'No plays left — come back tomorrow'],
  'mg.tile.aria': ['{title} — kỷ lục {best} trên {max}', '{title} — best score {best} out of {max}'],

  'mg.toast.popup': ['Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.', 'Your browser blocked the sign-in window. Please allow pop-ups and try again.'],
  'mg.toast.domain': ['Tên miền chưa được cấp phép trong Firebase Authentication.', 'This domain isn’t authorised in Firebase Authentication.'],
  'mg.toast.loginFail': ['Đăng nhập không thành công. Vui lòng thử lại.', 'Sign-in failed. Please try again.'],
  'mg.toast.profile': ['Không tải được hồ sơ. Kiểm tra kết nối mạng.', 'Couldn’t load your profile. Check your network connection.'],
  'mg.toast.msnvNotFound': ['Không tìm thấy MSNV {msnv} trong danh sách. Kiểm tra lại hoặc liên hệ BTC.', 'Employee ID {msnv} wasn’t found in the list. Please check it or contact the organizers.'],
  'mg.toast.msnvClaimed': ['MSNV {msnv} đã được liên kết với một Gmail khác. Vui lòng liên hệ BTC.', 'Employee ID {msnv} is already linked to another Gmail account. Please contact the organizers.'],
  'mg.toast.msnvCheckFail': ['Không kiểm tra được MSNV. Vui lòng thử lại.', 'Couldn’t verify the employee ID. Please try again.'],
  'mg.toast.claimFail': ['Không liên kết được MSNV (có thể vừa có người khác nhận). Vui lòng liên hệ BTC.', 'Couldn’t link the employee ID (someone else may have just claimed it). Please contact the organizers.'],
  'mg.toast.quizOut': ['Bạn đã hết lượt Đố vui hôm nay. Hẹn bạn ngày mai!', 'You’ve used all of today’s Quiz plays. See you tomorrow!'],
  'mg.toast.connect': ['Có lỗi kết nối. Vui lòng thử lại.', 'Connection error. Please try again.'],
  'mg.toast.quizDenied': ['Bạn đã hết lượt Đố vui hôm nay, hoặc vừa bắt đầu lượt khác. Thử lại sau vài giây.', 'You’ve used all of today’s Quiz plays, or another play has just started. Try again in a few seconds.'],
  'mg.toast.sessionDenied': ['Lượt chơi chưa được ghi nhận (bắt đầu quá nhanh hoặc ngoài giờ mở game). Thử lại sau vài giây.', 'Your play wasn’t registered (started too fast or outside opening hours). Try again in a few seconds.'],
  'mg.toast.scoreInvalid': ['Điểm không được ghi nhận vì không hợp lệ hoặc đã hết giờ tính điểm.', 'Your score wasn’t recorded because it was invalid or scoring has ended.'],
  'mg.toast.scoreFail': ['Không lưu được điểm. Kiểm tra kết nối mạng.', 'Couldn’t save your score. Check your network connection.'],

  /* ───────── trong game ───────── */
  'quiz.count': ['Câu {i}/{n}', 'Question {i}/{n}'],
  'mem.down': ['Thẻ {i}, úp', 'Card {i}, face down'],
  'mem.up': ['Thẻ {i}, {label}', 'Card {i}, {label}'],
  'lixi.aria': [
    'Khu vực chơi Hứng lì xì: kéo ngón tay hoặc dùng phím mũi tên để di chuyển giỏ',
    'Catch the Lucky Money play area: drag your finger or use the arrow keys to move the basket',
  ],
};
