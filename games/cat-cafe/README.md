# CAFÉ MÒE (PTPlay Cat Café LIVE) V1.0 🐾

**Phiên bản:** V1.0 Production Release  
**Tên tiếng Việt:** Café Mòe  
**Nền tảng:** Windows PC (Trình duyệt web, tỷ lệ 9:16 dọc cho TikTok LIVE Studio / OBS Studio)  
**Công nghệ:** Phaser 3 + TypeScript Strict + Vite + Procedural Web Audio Synthesis  
**Tích hợp LIVE:** Kết nối trực tiếp qua **PTPlay LIVE Bridge** (Port 8088, query `?app=cat-cafe`)  

---

## 1. Giới Thiệu (Overview)

**CAFÉ MÒE — PTPlay Cat Café LIVE V1.0** là trò chơi tương tác 2D ấm cúng, thư giãn, chuẩn chất lượng phát hành sản xuất dành riêng cho khán giả yêu mèo trên TikTok LIVE:
- **Thư Giãn, Không Giao Tranh:** Trò chơi không có thắng thua hay áp lực thời gian. Khán giả tìm thấy sự bình yên khi ngắm nhìn những chú mèo dễ thương cử động mượt mà, lắng nghe nhạc Lofi êm dịu, cho mèo ăn cá, vỗ về ru ngủ, thả tim và dạo chơi trong vườn hoa.
- **Hoạt Động Tự Động Thông Minh (Autonomous AI):** Dù chưa có người xem nào tham gia, quán luôn rộn rã với **3 chú mèo NPC tự động** (`Mimi 🌸`, `Bánh Mì 🍞`, `Miu Miu 🐾`) có cá tính riêng, tự đi tìm thức ăn, vồ bướm, nằm ườn tắm nắng và giao lưu với nhau.
- **Tương Tác Khán Giả Trực Tiếp Thời Gian Thực:** Khán giả gõ bình luận tiếng Việt sẽ kích hoạt hành động tức thì của chú mèo mang tên mình trên livestream.
- **3 Không Gian Phòng Cảnh Minh Hoạ Độc Đáo:** Quán Chính (Main Café), Vườn Mèo (Sunny Garden), và Gác Ngủ Lofi (Nap Loft) với chu kỳ Ngày, Hoàng hôn, Đêm ấm và thời tiết Nắng, Mưa rào, Mát mẻ.

---

## 2. Bảng 8 Lệnh Bình Luận Tương Tác (TikTok Chat Commands)

Hệ thống nhận diện thông minh: không phân biệt hoa/thường, tự động loại bỏ dấu tiếng Việt, chấp nhận từ ghép và tiếng Anh:

| STT | Bình luận TikTok | Viết tắt / Tiếng Anh | Hành động trong Game | Điểm Purr Thưởng |
|---|---|---|---|---|
| 1 | `MÈO`, `mèo` | `MEO`, `MEOW`, `CAT`, `xin mèo` | **Nhận nuôi mèo riêng**: Chuông cửa reo kính coong, mèo xuất hiện mang tên người xem với màu lông cố định. | +5 Purrs |
| 2 | `ĂN`, `ăn` | `AN`, `FEED`, `EAT`, `cho ăn` | **Cho mèo ăn cá**: Mèo chạy tới bát thức ăn, thưởng thức ngon lành và bắn vụn thức ăn + sao vui vẻ. | +5 Purrs |
| 3 | `CHƠI`, `chơi` | `CHOI`, `PLAY`, `chơi đùa` | **Mèo đùa nghịch**: Chạy tới bóng len, cào móng hoặc vồ bướm, nhảy nhót tinh nghịch. | +5 Purrs |
| 4 | `NGỦ`, `ngủ` | `NGU`, `SLEEP`, `NAP`, `đi ngủ` | **Mèo cuộn tròn ngủ**: Chạy về ổ nệm êm ái, nhắm mắt ngủ say sưa và phát bong bóng Zzz. | +5 Purrs |
| 5 | `YÊU`, `yêu` | `YEU`, `LOVE`, `TIM`, `thả tim` | **Thả tim yêu thương**: Mèo nhảy xoay vòng, phát tiếng rừ rừ sung sướng, mưa tim hồng bắn xung quanh. | +5 Purrs |
| 6 | `GỌI`, `gọi` | `GOI`, `CALL`, `COME`, `lại đây` | **Gọi mèo ra chào**: Mèo chạy ra giữa sân khấu phía trước màn hình, ngước nhìn chào khán giả. | +5 Purrs |
| 7 | `CHỤP`, `chụp` | `CHUP`, `PHOTO`, `PIC`, `chụp ảnh` | **Chụp ảnh tạo dáng**: Đèn flash chớp sáng, âm thanh màn trập `tách!`, mèo tạo dáng chụp ảnh dễ thương. | +5 Purrs |
| 8 | `VƯỜN`, `vườn` | `VUON`, `GARDEN`, `OUT`, `ra vườn` | **Dạo chơi ngoài vườn**: Mèo chạy tung tăng ra thảm cỏ xanh, ngắm hoa dại và đuổi bướm dưới nắng. | +5 Purrs |

