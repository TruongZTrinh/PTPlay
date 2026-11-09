# PTPlay Platform 🎮

> **Scalable Multi-Game TikTok LIVE Gaming Platform** — Built for 20+ interactive live games.

---

## 🏛️ Platform Architecture

```text
PTPlay/
│
├── apps/
│   ├── admin/                    # PTPlay Enterprise Admin & Gift Control Center (Port 8080)
│   └── bridge/                   # Shared Authoritative LIVE Bridge (Port 8088 / TikFinity 21213)
│
├── packages/
│   ├── game-sdk/                 # Shared Game Client, TTS Engine & Text Sanitizer SDK
│   ├── gift-catalog/             # TikTok Gift Catalog (1,711 Global & 727 VN Gifts) + Mappings
│   ├── live-contracts/           # Normalized Event, Gift & Command Contracts
│   └── shared-config/            # Central Ports, Themes & Registry Types
│
├── games/
│   ├── mini-war-arena/           # Game 01: 2D Cartoon Auto-Battler (Port 5173)
│   ├── cat-cafe/                 # Game 02: Cozy Interactive Cat Pet Simulator (Port 5174)
│   ├── english-class-live/       # Game 03: Interactive Bilingual Live Classroom (Port 5175)
│   ├── quiz-show/                # Game 04: PTPlay Quiz Show Neon Gameshow (Port 5176)
│   └── duoi-hinh-bat-chu/        # Game 05: Vietnamese Rebus Word Puzzle (Port 5177)
│
├── config/
│   └── games.json                # Typed Central Game Registry
│
├── scripts/
│   ├── start-platform.mjs        # Master Platform Orchestrator
│   └── validate-games.mjs        # Game Registry Validator
│
├── RUN_PTPLAY_WINDOWS.bat        # 1-Click Master Launcher for Windows
└── package.json                  # NPM Workspaces Monorepo
```

---

## 🎮 Core Game Suite (5 Games)

| Game | Port | Thể Loại | Mô Tả & Tương Tác LIVE |
| :--- | :---: | :--- | :--- |
| **Mini War Arena** | `5173` | Auto-Battler Đỏ vs Xanh | Khán giả chat ĐỎ/XANH tham chiến, tặng quà triệu hồi Đại tướng Boss, hồi máu thành trì. |
| **Café Mòe LIVE** | `5174` | Cozy Pet Simulator (9:16) | Nuôi mèo tương tác: vuốt ve, cho ăn, tắm rửa, biểu cảm giận dỗi (angry), nhảy múa, zoomies, quà cá nướng, giỏ cá. |
| **English Class LIVE** | `5175` | Lớp Học Vui Song Ngữ | Lớp học tương tác 25 bàn học FIFO, 513 câu hỏi trắc nghiệm song ngữ, 8 chế độ chơi, avatar TikTok thật. |
| **PTPlay Quiz Show** | `5176` | Neon Trivia Gameshow (9:16) | Đấu trường đố vui 529 câu hỏi đa lĩnh vực, bảng vinh danh Top 3 khán giả, tính điểm tốc độ và chuỗi streak. |
| **Đuổi Hình Bắt Chữ** | `5177` | Rebus Puzzle Show (9:16) | Gameshow đoán chữ hình ảnh 666 câu đố thành ngữ & ghép từ thuần Việt, bảng vẽ easel trực quan, gợi ý thông minh. |

---

## 🎁 PTPlay Gift Control Center (Admin Port 8080)

Trung tâm điều hành và quản lý quà tặng chuyên nghiệp cho toàn bộ hệ sinh thái:
- **Catalog Quà TikTok**: Tra cứu nhanh 1.711 món quà toàn cầu và 727 món quà tại Việt Nam kèm giá Xu tham khảo và icon CDN an toàn.
- **Mappings Theo Game**: Cấu hình độc lập hành động cho từng game (triệu hồi lính, cá nướng, gợi ý đố vui), hệ số multiplier, cooldown, giới hạn và mẫu câu xướng tên TTS. Hỗ trợ Export / Import file JSON.
- **Thống Kê LIVE Real-Time**: Phân tách rạch ròi giữa quà thật nhận từ TikTok LIVE (`deltaCount`) và lượt thử nghiệm giả lập (`Mock Simulator`). Cảnh báo Unknown Gifts cần cấu hình.
- **Pipeline Event Monitor**: Giám sát luồng xử lý 6 bước thời gian thực và nhật ký Pipeline Trace.
- **Phòng Thí Nghiệm TTS**: Thử nghiệm và phát âm giọng đọc tiếng Việt đa năng (Google Tiếng Việt, Microsoft HoaiMy, NamMinh) tới từng game theo thời gian thực.

---

## 🚀 Quick Start

### 1. Master Launcher (Windows)
Chạy trực tiếp file batch tại thư mục gốc:
```cmd
RUN_PTPLAY_WINDOWS.bat
```
Chọn game muốn chạy [1-5] hoặc khởi động hạ tầng Bridge + Admin [6].

### 2. Dòng lệnh (NPM Workspaces)
```bash
# 1. Cài đặt toàn bộ dependencies (chỉ chạy lần đầu)
npm install

# 2. Kiểm tra Game Registry
npm run validate

# 3. Chạy toàn bộ 132 tests kiểm thử
npm test

# 4. Khởi động game tùy chọn
npm run start:miniwar    # Mini War Arena (5173)
npm run start:catcafe    # Café Mòe (5174)
npm run start:english    # English Class LIVE (5175)
npm run start:quiz       # PTPlay Quiz Show (5176)
npm run start:rebus      # Đuổi Hình Bắt Chữ (5177)
```

---

## 🔌 Default Ports

| Thành Phần | Cổng Port | Chức Năng |
| :--- | :---: | :--- |
| **LIVE Bridge** | `8088` | Nhận diện, chuẩn hóa streak, chống trùng và phân phối sự kiện |
| **Bridge Dashboard** | `8088/admin` | Streamer control room & diagnostic probe |
| **PTPlay Admin Center** | `8080` | Trung tâm quản trị, Gift Control Center, Quản lý quy trình & TTS Studio |
| **Mini War Arena** | `5173` | Game 1: Auto-battler Đỏ vs Xanh |
| **Café Mòe** | `5174` | Game 2: Cozy pet simulator dọc 9:16 |
| **English Class LIVE** | `5175` | Game 3: Lớp học tương tác song ngữ dọc 9:16 |
| **PTPlay Quiz Show** | `5176` | Game 4: Đấu trường đố vui neon dọc 9:16 |
| **Đuổi Hình Bắt Chữ** | `5177` | Game 5: Gameshow đoán chữ hình ảnh dọc 9:16 |
| **TikFinity Desktop** | `21213` | Cổng kết nối TikFinity Desktop chuẩn (tự động nhận diện) |

