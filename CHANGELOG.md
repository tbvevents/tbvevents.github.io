# Changelog

Ghi lại các thay đổi đáng chú ý của trang YEP 2026. Mục mới nhất ở trên cùng.

## 2026-10-30

### Thêm
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