### Quà Tặng Đặc Biệt (TikTok Gifts):
- **🌹 Rose (Hoa Hồng - 1 Xu):** Thưởng bát cá hồi nướng đặc biệt vàng ươm, mèo chạy đến ăn no say.
- **❤️ Heart / Heart Me (Trái Tim - 5 Xu):** Cơn mưa tim đỏ thắm và pháo hoa rực rỡ rơi khắp không gian quán café.
- **🌌 Quà Lớn (Universe / Sư Tử):** Bật cờ chúc mừng đại tiệc, các chú mèo cùng nhảy múa hoan hỷ toàn màn hình!

---

## 3. Hệ Thống Tiến Trình & Cá Nhân Hoá (Progression System)

- **Điểm Purr / Hòa Khí:** Tích luỹ điểm thông qua tương tác bình luận, cho ăn, chơi, ngủ, tặng quà và hoàn thành nhiệm vụ.
- **10 Cấp Độ Quán Mèo:**
  - Cấp 1: Quán Mới Khai Trương (3 NPC khởi đầu).
  - Cấp 2: Góc Trà Sữa Thơm (Mở khoá Cốc Trà Sữa & Đèn Ngủ Gỗ Mèo).
  - Cấp 3: Khu Vườn Tràn Nắng (MỞ KHOÁ PHÒNG MỚI: Sunny Garden - Vườn Mèo).
  - Cấp 4: Cây Cào Móng Cao Cấp (Mở khoá Cây Cào Móng 3 Tầng Sisal).
  - Cấp 5: Gác Xép Ấm Áp (MỞ KHOÁ PHÒNG MỚI: Nap Loft - Gác Ngủ Lofi).
  - Cấp 6: Bát Ăn Pha Lê Vàng (Mở khoá Bát Ăn Cá Hồi Hoàng Gia).
  - Cấp 7: Tiệm Mèo Nổi Tiếng (Mở khoá Đèn Lồng Hoa Anh Đào & Thảm Ba Tư).
  - Cấp 8: Giường Nệm Hoàng Gia (Mở khoá Sofa Nệm Nhung Cho Mèo).
  - Cấp 9: Vườn Bướm Thần Tiên (Mở khoá Đài Phun Nước Bồ Câu & Bướm Vườn).
  - Cấp 10: Thiên Đường Café Mòe (Danh hiệu Đỉnh Cao & Vòng Nguyệt Quế Vàng).
- **12 Thử Thách Phiên Live:** Hoàn thành các mục tiêu như chào đón 5 khách, cho ăn 10 lần, thả tim 12 lần để nhận thưởng điểm Purr lớn.
- **Album 8 Giống Mèo:** Mèo Mướp Cam, Bạch Tuyết, Xám Tro, Tuxedo, Tam Thể, Mun Đen, Vàng Kem, Xiêm Quý Phái.

---

## 4. Bộ Tổng Hợp Âm Thanh Procedural Web Audio

- **100% Nguyên Bản & An Toàn Bản Quyền:** Không sử dụng file nhạc MP3 bản quyền, an toàn tuyệt đối với TikTok Content ID khi livestream.
- **3 Theme Nhạc Lofi Synth:** Ban ngày (Rhodes Piano), Mưa rơi chill (Pink Noise Rain), Đêm ấm (Music Box Lullaby).
- **Bộ Hiệu Ứng Âm Học:** Tiếng mèo kêu meo meo luyến láy, tiếng rừ rừ LFO 24Hz, tiếng nhai cá, chuông cửa, màn trập máy ảnh, kèn thăng cấp.
- **Mở Khóa Âm Thanh 1-Click:** Banner bấm trực quan ở đầu trang giải quyết rào cản autoplay policy của trình duyệt.

---

## 5. Công Cụ Hỗ Trợ Streamer

- **Bảng Điều Khiển Streamer Modal (`StreamerModal`):** Nhấn phím `Tab` / `Esc` hoặc bấm biểu tượng bánh răng `⚙️`:
  - Đổi phòng tức thì: Quán Chính, Vườn Mèo, Gác Ngủ.
  - Đổi thời tiết: Nắng ấm, Mưa rơi, Mát mẻ.
  - Đổi khung giờ: Ngày, Hoàng hôn, Đêm.
  - Chỉnh âm lượng Nhạc nền (BGM), Hiệu ứng (SFX), Môi trường (Ambience).
  - Bật/Tắt vạch an toàn TikTok Safe Zone.
  - Xuất / Nhập file sao lưu JSON và Đặt lại tiến trình.
