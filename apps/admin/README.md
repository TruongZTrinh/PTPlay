# PTPlay Admin Center — Unified Web Management Hub 🎮⚡

**Trung Tâm Quản Trị Hệ Sinh Thái Game Tương Tác TikTok LIVE (PTPlay)**

Hệ thống bảng điều khiển web tập trung giúp streamer và admin quản lý, điều phối, giả lập và vận hành song song toàn bộ các tựa game trong hệ sinh thái PTPlay:
1. **PTPlay — Mini War Arena V1.0** (`C:\Workspace\PTPlay-Mini-War-Arena`, Cổng 5173)
2. **PTPlay — Café Mòe (Cat Café LIVE V1.0)** (`C:\Workspace\PTPlay-Cat-Cafe`, Cổng 5174)
3. **PTPlay LIVE Bridge** (`C:\Workspace\PTPlay-Mini-War-Arena\ptplay-live-bridge`, Cổng 8088)

---

## 1. Khởi Chạy Nhanh Trên Windows (1-Click Start)

### Cách 1: Chạy file Batch (Khuyến nghị cho Streamer)
Nhấp đúp chuột vào file:
```cmd
RUN_ADMIN_WEB.bat
```
- Tự động kiểm tra môi trường Node.js.
- Tự động kích hoạt **PTPlay LIVE Bridge** (Cổng 8088) nếu chưa chạy.
- Khởi động **PTPlay Admin Center** (Cổng 8080).
- Tự động mở trình duyệt web tại địa chỉ: `http://localhost:8080`.

### Cách 2: Khởi chạy bằng lệnh dòng lệnh
```powershell
cd C:\Workspace\PTPlay-Admin
npm start
# Hoặc: node src/server.js
```

---

## 2. 9 Phân Hệ Quản Trị Toàn Diện (All-in-One Admin Tabs)

### 1. 🚀 Quản Lý Tiến Trình & Khởi Chạy Game (Process & Games Management)
- **Quản lý vòng đời tiến trình con (Process Lifecycle):** Khởi động (Start), Dừng (Stop), Khởi động lại (Restart) cho từng dịch vụ:
  - Mini War Arena (Vite Dev Server, cổng 5173).
  - Café Mòe (Vite Dev Server, cổng 5174).
  - PTPlay Live Bridge (TypeScript Server, cổng 8088).
- **Kiểm tra trạng thái cổng mạng (Port Scanner):** Thăm dò tức thì trạng thái cổng 5173, 5174, 8088, và TikFinity Desktop (21213).
- **Nhật ký dòng lệnh thời gian thực (Live Terminal Streaming):** Theo dõi log output STDOUT/STDERR trực tiếp trong trình duyệt mà không cần mở nhiều cửa sổ cmd.
- **Bộ chuyển luồng sự kiện (Active Game Router):** Điều phối bình luận & quà tặng TikTok LIVE về đúng game được kích hoạt, cách ly hoàn toàn chống rò rỉ sự kiện sang game khác.

### 2. ⚔️ Bàn Điều Khiển Chiến Trường Mini War Arena (Tactical Battlefield Console)
- **Quản lý vòng đấu:** Bắt đầu vòng mới, tạm dừng, tiếp tục, kết thúc vòng ép buộc, đặt lại trận đấu.
- **Ghi đè máu thành trì (Core HP Override):** Tùy chỉnh trực tiếp thanh máu của Nhà Chính Đỏ / Nhà Chính Xanh (0 - 1500 HP).
- **Triệu hồi binh chủng theo làn đường (Lane-specific Spawner):** Triệu hồi Chiến Binh, Cung Thủ, Hộ Vệ, Pháp Sư thả vào Đường Trên (Top), Đường Giữa (Mid), Đường Dưới (Bot).
- **Triệu hồi Boss & Tuyệt chiêu Boss (Boss Ability):** Kích hoạt Infernal Warlord (Đỏ) hoặc Crystal Titan (Xanh), tung kỹ năng trừng phạt địa chấn hoặc mưa lửa.
- **Dọn dẹp chiến trường tức thì (Clear Units):** Xóa toàn bộ quân lính đang giao tranh để làm mới trận đấu ngay lập tức.
- **Thời tiết & Khí quyển 4 đấu trường:** Hoàng gia (Castle), Rừng phép thuật (Forest), Pha lê băng giá (Crystal), Nham thạch (Ember).

### 3. 🐱 Đạo Diễn Không Gian Café Mòe (Pet & Atmosphere Studio)
- **Xưởng tạo mèo tùy biến (Custom Cat Spawner):** Nhập tên người nuôi, chọn 1 trong 8 giống mèo (Mèo Cam, Tuxedo, Mèo Mun, Ba Tư, Xiêm, Tam Thể, Mèo Nga Mắt Xanh, Ragdoll), tùy chỉnh cân nặng và mức độ thân thiết.
- **Dọn dẹp mèo:** Xóa sạch mèo khách hoặc đưa tất cả mèo đi ngủ.
- **Chuyển đổi 3 không gian:** Quán Cà Phê Chính (Main Room), Vườn Nắng Thư Giãn (Garden), Gác Ngủ Lofi (Nap Loft).
- **Khí quyển & Thời tiết:** Nắng ấm rực rỡ, Chiều mưa rơi chill, Đêm trăng thanh tĩnh.
- **Bàn trộn âm lượng (Audio Mixer):** Điều chỉnh âm lượng nhạc nền Lofi, tiếng mèo kêu Meow SFX, và tiếng mưa rơi rào rạt.
- **Quản lý Purr Points & Cấp độ Quán:** Tăng cấp độ quán (Level 1 - 10) và cộng thưởng điểm Purr Points.

