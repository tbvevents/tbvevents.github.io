# Changelog

Ghi lại các thay đổi đáng chú ý của trang YEP 2026. Mục mới nhất ở trên cùng.

## 2026-10-30

### Thêm
- **Game thứ 4: Bắn cung 🏹** (`assets/js/minigame/archery.js`). 5 mũi tên, chạm-kéo để nhắm, thả để bắn; hồng tâm 10 điểm giảm dần ra ngoài, trượt 0; gió ngẫu nhiên mỗi mũi; tối đa 50 điểm, cộng vào tổng điểm Top 10.
  - `firestore.rules`: trần 50 điểm, chơi tối thiểu 6 giây, tổng điểm tính thêm `archery` (doc cũ thiếu field coi như 0). **Cần Publish lại rules trên Firebase Console trước khi đưa code lên**, nếu không lượt Bắn cung sẽ bị từ chối.
  - Trang quản trị: thêm cột *Bắn cung* ở bảng điểm và file CSV.
  - Giao diện Bắn cung làm lại: góc nhìn người bắn, cảnh trời–núi–cây–bãi cỏ phong cách flat (thêm hoa đào, đèn lồng), camera tiến vào bia khi nhắm (phối cảnh 3D, parallax), mũi tên bay xa dần, huy hiệu gió, ô điểm từng mũi, hiệu ứng hồng tâm. Kéo tương đối để di chuyển tâm ngắm. Chạy trên điện thoại, tablet (cả xoay ngang) và máy tính. Không đổi luật, không cần publish lại rules.
  - Bắn cung, cảm giác bắn: lúc kéo dây cây cung trượt ra khỏi khung hình, chỉ còn đầu mũi tên và tâm ngắm, bia giữ nguyên cỡ; khi thả, camera đuổi theo mũi tên tới bia (bia to dần). Mũi tên bay ~1 giây, cong theo gió, vồng lên, thân rung, lông đuôi xoay, có vệt gió; cắm vào thì giá bia giật và đuôi rung. Gió thổi từ mọi hướng (0–360°), đổi hướng ≥ 45° và tốc độ ≥ 1 sau mỗi lượt; huy hiệu gió xoay theo hướng mới. Không cần publish lại rules.
- **Trang quản trị: cấp / thu hồi quyền admin** (mục *Quản trị viên*), không cần vào Firebase Console.
  - Thêm admin bằng Gmail, xem danh sách admin (ai thêm, lúc nào), xoá quyền.
  - Không tự xoá quyền của chính mình được, nên luôn còn ít nhất một admin.
  - Chỉ admin gốc (tạo tay trong Console, không có `addedBy`) mới thêm / xoá được admin. Admin thêm qua trang quản trị có đầy đủ quyền khác nhưng không thêm / xoá được admin.
  - `firestore.rules`: admin được `list` trong `admins`; chỉ admin gốc được `create` / `delete`. **Cần Publish lại rules trên Firebase Console.**
- **Trang quản trị: sửa / xoá nhân viên**, không cần vào Firebase Console.
  - Tra cứu MSNV: sửa họ tên tại chỗ, nút *Xoá nhân viên* (dùng cho cả người chưa liên kết Gmail).
  - Mục mới *Danh sách nhân viên*: tải toàn bộ, lọc theo MSNV/họ tên, xem Gmail đã liên kết, nút *Sửa* / *Xoá* từng dòng.
  - Sửa tên sẽ cập nhật luôn tên trên bảng điểm. Xoá người đã liên kết thì xoá luôn tài khoản liên kết và điểm (có hộp xác nhận).
- Chuyển ngôn ngữ **Tiếng Việt / English** (nút VI | EN góc dưới bên phải) cho landing page và mini game, kèm bản tiếng Anh của kho câu hỏi Đố vui (`85291b6`).
- Nhạc nền cho mini game `assets/audio/nhac-nen-games.mp3` (`6ab7db3`).

### Sửa
- Admin gốc thấy nút *Xoá quyền* nhưng không xoá được: `firestore.rules` gọi `data.has('addedBy')`, mà Map trong Rules không có `has()` nên rule luôn từ chối. Đổi sang `'addedBy' in data`.

### Tài liệu
- README: thêm mục *Quản lý nhân viên* (nạp CSV chỉ cần người mới, sửa/xoá trong admin).

## Trước đó

- `8132b88` Sửa màn hình mini game: ẩn khung game cho đến khi bắt đầu chơi, hiện nút đăng nhập khi chưa đăng nhập.
- `498be2e` Làm lại mini game: sảnh gọn hơn, popup luật chơi, âm thanh, kho 155 câu Đố vui với giới hạn lượt mỗi ngày.
- `5d8330c` Cấu hình Firebase web app.
- `685f0b3` Pháo hoa: chạm vào nửa trên màn hình (bầu trời), chạy ổn trên cả cảm ứng và chuột.
