# PTPlay — Mini War Arena V1.0 (Full Release) & PTPlay LIVE Bridge

**Game Tương Tác TikTok LIVE 2D Cartoon / Tỷ Lệ Dọc 9:16 / Phaser 3 + TypeScript + Node.js Bridge**

Mini War Arena V1.0 là tựa game chiến đấu tự động nhiều binh chủng giữa **Đội Đỏ (Red Legion)** và **Đội Xanh (Blue Guard)**, được thiết kế chuyên biệt cho luồng livestream tương tác trên TikTok LIVE kênh **PTPlay**.

- Màu sắc thương hiệu: **Electric Blue `#0066FF`**, **Golden Yellow `#FFD700`**, **Dark Navy `#08142D`**.
- Kiến trúc hệ sinh thái PTPlay: Hai tựa game độc lập (**Mini War Arena V1.0** và **Quán Mèo Moe V1.0**) dùng chung một **PTPlay LIVE Bridge**, có bộ chọn game đang phát sóng trực tiếp (Active Game Selector) bảo đảm không rò rỉ sự kiện giữa hai game.

---

## 1. Yêu Cầu Hệ Thống & Cài Đặt

### Cấu hình đề xuất
- **Hệ điều hành:** Windows 10 / 11 (64-bit).
- **Phần cứng:** Intel Core i5 / AMD Ryzen 5, GPU GTX 1660 Super hoặc tương đương (đạt chuẩn 60 FPS mượt mà).
- **Node.js:** Node.js LTS v20+ hoặc v22+ (<https://nodejs.org/>).
- **Trình duyệt:** Google Chrome hoặc Microsoft Edge mới nhất.
- **TikTok LIVE Studio** (nếu phát sóng từ PC) hoặc ứng dụng **TikFinity Desktop**.

---

## 2. Cách Khởi Chạy Nhanh Trên Windows

### Cách 1: Nhấp đúp chuột (Khuyến nghị cho Streamer)
1. Cài đặt **Node.js LTS** nếu máy tính chưa có.
2. Nhấp đúp vào tệp **`RUN_GAME_WINDOWS.bat`**.
3. File tự động cài đặt thư viện cho cả Game và LIVE Bridge nếu thiếu.
4. Trình duyệt tự động mở 2 tab:
   - **Màn hình Game Mini War Arena (9:16):** `http://localhost:5173`
   - **Bảng Điều Khiển Streamer (Dashboard):** `http://127.0.0.1:8088/admin`
5. Nhấn **BẮT ĐẦU TRẬN** hoặc phím **SPACE** để mở khóa âm thanh và bắt đầu trận đấu.

### Khởi chạy Quán Mèo Moe (Cat Café):
- Nhấp đúp vào tệp **`RUN_CAT_CAFE_WINDOWS.bat`** để mở game Quán Mèo Moe trên cổng 5174.

---

## 3. Kiến Trúc Dual-Game & Phân Tuyến Sự Kiện (Architecture Flow)

```
TikTok LIVE (Phát từ Điện Thoại hoặc TikTok LIVE Studio)
                     │
                     ▼
TikFinity Desktop App (ws://localhost:21213) hoặc Mock Provider
                     │
                     ▼
PTPlay LIVE Bridge (Node.js Service - Cổng 8088)
   │
   ├── Bộ Chọn Game Đang Nhận LIVE (Active Game Selector)
   │     ├── Khi chọn [Mini War Arena]: Chỉ gửi lệnh Mini War, cách ly hoàn toàn Quán Mèo.
   │     └── Khi chọn [Quán Mèo Moe]:   Chỉ gửi lệnh Quán Mèo, cách ly hoàn toàn Mini War.
   │
   ├── TeamManager (Nhận diện ĐỎ / XANH / CHIẾN / BOSS qua bình luận)
   ├── GiftStreakHandler (Chống đếm trùng streak, tính delta count)
   ├── GiftMapper (Ánh xạ quà tặng sang đơn vị lính & kỹ năng)
   └── EventQueue (Hàng đợi điều tiết nhịp độ, chính sách chống ngập lụt lệnh)
         │
         ├── ws://127.0.0.1:8088/game?app=mini-war  ──> Mini War Arena V1.0 (5173)
         └── ws://127.0.0.1:8088/game?app=cat-cafe  ──> Quán Mèo Moe V1.0 (5174)
```

---

## 4. Bốn Chiến Trường & Khí Quyển (Atmospheric Arenas)

Game hỗ trợ luân chuyển tự động qua từng vòng đấu hoặc đổi nhanh bằng phím **T**:

1. **Sân Thành Hoàng Gia (Castle Courtyard):** Tường thành đá cẩm thạch, cờ hiệu rực rỡ và bụi hạt lấp lánh hoàng kim.
2. **Rừng Phép Thuật (Enchanted Forest):** Lối mòn rêu xanh cổ xưa với tán cây ngàn năm và đom đóm thần bí.
3. **Hẻm Núi Pha Lê (Crystal Pass):** Vách núi đóng băng với tinh thể sapphire phát sáng và gió tuyết huyền ảo.
4. **Pháo Đài Nham Thạch (Ember Keep):** Vực sâu đá hắc diện, vết nứt nham thạch sôi sục và đốm than hồng bốc lên.

---

## 5. Binh Chủng & Kỹ Năng Đại Tướng Boss

| Binh chủng | Chỉ số | Hành vi & Kỹ năng | Hiệu ứng hình ảnh |
|---|---|---|---|
| **Chiến Binh (Warrior)** | HP: 125, ATK: 19, Giáp: 3 | Cận chiến dũng cảm, chém kiếm theo hình cánh cung | Vệt chém tia lửa, chân bước linh hoạt |
| **Cung Thủ (Archer)** | HP: 80, ATK: 23, Tầm xa: 220px | Đứng sau đội hình, kéo cung bắn tên đạn đạo | Mũi tên bay có góc quay vật lý, phát sáng khi trúng |
| **Hộ Vệ Giáp Thép (Tank)** | HP: 330, ATK: 15, Giáp: 7 | Khiên chắn khổng lồ, tự kích hoạt thế thủ khi dưới 75% máu | Giảm thêm 40% sát thương, hiện vòm năng lượng bảo hộ |
| **Pháp Sư (Mage)** | HP: 85, ATK: 34, Tầm xa: 190px | Vận chú niệm phép, cầu ma thuật nổ văng 48px diện rộng | Hoạt ảnh giơ quyền trượng, sóng năng lượng nổ lan |
| **Boss Đỏ: Infernal Warlord** | HP: 1250, ATK: 50, Giáp: 12 | Kỹ năng **Hỏa Diệm Trảm (Ground Slam)** có vòng báo trước 165px | Vòng cảnh báo đỏ, rung màn hình, để lại vết cháy xém |
| **Boss Xanh: Crystal Titan** | HP: 1250, ATK: 50, Giáp: 12 | Kỹ năng **Băng Tinh Kích (Crystal Shatter)** có vòng báo trước 165px | Vòng cảnh báo xanh, chấn động, bắn mảnh pha lê văng tung tóe |

---

## 6. Phím Tắt Bàn Phím Trong Game (Hotkeys)

| Phím | Tác vụ |
| :--- | :--- |
| **R** | Triệu hồi 2 Chiến Binh ĐỎ (Warrior) |
| **B** | Triệu hồi 2 Chiến Binh XANH (Warrior) |
| **A** | Triệu hồi 2 Cung Thủ ĐỎ (Archer) |
| **S** | Triệu hồi 2 Cung Thủ XANH (Archer) |
| **Z** | Triệu hồi ĐẠI TƯỚNG BOSS ĐỎ (Infernal Warlord) |
| **X** | Triệu hồi ĐẠI TƯỚNG BOSS XANH (Crystal Titan) |
| **T** | Đổi nhanh khí quyển chiến trường (Castle ➜ Forest ➜ Crystal ➜ Ember) |
| **Q** | Chuyển đổi mức hiệu ứng hình ảnh (High ➜ Low FX cho máy cấu hình yếu) |
| **P** hoặc **SPACE** | Tạm dừng / Tiếp tục trận đấu |
| **N** | Bắt đầu vòng đấu mới ngay lập tức |
| **M** | Bật / Tắt âm thanh game |

---

## 7. Tương Tác Khán Giả Miễn Phí & Quà Tặng (TikTok Interactivity)

### Tương tác miễn phí qua Bình luận (Chat)
- Gõ **`ĐỎ`**, **`DO`**, **`RED`**, hoặc biểu tượng **`🔴`**: Gia nhập Đội Đỏ.
- Gõ **`XANH`**, **`BLUE`**, hoặc biểu tượng **`🔵`**: Gia nhập Đội Xanh.
- Gõ **`CHIẾN`** hoặc **`CO LEN`**: Cổ vũ tinh thần, tăng tốc độ chạy và sát thương cho đội mình.
- Gõ **`BOSS`**: Tích nộ hiển thị thanh nộ triệu hồi Boss công khai.

### Tương tác qua Quà Tặng (Gifts - Cấu hình linh hoạt từ Dashboard)
- **1 Rose:** Triệu hồi 2 Chiến Binh (Warrior).
- **1 Heart:** Triệu hồi 2 Cung Thủ (Archer).
- **1 Fireworks:** Triệu hồi 1 Hộ Vệ Giáp Thép (Tank).
- **1 Lion / Dragon:** Triệu hồi Đại Tướng Boss giữa trận.
- **1 Medkit:** Hồi phục +200 HP cho thành trì đội nhà.

---

## 8. Lệnh Kiểm Thử & Đóng Gói (Testing & Build)

```bash
# Chạy toàn bộ 50 ca kiểm thử tự động (Mini War + Bridge + Cat Cafe)
npm test

# Kiểm tra riêng Mini War Arena
npm run test:miniwar

# Đóng gói sản phẩm thành file đơn duy nhất (Single-file dist/index.html)
npm run build

# Đóng gói cả Game và LIVE Bridge
npm run build:all
```