### 4. 👥 Quản Trị Khán Giả & Đội Ngũ (Spectators CRM)
- Thống kê thời gian thực tổng số người xem tham gia phe Đỏ và phe Xanh.
- Danh sách khán giả chi tiết kèm TikTok ID đã được che mờ bảo mật.
- Thao tác nhanh 1-click: Đổi phe khán giả (Đỏ ⇄ Xanh), xóa khán giả, thêm khán giả thủ công.

### 5. 💰 Quy Tắc Kinh Tế Quà Tặng (Gift Economy Rules)
- Tùy biến toàn bộ logic chuyển đổi quà TikTok sang hành động game:
  - Tên quà: Rose, Heart, Finger Heart, Doughnut, Dragon, Fireworks, Universe...
  - Hành động: Triệu hồi lính, Triệu hồi Boss, Hồi máu thành, Tăng Morale...
  - Hệ số nhân (Multiplier), Thời gian hồi chiêu (Cooldown), Giới hạn tối đa mỗi lần (Max Cap).
- Thao tác Bật/Tắt (Toggle Active) hoặc Xóa quy tắc ngay trên giao diện web.

### 6. 📺 Màn Hình Trực Tiếp Tỷ Lệ Dọc 9:16 & Vạch An Toàn TikTok LIVE
- Khung hiển thị mô phỏng điện thoại di động tỷ lệ chuẩn 9:16 (540x960 px) xem Mini War, Café Mòe hoặc chế độ xem kép song song (Dual View).
- **Vạch An Toàn TikTok LIVE (Safe Zone Overlay):**
  - Vùng đỏ phía trên (80px): Thanh avatar streamer, số mắt xem, huy hiệu TOP.
  - Vùng đỏ phía dưới (200px): Khung chat bình luận cuộn, nút Like tim bay, khay quà tặng.
  - Vùng xanh lá ở giữa: Vùng an toàn hiển thị đồ họa và thông tin chiến đấu không bao giờ bị che.

### 7. 🧪 TikTok LIVE Studio & Trình Giả Lập Mock
- Chuyển đổi linh hoạt giữa nguồn **Mock Simulation** và **TikFinity LIVE Thật**.
- **TikFinity Diagnostic Probe:** Thăm dò socket `ws://localhost:21213`, hiển thị lỗi kết nối và gợi ý khắc phục nếu ứng dụng TikFinity chưa mở.
- **Auto Simulator:** Chế độ tự động giả lập bình luận và quà tặng ngẫu nhiên theo nhịp điệu thực tế.
- **Trình gửi sự kiện thủ công:** Nhập tên người xem, bình luận, quà tặng để test kịch bản stream.

### 8. 📜 Nhật Ký Sự Kiện & Trình Soi RAW JSON An Toàn
- Bảng lịch sử sự kiện thời gian thực (Thời gian, Khán giả, Đội, Lệnh, Trạng thái hàng đợi).
- Trình soi RAW JSON từ TikTok LIVE với cơ chế bảo mật tự động ẩn danh hóa User ID, an toàn tuyệt đối khi livestream màn hình.

### 9. 🚦 Điều Tiết Hàng Đợi Sự Kiện & Chống Nghẽn (Queue & Traffic Policy)
- Cấu hình số lệnh xử lý đồng thời (`Max Concurrency`).
- Cấu hình giới hạn đột biến (`Burst Limit`).
- Thiết lập chính sách khi hàng đợi quá tải (`Drop Policy`: Chờ chỗ trống / Bỏ qua lệnh cũ).
- Điều chỉnh chu kỳ nhịp điệu phát sự kiện (`Dispatch Interval`).

---

## 3. Bản Đồ Cổng & Kiến Trúc Mạng

| Dịch vụ | Cổng Mặc Định | URL Truy Cập | Mục Đích |
|---|---|---|---|
| **PTPlay Admin Center** | `8080` | `http://localhost:8080` | Trung tâm điều khiển toàn diện |
| **PTPlay LIVE Bridge** | `8088` | `http://localhost:8088/admin` | Cầu nối sự kiện thời gian thực & API |
| **Mini War Arena V1.0** | `5173` | `http://localhost:5173` | Màn hình game Đấu Trường Chiến Binh (9:16) |
| **Café Mòe V1.0** | `5174` | `http://localhost:5174` | Màn hình game Quán Mèo Moe (9:16) |
| **TikFinity Desktop App**| `21213`| `ws://localhost:21213` | Cổng WebSocket nhận dữ liệu TikTok LIVE |