- **Thanh Phím Nhanh 10 Nút:** Nằm dưới đáy màn hình (`+ MÈO`, `ĂN`, `CHƠI`, `NGỦ`, `YÊU`, `GỌI`, `CHỤP`, `VƯỜN`, `🌹`, `🔄`) hỗ trợ streamer test nhanh mọi tính năng mà không cần đợi khán giả chat.
- **Phím Tắt Bàn Phím:** `M` (nhận mèo), `F` (cho ăn), `P` (chơi đùa), `S` (ngủ), `L` (thả tim), `C` (gọi ra chào), `R` (thưởng hoa hồng Rose), `Tab`/`Esc` (bảng điều khiển).

---

## 6. Khởi Chạy Nhanh trên Windows (1-Click Start)

### Cách 1: Khởi chạy 1-Click bằng file Batch (Khuyến nghị cho Streamer)
Nhấp đúp chuột vào file:
```cmd
RUN_CAT_CAFE_WINDOWS.bat
```
Kịch bản tự động khởi động **PTPlay LIVE Bridge** (cổng 8088), **Cat Café LIVE** (cổng 5174), và mở sẵn màn hình game kèm trang quản trị.

---

## 7. Các Lệnh Build & Test

```powershell
# Chạy bộ 26 bài test tự động cho Quán Mèo:
npm test

# Chạy toàn bộ 33 bài test tự động (bao gồm Live Bridge):
npm --prefix .. test

# Build ứng dụng cho môi trường Production:
npm run build

# Xem trước bản build production:
npm run preview
```

---

## 8. Cấu Trúc Mã Nguồn

```text
C:\Workspace\PTPlay-Cat-Cafe/
├── index.html                     # Trang HTML chuẩn tỷ lệ 9:16 dọc (540x960)
├── package.json                   # Script dev, build, test độc lập
├── tsconfig.json                  # Cấu hình TypeScript Strict
├── vite.config.ts                 # Cấu hình Vite cổng 5174
├── RUN_CAT_CAFE_WINDOWS.bat       # Launcher 1-Click trên Windows
├── tests/
│   └── index.ts                   # 26 bài test tự động toàn diện
├── docs/
│   ├── CAT_CAFE_ARCHITECTURE.md   # Thiết kế kiến trúc tổng thể V1.0
│   ├── CAT_CAFE_EVENT_CONTRACT.md # Đặc tả giao thức WebSocket & 8 lệnh
│   ├── CAT_CAFE_LIVE_RUNBOOK.md   # Sổ tay vận hành streamer & kết nối TikFinity
│   ├── CAT_CAFE_ASSET_CREDITS.md  # Nguồn gốc tài nguyên vector & synth audio
│   ├── CAT_CAFE_RELEASE_CHECKLIST.md # Bảng nghiệm thu tiêu chí Mục O
│   └── CAT_CAFE_TEST_REPORT.md    # Báo cáo kết quả kiểm thử tự động
└── src/
    ├── main.ts                    # Điểm khởi động game Phaser
    └── game/
        ├── config.ts              # Phaser GameConfig (540x960, Fit, Center)
        ├── config/
        │   └── CafeConfig.ts      # 3 phòng, 8 giống mèo, 6 tính cách, 10 cấp độ
        ├── audio/
        │   └── CafeAudioEngine.ts # Bộ tổng hợp âm thanh Web Audio procedural
        ├── progression/
        │   └── ProgressionManager.ts # Singleton quản lý cấp độ, thử thách, lưu trữ
        ├── art/
        │   └── ProceduralTextures.ts # Vẽ vector 8 giống mèo & 3 phòng cảnh
        ├── entities/
        │   └── Cat.ts             # Entity Mèo: 11 hành vi, biểu cảm, kêu rừ rừ
        ├── systems/
        │   ├── CatManager.ts      # Quản lý 20 mèo, cự ly mềm, nuzzle chào nhau
        │   ├── CafeSimulation.ts  # Dựng 3 phòng cảnh, thời tiết, chiếu sáng
        │   ├── EffectManager.ts   # Hiệu ứng tim, sao, pháo hoa đại tiệc
        │   └── InteractionController.ts # Xử lý logic 8 lệnh tương tác & quà
        ├── events/
        │   ├── CafeEventClient.ts # Client WebSocket kết nối ws://localhost:8088/game
        │   ├── CafeCommandAdapter.ts # Chuẩn hoá 8 lệnh bình luận & quà tặng
        │   └── MockEventHarness.ts # Bộ giả lập sự kiện cục bộ
        ├── ui/
        │   ├── Hud.ts             # Header, Cấp độ, Purrs, Vạch an toàn TikTok
        │   ├── ChatPrompt.ts      # Hướng dẫn bình luận & thanh 10 nút demo
        │   └── StreamerModal.ts   # Hộp thoại điều khiển streamer 4 tab
        ├── utils/
        │   ├── TextSanitizer.ts   # Chống XSS, cắt tên 16 ký tự, che User ID
        │   └── Random.ts          # Tiện ích ngẫu nhiên an toàn
        └── scenes/
            ├── BootScene.ts       # Sinh texture đồ hoạ vector lúc khởi động
            ├── CafeScene.ts       # Màn hình chính điều phối quán mèo
            └── UIScene.ts         # Quản lý giao diện HUD và StreamerModal
```
