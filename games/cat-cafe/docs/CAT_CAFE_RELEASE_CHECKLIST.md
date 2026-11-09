# CAFÉ MÒE (PTPlay Cat Café LIVE) V1.0 — Production Release Checklist (Section O)

**Dự án:** PTPlay Cat Café LIVE (Café Mòe)  
**Phiên bản:** V1.0 Production Release  
**Ngày đánh giá:** 2026-11-03  
**Kết luận tổng thể:** ĐẠT YÊU CẦU PHÁT HÀNH SẢN XUẤT (PRODUCTION READY)  

---

## 1. Bảng Tiêu Chí Nghiệm Thu Toàn Diện (Acceptance Checklist)

### Mục A: Mỹ Thuật & Không Gian Minh Hoạ (Visual Quality & Environments)
- [x] **A.1 Không sử dụng đồ hoạ thô sơ/tạm bợ:** Không dùng emoji, hình khối dẹt trơn, hay texture có sẵn của Mini War Arena làm mèo. Toàn bộ hình ảnh là vector nguyên bản vẽ tay bằng mã code.
- [x] **A.2 Ba không gian phòng cảnh hoàn chỉnh:**
  - [x] Main Café (Quán Chính): Sàn gỗ sọc, quầy bar pha chế, tủ bánh ngọt, khung cửa sổ nhìn ra công viên nắng ấm.
  - [x] Sunny Garden (Vườn Mèo): Thảm cỏ xanh mát, hàng rào gỗ, lối đi đá cuội, bồn tắm chim, bụi hoa dại rực rỡ, bướm bay dập dờn.
  - [x] Nap Loft (Gác Ngủ Lofi): Sàn gỗ mộc, dây đèn đom đóm fairy lights, cửa sổ trần ngắm sao đêm, kệ sách nhiều tầng, nệm êm lofi.
- [x] **A.3 Tám giống mèo minh hoạ đặc sắc:**
  - [x] 0: Ginger Tabby (Mướp cam béo tròn, mắt xanh ngọc)
  - [x] 1: Pure White Cloud (Bạch tuyết kiêu kỳ, mắt xanh da trời)
  - [x] 2: Smoky Slate Gray (Xám tro lạnh lùng, mắt hổ phách)
  - [x] 3: Tuxedo Gentleman (Tuxedo quý tộc, yếm trắng cổ áo)
  - [x] 4: Calico Lucky Charm (Tam thể may mắn ba màu)
  - [x] 5: Midnight Black (Mun đen huyền bí, mắt topaz vàng sáng)
  - [x] 6: Honey Cream (Vàng kem dịu dàng ngọt ngào)
  - [x] 7: Royal Siamese (Xiêm quý phái mặt bánh mì cháy)
- [x] **A.4 Hoạt hoạ đa tầng mượt mà:**
  - [x] Thân, đầu (mắt mở, mắt cười, mắt ngủ, mắt tròn xoe), tai, đuôi ngoe nguẩy nhịp nhàng độc lập.
  - [x] Hiệu ứng thở (idle breathing cycle), chớp mắt tự nhiên (blinking cycle).
- [x] **A.5 Ánh sáng khí quyển & Thời tiết:**
  - [x] 3 Khung giờ: Ban ngày (Day), Hoàng hôn ấm (Sunset), Đêm lofi (Night).
  - [x] 3 Kiểu thời tiết: Nắng ấm (Sunny), Mưa rơi chill (Rainy), Mát mẻ dịu êm (Cozy).

---

### Mục B: Trí Tuệ Nhân Tạo & Hành Vi Của Mèo (Cat AI & Behaviors)
- [x] **B.1 Máy trạng thái 11 hành vi (State Machine):**
  - [x] `idle`, `blink`, `walk`, `sit`, `sleep`, `stretch`, `groom`, `eat`, `play`, `react`, `call`, `social`.
- [x] **B.2 Sáu tính cách riêng biệt:**
  - [x] `sleepy`: Thích ngủ nướng, hồi năng lượng nhanh.
  - [x] `playful`: Hiếu động, vồ bóng len, leo cây cào móng.
  - [x] `foodie`: Thích ăn vặt, luôn quanh quẩn bát ăn.
  - [x] `curious`: Đi tuần tra, ngắm cảnh ngoài cửa sổ.
  - [x] `affectionate`: Quấn quýt, thích thả tim, kêu rừ rừ.
  - [x] `shy`: E thẹn, nấp góc êm, từ tốn làm quen.
- [x] **B.3 Tương tác xã hội tự nhiên (Cat-to-Cat Interaction):**
  - [x] Mèo tự động tiếp cận nhau khi ở gần, cụng đầu (head-butt nuzzle) và phát tiếng kêu chào nhau.
  - [x] Lực đẩy mềm (soft separation) giúp mèo không bị chồng chéo lên nhau khi di chuyển.
- [x] **B.4 Bong bóng thoại tiếng Việt:**
  - [x] Mèo hiển thị suy nghĩ bằng các câu thoại tiếng Việt dễ thương phù hợp với tính cách khi được gọi hoặc tương tác.

---

