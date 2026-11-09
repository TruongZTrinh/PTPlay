# PTPlay Cat Café LIVE (Café Mòe) V1.0 — Event Contract Specification

**Tài liệu:** Đặc tả Giao thức Sự kiện & Kết nối WebSocket V1.0  
**Dịch vụ phát sóng:** PTPlay LIVE Bridge (Port 8088)  
**Game Client:** PTPlay Cat Café LIVE (Café Mòe - Port 5174)  
**Phiên bản:** V1.0 Production Release  
**Ngày cập nhật:** 2026-11-03  

---

## 1. Giao Thức Kết Nối WebSocket (WebSocket Handshake)

Cat Café kết nối với PTPlay LIVE Bridge thông qua giao thức WebSocket cục bộ:
```
ws://127.0.0.1:8088/game?app=cat-cafe
```

### 1.1 Xác thực Nguồn (Origin Verification)
- Bridge chỉ chấp nhận các kết nối xuất phát từ localhost (`http://127.0.0.1:*`, `http://localhost:*`).
- Mọi kết nối từ bên ngoài mạng LAN/WAN đều bị từ chối ngay tại tầng HTTP upgrade để đảm bảo an ninh tuyệt đối cho máy streamer.

### 1.2 Đăng ký Client (Client Registration)
Khi kết nối thành công, Server gửi phản hồi xác nhận:
```json
{
  "type": "connected",
  "message": "PTPlay Live Bridge connected",
  "app": "cat-cafe"
}
```
Client đồng thời gửi gói tin định danh khi vừa mở socket:
```json
{
  "type": "register",
  "app": "cat-cafe"
}
```

### 1.3 Nhịp tim & Báo cáo trạng thái (Heartbeat & Game State)
Mỗi 3 giây, Cat Café gửi trạng thái hoạt động về Bridge:
```json
{
  "type": "game_state",
  "app": "cat-cafe",
  "catCount": 6,
  "viewerCatCount": 3,
  "timestamp": 1730628000000
}
```

---

## 2. Đặc Tả Lệnh Tương Tác (Game Commands)

Server chuyển tiếp lệnh chuẩn hoá tới Cat Café dưới định dạng JSON:

```typescript
export interface CatCafeGameCommand {
  id: string;               // UUID duy nhất dùng để chống trùng lặp (deduplication)
  action:
    | 'cat_cafe.join'        // Nhận nuôi mèo
    | 'cat_cafe.feed'        // Cho mèo ăn bát cá
    | 'cat_cafe.play'        // Cho mèo chơi đùa bóng len / cây cào móng
    | 'cat_cafe.nap'         // Cho mèo đi ngủ cuộn tròn
    | 'cat_cafe.love'        // Thả tim cho mèo
    | 'cat_cafe.call'        // Gọi mèo chạy ra chào khán giả
    | 'cat_cafe.photo'       // Chụp ảnh tạo dáng chụp hình
    | 'cat_cafe.garden'      // Đưa mèo dạo chơi ngoài vườn
    | 'cat_cafe.gift_effect' // Hiệu ứng quà tặng (Rose, Heart, Universe)
    | 'cat_cafe.reset';      // Đặt lại toàn bộ quán mèo
  user?: {
    userId: string;          // ID người dùng TikTok (đã mask riêng tư: 123****789)
    uniqueId: string;        // TikTok @handle
    nickname: string;        // Tên hiển thị (đã lọc XSS, tối đa 16 ký tự)
  };
  metadata?: {
    originalComment?: string;
    giftName?: string;
    count?: number;
    diamondCount?: number;
  };
  timestamp: number;
}
```

---

## 3. Bảng Ánh Xạ 8 Lệnh Bình Luận Tiếng Việt (Comment Mapping)

Hệ thống xử lý linh hoạt: không phân biệt chữ hoa/thường, tự động loại bỏ dấu tiếng Việt, chấp nhận từ ghép hoặc biến thể viết tắt phổ biến:

