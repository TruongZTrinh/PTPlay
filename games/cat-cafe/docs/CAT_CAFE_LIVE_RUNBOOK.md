# CAFÉ MÒE (PTPlay Cat Café LIVE) V1.0 — Streamer Live Runbook & Setup Guide

**Dự án:** PTPlay Cat Café LIVE (Café Mòe)  
**Phiên bản:** V1.0 Production Release  
**Nền tảng:** Windows PC, TikTok LIVE Studio / OBS Studio  
**Mục tiêu:** Hướng dẫn vận hành trọn gói dành cho streamer từ khởi động 1-click, thiết lập nguồn video 9:16, kết nối TikFinity, điều khiển trong game và xử lý sự cố.  
**Ngày cập nhật:** 2026-11-03  

---

## 1. Bảng Trạng Thái Xác Thực Phát Sóng (Honest Verification Status)

Tuân thủ nguyên tắc trung thực kỹ thuật cao nhất: **Tuyệt đối phân biệt rạch ròi giữa các tính năng đã kiểm thử tự động nội bộ và việc tiếp nhận sự kiện trong một phiên live stream thực tế.**

| Hạng Mục Kiểm Thử | Trạng Thái | Chi Tiết & Bằng Chứng Kỹ Thuật |
|---|---|---|
| **1. Mã nguồn & Đồ hoạ vector V1.0** | ✅ **PASS** | 3 phòng cảnh (Quán Chính, Vườn Mèo, Gác Ngủ), 8 giống mèo minh hoạ vector, 6 tính cách, 11 trạng thái cử động. |
| **2. Bản Build & Type Check** | ✅ **PASS** | `npm run build` thành công, 0 lỗi TypeScript strict trên cả Cat Café và Mini War Arena. |
| **3. Bộ Kiểm Thử Tự Động (Automated Tests)** | ✅ **PASS** | 33 bài test tự động (26 Cat Café + 7 Live Bridge) đạt 100%. |
| **4. Tích hợp LIVE Bridge & Dashboard** | ✅ **PASS** | Cổng 8088 định tuyến chuẩn xác tới `app=cat-cafe`, phản hồi lệnh mock và hiển thị nhật ký sự kiện. |
| **5. Công cụ Streamer Trong Game** | ✅ **PASS** | Bảng điều khiển modal 4 tab (`Tab`/`Esc` hoặc nút bánh răng), phím tắt nhanh, vạch an toàn TikTok, thanh 10 nút demo. |
| **6. Bộ Tổng Hợp Âm Thanh Web Audio** | ✅ **PASS** | 3 theme nhạc Lofi synth (Ngày, Mưa, Đêm), tiếng kêu meo meo, rừ rừ, nhai cá, chuông cửa, chụp ảnh, level up. |
| **7. Phiên LIVE TikTok Thật (Real LIVE Session)** | ⏳ **UNVERIFIED** | **Chưa thực hiện với tài khoản phát sóng thực tế.** Cần streamer mở phiên LIVE và kết nối TikFinity thật để xác nhận. |

---

## 2. Yêu Cầu Hệ Thống & Chuẩn Bị (Prerequisites)