### Mục C: Hệ Thống Tiến Trình & Cá Nhân Hoá (Progression & Customization)
- [x] **C.1 Điểm Purr / Hòa Khí:** Tích luỹ điểm thông qua tương tác bình luận, cho ăn, chơi, ngủ, tặng quà và hoàn thành nhiệm vụ.
- [x] **C.2 Mười cấp độ Quán Mèo:** Mỗi cấp độ có mốc điểm rõ ràng, thông báo thăng cấp hoành tráng và phần thưởng mở khoá vật phẩm/phòng cảnh mới.
- [x] **C.3 Mười hai thử thách phiên live (Session Challenges):** Theo dõi tiến độ cho ăn, thả tim, chụp ảnh, dạo vườn, nhận mèo.
- [x] **C.4 Album Sưu Tập 8 Giống Mèo:** Tự động ghi nhận giống mèo mới ghé thăm quán và thưởng điểm Purr khám phá.
- [x] **C.5 Lưu trữ bền vững (Persistent Save):** Tự động lưu vào `localStorage`, hỗ trợ Xuất/Nhập dữ liệu JSON và Đặt lại an toàn.

---

### Mục D: Âm Thanh & Nhạc Nền Độc Quyền (Procedural Web Audio)
- [x] **D.1 Bộ tổng hợp nhạc Web Audio:** Không dùng file mp3 bản quyền, an toàn tuyệt đối với TikTok Content ID.
- [x] **D.2 Ba theme nhạc nền Lofi:** Nhạc ban ngày Rhodes Piano, Nhạc mưa rào với tiếng mưa pink noise, Nhạc đêm ru hộp nhạc.
- [x] **D.3 Hiệu ứng âm thanh chân thực:** Tiếng rừ rừ (Purr) dao động tần số thấp LFO, tiếng meo meo luyến láy, tiếng nhai cá, chuông cửa kính coong, tiếng màn trập chụp ảnh, tiếng kèn thăng cấp.
- [x] **D.4 Mở khóa âm thanh thân thiện trình duyệt:** Banner bấm 1-click trực quan giải quyết triệt để rào cản autoplay policy.

---

### Mục E: Tương Tác TikTok LIVE & Kết Nối Bridge
- [x] **E.1 Kết nối Bridge duy nhất:** Định tuyến qua `ws://127.0.0.1:8088/game?app=cat-cafe`, không can thiệp kết nối của Mini War Arena.
- [x] **E.2 Tám lệnh bình luận tiếng Việt hoàn chỉnh:**
  - [x] `MÈO`: Nhận mèo riêng (idempotent, 1 người xem = 1 mèo duy nhất).
  - [x] `ĂN`: Cho mèo ăn cá.
  - [x] `CHƠI`: Cho mèo chơi đồ chơi.
  - [x] `NGỦ`: Cho mèo đi ngủ cuộn tròn.
  - [x] `YÊU`: Thả tim yêu thương.
  - [x] `GỌI`: Gọi mèo ra chào khán giả.
  - [x] `CHỤP`: Chụp ảnh tạo dáng kèm flash màn hình.
  - [x] `VƯỜN`: Cho mèo ra vườn vui chơi.
- [x] **E.3 Tương thích biến thể:** Xử lý có dấu, không dấu, chữ hoa, chữ thường, từ ghép tiếng Việt và tiếng Anh phổ biến.
- [x] **E.4 Xử lý quà tặng (Gift Handling):** Thưởng hoa hồng Rose (bát cá nướng), Heart (mưa tim đỏ), Universe (đại tiệc toàn quán).
- [x] **E.5 An toàn & Chống gian lận:** Giới hạn tần suất 2000ms/người, chống XSS nickname, mask ID người dùng riêng tư, lọc trùng lặp sự kiện.

---

### Mục F: Công Cụ Streamer & Giao Diện Livestream
- [x] **F.1 Bảng điều khiển Streamer (`StreamerModal`):** Mở bằng nút bánh răng hoặc phím tắt `Tab`/`Esc`, gồm 4 tab điều khiển chi tiết.
- [x] **F.2 Vạch an toàn TikTok (Safe Zone Overlay):** Dễ dàng bật/tắt để căn chỉnh vùng comment và viền mép điện thoại.
- [x] **F.3 Thanh phím tắt nhanh 10 nút:** Giúp streamer tự tay test hoặc biểu diễn tính năng khi chưa có khán giả chat.
- [x] **F.4 Báo cáo trạng thái kết nối:** Huy hiệu trực quan `🟢 LIVE Online` hoặc `⚪ Standalone`.

---

### Mục G: Khởi Động & Tương Thích Windows PC
- [x] **G.1 File chạy 1-Click độc lập:** [`RUN_CAT_CAFE_WINDOWS.bat`](file:///C:/Workspace/PTPlay-Cat-Cafe/RUN_CAT_CAFE_WINDOWS.bat) tự động khởi chạy Bridge, Cat Café và mở trình duyệt.
- [x] **G.2 Bảo vệ tuyệt đối Mini War Arena:** Mini War Arena V0.2 build và test độc lập 100% thành công không bị ảnh hưởng.
- [x] **G.3 Bộ kiểm thử tự động toàn diện:** 33 bài kiểm thử (26 Cat Café + 7 Bridge) vượt qua 100%.

---

## 2. Xác Nhận Trạng Thái LIVE Thật (Real LIVE Status Confirmation)

- [x] **Local Game Operation:** **PASS (100%)**
- [x] **Mock Bridge Integration:** **PASS (100%)**
- [x] **Mini War Arena Regression Check:** **PASS (0 Regression)**
- [ ] **Real TikTok Broadcast Session:** **UNVERIFIED** (Chờ streamer phát sóng thực tế với tài khẩu TikTok và TikFinity).

