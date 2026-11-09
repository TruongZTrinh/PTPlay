export function getDashboardHtml(controlToken = ''): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PTPlay Admin Center — Quản Trị Hệ Sinh Thái Game LIVE</title>
  <style>
    :root {
      --bg-main: #060e1d;
      --bg-card: #0c1a32;
      --bg-card-hover: #102242;
      --bg-card-sub: #081326;
      --border-color: #1a335c;
      --border-focus: #285596;
      --primary-blue: #0066ff;
      --primary-blue-glow: rgba(0, 102, 255, 0.35);
      --primary-gold: #ffd700;
      --primary-gold-glow: rgba(255, 215, 0, 0.3);
      --red: #ff3355;
      --red-hover: #d92040;
      --blue: #288cff;
      --blue-hover: #1971d6;
      --green: #10b981;
      --green-hover: #0d9668;
      --orange: #f59e0b;
      --purple: #8b5cf6;
      --text-main: #f0f6fc;
      --text-muted: #8b9bb4;
      --text-dim: #5c6d86;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg-main); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; }

    /* HEADER */
    header.app-header {
      background: #08142b; border-bottom: 1px solid var(--border-color); padding: 12px 20px;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .brand-wrapper { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 36px; height: 36px; background: linear-gradient(135deg, #0066ff, #00d4ff);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-size: 20px; box-shadow: 0 0 12px var(--primary-blue-glow);
    }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #fff; display: flex; align-items: center; gap: 8px; }
    .brand-title span.highlight { color: var(--primary-gold); }
    .brand-badge { font-size: 11px; padding: 2px 7px; background: #17325b; color: #7eb3ff; border-radius: 4px; font-weight: 700; }

    .header-status-pills { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .status-pill {
      display: flex; align-items: center; gap: 7px; padding: 6px 12px; background: #0c1a32;
      border: 1px solid var(--border-color); border-radius: 20px; font-size: 12px; font-weight: 600;
      transition: 0.2s ease;
    }
    .status-pill.clickable { cursor: pointer; }
    .status-pill.clickable:hover { border-color: var(--primary-blue); background: #13274a; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
    .status-dot.online { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .status-dot.warn { background: var(--orange); box-shadow: 0 0 8px var(--orange); }
    .status-dot.offline { background: var(--red); box-shadow: 0 0 8px var(--red); }

    /* NAVIGATION TABS */
    nav.tab-nav { background: #09172e; border-bottom: 1px solid var(--border-color); padding: 0 20px; display: flex; gap: 4px; overflow-x: auto; }
    .tab-btn {
      background: transparent; border: none; border-bottom: 3px solid transparent; color: var(--text-muted);
      padding: 12px 18px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
      white-space: nowrap; transition: all 0.2s ease;
    }
    .tab-btn:hover { color: #ffffff; background: rgba(255,255,255,0.03); }
    .tab-btn.active { color: var(--primary-gold); border-bottom-color: var(--primary-gold); background: rgba(255,215,0,0.05); }

    /* CONTENT */
    main.tab-content { flex: 1; padding: 20px; max-width: 1400px; width: 100%; margin: 0 auto; }
    .tab-panel { display: none; animation: fadeIn 0.25s ease-out; }
    .tab-panel.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md);
      padding: 18px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
    .card-title { font-size: 15px; font-weight: 700; color: #dbeafe; display: flex; align-items: center; gap: 8px; }
    .card-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5; }

    /* GAME CARDS */
    .game-card { border: 2px solid var(--border-color); transition: all 0.2s ease; position: relative; overflow: hidden; }
    .game-card:hover { border-color: var(--border-focus); }
    .game-card.active-live { border-color: var(--primary-gold); box-shadow: 0 0 20px var(--primary-gold-glow); }
    .game-card .active-banner {
      display: none; position: absolute; top: 12px; right: -32px; background: var(--primary-gold);
      color: #060e1d; font-size: 10px; font-weight: 800; padding: 4px 36px; transform: rotate(45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .game-card.active-live .active-banner { display: block; }
    .game-hero { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .game-hero-icon {
      width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 28px; background: #11264c; border: 1px solid #1f4277;
    }
    .game-hero-info h3 { font-size: 17px; color: #ffffff; margin-bottom: 3px; }
    .game-hero-info p { font-size: 12px; color: var(--text-muted); }

    .stat-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .stat-item {
      flex: 1; min-width: 90px; background: var(--bg-card-sub); border: 1px solid var(--border-color);
      border-radius: var(--radius-sm); padding: 8px 10px; text-align: center;
    }
    .stat-item .stat-label { font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; }
    .stat-item .stat-val { font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 2px; }

    /* BUTTONS */
    .btn-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    button {
      background: #152b4d; color: #ffffff; border: 1px solid #23457a; border-radius: var(--radius-sm);
      padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex;
      align-items: center; gap: 6px; transition: all 0.15s ease; user-select: none;
    }
    button:hover { background: #1f3e70; border-color: #3b66aa; }
    button:active { transform: translateY(1px); }
    button.btn-primary { background: #0066ff; border-color: #3385ff; }
    button.btn-primary:hover { background: #1a75ff; }
    button.btn-gold { background: #8b6e12; border-color: #ffd700; color: #fff9db; }
    button.btn-gold:hover { background: #a38217; }
    button.btn-green { background: #0f6645; border-color: #10b981; }
    button.btn-green:hover { background: #137d55; }
    button.btn-red { background: #8a192f; border-color: #ff3355; }
    button.btn-red:hover { background: #ab203c; }
    button.btn-blue { background: #134e9e; border-color: #288cff; }
    button.btn-blue:hover { background: #1961c2; }
    button.btn-outline { background: transparent; border-color: var(--border-color); color: var(--text-muted); }
    button.btn-outline:hover { background: #102242; color: #ffffff; }

    /* INPUTS */
    input, select, textarea {
      background: #09152b; border: 1px solid var(--border-color); color: #ffffff; padding: 8px 12px;
      border-radius: var(--radius-sm); font-size: 13px; outline: none;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--primary-blue); box-shadow: 0 0 0 2px rgba(0,102,255,0.2); }
    label { display: block; font-size: 11px; font-weight: 700; color: #9cb3d3; margin-bottom: 5px; text-transform: uppercase; }
    .form-group { margin-bottom: 12px; }

    /* 9:16 PREVIEW & SAFE ZONE */
    .preview-container { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; padding: 10px 0; }
    .phone-mockup {
      width: 380px; height: 675px; background: #000; border: 4px solid #1c3256; border-radius: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7); position: relative; overflow: hidden; display: flex; flex-direction: column;
    }
    .phone-mockup iframe { width: 100%; height: 100%; border: none; background: #000; }
    .safe-zone-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; display: none; z-index: 50; }
    .safe-zone-overlay.active { display: block; }
    .sz-top-header { height: 80px; background: rgba(239,68,68,0.25); border-bottom: 2px dashed #ef4444; color: #ff8b8b; font-size: 10px; font-weight: bold; padding: 6px; display: flex; align-items: flex-end; }
    .sz-bottom-chat { position: absolute; bottom: 0; left: 0; right: 0; height: 200px; background: rgba(239,68,68,0.25); border-top: 2px dashed #ef4444; color: #ff8b8b; font-size: 10px; font-weight: bold; padding: 6px; }
    .sz-safe-area { position: absolute; top: 80px; bottom: 200px; left: 0; right: 0; border: 2px solid #10b981; background: rgba(16,185,129,0.05); display: flex; align-items: center; justify-content: center; color: #34d399; font-size: 12px; font-weight: 800; text-shadow: 0 2px 4px #000; }

    /* TABLES */
    .table-container { max-height: 320px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm); }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #09152b; padding: 9px 12px; text-align: left; color: #8da4c4; font-weight: 700; position: sticky; top: 0; z-index: 2; border-bottom: 1px solid var(--border-color); }
    td { padding: 8px 12px; border-bottom: 1px solid #112444; }
    tr:nth-child(even) { background: rgba(255,255,255,0.015); }
    tr:hover { background: rgba(40,140,255,0.06); }
    .badge { padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block; }
    .badge-red { background: rgba(255,51,85,0.15); color: #ff6b84; border: 1px solid #ff3355; }
    .badge-blue { background: rgba(40,140,255,0.15); color: #7cb8ff; border: 1px solid #288cff; }
    .badge-gold { background: rgba(255,215,0,0.15); color: #ffd700; border: 1px solid #ffd700; }

    #toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
    .toast { background: #0f2244; border: 1px solid #295392; color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
    footer.app-footer { background: #050b17; border-top: 1px solid var(--border-color); padding: 12px 20px; font-size: 11px; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header class="app-header">
    <div class="brand-wrapper">
      <div class="brand-icon">⚡</div>
      <div class="brand-title">
        PTPLAY <span class="highlight">ADMIN</span>
        <span class="brand-badge">BRIDGE V0.2</span>
      </div>
    </div>

    <!-- STATUS PILLS -->
    <div class="header-status-pills">
      <div class="status-pill clickable" onclick="switchTab('games')" title="Nhấp để xem danh sách Game">
        <div id="dot-active-game" class="status-dot online"></div>
        <span>Target: <strong id="val-active-game" style="color: var(--primary-gold);">Mini War Arena</strong></span>
      </div>

      <div class="status-pill clickable" onclick="toggleProvider()" title="Nhấp để chuyển đổi nguồn sự kiện (Mock, TikFinity, Synthetic Webhook)">
        <div id="dot-provider" class="status-dot warn"></div>
        <span>Nguồn: <strong id="val-provider">Mock Sim</strong></span>
        <span style="font-size: 10px; color: var(--primary-gold);">[Đổi ⇄]</span>
      </div>

      <div class="status-pill">
        <div id="dot-bridge" class="status-dot online"></div>
        <span>Bridge: <strong id="val-bridge">Online (8088)</strong></span>
      </div>

      <div class="status-pill">
        <div id="dot-port-5173" class="status-dot offline"></div>
        <span>Mini War (5173): <strong id="val-port-5173">Checking...</strong></span>
      </div>

      <div class="status-pill">
        <div id="dot-port-5174" class="status-dot offline"></div>
        <span>Café Mòe (5174): <strong id="val-port-5174">Checking...</strong></span>
      </div>

      <div class="status-pill">
        <div id="dot-tikfinity" class="status-dot offline"></div>
        <span>TikFinity: <strong id="val-tikfinity">Checking...</strong></span>
      </div>
    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <nav class="tab-nav">
    <button class="tab-btn active" data-tab="games"><span>🎮</span> Tổng Quan Games</button>
    <button class="tab-btn" data-tab="miniwar"><span>⚔️</span> Mini War Arena</button>
    <button class="tab-btn" data-tab="catcafe"><span>🐱</span> Café Mòe</button>
    <button class="tab-btn" data-tab="preview"><span>📺</span> Màn Hình Trực Tiếp (9:16)</button>
    <button class="tab-btn" data-tab="simulator"><span>🧪</span> TikTok LIVE Studio</button>
    <button class="tab-btn" data-tab="logs"><span>📜</span> Nhật Ký & RAW Inspector</button>
    <button class="tab-btn" data-tab="settings"><span>⚙️</span> Cấu Hình Hệ Thống</button>
  </nav>

  <!-- MAIN CONTENT -->
  <main class="tab-content">

    <!-- TAB 1: GAMES OVERVIEW -->
    <section id="panel-games" class="tab-panel active">
      <div class="card" style="border-left: 4px solid var(--primary-gold); background: #0b1a36;">
        <div class="card-header">
          <div class="card-title">🎯 Phân Tuyến Sự Kiện TikTok LIVE (Active Game Router)</div>
          <span style="font-size: 12px; color: var(--primary-gold); font-weight: bold;">CÁCH LY SỰ KIỆN CHỐNG RÒ RỈ</span>
        </div>
        <p class="card-desc">
          Chỉ tựa game được kích hoạt mới tiếp nhận bình luận và quà tặng từ TikTok LIVE. Game còn lại hoạt động độc lập ở chế độ demo ngoại tuyến.
        </p>
        <div class="btn-group">
          <button class="btn-blue" onclick="switchActiveGame('mini-war')" style="padding: 10px 18px;">
            ⚔️ Tiếp Nhận Luồng Cho: Mini War Arena (Cổng 5173)
          </button>
          <button class="btn-green" onclick="switchActiveGame('cat-cafe')" style="padding: 10px 18px;">
            🐱 Tiếp Nhận Luồng Cho: Café Mòe (Cổng 5174)
          </button>
        </div>
      </div>

      <div class="grid-2">
        <!-- GAME 1 -->
        <div id="game-card-miniwar" class="card game-card active-live">
          <div class="active-banner">ĐANG NHẬN LIVE</div>
          <div class="game-hero">
            <div class="game-hero-icon" style="color: #60a5fa;">⚔️</div>
            <div class="game-hero-info">
              <h3>Mini War Arena V1.0</h3>
              <p>Chiến đấu tự động Đỏ vs Xanh · Tỷ lệ 9:16 dọc</p>
            </div>
          </div>
          <p class="card-desc">
            <strong>Thư mục:</strong> <code>C:\\Workspace\\PTPlay-Mini-War-Arena</code><br>
            <strong>Cổng phát sóng:</strong> <code>http://localhost:5173</code>
          </p>
          <div class="stat-row">
            <div class="stat-item"><div class="stat-label">Lính ĐỎ</div><div id="stat-mw-red" class="stat-val" style="color:#ff6b84;">0</div></div>
            <div class="stat-item"><div class="stat-label">Lính XANH</div><div id="stat-mw-blue" class="stat-val" style="color:#7cb8ff;">0</div></div>
            <div class="stat-item"><div class="stat-label">CĐV ĐỎ</div><div id="stat-mw-supporters-red" class="stat-val" style="color:#ff6b84;">0</div></div>
            <div class="stat-item"><div class="stat-label">CĐV XANH</div><div id="stat-mw-supporters-blue" class="stat-val" style="color:#7cb8ff;">0</div></div>
          </div>
          <div class="btn-group">
            <button class="btn-outline" onclick="window.open('http://localhost:5173', '_blank')">🌐 Mở Tab 5173</button>
            <button class="btn-gold" onclick="switchTab('miniwar')">🎮 Bảng Điều Khiển</button>
            <button class="btn-outline" onclick="setPreviewMode('mini-war'); switchTab('preview');">📺 Xem 9:16</button>
          </div>
        </div>

        <!-- GAME 2 -->
        <div id="game-card-catcafe" class="card game-card">
          <div class="active-banner">ĐANG NHẬN LIVE</div>
          <div class="game-hero">
            <div class="game-hero-icon" style="color: #34d399;">🐱</div>
            <div class="game-hero-info">
              <h3>Café Mòe (Cat Café LIVE)</h3>
              <p>Nuôi mèo tương tác thư giãn · Lofi Audio Synthesis · Tỷ lệ 9:16 dọc</p>
            </div>
          </div>
          <p class="card-desc">
            <strong>Thư mục:</strong> <code>C:\\Workspace\\PTPlay-Cat-Cafe</code><br>
            <strong>Cổng phát sóng:</strong> <code>http://localhost:5174</code>
          </p>
          <div class="stat-row">
            <div class="stat-item"><div class="stat-label">Game Client</div><div id="val-cat-client" class="stat-val">Waiting</div></div>
            <div class="stat-item"><div class="stat-label">3 Phòng Cảnh</div><div class="stat-val" style="font-size:13px; color:#34d399;">Quán / Vườn / Gác</div></div>
            <div class="stat-item"><div class="stat-label">8 Giống Mèo</div><div class="stat-val" style="font-size:13px; color:#ffd700;">Cam / Tux / Mun...</div></div>
            <div class="stat-item"><div class="stat-label">Lệnh TikTok</div><div class="stat-val" style="font-size:13px; color:#60a5fa;">8 Lệnh Chuẩn</div></div>
          </div>
          <div class="btn-group">
            <button class="btn-outline" onclick="window.open('http://localhost:5174', '_blank')">🌐 Mở Tab 5174</button>
            <button class="btn-gold" onclick="switchTab('catcafe')">🐾 Bảng Điều Khiển</button>
            <button class="btn-outline" onclick="setPreviewMode('cat-cafe'); switchTab('preview');">📺 Xem 9:16</button>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 2: MINI WAR CONSOLE -->
    <section id="panel-miniwar" class="tab-panel">
      <div class="card">
        <div class="card-header">
          <div class="card-title">⚔️ Điều Khiển Trận Đấu & Vòng Đấu</div>
          <div class="btn-group">
            <button class="btn-green" onclick="sendMwCommand('start_round')">▶ Bắt Đầu Vòng Mới (Space)</button>
            <button class="btn-outline" onclick="sendMwCommand('pause_round')">⏸ Tạm Dừng</button>
            <button class="btn-outline" onclick="sendMwCommand('resume_round')">⏯ Tiếp Tục</button>
            <button class="btn-gold" onclick="sendMwCommand('reset_round')">↻ Đặt Lại Trận</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- RED -->
        <div class="card" style="border-top: 3px solid #ff3355;">
          <div class="card-header">
            <div class="card-title" style="color: #ff6b84;">🔴 ĐỘI ĐỎ (Red Legion)</div>
            <button class="btn-red" style="font-size: 11px; padding: 4px 8px;" onclick="sendMwCommand('boost_team', 'red')">⚡ Morale Boost</button>
          </div>
          <div class="btn-group" style="margin-bottom: 12px;">
            <button class="btn-red" onclick="sendMwCommand('spawn_unit', 'red', 'warrior', 2)">⚔️ +2 Warrior (R)</button>
            <button class="btn-red" onclick="sendMwCommand('spawn_unit', 'red', 'archer', 2)">🏹 +2 Archer (A)</button>
            <button class="btn-red" onclick="sendMwCommand('spawn_unit', 'red', 'tank', 1)">🛡️ +1 Tank</button>
            <button class="btn-red" onclick="sendMwCommand('spawn_unit', 'red', 'mage', 1)">🔮 +1 Mage</button>
          </div>
          <div class="btn-group">
            <button class="btn-gold" onclick="sendMwCommand('spawn_boss', 'red')">👑 TRIỆU HỒI BOSS ĐỎ (Z)</button>
            <button class="btn-green" onclick="sendMwCommand('heal_team', 'red', undefined, 1, { amount: 200 })">❤️ Hồi +200 HP Thành</button>
          </div>
        </div>

        <!-- BLUE -->
        <div class="card" style="border-top: 3px solid #288cff;">
          <div class="card-header">
            <div class="card-title" style="color: #7cb8ff;">🔵 ĐỘI XANH (Blue Guard)</div>
            <button class="btn-blue" style="font-size: 11px; padding: 4px 8px;" onclick="sendMwCommand('boost_team', 'blue')">⚡ Morale Boost</button>
          </div>
          <div class="btn-group" style="margin-bottom: 12px;">
            <button class="btn-blue" onclick="sendMwCommand('spawn_unit', 'blue', 'warrior', 2)">⚔️ +2 Warrior (B)</button>
            <button class="btn-blue" onclick="sendMwCommand('spawn_unit', 'blue', 'archer', 2)">🏹 +2 Archer (S)</button>
            <button class="btn-blue" onclick="sendMwCommand('spawn_unit', 'blue', 'tank', 1)">🛡️ +1 Tank</button>
            <button class="btn-blue" onclick="sendMwCommand('spawn_unit', 'blue', 'mage', 1)">🔮 +1 Mage</button>
          </div>
          <div class="btn-group">
            <button class="btn-gold" onclick="sendMwCommand('spawn_boss', 'blue')">👑 TRIỆU HỒI BOSS XANH (X)</button>
            <button class="btn-green" onclick="sendMwCommand('heal_team', 'blue', undefined, 1, { amount: 200 })">❤️ Hồi +200 HP Thành</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🌄 Đổi Khí Quyển 4 Chiến Trường & Hiệu Ứng</div>
          <button class="btn-outline" onclick="sendMwCommand('toggle_fx')">✨ Đổi High / Low FX (Q)</button>
        </div>
        <div class="btn-group">
          <button class="btn-outline" onclick="setMwTheme('castle')">🏰 Hoàng Gia (Castle)</button>
          <button class="btn-outline" onclick="setMwTheme('forest')">🌲 Rừng Phép Thuật (Forest)</button>
          <button class="btn-outline" onclick="setMwTheme('crystal')">💎 Hẻm Núi Pha Lê (Crystal)</button>
          <button class="btn-outline" onclick="setMwTheme('ember')">🌋 Pháo Đài Nham Thạch (Ember)</button>
        </div>
      </div>
    </section>

    <!-- TAB 3: CAT CAFE CONSOLE -->
    <section id="panel-catcafe" class="tab-panel">
      <div class="card" style="border-left: 4px solid #10b981;">
        <div class="card-header">
          <div class="card-title">🚪 Chuyển Phòng & Thời Tiết Quán Mèo</div>
          <div class="btn-group">
            <button class="btn-gold" onclick="sendCatCommand('cat_cafe.reset')">🔄 Đặt Lại Quán Mèo</button>
            <button class="btn-green" onclick="addPurrs(100)">✨ Thưởng +100 Purrs</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
          <div>
            <label>Không Gian (Phòng):</label>
            <div class="btn-group" style="margin-top: 4px;">
              <button class="btn-outline" onclick="switchCatRoom('main_cafe')">☕ Quán Chính</button>
              <button class="btn-outline" onclick="switchCatRoom('garden')">🌻 Vườn Nắng</button>
              <button class="btn-outline" onclick="switchCatRoom('loft')">🛋️ Gác Ngủ Lofi</button>
            </div>
          </div>
          <div>
            <label>Khung Giờ & Thời Tiết:</label>
            <div class="btn-group" style="margin-top: 4px;">
              <button class="btn-outline" onclick="switchCatAtmosphere('day', 'sunny')">☀️ Ngày Nắng</button>
              <button class="btn-outline" onclick="switchCatAtmosphere('sunset', 'rain')">🌧️ Hoàng Hôn Mưa</button>
              <button class="btn-outline" onclick="switchCatAtmosphere('night', 'cool')">🌙 Đêm Mát</button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><div class="card-title">🐾 Giả Lập 8 Lệnh Bình Luận Khán Giả</div></div>
          <div class="btn-group">
            <button class="btn-blue" onclick="sendMockChat('cat', undefined, 'MÈO')">🐾 1. 'MÈO' (Nhận mèo)</button>
            <button class="btn-gold" onclick="sendMockChat('cat', undefined, 'ĂN')">🍗 2. 'ĂN' (Cho ăn cá)</button>
            <button class="btn-green" onclick="sendMockChat('cat', undefined, 'CHƠI')">🧶 3. 'CHƠI' (Đùa nghịch)</button>
            <button class="btn-outline" onclick="sendMockChat('cat', undefined, 'NGỦ')">💤 4. 'NGỦ' (Đi ngủ)</button>
            <button class="btn-red" onclick="sendMockChat('cat', undefined, 'YÊU')">💖 5. 'YÊU' (Thả tim)</button>
            <button class="btn-primary" onclick="sendMockChat('cat', undefined, 'GỌI')">📣 6. 'GỌI' (Ra chào)</button>
            <button class="btn-outline" onclick="sendMockChat('cat', undefined, 'CHỤP')">📸 7. 'CHỤP' (Tạo dáng)</button>
            <button class="btn-green" onclick="sendMockChat('cat', undefined, 'VƯỜN')">🌿 8. 'VƯỜN' (Ra vườn)</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">🎁 Giả Lập Quà Tặng Mèo (TikTok Gifts)</div></div>
          <div class="btn-group">
            <button class="btn-red" onclick="sendMockGift('cat', 'Rose', 1)">🌹 Gửi 1 Rose (Thưởng Cá Nướng)</button>
            <button class="btn-red" onclick="sendMockGift('cat', 'Rose', 5)">🌹 Chuỗi 5 Roses</button>
            <button class="btn-gold" onclick="sendMockGift('cat', 'Heart', 1)">❤️ Gửi Heart (Mưa Tim)</button>
            <button class="btn-blue" onclick="sendMockGift('cat', 'Universe', 1)">🌌 Gửi Universe (Đại Tiệc Mèo)</button>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: PREVIEW -->
    <section id="panel-preview" class="tab-panel">
      <div class="card" style="margin-bottom: 14px;">
        <div class="card-header">
          <div class="card-title">📱 Màn Hình Xem Trước Chuẩn Tỷ Lệ Dọc 9:16</div>
          <div class="btn-group">
            <button class="btn-outline preview-mode-btn active" data-mode="mini-war" onclick="setPreviewMode('mini-war')">⚔️ Mini War (5173)</button>
            <button class="btn-outline preview-mode-btn" data-mode="cat-cafe" onclick="setPreviewMode('cat-cafe')">🐱 Café Mòe (5174)</button>
            <button class="btn-outline preview-mode-btn" data-mode="dual" onclick="setPreviewMode('dual')">👥 Xem Song Song (Dual)</button>
            <button id="btn-toggle-safe-zone" class="btn-outline" onclick="toggleSafeZoneOverlay()">🛡️ Vạch An Toàn TikTok</button>
            <button class="btn-outline" onclick="reloadPreviews()">🔄 Tải Lại Màn Hình</button>
          </div>
        </div>
      </div>

      <div class="preview-container">
        <div id="wrapper-preview-mw" class="phone-mockup">
          <iframe id="preview-frame-mw" src="http://localhost:5173" title="Mini War Arena"></iframe>
          <div class="safe-zone-overlay">
            <div class="sz-top-header">TIKTOK TOP HEADER & AVATAR (VÙNG NGUY HIỂM)</div>
            <div class="sz-safe-area">VÙNG HIỂN THỊ AN TOÀN (BATTLEFIELD CORE)</div>
            <div class="sz-bottom-chat">KHUNG CHAT & NÚT QUÀ TIKTOK LIVE (VÙNG BỊ CHE)</div>
          </div>
        </div>

        <div id="wrapper-preview-cat" class="phone-mockup" style="display: none;">
          <iframe id="preview-frame-cat" src="http://localhost:5174" title="Cat Café LIVE"></iframe>
          <div class="safe-zone-overlay">
            <div class="sz-top-header">TIKTOK TOP HEADER & AVATAR (VÙNG NGUY HIỂM)</div>
            <div class="sz-safe-area">VÙNG HIỂN THỊ AN TOÀN (CAFÉ STAGE)</div>
            <div class="sz-bottom-chat">KHUNG CHAT & NÚT QUÀ TIKTOK LIVE (VÙNG BỊ CHE)</div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 5: SIMULATOR -->
    <section id="panel-simulator" class="tab-panel">
      <div class="card" style="border-left: 4px solid var(--primary-gold);">
        <div class="card-header">
          <div class="card-title">🩺 Bảng Chẩn Đoán & Chuyển Đổi Provider Độc Lập</div>
          <div class="btn-group">
            <button class="btn-gold" onclick="runDiagnosticProbe()">🔍 Quét Cổng (Probe)</button>
            <button class="btn-green" onclick="toggleProvider('tikfinity')">⚡ TikFinity LIVE</button>
            <button class="btn-primary" onclick="toggleProvider('synthetic')">🌐 Synthetic Webhook</button>
            <button class="btn-gold" onclick="toggleProvider('mock')">🧪 Mock Sim</button>
          </div>
        </div>
        <pre id="probe-result-box" style="display:none; background: #040a16; border: 1px solid #1c3256; padding: 12px; border-radius: 6px; font-size: 12px; color: #ffd700; white-space: pre-wrap;"></pre>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚡ Trình Giả Lập Tự Động (Auto Traffic Simulator)</div>
            <button id="btn-toggle-auto" class="btn-green" onclick="toggleAutoSim()">▶ Bật Auto Sim</button>
          </div>
          <p class="card-desc">Tự động sinh tương tác ngẫu nhiên (chọn đội, bình luận, quà tặng) theo nhịp livestream.</p>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">💬 Gửi Bình Luận Tuỳ Chỉnh (Custom Chat)</div></div>
          <div class="form-group">
            <label>Tên Khán Giả:</label>
            <input type="text" id="input-custom-nick" value="Khán Giả VIP" style="width: 100%;">
          </div>
          <div class="form-group">
            <label>Nội Dung Bình Luận:</label>
            <input type="text" id="input-custom-comment" value="ĐỎ CỐ LÊN" style="width: 100%;">
          </div>
          <div class="btn-group">
            <button class="btn-primary" onclick="sendMockChat(currentActiveGame === 'mini-war' ? 'miniwar' : 'cat', document.getElementById('input-custom-nick').value, document.getElementById('input-custom-comment').value)">
              📤 Gửi Vào Game Đang Active
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 6: LOGS -->
    <section id="panel-logs" class="tab-panel">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📡 Nhật Ký Xử Lý Sự Kiện (Event Queue Logs)</div>
          <button class="btn-outline" onclick="clearLogs()">🧹 Xóa Nhật Ký</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Thời Gian</th><th>Khán Giả</th><th>Đội</th><th>Hành Động</th><th>Trạng Thái</th></tr>
            </thead>
            <tbody id="logs-tbody"><tr><td colspan="5" style="text-align:center; color:#64748b;">Đang tải nhật ký...</td></tr></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🔍 Soi RAW JSON TikFinity (Privacy Masked)</div>
          <div class="btn-group">
            <button class="btn-outline" onclick="fetchRawLogs()">Làm Mới</button>
            <button class="btn-outline" onclick="clearRawLogs()">Xóa RAW Logs</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 12px;">
          <div class="table-container" style="max-height: 220px;">
            <table>
              <thead><tr><th>Thời Gian</th><th>Event</th></tr></thead>
              <tbody id="raw-list-tbody"><tr><td colspan="2" style="text-align: center; color: #64748b;">Chưa có RAW event nào</td></tr></tbody>
            </table>
          </div>
          <div><pre id="raw-json-viewer" style="background:#040913; border:1px solid #1a3258; padding:12px; border-radius:6px; font-family:Consolas, monospace; font-size:11px; color:#93c5fd; max-height:220px; overflow:auto; white-space:pre-wrap;">// Chọn một sự kiện bên trái để xem JSON</pre></div>
        </div>
      </div>
    </section>

    <!-- TAB 7: SETTINGS -->
    <section id="panel-settings" class="tab-panel">
      <div class="card">
        <div class="card-header"><div class="card-title">⚙️ Cấu Hình Cổng & Hệ Sinh Thái PTPlay</div></div>
        <div class="stat-row">
          <div class="stat-item" style="text-align: left;"><div class="stat-label">Admin Web Hub</div><div class="stat-val" style="font-size: 13px; color: var(--primary-gold);">Port 8080 (http://localhost:8080)</div></div>
          <div class="stat-item" style="text-align: left;"><div class="stat-label">PTPlay Live Bridge</div><div class="stat-val" style="font-size: 13px; color: #60a5fa;">Port 8088 (http://localhost:8088/admin)</div></div>
          <div class="stat-item" style="text-align: left;"><div class="stat-label">Mini War Arena</div><div class="stat-val" style="font-size: 13px; color: #ff6b84;">Port 5173 (C:\\Workspace\\PTPlay-Mini-War-Arena)</div></div>
          <div class="stat-item" style="text-align: left;"><div class="stat-label">Café Mòe</div><div class="stat-val" style="font-size: 13px; color: #34d399;">Port 5174 (C:\\Workspace\\PTPlay-Cat-Cafe)</div></div>
        </div>
      </div>
    </section>

  </main>

  <div id="toast-container"></div>

  <footer class="app-footer">
    <div>PTPlay Live Interactive Ecosystem · Mini War Arena V1.0 & Quán Mèo Moe V1.0</div>
    <div id="val-queue-total">Hàng đợi: 0 lệnh</div>
  </footer>

  <script>
    const AUTH_TOKEN = '${controlToken}';
    let currentActiveGame = 'mini-war';
    let currentProvider = 'mock';
    let currentProviderId = 'mock';
    let availableProvidersList = ['mock', 'tikfinity', 'synthetic'];
    let isAutoSim = false;
    let currentPreviewMode = 'mini-war';
    let rawLogsCache = [];

    function authHeaders() {
      const h = { 'Content-Type': 'application/json' };
      if (AUTH_TOKEN) h['x-ptplay-token'] = AUTH_TOKEN;
      return h;
    }

    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast';
      if (type === 'success') toast.style.borderColor = '#10b981';
      if (type === 'error') toast.style.borderColor = '#ff3355';
      if (type === 'warn') toast.style.borderColor = '#ffd700';
      toast.innerText = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }

    function initTabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
      });
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tabId));
    }

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status', { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();

        if (data.activeGame) updateActiveGameUI(data.activeGame);
        if (data.availableProviders && Array.isArray(data.availableProviders)) {
          availableProvidersList = data.availableProviders;
        }
        if (data.activeProvider) {
          currentProvider = data.activeProvider.name;
          currentProviderId = data.activeProviderId || (currentProvider.includes('Mock') ? 'mock' : 'tikfinity');
          let label = data.activeProvider.name;
          if (currentProviderId === 'mock') label = 'Mock Sim';
          else if (currentProviderId === 'tikfinity') label = 'TikFinity LIVE';
          else if (currentProviderId === 'synthetic') label = 'Synthetic Webhook';
          document.getElementById('val-provider').innerText = label;
          document.getElementById('dot-provider').className = 'status-dot ' + (data.activeProvider.connected ? 'online' : 'warn');
        }

        const miniWarCount = data.gameClientsApps ? data.gameClientsApps.miniWar : 0;
        const catCafeCount = data.gameClientsApps ? data.gameClientsApps.catCafe : 0;

        const valCat = document.getElementById('val-cat-client');
        if (valCat) valCat.innerText = catCafeCount > 0 ? 'Connected (' + catCafeCount + ')' : 'Waiting';

        const redUnits = document.getElementById('stat-mw-red');
        const blueUnits = document.getElementById('stat-mw-blue');
        if (redUnits && data.teamUnits) redUnits.innerText = data.teamUnits.red || 0;
        if (blueUnits && data.teamUnits) blueUnits.innerText = data.teamUnits.blue || 0;

        const mwRedCount = document.getElementById('stat-mw-supporters-red');
        const mwBlueCount = document.getElementById('stat-mw-supporters-blue');
        if (mwRedCount && data.teamCounts) mwRedCount.innerText = data.teamCounts.red || 0;
        if (mwBlueCount && data.teamCounts) mwBlueCount.innerText = data.teamCounts.blue || 0;

        const qTotal = document.getElementById('val-queue-total');
        if (qTotal && data.queueStats) {
          qTotal.innerText = (data.queueStats.queueLength || 0) + ' lệnh (Đã xử lý: ' + (data.totalProcessedEvents || 0) + ')';
        }

        renderLogs(data.recentLogs || [], data.errorLogs || []);
      } catch (e) {}
    }

    async function fetchPorts() {
      try {
        const res = await fetch('/api/system/ports');
        if (!res.ok) return;
        const p = await res.json();

        const val5173 = document.getElementById('val-port-5173');
        const dot5173 = document.getElementById('dot-port-5173');
        if (val5173) val5173.innerText = p.miniWarPort.open ? 'Online (5173)' : 'Offline';
        if (dot5173) dot5173.className = 'status-dot ' + (p.miniWarPort.open ? 'online' : 'offline');

        const val5174 = document.getElementById('val-port-5174');
        const dot5174 = document.getElementById('dot-port-5174');
        if (val5174) val5174.innerText = p.catCafePort.open ? 'Online (5174)' : 'Offline';
        if (dot5174) dot5174.className = 'status-dot ' + (p.catCafePort.open ? 'online' : 'offline');

        const valTk = document.getElementById('val-tikfinity');
        const dotTk = document.getElementById('dot-tikfinity');
        if (valTk) valTk.innerText = p.tikfinityPort.open ? 'Online (21213)' : 'Disconnected';
        if (dotTk) dotTk.className = 'status-dot ' + (p.tikfinityPort.open ? 'online' : 'offline');
      } catch (e) {}
    }

    function updateActiveGameUI(game) {
      currentActiveGame = game;
      const isMini = game === 'mini-war';
      const cardMw = document.getElementById('game-card-miniwar');
      const cardCat = document.getElementById('game-card-catcafe');
      if (cardMw) cardMw.classList.toggle('active-live', isMini);
      if (cardCat) cardCat.classList.toggle('active-live', !isMini);
      const pillText = document.getElementById('val-active-game');
      if (pillText) pillText.innerText = isMini ? 'Mini War Arena' : 'Café Mòe';
    }

    async function switchActiveGame(target) {
      if (target === currentActiveGame) return;
      const targetName = target === 'mini-war' ? 'Mini War Arena' : 'Café Mòe';
      if (!confirm('Xác nhận đổi game tiếp nhận luồng sự kiện TikTok LIVE sang: ' + targetName + '?')) return;
      try {
        const res = await fetch('/api/active_game', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ activeGame: target })
        });
        const data = await res.json();
        if (data.success) {
          showToast('🎯 Đã chuyển sang nhận LIVE cho ' + targetName + '!', 'success');
          updateActiveGameUI(data.activeGame);
        }
      } catch (e) {
        showToast('Lỗi chuyển game: ' + e.message, 'error');
      }
    }

    async function toggleProvider(specificProvider) {
      let target = specificProvider;
      if (!target) {
        const curId = currentProviderId || 'mock';
        const idx = availableProvidersList.indexOf(curId);
        const nextIdx = idx >= 0 ? (idx + 1) % availableProvidersList.length : 0;
        target = availableProvidersList[nextIdx];
      }
      try {
        const res = await fetch('/api/provider/switch', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ provider: target })
        });
        const d = await res.json();
        if (d.success) {
          showToast('⚡ Đã chuyển Provider: ' + (d.active || target).toUpperCase(), 'success');
          fetchStatus();
        }
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    }

    async function sendMwCommand(action, team, unitType, count = 1, metadata = {}) {
      try {
        const res = await fetch('/api/game/command', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action, team, unitType, count, metadata })
        });
        const data = await res.json();
        if (data.success) {
          showToast('⚔️ [Mini War] Lệnh: ' + action, 'success');
          fetchStatus();
        }
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    }

    async function setMwTheme(themeId) {
      await sendMwCommand('switch_theme', undefined, undefined, 1, { themeId });
    }

    async function sendCatCommand(action, metadata = {}) {
      try {
        const res = await fetch('/api/catcafe/command', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ action, metadata })
        });
        const data = await res.json();
        if (data.success) {
          showToast('🐱 [Café Mòe] Lệnh: ' + action, 'success');
          fetchStatus();
        }
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'error');
      }
    }

    async function switchCatRoom(roomId) {
      await sendCatCommand('cat_cafe.switch_room', { roomId });
    }

    async function switchCatAtmosphere(time, weather) {
      await sendCatCommand('cat_cafe.switch_atmosphere', { time, weather });
    }

    async function addPurrs(amount) {
      await sendCatCommand('cat_cafe.add_purrs', { amount });
    }

    async function sendMockChat(gameType, customNick, customComment) {
      const nick = customNick || (gameType === 'cat' ? 'BéMèoXinh' : 'ChiếnBinhThầnTốc');
      const comment = customComment || (gameType === 'cat' ? 'MÈO' : 'ĐỎ CỐ LÊN');
      const endpoint = gameType === 'cat' ? '/api/catcafe/mock/chat' : '/api/mock/chat';
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ nickname: nick, comment })
        });
        showToast('💬 Giả lập chat [' + nick + ']: "' + comment + '"', 'info');
        fetchStatus();
        fetchRawLogs();
      } catch (e) {}
    }

    async function sendMockGift(gameType, giftName, count = 1) {
      const nick = gameType === 'cat' ? 'MèoMêĂn' : 'ĐạiGiaTikTok';
      const endpoint = gameType === 'cat' ? '/api/catcafe/mock/gift' : '/api/mock/gift';
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ nickname: nick, giftName, count })
        });
        showToast('🎁 Giả lập tặng quà [' + nick + ']: ' + count + 'x ' + giftName, 'success');
        fetchStatus();
        fetchRawLogs();
      } catch (e) {}
    }

    async function toggleAutoSim() {
      try {
        const res = await fetch('/api/mock/toggle_auto', { method: 'POST', headers: authHeaders() });
        const data = await res.json();
        isAutoSim = data.active;
        const btn = document.getElementById('btn-toggle-auto');
        if (btn) {
          btn.innerText = isAutoSim ? '⏹ Dừng Auto Sim' : '▶ Bật Auto Sim';
          btn.className = isAutoSim ? 'btn-red' : 'btn-green';
        }
        showToast(isAutoSim ? '▶ Đã bật Auto Simulator!' : '⏹ Đã dừng Auto Simulator.', isAutoSim ? 'success' : 'info');
        fetchStatus();
      } catch (e) {}
    }

    async function runDiagnosticProbe() {
      showToast('🔍 Đang kiểm tra cổng 21213 và Game...', 'info');
      const alertBox = document.getElementById('probe-result-box');
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.innerText = 'Đang quét kết nối TikFinity và Game...';
      }
      try {
        const res = await fetch('/api/diagnostic/probe', { method: 'POST', headers: authHeaders() });
        const probe = await res.json();
        let text = '🩺 Báo Cáo Chẩn Đoán:\\n';
        text += '• TikFinity (21213): ' + (probe.tikfinityPort.open ? '✅ ' + probe.tikfinityWs.message : '❌ ' + probe.tikfinityPort.message) + '\\n';
        text += '• Game Client: ' + (probe.gameClient.connected ? '✅ Đã kết nối (' + probe.gameClient.clientsCount + ')' : '⚠️ ' + probe.gameClient.message) + '\\n';
        if (probe.recommendations && probe.recommendations.length > 0) {
          text += '\\n💡 Khuyến nghị:\\n' + probe.recommendations.map(r => '  - ' + r).join('\\n');
        }
        if (alertBox) alertBox.innerText = text;
      } catch (e) {
        if (alertBox) alertBox.innerText = 'Lỗi probe: ' + e.message;
      }
    }

    function setPreviewMode(mode) {
      currentPreviewMode = mode;
      document.querySelectorAll('.preview-mode-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-mode') === mode));
      const mwWrapper = document.getElementById('wrapper-preview-mw');
      const catWrapper = document.getElementById('wrapper-preview-cat');
      if (mode === 'mini-war') {
        if (mwWrapper) mwWrapper.style.display = 'block';
        if (catWrapper) catWrapper.style.display = 'none';
      } else if (mode === 'cat-cafe') {
        if (mwWrapper) mwWrapper.style.display = 'none';
        if (catWrapper) catWrapper.style.display = 'block';
      } else if (mode === 'dual') {
        if (mwWrapper) mwWrapper.style.display = 'block';
        if (catWrapper) catWrapper.style.display = 'block';
      }
    }

    function toggleSafeZoneOverlay() {
      document.querySelectorAll('.safe-zone-overlay').forEach(o => o.classList.toggle('active'));
      const btn = document.getElementById('btn-toggle-safe-zone');
      if (btn) {
        const isActive = document.querySelector('.safe-zone-overlay')?.classList.contains('active');
        btn.classList.toggle('btn-gold', isActive);
        btn.classList.toggle('btn-outline', !isActive);
      }
    }

    function reloadPreviews() {
      const mwFrame = document.getElementById('preview-frame-mw');
      const catFrame = document.getElementById('preview-frame-cat');
      if (mwFrame) mwFrame.src = mwFrame.src;
      if (catFrame) catFrame.src = catFrame.src;
      showToast('🔄 Đã tải lại màn hình xem trước', 'info');
    }

    function renderLogs(logs, errorLogs) {
      const tbody = document.getElementById('logs-tbody');
      if (!tbody) return;
      const allRows = [];
      if (errorLogs && errorLogs.length > 0) {
        for (const err of errorLogs) {
          allRows.push({ timestamp: err.timestamp, userName: '[' + err.source + ' ERROR]', team: undefined, action: 'ERROR', details: err.message, status: 'dropped', isError: true });
        }
      }
      if (logs && logs.length > 0) {
        for (const l of logs) allRows.push(l);
      }
      if (allRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Chưa có sự kiện nào</td></tr>';
        return;
      }
      allRows.sort((a, b) => b.timestamp - a.timestamp);
      tbody.innerHTML = allRows.slice(0, 50).map(l => {
        const time = new Date(l.timestamp).toLocaleTimeString();
        const teamBadge = l.team ? '<span class="badge badge-' + l.team + '">' + l.team.toUpperCase() + '</span>' : '<span style="color:#64748b">–</span>';
        let stBadge = '<span style="color:#ffd700;">Hàng đợi</span>';
        if (l.status === 'dispatched') stBadge = '<span style="color:#10b981;font-weight:bold;">Đã thực thi</span>';
        else if (l.status === 'waiting') stBadge = '<span style="color:#f59e0b;font-weight:bold;">Chờ chỗ trống</span>';
        else if (l.status === 'dropped') stBadge = '<span style="color:#ff3355;">Lỗi / Bỏ qua</span>';
        const rowStyle = l.isError ? 'style="background:rgba(239,68,68,0.1);"' : '';
        return '<tr ' + rowStyle + '><td>' + time + '</td><td><strong>' + l.userName + '</strong></td><td>' + teamBadge + '</td><td><code>' + l.action + '</code></td><td>' + stBadge + '</td></tr>';
      }).join('');
    }

    async function fetchRawLogs() {
      try {
        const res = await fetch('/api/raw_logs', { headers: authHeaders() });
        if (!res.ok) return;
        rawLogsCache = await res.json();
        const tbody = document.getElementById('raw-list-tbody');
        if (!tbody) return;
        if (!rawLogsCache || rawLogsCache.length === 0) {
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#64748b;">Chưa có RAW event nào</td></tr>';
          return;
        }
        tbody.innerHTML = rawLogsCache.map((item, idx) => {
          const time = new Date(item.timestamp).toLocaleTimeString();
          return '<tr style="cursor:pointer;" onclick="selectRawLog(' + idx + ')"><td>' + time + '</td><td><strong>' + item.event + '</strong></td></tr>';
        }).join('');
      } catch (e) {}
    }

    function selectRawLog(idx) {
      const item = rawLogsCache[idx];
      if (!item) return;
      const viewer = document.getElementById('raw-json-viewer');
      if (viewer) viewer.innerText = item.sanitizedJson;
    }

    async function clearRawLogs() {
      await fetch('/api/raw_logs/clear', { method: 'POST', headers: authHeaders() });
      fetchRawLogs();
      const viewer = document.getElementById('raw-json-viewer');
      if (viewer) viewer.innerText = '// RAW logs đã được xóa sạch.';
      showToast('🧹 Đã xóa RAW logs', 'info');
    }

    async function clearLogs() {
      await fetch('/api/logs/clear', { method: 'POST', headers: authHeaders() });
      fetchStatus();
      showToast('🧹 Đã xóa nhật ký sự kiện', 'info');
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTabs();
      setInterval(() => {
        fetchStatus();
        fetchPorts();
        fetchRawLogs();
      }, 1200);
      fetchStatus();
      fetchPorts();
      fetchRawLogs();
    });
  </script>
</body>
</html>`;
}
