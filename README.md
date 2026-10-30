# tbvevents.github.io

Landing page 3D cho **Year End Party 2026 · Terumo BCT Việt Nam** — chủ đề *Chào Xuân Đinh Mùi 2027*.

Cuộn trang để "du xuân" theo hình chữ S qua Hà Nội → Huế → Đà Nẵng → Hội An → TP. HCM, tới sân khấu đêm tiệc.

## Chạy thử

Trang tĩnh, không cần build. ES modules phải chạy qua HTTP (không mở file trực tiếp):

```bash
python -m http.server 8000
# mở http://localhost:8000
```

GitHub Pages phục vụ trực tiếp từ nhánh `main` (file `.nojekyll` đã có).

## Sửa nội dung

Tất cả thông tin sự kiện nằm trong [`assets/js/config.js`](assets/js/config.js): ngày giờ, địa điểm, dress code, link form đăng ký, chương trình, và (tuỳ chọn) URL scene Spline.
Các giá trị đánh dấu `TODO` là giá trị tạm, cần thay bằng thông tin chính thức.

## Ngôn ngữ Tiếng Việt / English

Nút **VI | EN** nhỏ, mờ ở góc dưới bên phải (cả landing page lẫn trang mini game). Lựa chọn được nhớ trên máy người dùng (`localStorage`), dùng chung hai trang; thêm `?lang=en` hoặc `?lang=vi` vào URL để ép ngôn ngữ (ví dụ link gửi khách nước ngoài). Mặc định là Tiếng Việt. Họ tên người chơi, MSNV, email luôn giữ nguyên. Trang `admin.html` chỉ có Tiếng Việt.

| Chỗ cần sửa chữ | Ở đâu |
| --- | --- |
| Thông tin sự kiện, chương trình, luật chơi (config) | [`assets/js/config.js`](assets/js/config.js): các giá trị dạng `{ vi: '…', en: '…' }` (chuỗi thường thì dùng cho cả hai ngôn ngữ) |
| Mọi chữ khác trên giao diện (thẻ, nút, thông báo, 3D...) | [`assets/js/i18n-strings.js`](assets/js/i18n-strings.js): `'khoá': ['Tiếng Việt', 'English']`, `{tên}` là chỗ điền giá trị |
| Câu hỏi Đố vui | [`assets/js/minigame/quiz-bank.js`](assets/js/minigame/quiz-bank.js): mỗi câu có thêm `en: { q, o }` (đáp án đúng cũng ở đầu); thiếu `en` thì bản EN hiện tiếng Việt |
| Tên biểu tượng game Lật thẻ | `SYMBOLS` trong `assets/js/minigame/memory.js` (`[icon, vi, en]`) |

Trong HTML dùng `data-i18n="khoá"` (văn bản), `data-i18n-html` (có thẻ `<b>`), `data-i18n-list` (`a|b|c` thành danh sách) và `data-i18n-attr="aria-label:khoá"`. Trong JS dùng `t('khoá')`, `L(giá trị {vi,en})` và `onLangChange(cb)` để vẽ lại chữ do JS tạo ra. Chữ vẽ lên canvas 3D tự vẽ lại khi đổi ngôn ngữ. Khoá thiếu bản dịch sẽ báo trong console (`[i18n] thiếu key`).

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Các section nội dung (mỗi `data-step` = một điểm dừng camera) |
| `assets/css/style.css` | Giao diện thẻ, typography, responsive |
| `assets/js/i18n.js`, `i18n-strings.js` | Chuyển ngôn ngữ VI/EN, kho chuỗi dịch |
| `assets/js/main.js` | Renderer, bloom, camera chạy theo scroll (GSAP ScrollTrigger), pháo hoa tự động/nhấp chuột |
| `assets/js/world/cities.js` | Mô hình low-poly: Tháp Rùa, Ngọ Môn, Cầu Rồng, Chùa Cầu, Landmark 81, Bitexco, Bến Thành, sân khấu |
| `assets/js/world/characters.js` | Linh vật Dê vàng, em bé áo dài, ông đồ, múa lân, đèn lồng |
| `assets/js/world/decor.js` | Bầu trời, cây đào/mai, cánh hoa rơi, đèn trời, bánh chưng, dây pháo |
| `assets/js/world/fireworks.js` | Hệ hạt pháo hoa |
| `assets/js/firebase.js`, `leaderboard.js` | Kết nối Firestore, Top 10 realtime trên landing page |
| `minigame.html`, `assets/js/minigame/` | Trang mini game: đăng nhập, nhận MSNV, 3 game |
| `admin.html`, `assets/js/admin.js` | Nạp / sửa / xoá nhân viên, gỡ liên kết, loại kết quả, xuất CSV |
| `firestore.rules` | Luật bảo mật & chống gian lận (dán vào Firebase Console) |

Thêm điểm dừng mới: thêm một `<section data-step>` trong HTML và một phần tử tương ứng trong mảng `STOPS` ở `main.js`.

Thư viện (CDN, phiên bản cố định): three.js 0.170.0, GSAP 3.13.0, @splinetool/viewer 2.0.64 (chỉ tải khi có `splineScene`).

Thêm `?debug` vào URL để truy cập scene qua `window.__yep` trong DevTools.

## Mini game & bảng xếp hạng (Firebase miễn phí)

Nhân viên đăng nhập Gmail ở `minigame.html`, nhập MSNV (phải có trong danh sách nhân viên), rồi chơi 3 game:
Hứng lì xì, Đố vui Tết ba miền, Lật thẻ ghép đôi. Mỗi game giữ lượt cao nhất; tổng 3 game quyết định Top 10,
hiển thị realtime ở section "Mini game" của landing page. `admin.html` dành cho BTC.

