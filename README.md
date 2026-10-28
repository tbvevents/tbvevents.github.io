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

## Cấu trúc

| File | Nội dung |
| --- | --- |
| `index.html` | Các section nội dung (mỗi `data-step` = một điểm dừng camera) |
| `assets/css/style.css` | Giao diện thẻ, typography, responsive |
| `assets/js/main.js` | Renderer, bloom, camera chạy theo scroll (GSAP ScrollTrigger), pháo hoa tự động/nhấp chuột |
| `assets/js/world/cities.js` | Mô hình low-poly: Tháp Rùa, Ngọ Môn, Cầu Rồng, Chùa Cầu, Landmark 81, Bitexco, Bến Thành, sân khấu |
| `assets/js/world/characters.js` | Linh vật Dê vàng, em bé áo dài, ông đồ, múa lân, đèn lồng |
| `assets/js/world/decor.js` | Bầu trời, cây đào/mai, cánh hoa rơi, đèn trời, bánh chưng, dây pháo |
| `assets/js/world/fireworks.js` | Hệ hạt pháo hoa |

Thêm điểm dừng mới: thêm một `<section data-step>` trong HTML và một phần tử tương ứng trong mảng `STOPS` ở `main.js`.

Thư viện (CDN, phiên bản cố định): three.js 0.170.0, GSAP 3.13.0, @splinetool/viewer 2.0.64 (chỉ tải khi có `splineScene`).

Thêm `?debug` vào URL để truy cập scene qua `window.__yep` trong DevTools.
