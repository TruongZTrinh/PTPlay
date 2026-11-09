# PTPlay – Checklist Kiểm Thử TikTok LIVE Thực Tế (Real LIVE Test Checklist)

> **LƯU Ý QUAN TRỌNG:**
> Hệ thống **PTPlay LIVE Bridge** hiện tại đã hoàn tất 100% phần mã nguồn, kiểm thử MockProvider và cơ chế tự động kết nối TikFinity Desktop.
> Tuy nhiên, kết nối TikTok LIVE thật hiện ở trạng thái:
> **`⚠️ BLOCKED – ĐANG CHỜ PHIÊN PHÁT SÓNG TIKTOK LIVE THỰC TẾ`**
> 
> Hệ thống **chỉ được coi là kết nối LIVE thật thành công** khi:
> 1. Có phiên phát sóng LIVE thực sự trên TikTok.
> 2. Có ít nhất một bình luận hoặc quà tặng thực tế từ người xem truyền qua TikFinity vào game.

---

## 1. Bảng Trạng Thái Hệ Thống (Diagnostic Matrix)

| Thành Phần | Trạng Thái Kỹ Thuật | Phương Thức Kiểm Chứng |
| :--- | :---: | :--- |
| **Mock Engine** | **✅ HOÀN THÀNH** | Đã pass 7/7 bài test tích hợp (`npm test`). |
| **TikFinity WebSocket Client** | **✅ HOÀN THÀNH** | Sẵn sàng kết nối `ws://127.0.0.1:21213/`, tự động reconnect an toàn. |
| **Bảo Mật Localhost & Token** | **✅ HOÀN THÀNH** | Khóa `127.0.0.1`, xác thực token `x-ptplay-token`, che `userId` nhạy cảm. |
| **Kiểm Soát Giới Hạn Quân** | **✅ HOÀN THÀNH** | Mặc định giữ lệnh trong hàng đợi (`wait`), không tự ý đổi quà thành hồi máu. |
| **Phiên LIVE TikTok Thật** | **⚠️ CHỜ STREAMER** | Cần người dùng làm theo checklist bên dưới khi kênh được phát sóng. |

---

## 2. Checklist Từng Bước Tự Kiểm Tra (Actionable Checklist)

Hãy đánh dấu `[x]` vào từng mục khi bạn thực hiện kiểm thử thực tế trên máy tính:

### Giai Đoạn A: Khởi Động Phần Mềm Cục Bộ
- [ ] **A1.** Mở terminal hoặc nhấp đúp [`RUN_GAME_WINDOWS.bat`](file:///c:/Workspace/PTPlay-Mini-War-Arena/RUN_GAME_WINDOWS.bat).
- [ ] **A2.** Kiểm tra màn hình game tại `http://localhost:5173` $\rightarrow$ Nhấn **▶ BẮT ĐẦU TRẬN** để kích hoạt âm thanh.
- [ ] **A3.** Mở Dashboard tại `http://127.0.0.1:8088/admin`.
- [ ] **A4.** Kiểm tra đèn **Game Client** trên Dashboard: Báo `Connected` (Màu xanh).

### Giai Đoạn B: Khởi Động TikFinity Desktop
- [ ] **B1.** Tải và cài đặt TikFinity Desktop từ <https://tikfinity.com/> (nếu chưa cài).
- [ ] **B2.** Mở phần mềm **TikFinity Desktop** trên máy tính.
- [ ] **B3.** Vào **Settings / Event API** trong TikFinity:
  - Bật tùy chọn **Enable Local WebSocket Server**.
  - Kiểm tra cổng là **`21213`**.
- [ ] **B4.** Kiểm tra kết nối từ terminal bằng lệnh:
  ```powershell
  npm --prefix ptplay-live-bridge run probe
  ```
  *(Nếu TikFinity đã bật, probe sẽ báo: "Xác minh thành công: TikFinity Desktop đang chạy và phản hồi tốt")*
- [ ] **B5.** Trên Dashboard (`http://127.0.0.1:8088/admin`), nhấn nút **Chạy Chẩn Đoán (Probe)**:
  - Xác nhận mục **TikFinity App (Port 21213)** chuyển sang `ĐÃ KẾT NỐI (21213)`.

### Giai Đoạn C: Kết Nối Phòng LIVE TikTok Thật
- [ ] **C1.** Mở **TikTok LIVE Studio** (hoặc app TikTok trên điện thoại) và bắt đầu buổi phát sóng trực tiếp.
- [ ] **C2.** Trong ứng dụng TikFinity Desktop:
  - Điền `@username` kênh TikTok của bạn.
  - Nhấn nút **Connect to Live**.
  - Đợi TikFinity hiện thông báo xanh: *"Connected to @username's Live"*.
- [ ] **C3.** Trên Dashboard PTPlay:
  - Nhấn nút **Dùng TikFinity (ws://localhost:21213/)**.
  - Quan sát đèn **TikTok LIVE**:
    - Khi nhận được dữ liệu phòng LIVE, đèn sẽ chuyển sang `ROOM ACTIVE`.
    - Nếu chưa có người chat, đèn báo `Standby (Chờ phiên LIVE)` hoặc `No Recent Events (Idle)`.

### Giai Đoạn D: Thử Nghiệm Tương Tác Thật
- [ ] **D1. Thử bình luận chọn đội:**
  - Dùng tài khoản người xem gõ vào livestream: `ĐỎ CỐ LÊN!`
  - Xác nhận trên Dashboard xuất hiện sự kiện: Người xem tham gia `RED LEGION`.
  - Xác nhận trên màn hình Game xuất hiện ticker chào mừng.
- [ ] **D2. Thử tặng 1 Hoa hồng (1 Rose):**
  - Người xem gửi $1$ Rose.
  - Xác nhận xuất hiện $2$ Chiến Binh Đỏ có gắn tên khán giả trên đầu.
  - Xác nhận âm thanh xuất quân vang lên.
- [ ] **D3. Thử tặng chuỗi quà (Streak):**
  - Người xem nhấn liên tục $5$ hoặc $10$ Hoa hồng.
  - Kiểm tra Dashboard: Hệ thống nhận đúng $delta$ qua từng nhịp, không bị nhân bản số lượng.
- [ ] **D4. Thử quà tặng Boss (Lion hoặc Fireworks):**
  - Người xem gửi quà Boss.
  - Cột năng lượng xuất hiện, còi trận vang lên, Đại Tướng Boss bước ra sân và thanh HP Boss xuất hiện trên đỉnh màn hình.
- [ ] **D5. Kiểm tra Trình Soi RAW Event:**
  - Mở bảng RAW Event Inspector trên Dashboard.
  - Xác nhận xem được nguyên văn JSON thật từ TikTok và TikFinity đã được che `userId` an toàn dạng `123****789`.

---

## 3. Nhật Ký Lỗi & Chẩn Đoán Khi Không Nhận Được Sự Kiện

| Tình Huống | Nguyên Nhân Thường Gặp | Hành Động Xử Lý |
| :--- | :--- | :--- |
| **Probe báo `Cổng 21213 đóng`** | Ứng dụng TikFinity chưa được mở hoặc Event API chưa bật | Mở app TikFinity $\rightarrow$ Settings $\rightarrow$ Bật Local WebSocket Server. |
| **TikFinity App báo `Connected` nhưng TikTok LIVE báo `Offline` hoặc `Standby`** | TikFinity chưa kết nối thành công với phòng phát sóng TikTok | Kiểm tra xem phiên LIVE TikTok đã bấm phát chưa; bấm nút **Connect** lại trong TikFinity. |
| **Gửi quà nhưng lính không xuất hiện** | 1. Người xem chưa bình luận chọn phe ĐỎ/XANH.<br>2. Số quân trên sân đã đạt mức tối đa 35 lính. | 1. Nhắc người xem bình luận `ĐỎ` hoặc `XANH`.<br>2. Nếu đạt giới hạn quân, lệnh đang được giữ an toàn trong hàng đợi (sẽ ra trận khi có lính tử trận). |
| **Dashboard báo `401 Unauthorized`** | Token bảo mật bị sai lệch khi tải lại | Làm mới lại trang `http://127.0.0.1:8088/admin` để nạp token phiên mới. |

---

## 4. Cam Kết Tiêu Chuẩn

Hệ thống cam kết:
1. **Không giả mạo sự kiện:** Không tự động tạo sự kiện ảo khi đang ở chế độ TikFinity.
2. **Không kết luận vội vã:** Khi phòng LIVE yên ắng không có chat, hệ thống hiển thị `No Recent Events (Idle)`, tuyệt đối không báo ngắt kết nối sai thực tế.
3. **Bảo mật tuyệt đối:** Khóa cổng cục bộ `127.0.0.1`, chống can thiệp từ website bên ngoài.