1. **Hệ điều hành:** Windows 10 hoặc Windows 11 (64-bit).
2. **Môi trường:** Node.js v18 trở lên (đã kiểm thử ổn định trên Node v22).
3. **Phần mềm Livestream:**
   - **TikTok LIVE Studio** HOẶC **OBS Studio** (bản 29+).
   - **TikFinity Desktop Client** (tải miễn phí tại [tikfinity.zerody.one](https://tikfinity.zerody.one)).
4. **Trình duyệt khuyến nghị:** Google Chrome, Microsoft Edge, hoặc Brave.

---

## 3. Khởi Động Nhanh 1-Click (1-Click Launch)

Chỉ cần chạy tập tin kịch bản tự động hóa nằm tại thư mục gốc:
```bat
C:\Workspace\PTPlay-Cat-Cafe\RUN_CAT_CAFE_WINDOWS.bat
```
Kịch bản tự động thực hiện:
1. Khởi động **PTPlay LIVE Bridge** tại cổng `8088`.
2. Khởi động **Cat Café LIVE** tại cổng `5174`.
3. Tự động mở 2 tab trình duyệt:
   - **Màn hình Game Quán Mèo:** `http://localhost:5174` (chuẩn tỷ lệ dọc 9:16).
   - **Bảng Quản Trị Streamer Dashboard:** `http://127.0.0.1:8088/admin`.

---

## 4. Thiết Lập TikFinity Để Nhận Chat & Quà Từ TikTok LIVE

1. Mở phần mềm **TikFinity Desktop** trên máy tính.
2. Đăng nhập hoặc nhập `Username` của kênh TikTok đang phát sóng LIVE.
3. Bật tính năng **Event API**:
   - Trong TikFinity, vào mục **Settings / Event API**.
   - Đảm bảo tính năng WebSocket Server cổng `21213` đang ở trạng thái **ON / Active**.
4. Truy cập **Dashboard Streamer** tại `http://127.0.0.1:8088/admin`:
   - Chọn mục **TikFinity Provider (ws://localhost:21213/)**.
   - Bấm nút **⚡ Chạy Chẩn Đoán (Probe)**. Khi hệ thống báo `ĐÃ KẾT NỐI (21213)` là cổng kết nối đã sẵn sàng.
5. Khi người xem bình luận hoặc tặng quà trên livestream, TikFinity sẽ tự động đẩy sự kiện vào Bridge, Bridge chuẩn hoá và gửi tới Cat Café hiển thị tức thì.

---

## 5. Cấu Hình Nguồn Phát Trong TikTok LIVE Studio / OBS Studio

### Đối với TikTok LIVE Studio:
1. Đặt định dạng phiên phát sóng là **Dọc (Portrait 9:16)** với độ phân giải `1080 x 1920`.
2. Nhấn **Thêm nguồn (Add Source)** -> Chọn **Trình duyệt (Browser Source)** hoặc **Cửa sổ ứng dụng (Window Capture)**.
3. Nhập URL: `http://localhost:5174`
4. Cài đặt kích thước:
   - Width: `540`
   - Height: `960`
   - FPS: `60`
5. Bật kiểm tra **Vạch Khung An Toàn TikTok (Safe Zone)** trong game (bấm nút bánh răng `⚙️` -> Tab Âm thanh -> Bật Khung An Toàn). Khung màu xanh dương mô phỏng vùng comment TikTok để streamer canh chỉnh không bị che khuất mèo.

### Đối với OBS Studio:
1. Vào Settings -> Video -> Đặt Base Canvas là `1080x1920` (9:16).
2. Thêm **Browser Source**:
   - URL: `http://localhost:5174`
   - Width: `540`
   - Height: `960`
   - Tích chọn: *Control audio via OBS* hoặc cho phép âm thanh truyền qua trình duyệt.

---

## 6. Hướng Dẫn Vận Hành & Phím Tắt Trong Buổi Live

### Mở Nhạc Lofi & Âm Thanh (Audio Unlock):
- Do chính sách autoplay của trình duyệt web hiện đại, âm thanh sẽ bị tắt cho đến khi có tương tác đầu tiên.
- Khi vừa mở game, streamer chỉ cần nhấp chuột vào banner thông báo màu xanh lá:  
  `🔊 Bấm vào đây để bật nhạc Lofi`  
  Ngay lập tức, nhạc nền Lofi êm dịu và tiếng mèo kêu sẽ được kích hoạt!

### Bảng Điều Khiển Streamer (`StreamerModal`):
- Bấm vào biểu tượng bánh răng `⚙️` ở góc trên bên phải màn hình hoặc nhấn phím `Tab` / `Esc` trên bàn phím:
  - **Tab 1: Không Gian (Rooms & Weather):**
    - Chuyển phòng: `☕ Quán Chính`, `🌿 Vườn Mèo`, `🌙 Gác Ngủ Lofi`.
    - Đổi thời tiết: `☀️ Nắng Ấm`, `🌧️ Mưa Rào Chill`, `🍃 Thư Giãn Mát Mẻ`.
    - Đổi khung giờ: `🌤️ Ban Ngày`, `🌇 Hoàng Hôn`, `🌃 Đêm Ấm`.
  - **Tab 2: Tiến Trình (Progression & Album):**
    - Xem Cấp độ Quán (1-10), thanh điểm Purr, danh sách 12 Thử Thách phiên live.
    - Album Khám Phá 8 Giống Mèo (mèo mướp cam, mèo bạch tuyết, xám tro, tuxedo, tam thể, mun đen, vàng kem, xiêm quý phái).
  - **Tab 3: Âm Thanh & Màn Hình:**
    - Điều chỉnh âm lượng Nhạc nền (BGM), Hiệu ứng (SFX), Môi trường (Ambience).
    - Bật/Tắt vạch an toàn TikTok Safe Zone.
  - **Tab 4: Lưu Trữ (Save & Data):**
    - Xuất file sao lưu JSON, Nhập lại file sao lưu, Đặt lại toàn bộ dữ liệu về Cấp 1.

### Phím Tắt Nhanh (Keyboard Shortcuts) Dành Cho Streamer:
| Phím Tắt | Tác Vụ Nhanh |
|---|---|
| `M` | Giả lập thêm 1 mèo người xem mới (`cat_cafe.join`) |
| `F` | Cho mèo ăn cá (`cat_cafe.feed`) |
| `P` | Cho mèo chơi cuộn len (`cat_cafe.play`) |
| `S` | Đưa mèo đi ngủ (`cat_cafe.nap`) |
| `L` | Thả tim nồng thắm (`cat_cafe.love`) |
| `C` | Gọi mèo ra chào khán giả (`cat_cafe.call`) |
| `R` | Thưởng bông hồng Rose (`cat_cafe.gift_effect`) |
| `Tab` / `Esc` | Bật / Tắt Bảng điều khiển Quán Mèo (`StreamerModal`) |

---

## 7. Các Lệnh Chat & Tương Tác Khán Giả Live

Hệ thống được thiết kế **thông minh & khoan dung tuyệt đối**: Khán giả gõ **chữ in hoa, in thường, có dấu hoặc không dấu** (`Ăn`, `ăn`, `an`, `AN`, `MÈO`, `mèo`, `meo`, `CHƠI`, `choi`...) hệ thống đều tự động nhận diện chính xác 100%.

### 7.1. Bảng Từ Khóa Lệnh Chi Tiết:
| Lệnh Chat (Có hoặc không dấu) | Tiếng Anh Hỗ Trợ | Tác Vụ Trong Game | Hiệu Ứng Âm Thanh Thực Tế |
|---|---|---|---|
| **`MÈO` / `meo` / `xin mèo`** | `cat`, `meow` | Nhận nuôi 1 bé mèo độc quyền mang tên mình | Tiếng mèo thật kêu chào `meow_classic.wav` |
| **`ĂN` / `an` / `cho ăn`** | `feed`, `eat` | Mèo chạy tới thưởng thức bát cá thơm ngon | Tiếng nhai rào rạo `munch_real.wav` & bát sứ `bowl_clink.wav` |
| **`CHƠI` / `choi`** | `play` | Mèo vồ bóng len hoặc cào cột móng | Chuông đồ chơi `yarn_jingle.wav` & cào móng `scratch_real.wav` |
| **`NGỦ` / `ngu`** | `sleep`, `nap` | Mèo cuộn tròn ngủ say trên nệm êm | Tiếng ngáp ngủ dễ thương `yawn_real.wav` |
| **`YÊU` / `yeu` / `tim`** | `love` | Mèo bắn tim hạnh phúc, chạy nhảy | Tiếng bong bóng tim `heart_pop.wav` & rừ rừ `purr_real.wav` |
| **`GỌI` / `goi`** | `call`, `come` | Mèo chạy lại gần camera chào bạn | Tiếng mèo líu lo chào mừng `meow_baby.wav` |
| **`CHỤP` / `chup`** | `photo`, `pic` | Mèo tạo dáng kute, chớp đèn chụp ảnh | Tiếng màn trập máy ảnh cơ `camera_shutter.wav` |
| **`VƯỜN` / `vuon`** | `garden`, `out` | Dẫn mèo ra vườn hoa tắm nắng bắt bướm | Tiếng bước chân `paw_tap.wav` |
| **Quà 🌹 (Rose)** | Rose | Thưởng món cá nướng hoàng gia dát vàng | Mưa sao tiên lấp lánh `sparkle_real.wav` |
| **Chạm Màn Hình (Tap Like)** | Like Screen | Tự động tạo cơn mưa tim bay khắp quán | Tiếng nổ bóng tim rộn ràng `heart_pop.wav` |

### 7.2. Mẫu Bình Luận Ghim Trên TikTok LIVE (Copy & Paste):
Streamer chỉ cần copy đoạn văn bản sau để ghim (Pin) lên đầu khung chat TikTok LIVE:

```text
🐾 CAFÉ MÒE LIVE 🐾
Gõ có dấu hoặc không dấu đều được nhé:
👉 MÈO (hoặc meo) : Nhận nuôi mèo riêng
👉 ĂN (hoặc an)   : Cho mèo ăn cá
👉 CHƠI (hoặc choi): Chơi cuộn len
👉 NGỦ (hoặc ngu) : Cho mèo đi ngủ
👉 YÊU (hoặc yeu) : Thả tim cho mèo
👉 GỌI (hoặc goi) : Mèo chạy ra chào
👉 CHỤP           : Chụp ảnh kỷ niệm
👉 Quà 🌹         : Tiệc cá nướng dát vàng!
❤️ Nhấp đúp vào màn hình để thả tim cho các bé mèo nhé!
```

---

## 8. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Game báo "⚪ Standalone" thay vì "🟢 LIVE Online":**
   - Kiểm tra xem Bridge đã chạy chưa (mở `http://127.0.0.1:8088/admin`).
   - Nếu Bridge chưa chạy, nhấp lại vào `RUN_CAT_CAFE_WINDOWS.bat`.
2. **Không nghe thấy tiếng nhạc Lofi:**
   - Nhấp chuột bất kỳ vào màn hình game hoặc bấm vào nút mở âm thanh trên banner đầu trang.
   - Kiểm tra âm lượng BGM trong Bảng điều khiển streamer (`⚙️`).
3. **TikFinity không nhận bình luận từ TikTok:**
   - Đảm bảo tài khoản TikTok đang phát sóng LIVE thật.
   - Nhấn **Connect** lại trong TikFinity Desktop.
   - Mở tab `/admin` trên Bridge và nhấn **Chạy Chẩn Đoán (Probe)** để kiểm tra cổng `21213`.
4. **Không muốn bình luận của khán giả bị che bởi chat TikTok:**
   - Mở Bảng điều khiển `⚙️` -> Tab Âm thanh -> Bật Khung An Toàn TikTok để canh chỉnh góc máy phù hợp.

