# PTPlay Cat Café LIVE — Real TikTok LIVE Verification Runbook

**Dự án:** PTPlay Cat Café LIVE (Quán Mèo Moe)  
**Mục tiêu:** Quy trình xác thực phiên LIVE thực tế và kiểm tra tính năng tiếp nhận sự kiện từ TikTok  
**Ngày lập tài liệu:** 2026-11-03  

---

## 1. Bảng Trạng Thái Xác Thực (Verification Status Matrix)

Tuân thủ nghiêm ngặt nguyên tắc trung thực kỹ thuật: **Tuyệt đối không báo cáo thành công phiên LIVE thật khi chưa thực sự quan sát được sự kiện từ phòng LIVE TikTok thật.**

| Hạng Mục | Trạng Thái Hiện Tại | Minh Chứng Kỹ Thuật |
|---|---|---|
| **1. Mã nguồn & Đồ hoạ (Implemented)** | ✅ **HOÀN THÀNH** | Phaser 3, 5 màu lông, 3 NPC tự động, giao diện 9:16 |
| **2. Bản Build & Type Check (Build-tested)** | ✅ **HOÀN THÀNH** | `npm run build` thành công, 0 lỗi TypeScript strict |
| **3. Giả lập nội bộ (Mock-tested)** | ✅ **HOÀN THÀNH** | 25 bài unit & E2E tests đạt 100%, lệnh MÈO, ĂN, Rose hoạt động qua Bridge |
| **4. Tiếp nhận Chat Thật (Real-chat-tested)** | ⏳ **CHỜ STREAMER THỬ NGHIỆM** | Cần streamer mở phiên LIVE trên điện thoại hoặc PC |
| **5. Tiếp nhận Quà Thật (Real-gift-tested)** | ⏳ **CHỜ STREAMER THỬ NGHIỆM** | Chưa kiểm thử với quà tặng thật từ tài khoản người xem |
| **6. Phát sóng Studio PC (PC-broadcast-tested)** | ⏳ **CHỜ XÁC MINH QUYỀN HẠN** | Quyền LIVE Studio trên PC của tài khoản cần kiểm tra |

---

## 2. Quy Trình Thử Nghiệm LIVE Thật (Step-by-Step Runbook)

### Bước 1: Khởi động hệ thống trên máy tính Windows
1. Nhấp đúp vào `RUN_CAT_CAFE_WINDOWS.bat` để mở:
   - Live Bridge tại `http://127.0.0.1:8088/admin`
   - Game Cat Café tại `http://localhost:5174`
2. Mở ứng dụng **TikFinity Desktop** trên máy tính (đảm bảo TikFinity đang chạy ngầm và mở cổng WebSocket `21213`).
3. Trên Dashboard Streamer (`http://127.0.0.1:8088/admin`):
   - Nhấn **"Dùng TikFinity (ws://localhost:21213/)"** trong phần chuyển đổi Provider.
   - Nhấn **"⚡ Chạy Chẩn Đoán (Probe)"** để kiểm tra: mục *TikFinity App (Port 21213)* phải báo `ĐÃ KẾT NỐI (21213)`.

---

### Bước 2: Bắt đầu phiên TikTok LIVE trên Điện Thoại (Mobile Go LIVE)
1. Mở ứng dụng TikTok trên điện thoại của tài khoản mèo đã đủ điều kiện LIVE.
2. Bấm nút **+** và chuyển sang chế độ **LIVE** (Live camera bình thường).
3. Người dẫn (Host) có thể xuất hiện, trò chuyện thân thiện và giới thiệu về trò chơi tương tác.

---

### Bước 3: Kết nối TikFinity với Phòng LIVE
1. Trên TikFinity Desktop (PC), nhập username TikTok của tài khoản đang phát sóng.
2. Bấm **Connect**.
3. Quan sát trên Dashboard `http://localhost:8088/admin`:
   - Trạng thái **TikTok LIVE** chuyển từ `Offline` sang `ROOM ACTIVE` (màu xanh lá).
   - Ô chẩn đoán hiển thị số lượng người xem thực tế.

---

### Bước 4: Kiểm tra Lệnh Chat Thật
1. Dùng một tài khoản TikTok thứ hai (khác với tài khoản đang LIVE), vào xem phiên LIVE.
2. Gửi bình luận:
   ```text
   MÈO
   ```
3. Quan sát:
   - Trên **RAW Event Inspector** của Dashboard xuất hiện sự kiện `chat` với nội dung `MÈO`.
   - Trên màn hình game `http://localhost:5174`, một chú mèo mới xuất hiện cùng tên hiển thị của tài khoản vừa chat.
4. Gửi tiếp bình luận:
   ```text
   ĂN
   ```
   - Chú mèo của tài khoản đó chạy ngay tới bát ăn cá!
5. Gửi tiếp bình luận:
   ```text
   CHƠI
   ```
   - Chú mèo nhảy nhót và cào móng trên cây cào đồ chơi.

---

### Bước 5: Kiểm tra Quà Tặng Thật (Tuỳ Chọn)
- Chỉ thực hiện nếu streamer và người xem đồng thuận thử nghiệm một món quà nhỏ (ví dụ: 1 bông hồng **Rose** - 1 xu).
- Tuyệt đối không ép buộc nạp tiền hoặc tặng quà giá trị cao.
- Khi người xem gửi **Rose**: Bát cá nướng đặc biệt xuất hiện trong game, chú mèo chạy tới ăn và hiệu ứng tim/sao bắn lên vui mừng.

---

### Bước 6: Kiểm tra Quyền Truy Cập TikTok LIVE Studio PC
1. Mở phần mềm **TikTok LIVE Studio** trên Windows PC.
2. Đăng nhập tài khoản mèo.
3. Nếu tài khoản được cấp quyền Live Studio:
   - Thêm nguồn phát **Window Capture** hoặc **Browser**.
   - Chọn cửa sổ trình duyệt đang hiển thị game `http://localhost:5174`.
   - Điều chỉnh khung hình theo tỷ lệ dọc 9:16 (1080 × 1920).
4. Nếu tài khoản chưa được mở quyền LIVE Studio:
   - Vẫn có thể thử nghiệm tiếp nhận bình luận (Bước 1 - Bước 5) song song khi phát sóng camera điện thoại!