Dùng Firebase gói **Spark** (miễn phí, không cần thẻ): Authentication (Google) + Cloud Firestore.
Không có server riêng: mọi kiểm tra (1 Gmail ↔ 1 MSNV, trần điểm, thời gian chơi tối thiểu, khung giờ mở game)
nằm trong [`firestore.rules`](firestore.rules).

### Cài đặt (một lần, ~15 phút)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (tắt Google Analytics cũng được). Giữ gói Spark.
2. **Build → Authentication → Get started → Google → Enable**. Vào tab **Settings → Authorized domains**, thêm `tbvevents.github.io`.
3. **Build → Firestore Database → Create database**, chọn location `asia-southeast1`, chế độ production.
   Tab **Rules**: dán toàn bộ nội dung `firestore.rules` → **Publish**.
4. Tab **Indexes → Composite → Create index**: collection `scores`, field `total` *Descending*, field `updatedAt` *Ascending*, query scope *Collection*.
   (Hoặc mở landing page, bấm link tạo index trong lỗi ở DevTools Console.)
5. **Project settings → Your apps → Web (`</>`)** → đăng ký app → copy `apiKey`, `authDomain`, `projectId`, `appId` vào `FIREBASE` trong [`assets/js/config.js`](assets/js/config.js).
6. Firestore → **Start collection** `admins` → Document ID = email Google của bạn (không cần field nào). Chỉ cần tạo tay admin đầu tiên; các thành viên BTC khác thêm ngay trong `admin.html` (mục *Quản trị viên*).
7. Mở `/admin.html`, đăng nhập, nạp file CSV danh sách nhân viên (`MSNV,Họ tên`).

### Quản lý nhân viên

- **Thêm người mới:** nạp CSV chỉ gồm nhân viên mới, không cần gộp danh sách cũ. Nếu MSNV đã có thì chỉ cập nhật họ tên, liên kết Gmail và điểm vẫn giữ nguyên.
- **Sửa họ tên / xoá:** trong `admin.html`, tra cứu theo MSNV (mục 2), hoặc bấm *Tải danh sách nhân viên* rồi lọc và bấm *Sửa* / *Xoá* trên từng dòng. Sửa tên sẽ cập nhật luôn tên trên bảng điểm.
- Nếu xoá một nhân viên đã liên kết Gmail, liên kết và **điểm của người đó cũng bị xoá**. Muốn giữ nhân viên nhưng cho nhận lại bằng Gmail khác thì dùng *Gỡ liên kết*.

### Quản trị viên

- Trong `admin.html` → mục *Quản trị viên*: nhập Gmail rồi bấm *Thêm admin*. Người đó đăng nhập `admin.html` bằng đúng Gmail này là dùng được.
- *Tải danh sách admin* để xem ai đang có quyền, ai thêm và thêm lúc nào.
- Chỉ admin gốc (document tạo tay trong Console, không có field `addedBy`) mới *Thêm admin* và *Xoá quyền* admin khác. Admin được thêm qua `admin.html` có mọi quyền khác nhưng không thêm / xoá được admin nào.
- Không thể tự xoá quyền của chính mình, nên luôn còn ít nhất một admin. Firestore rules cũng chặn việc này.
- Chức năng này cần bản `firestore.rules` mới. Sau khi cập nhật file, nhớ dán lại vào Firebase Console → Firestore → Rules → **Publish**.

### Đổi thời gian / trần điểm / số lượt

Sửa `GAMES` trong `config.js` **và** các hàm `gameOpen()`, `maxScore()`, `minSeconds()`, `quizDailyPlays()` trong `firestore.rules` (publish lại rules).

### Đố vui: kho câu hỏi và giới hạn lượt

- Kho ~155 câu chia 10 chủ đề nằm trong [`assets/js/minigame/quiz-bank.js`](assets/js/minigame/quiz-bank.js) (đáp án đúng luôn ở vị trí đầu tiên).
  Mỗi lượt bốc 10 câu, mỗi chủ đề một câu, ưu tiên câu người chơi chưa gặp trên máy đó. Mỗi câu có sẵn bản tiếng Anh (`en`); khi thêm câu mới nên thêm luôn `en`.
- BTC duyệt toàn bộ kho ở `admin.html` → mục *Ngân hàng câu hỏi* (đáp án đúng tô xanh, xuất CSV được). Sửa câu thì sửa file trên rồi push.
- Mỗi người chơi Đố vui tối đa **3 lượt/ngày** (giờ VN). Máy chủ (Firestore rules) đếm, lượt được tính ngay khi bắt đầu.

### Giới hạn cần biết

- Không có server nên không thể chặn tuyệt đối gian lận: người rành kỹ thuật vẫn có thể gửi điểm sát trần.
  Rules chặn điểm vượt trần, nộp quá nhanh, sửa tên/MSNV. **BTC nên xác minh Top 10 trước khi trao giải**
  (dùng nút *Loại* trong admin nếu thấy bất thường).
- Đáp án Đố vui nằm trong code phía trình duyệt nên người rành kỹ thuật vẫn đọc được; giới hạn 3 lượt/ngày và trần điểm hạn chế điều này.
- Google chặn đăng nhập trong trình duyệt nhúng của Zalo/Messenger; trang sẽ nhắc mở bằng Chrome/Safari.
- Hạn mức miễn phí: 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày; một lượt chơi tốn 1–2 lượt ghi.
- Họ tên + MSNV hiển thị công khai trên Top 10 (có thông báo khi đăng nhập). Đặt `GAMES.maskMsnv: true` để che bớt MSNV.