| STT | Lệnh Bình Luận (Có dấu / Không dấu / Tiếng Anh) | Action phát sinh | Hành vi Game | Điểm Purr Thưởng |
|---|---|---|---|---|
| 1 | `MÈO`, `MEO`, `MEOW`, `CAT`, `XIN MÈO`, `NHẬN MÈO` | `cat_cafe.join` | Người xem nhận 1 chú mèo riêng với màu lông cố định theo ID người dùng. Chuông cửa reo kính coong. | +5 Purrs |
| 2 | `ĂN`, `AN`, `FEED`, `EAT`, `CHO ĂN` | `cat_cafe.feed` | Mèo chạy tới bát ăn cá, ăn nhai ngon lành và bắn vụn thức ăn + sao lấp lánh. | +5 Purrs |
| 3 | `CHƠI`, `CHOI`, `PLAY`, `CHƠI ĐÙA`, `NGHỊCH` | `cat_cafe.play` | Mèo chạy tới bóng len / cây cào móng hoặc vồ bướm hoa, nhảy tung tăng. | +5 Purrs |
| 4 | `NGỦ`, `NGU`, `SLEEP`, `NAP`, `ĐI NGỦ` | `cat_cafe.nap` | Mèo chạy về ổ đệm hoặc sofa nhung, cuộn tròn người ngủ phát bong bóng Zzz. | +5 Purrs |
| 5 | `YÊU`, `YEU`, `LOVE`, `TIM`, `THẢ TIM`, `THƯƠNG` | `cat_cafe.love` | Mèo nhảy xoay vòng, phát tiếng rừ rừ hạnh phúc, mưa tim hồng bắn xung quanh. | +5 Purrs |
| 6 | `GỌI`, `GOI`, `CALL`, `COME`, `LẠI ĐÂY`, `RA ĐÂY` | `cat_cafe.call` | Mèo chạy ra vị trí chủ trì phía trước sân khấu, ngước nhìn chào khán giả. | +5 Purrs |
| 7 | `CHỤP`, `CHUP`, `PHOTO`, `PIC`, `CHỤP ẢNH`, `POSE` | `cat_cafe.photo` | Đèn flash máy ảnh chớp sáng, âm thanh màn trập `tách!`, mèo tạo dáng chụp ảnh. | +5 Purrs |
| 8 | `VƯỜN`, `VUON`, `GARDEN`, `OUT`, `RA VƯỜN`, `LÊN GÁC` | `cat_cafe.garden` | Mèo chạy tung tăng ra thảm cỏ / hoa bướm vui đùa dưới nắng. | +5 Purrs |
| – | `RESET`, `LÀM LẠI` | `cat_cafe.reset` | Quản trị: Đặt lại toàn bộ mèo khán giả về 3 NPC mặc định. | 0 |

---

## 4. Ánh Xạ Quà Tặng (Gift Mapping)

| Tên Quà Tặng (Gift Name) | Giá Trị Ước Tính | Hiệu Ứng Game | Thưởng Tiến Trình |
|---|---|---|---|
| `Rose` (Hoa hồng) | 1 Xu / Kim Cương | Bát cá hồi nướng đặc biệt xuất hiện thơm nức, mèo chạy đến ăn no say. | +15 Purrs |
| `Heart` / `Heart Me` (Trái tim) | 5 Xu / Kim Cương | Cơn mưa tim đỏ thắm và pháo hoa rực rỡ rơi khắp không gian quán café. | +30 Purrs |
| Quà Đại Tiệc (`Universe`, `Lion`, `Dragon`...) | > 500 Xu | Toàn bộ các chú mèo nhảy múa, banner ruy băng chúc mừng đại tiệc toàn màn hình. | +200 Purrs |

---

## 5. Cơ Chế Chống Gian Lận, Spam & Bảo Vệ Riêng Tư

1. **Giới Hạn Tần Suất Theo Người Dùng (Per-User Rate Limiting):**
   - Mỗi người dùng TikTok chỉ được thực hiện thao tác tương tác tối đa 1 lần mỗi `2000ms`.
   - Các bình luận spam liên tục trong thời gian ngắn sẽ bị bỏ qua trong yên lặng, không làm chậm game.
2. **Khử Trùng Dữ Liệu & Chống XSS (Text Sanitizer):**
   - Mọi `nickname` đều được tước sạch các thẻ HTML `<script>`, `<img>`, các ký tự điều khiển nguy hiểm.
   - Chiều dài tên hiển thị bị giới hạn tối đa 16 ký tự hiển thị để đảm bảo tính mỹ quan trong bong bóng thoại.
3. **Mã Hoá Ẩn Danh User ID (Privacy Masking):**
   - ID người dùng thực tế không bao giờ hiển thị nguyên bản trên giao diện livestream, tự động chuyển dạng `123****789`.
4. **Chống Trùng Lặp Tin Nhắn (Event Deduplication):**
   - Cơ chế Sliding Window lưu trữ 500 ID sự kiện gần nhất nhằm ngăn ngừa TikFinity gửi lặp cùng 1 sự kiện khi mạng chập chờn.

---

## 6. API Điều Khiển Dành Cho Dashboard & Streamer (HTTP REST)

Tất cả các API POST yêu cầu kèm header `x-ptplay-token: <CONTROL_TOKEN>`:

| Phương Thức | Đường Dẫn | Tham Số Body | Mục Đích |
|---|---|---|---|
| `GET` | `/api/status` | – | Lấy thông tin kết nối, số client kết nối, log lỗi |
| `POST` | `/api/catcafe/mock/chat` | `{ nickname, comment }` | Giả lập bình luận khán giả (vd: `comment: "MÈO"`) |
| `POST` | `/api/catcafe/mock/gift` | `{ nickname, giftName, count }` | Giả lập quà tặng (vd: `giftName: "Rose", count: 1`) |
| `POST` | `/api/catcafe/command` | `{ action: "cat_cafe.reset" }` | Gửi lệnh quản trị trực tiếp tới Cat Café |
| `POST` | `/api/catcafe/room` | `{ roomId: "garden" }` | Chuyển phòng trực tiếp qua API |
