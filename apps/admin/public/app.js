// ==========================================================================
// PTPLAY ENTERPRISE ADMIN CENTER — ENGINE & INTERACTIVITY SCRIPT
// ==========================================================================

let authToken = 'ptplay_control_secret_2026';
let currentActiveGame = 'mini-war';
let currentProvider = 'mock';
let isAutoSim = false;
let currentPreviewMode = 'mini-war';
let rawLogsCache = [];
let audioCtx = null;
let isSoundEnabled = true;
const sessionStartTime = Date.now();

// --- 1. Sound Synthesizer for tactile feedback ---
function playSound(type = 'click') {
  if (!isSoundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'click') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'warn') {
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {}
}

function toggleSoundFx() {
  isSoundEnabled = !isSoundEnabled;
  const btn = document.getElementById('btn-toggle-sound');
  if (btn) {
    btn.innerText = isSoundEnabled ? '🔊 SFX' : '🔇 Mute';
    btn.style.color = isSoundEnabled ? '#38bdf8' : '#94a3b8';
  }
  showToast(isSoundEnabled ? '🔊 Đã bật âm thanh hiệu ứng' : '🔇 Đã tắt âm thanh', 'info');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'success') toast.style.borderColor = '#10b981';
  if (type === 'error') toast.style.borderColor = '#ef4444';
  if (type === 'warn') toast.style.borderColor = '#f59e0b';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) {
    h['x-ptplay-token'] = authToken;
  }
  return h;
}

// --- 2. Sidebar & Navigation Tabs ---
const TAB_BREADCRUMBS = {
  games: { cat: 'Core Game Suite', name: 'Tiến Trình & Cổng Mạng' },
  miniwar: { cat: 'Core Game Suite', name: 'Mini War Arena V1.0' },
  catcafe: { cat: 'Core Game Suite', name: 'Café Mòe LIVE V1.0' },
  englishclass: { cat: 'Core Game Suite', name: 'English Class LIVE V1.0' },
  quizshow: { cat: 'Core Game Suite', name: 'PTPlay Quiz Show (Đố Vui Có Thưởng)' },
  duoihinh: { cat: 'Core Game Suite', name: 'PTPlay Đuổi Hình Bắt Chữ' },
  preview: { cat: 'Core Game Suite', name: 'Multiview Dọc 9:16' },
  spectators: { cat: 'Audience & CRM', name: 'Khán Giả & Đội Ngũ' },
  economy: { cat: 'Audience & CRM', name: 'PTPlay Gift Control Center (Quà Tặng & Mappings)' },
  ttsstudio: { cat: 'Operations & Control', name: 'Phòng Thí Nghiệm TTS & Giọng Đọc Đa Năng' },
  musicmanager: { cat: 'Operations & Control', name: 'Thư Viện Nhạc Dùng Chung & BGM Mixer' },
  simulator: { cat: 'Operations & Control', name: 'TikTok LIVE Studio & Giả Lập' },
  logs: { cat: 'Operations & Control', name: 'Nhật Ký & Soi RAW JSON' },
  queue: { cat: 'Operations & Control', name: 'Hàng Đợi & Quá Tải' },
};

function normalizeTabId(tab) {
  if (!tab) return 'games';
  const clean = String(tab).replace(/^#/, '').toLowerCase();
  const validTabs = [
    'games', 'miniwar', 'catcafe', 'englishclass', 'quizshow',
    'duoihinh', 'preview', 'spectators', 'economy', 'ttsstudio',
    'musicmanager', 'simulator', 'logs', 'queue'
  ];
  return validTabs.includes(clean) ? clean : 'games';
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) switchTab(hash);
  });

  const savedTab = window.location.hash ? window.location.hash.slice(1) : localStorage.getItem('ptplay_admin_active_tab');
  if (savedTab) {
    switchTab(savedTab);
  }

  const savedSubtab = localStorage.getItem('ptplay_admin_gift_subtab');
  if (savedSubtab && typeof switchGiftSubtab === 'function') {
    switchGiftSubtab(savedSubtab);
  }
}

function switchTab(tabId) {
  const resolvedTab = normalizeTabId(tabId);
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === resolvedTab);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${resolvedTab}`);
  });

  // Save to localStorage & sync URL hash
  try {
    localStorage.setItem('ptplay_admin_active_tab', resolvedTab);
    history.replaceState(null, '', '#' + resolvedTab);
  } catch (e) {}

  // Update Breadcrumbs
  const crumbInfo = TAB_BREADCRUMBS[resolvedTab];
  if (crumbInfo) {
    const catEl = document.getElementById('crumb-category');
    const actEl = document.getElementById('crumb-active');
    if (catEl) catEl.innerText = crumbInfo.cat;
    if (actEl) actEl.innerText = crumbInfo.name;
  }

  // Automatically sync Live Target when switching to a game tab
  const gameTargetMap = {
    miniwar: 'mini-war',
    catcafe: 'cat-cafe',
    englishclass: 'english-class',
    quizshow: 'quiz-show',
    duoihinh: 'duoi-hinh-bat-chu',
  };
  const targetGame = gameTargetMap[resolvedTab];
  if (targetGame && targetGame !== currentActiveGame) {
    currentActiveGame = targetGame;
    updateActiveGameUI(targetGame);
    fetch('/api/active_game', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ activeGame: targetGame }),
    }).then(() => fetchStatus()).catch(() => {});
  }

  if (resolvedTab === 'economy') {
    fetchGiftControlData();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

// --- 3. Process Management API ---
async function fetchProcessStatus() {
  try {
    const res = await fetch('/api/process/status');
    if (!res.ok) return;
    const data = await res.json();
    const svcs = data.services;
    if (!svcs) return;

    updateServiceCard('mw', svcs['mini-war']);
    updateServiceCard('cat', svcs['cat-cafe']);
    updateServiceCard('ec', svcs['english-class']);
    updateServiceCard('qs', svcs['quiz-show']);
    updateServiceCard('dh', svcs['duoi-hinh-bat-chu']);
    updateServiceCard('bridge', svcs.bridge);
  } catch (e) {}
}

function updateServiceCard(prefix, svc) {
  if (!svc) return;
  const dot = document.getElementById(`dot-proc-${prefix}`);
  const statusLbl = document.getElementById(`val-proc-${prefix}`);
  const pidLbl = document.getElementById(`val-pid-${prefix}`);
  const term = document.getElementById(`term-${prefix}`);

  if (statusLbl) statusLbl.innerText = svc.running ? 'RUNNING' : 'STOPPED';
  if (statusLbl) statusLbl.style.color = svc.running ? 'var(--emerald)' : 'var(--rose)';
  if (dot) dot.className = `status-dot ${svc.running ? 'online' : 'offline'}`;
  if (pidLbl) pidLbl.innerText = svc.pid ? `PID: ${svc.pid}` : (svc.portOpen ? 'EXTERNAL PROCESS' : 'OFFLINE');

  if (term && svc.recentLogs) {
    const isAtBottom = term.scrollHeight - term.clientHeight <= term.scrollTop + 20;
    term.innerText = svc.recentLogs.length > 0 ? svc.recentLogs.join('\n') : '// Sẵn sàng nhận logs...';
    if (isAtBottom) {
      term.scrollTop = term.scrollHeight;
    }
  }
}

async function startService(key) {
  playSound('click');
  showToast(`🚀 Đang khởi động ${key}...`, 'info');
  try {
    const res = await fetch(`/api/process/start/${key}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      playSound('success');
      showToast(`✅ Đã bật ${key}!`, 'success');
      setTimeout(fetchProcessStatus, 1000);
    } else {
      showToast(`Lỗi: ${data.error}`, 'error');
    }
  } catch (e) {
    showToast(`Không thể bật ${key}: ${e.message}`, 'error');
  }
}

async function stopService(key) {
  playSound('warn');
  try {
    const res = await fetch(`/api/process/stop/${key}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`⏹ Đã dừng ${key}`, 'info');
      setTimeout(fetchProcessStatus, 800);
    }
  } catch (e) {
    showToast(`Lỗi dừng ${key}: ${e.message}`, 'error');
  }
}

async function restartService(key) {
  playSound('click');
  showToast(`🔄 Đang khởi động lại ${key}...`, 'info');
  await fetch(`/api/process/restart/${key}`, { method: 'POST' });
  setTimeout(fetchProcessStatus, 1500);
}

async function startAllServices() {
  playSound('click');
  showToast('⚡ Đang khởi động toàn bộ hệ thống PTPlay...', 'info');
  await fetch('/api/process/start_all', { method: 'POST' });
  setTimeout(() => {
    fetchProcessStatus();
    fetchPorts();
  }, 2000);
}

async function stopAllServices() {
  playSound('warn');
  showToast('⏹ Đang dừng toàn bộ dịch vụ...', 'warn');
  await fetch('/api/process/stop_all', { method: 'POST' });
  setTimeout(() => {
    fetchProcessStatus();
    fetchPorts();
  }, 1000);
}

// --- 4. Global Status, Ports & Telemetry ---
async function fetchStatus() {
  try {
    const res = await fetch('/api/status', { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();

    if (data.activeGame) updateActiveGameUI(data.activeGame);
    if (data.activeProvider) {
      currentProvider = data.activeProvider.name;
      const isMock = currentProvider.includes('Mock');
      const valProv = document.getElementById('val-provider');
      const dotProv = document.getElementById('dot-provider');
      if (valProv) valProv.innerText = isMock ? 'Mock Sim' : 'TikFinity LIVE';
      if (dotProv) dotProv.className = `status-dot ${data.activeProvider.connected ? 'online' : 'warn'}`;
    }

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
      qTotal.innerText = `${data.queueStats.queueLength || 0} lệnh (Đã xử lý: ${data.totalProcessedEvents || 0})`;
    }

    renderLogs(data.recentLogs || [], data.errorLogs || []);
  } catch (e) {}
}

let latestPorts = {
  8088: false,
  5173: false,
  5174: false,
  5175: false,
  5176: false,
  5177: false,
  21213: false,
};

function updatePillStatus(port, isOpen, serviceName) {
  const pill = document.getElementById(`pill-port-${port}`) || document.getElementById(`pill-${port === 8088 ? 'bridge' : (port === 21213 ? 'tikfinity' : '')}`);
  if (pill) {
    pill.classList.toggle('is-online', isOpen);
    pill.classList.toggle('is-offline', !isOpen);
    pill.title = isOpen
      ? `🟢 ${serviceName} đang chạy · Bấm để MỞ TAB (http://127.0.0.1:${port})`
      : `⚪ ${serviceName} đang tắt · Bấm 1-Click để BẬT & MỞ TAB (http://127.0.0.1:${port})`;
  }
  const qlStatus = document.getElementById(`ql-status-${port}`);
  if (qlStatus) {
    qlStatus.innerHTML = isOpen
      ? `<span style="color:#10b981; font-weight:700;">● Đang Chạy</span>`
      : `<span style="color:#64748b;">● Đang Tắt</span>`;
  }
  const qlBtn = document.getElementById(`ql-btn-${port}`);
  if (qlBtn) {
    qlBtn.innerText = isOpen ? '↗ Mở Tab' : '🚀 Bật & Mở';
    qlBtn.className = isOpen ? 'ql-btn-open' : 'ql-btn-start';
  }
}

async function quickLaunchOrOpen(serviceKey, port, serviceName) {
  playSound('click');
  const url = `http://127.0.0.1:${port}`;
  const isOpen = Boolean(latestPorts[port]);

  if (isOpen) {
    window.open(url, '_blank');
    showToast(`🚀 [${serviceName}] Đang mở tab ${url}`, 'success');
    return;
  }

  // If closed, open a transitional tab immediately to avoid browser popup blocker!
  const targetWindow = window.open('', '_blank');
  if (targetWindow) {
    targetWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <title>Đang khởi động ${serviceName}...</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      border-radius: 16px;
      padding: 36px 32px;
      text-align: center;
      max-width: 440px;
      width: 100%;
    }
    .spinner {
      width: 52px;
      height: 52px;
      margin: 0 auto 20px;
      border: 4px solid rgba(56, 189, 248, 0.15);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #fff; }
    p { margin: 0 0 18px; font-size: 13px; color: #94a3b8; line-height: 1.5; }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 999px;
      padding: 4px 14px;
      font-size: 12px;
      font-weight: 600;
      font-family: monospace;
    }
    .manual-btn {
      display: inline-block;
      margin-top: 20px;
      padding: 8px 18px;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .manual-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Đang khởi động ${serviceName}</h2>
    <p>Hệ thống đang nạp tài nguyên và mở cổng dev server...</p>
    <div class="badge">http://127.0.0.1:${port}</div>
    <br>
    <a class="manual-btn" href="${url}">Bấm vào đây nếu không tự chuyển</a>
  </div>
  <script>
    let attempts = 0;
    function checkServer() {
      fetch('${url}', { mode: 'no-cors' })
        .then(() => {
          location.replace('${url}');
        })
        .catch(() => {
          attempts++;
          if (attempts < 25) {
            setTimeout(checkServer, 500);
          } else {
            location.replace('${url}');
          }
        });
    }
    setTimeout(checkServer, 700);
  </script>
</body>
</html>`);
    targetWindow.document.close();
  }

  showToast(`⚡ Đang khởi động ${serviceName} (Cổng ${port})...`, 'info');
  try {
    const res = await fetch(`/api/process/start/${serviceKey}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`✅ Đã bật ${serviceName}! Đang tự động mở tab...`, 'success');
    }
    setTimeout(() => {
      fetchProcessStatus();
      fetchPorts();
    }, 1200);
  } catch (e) {
    showToast(`Lỗi bật ${serviceName}: ${e.message}`, 'error');
  }
}

function toggleQuickLaunchMenu(event) {
  if (event) event.stopPropagation();
  playSound('click');
  const menu = document.getElementById('quick-launch-menu');
  if (!menu) return;
  const isHidden = menu.style.display === 'none' || !menu.style.display;
  menu.style.display = isHidden ? 'flex' : 'none';
  if (isHidden) {
    fetchPorts();
  }
}

function closeQuickLaunchMenu() {
  const menu = document.getElementById('quick-launch-menu');
  if (menu) menu.style.display = 'none';
}

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('quick-launcher-wrap');
  if (wrap && !wrap.contains(e.target)) {
    closeQuickLaunchMenu();
  }
});

async function fetchPorts() {
  try {
    const res = await fetch('/api/ports');
    if (!res.ok) return;
    const p = await res.json();

    latestPorts = {
      8088: Boolean(p.bridgePort?.open),
      5173: Boolean(p.miniWarPort?.open),
      5174: Boolean(p.catCafePort?.open),
      5175: Boolean(p.englishClassPort?.open),
      5176: Boolean(p.quizShowPort?.open),
      5177: Boolean(p.duoiHinhPort?.open),
      21213: Boolean(p.tikfinityPort?.open),
    };

    updatePillStatus(8088, latestPorts[8088], 'Bridge');
    updatePillStatus(5173, latestPorts[5173], 'Mini War Arena');
    updatePillStatus(5174, latestPorts[5174], 'Café Mòe LIVE');
    updatePillStatus(5175, latestPorts[5175], 'Lớp Học Vui LIVE');
    updatePillStatus(5176, latestPorts[5176], 'Quiz Show');
    updatePillStatus(5177, latestPorts[5177], 'Đuổi Hình Bắt Chữ');
    updatePillStatus(21213, latestPorts[21213], 'TikFinity');

    const val5173 = document.getElementById('val-port-5173');
    const dot5173 = document.getElementById('dot-port-5173');
    if (val5173) val5173.innerText = p.miniWarPort.open ? '5173' : '5173';
    if (dot5173) dot5173.className = `tele-dot ${p.miniWarPort.open ? 'online' : 'offline'}`;

    const val5174 = document.getElementById('val-port-5174');
    const dot5174 = document.getElementById('dot-port-5174');
    if (val5174) val5174.innerText = p.catCafePort.open ? '5174' : '5174';
    if (dot5174) dot5174.className = `tele-dot ${p.catCafePort.open ? 'online' : 'offline'}`;

    const val5175 = document.getElementById('val-port-5175');
    const dot5175 = document.getElementById('dot-port-5175');
    if (val5175) val5175.innerText = p.englishClassPort?.open ? '5175' : '5175';
    if (dot5175) dot5175.className = `tele-dot ${p.englishClassPort?.open ? 'online' : 'offline'}`;

    const val5176 = document.getElementById('val-port-5176');
    const dot5176 = document.getElementById('dot-port-5176');
    if (val5176) val5176.innerText = p.quizShowPort?.open ? '5176' : '5176';
    if (dot5176) dot5176.className = `tele-dot ${p.quizShowPort?.open ? 'online' : 'offline'}`;

    const val5177 = document.getElementById('val-port-5177');
    const dot5177 = document.getElementById('dot-port-5177');
    if (val5177) val5177.innerText = p.duoiHinhPort?.open ? '5177' : '5177';
    if (dot5177) dot5177.className = `tele-dot ${p.duoiHinhPort?.open ? 'online' : 'offline'}`;

    const valBridge = document.getElementById('val-bridge');
    const dotBridge = document.getElementById('dot-bridge');
    if (valBridge) valBridge.innerText = p.bridgePort.open ? '8088' : '8088';
    if (dotBridge) dotBridge.className = `tele-dot ${p.bridgePort.open ? 'online' : 'offline'}`;

    const valTk = document.getElementById('val-tikfinity');
    const dotTk = document.getElementById('dot-tikfinity');
    if (valTk) valTk.innerText = p.tikfinityPort.open ? '21213' : '21213';
    if (dotTk) dotTk.className = `tele-dot ${p.tikfinityPort.open ? 'online' : 'offline'}`;

    // Update top server status badges in Mini War, Cat Cafe, and English Class tabs
    const badgeTopMw = document.getElementById('badge-top-mw');
    if (badgeTopMw) {
      badgeTopMw.innerText = p.miniWarPort.open ? 'ONLINE (Cổng 5173)' : 'OFFLINE (Chưa bật)';
      badgeTopMw.className = `badge ${p.miniWarPort.open ? 'badge-green' : 'badge-red'}`;
    }
    const badgeTopCat = document.getElementById('badge-top-cat');
    if (badgeTopCat) {
      badgeTopCat.innerText = p.catCafePort.open ? 'ONLINE (Cổng 5174)' : 'OFFLINE (Chưa bật)';
      badgeTopCat.className = `badge ${p.catCafePort.open ? 'badge-green' : 'badge-red'}`;
    }
    const badgeTopEc = document.getElementById('badge-top-ec');
    if (badgeTopEc) {
      badgeTopEc.innerText = p.englishClassPort?.open ? 'ONLINE (Cổng 5175)' : 'OFFLINE (Chưa bật)';
      badgeTopEc.className = `badge ${p.englishClassPort?.open ? 'badge-green' : 'badge-red'}`;
    }
    const badgeTopQs = document.getElementById('badge-top-qs');
    if (badgeTopQs) {
      badgeTopQs.innerText = p.quizShowPort?.open ? 'ONLINE (Cổng 5176)' : 'OFFLINE (Chưa bật)';
      badgeTopQs.className = `badge ${p.quizShowPort?.open ? 'badge-green' : 'badge-red'}`;
    }
    const badgeTopDh = document.getElementById('badge-top-dh');
    if (badgeTopDh) {
      badgeTopDh.innerText = p.duoiHinhPort?.open ? 'ONLINE (Cổng 5177)' : 'OFFLINE (Chưa bật)';
      badgeTopDh.className = `badge ${p.duoiHinhPort?.open ? 'badge-green' : 'badge-red'}`;
    }
  } catch (e) {}
}

function updateActiveGameUI(game) {
  currentActiveGame = game;
  const isMini = game === 'mini-war';
  const isCat = game === 'cat-cafe';
  const isEnglish = game === 'english-class' || game === 'english-class-live';
  const isQuiz = game === 'quiz-show' || game === 'ptplay-quiz-show';
  const isDuoiHinh = game === 'duoi-hinh-bat-chu' || game === 'ptplay-duoi-hinh-bat-chu';
  
  const cardMw = document.getElementById('game-card-miniwar');
  const cardCat = document.getElementById('game-card-catcafe');
  const cardEc = document.getElementById('game-card-englishclass');
  const cardQs = document.getElementById('game-card-quizshow');
  const cardDh = document.getElementById('game-card-duoihinh');
  if (cardMw) cardMw.classList.toggle('active-live', isMini);
  if (cardCat) cardCat.classList.toggle('active-live', isCat);
  if (cardEc) cardEc.classList.toggle('active-live', isEnglish);
  if (cardQs) cardQs.classList.toggle('active-live', isQuiz);
  if (cardDh) cardDh.classList.toggle('active-live', isDuoiHinh);

  // Sidebar route switcher buttons
  const btnRouteMw = document.getElementById('btn-route-mw');
  const btnRouteCat = document.getElementById('btn-route-cat');
  const btnRouteEc = document.getElementById('btn-route-ec');
  const btnRouteQs = document.getElementById('btn-route-qs');
  const btnRouteDh = document.getElementById('btn-route-dh');
  if (btnRouteMw) btnRouteMw.classList.toggle('active', isMini);
  if (btnRouteCat) {
    btnRouteCat.classList.toggle('active', isCat);
    btnRouteCat.classList.toggle('cat', isCat);
  }
  if (btnRouteEc) {
    btnRouteEc.classList.toggle('active', isEnglish);
    btnRouteEc.classList.toggle('ec', isEnglish);
  }
  if (btnRouteQs) {
    btnRouteQs.classList.toggle('active', isQuiz);
    btnRouteQs.classList.toggle('qs', isQuiz);
  }
  if (btnRouteDh) {
    btnRouteDh.classList.toggle('active', isDuoiHinh);
    btnRouteDh.classList.toggle('dh', isDuoiHinh);
  }

  // Sidebar LIVE badges
  const badgeMw = document.getElementById('badge-mw-live');
  const badgeCat = document.getElementById('badge-cat-live');
  const badgeEc = document.getElementById('badge-ec-live');
  const badgeQs = document.getElementById('badge-qs-live');
  const badgeDh = document.getElementById('badge-dh-live');
  if (badgeMw) badgeMw.style.display = isMini ? 'inline-block' : 'none';
  if (badgeCat) badgeCat.style.display = isCat ? 'inline-block' : 'none';
  if (badgeEc) badgeEc.style.display = isEnglish ? 'inline-block' : 'none';
  if (badgeQs) badgeQs.style.display = isQuiz ? 'inline-block' : 'none';
  if (badgeDh) badgeDh.style.display = isDuoiHinh ? 'inline-block' : 'none';

  // Synchronize TTS Studio Active Target Label
  const optActive = document.querySelector('#select-tts-target-game option[value="active"]');
  if (optActive) {
    const gameName = isMini ? 'Mini War Arena' : (isCat ? 'Café Mòe' : (isEnglish ? 'Lớp Học Vui' : (isQuiz ? 'Quiz Show' : 'Đuổi Hình Bắt Chữ')));
    optActive.textContent = `🎯 Game Đang Active Ở Header (${gameName})`;
  }
}

// --- Interactive Custom Confirm Modal (Enter to OK, Esc to Close) ---
let confirmModalResolver = null;
let lastActiveElementBeforeModal = null;

function showConfirmModal(options) {
  return new Promise((resolve) => {
    if (confirmModalResolver) {
      try { confirmModalResolver(false); } catch (e) {}
    }
    confirmModalResolver = resolve;
    lastActiveElementBeforeModal = document.activeElement;

    const opts = typeof options === 'string' ? { message: options } : (options || {});
    const title = opts.title || 'Xác nhận';
    const subtitle = opts.subtitle || 'Vui lòng kiểm tra kỹ trước khi thực hiện';
    const message = opts.message || 'Bạn có chắc chắn muốn thực hiện hành động này?';
    const confirmText = opts.confirmText || 'Xác nhận';
    const cancelText = opts.cancelText || 'Hủy';
    const icon = opts.icon || '🎯';
    const variant = opts.variant || 'primary';

    const backdrop = document.getElementById('confirm-modal-backdrop');
    const titleEl = document.getElementById('confirm-modal-title');
    const subtitleEl = document.getElementById('confirm-modal-subtitle');
    const messageEl = document.getElementById('confirm-modal-message');
    const iconEl = document.getElementById('confirm-modal-icon-badge');
    const btnOk = document.getElementById('confirm-modal-btn-ok');
    const textOk = document.getElementById('confirm-modal-text-ok');
    const textCancel = document.getElementById('confirm-modal-text-cancel');

    if (!backdrop) {
      resolve(confirm(message.replace(/<[^>]*>?/gm, '')));
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (messageEl) messageEl.innerHTML = message;
    if (textOk) textOk.textContent = confirmText;
    if (textCancel) textCancel.textContent = cancelText;

    if (iconEl) {
      iconEl.textContent = icon;
      iconEl.className = 'confirm-dialog-icon' + (variant !== 'primary' ? ' ' + variant : '');
    }

    if (btnOk) {
      btnOk.className = 'confirm-btn-ok' + (variant !== 'primary' ? ' ' + variant : '');
    }

    backdrop.classList.add('active');

    // Auto-focus OK button immediately so pressing Enter will confirm
    requestAnimationFrame(() => {
      btnOk?.focus();
    });
  });
}

function handleConfirmDialogAction(isConfirmed) {
  const backdrop = document.getElementById('confirm-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
  }

  const resolver = confirmModalResolver;
  confirmModalResolver = null;

  if (lastActiveElementBeforeModal && typeof lastActiveElementBeforeModal.focus === 'function') {
    try { lastActiveElementBeforeModal.focus(); } catch (e) {}
    lastActiveElementBeforeModal = null;
  }

  if (resolver) {
    resolver(Boolean(isConfirmed));
  }
}

window.showConfirmModal = showConfirmModal;
window.handleConfirmDialogAction = handleConfirmDialogAction;

async function switchActiveGame(target) {
  if (target === currentActiveGame) return;
  playSound('click');
  const targetName = target === 'mini-war' 
    ? 'Mini War Arena' 
    : (target === 'cat-cafe' 
      ? 'Café Mòe' 
      : (target === 'english-class' 
        ? 'Lớp Học Vui LIVE' 
        : (target === 'quiz-show' 
          ? 'Đố Vui Có Thưởng' 
          : 'Đuổi Hình Bắt Chữ')));
  try {
    const res = await fetch('/api/active_game', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ activeGame: target }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      playSound('success');
      showToast(`🎯 Đã chuyển sang nhận LIVE cho ${targetName}!`, 'success');
      updateActiveGameUI(data.activeGame || target);
      fetchStatus();
    } else {
      showToast(`⚠️ Không thể chuyển game: ${data.error || res.statusText}`, 'warn');
    }
  } catch (e) {
    showToast(`Lỗi chuyển game: ${e.message}`, 'error');
  }
}

async function toggleProvider() {
  playSound('click');
  const isMock = (currentProvider || '').toLowerCase().includes('mock');
  const target = isMock ? 'tikfinity' : 'mock';
  try {
    const res = await fetch('/api/provider/switch', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ provider: target }),
    });
    const d = await res.json();
    if (res.ok && d.success) {
      playSound('success');
      currentProvider = d.active || (target === 'mock' ? 'Mock Provider' : 'TikFinity Desktop Provider');
      showToast(`⚡ Đã chuyển Provider: ${target.toUpperCase()}`, 'success');
      fetchStatus();
    } else {
      showToast(`⚠️ Không thể chuyển provider: ${d.error || res.statusText}`, 'warn');
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

// --- 5. Mini War Arena Tactical Console ---
async function sendMwCommand(action, team, unitType, count = 1, metadata = {}) {
  playSound('click');
  try {
    const res = await fetch('/api/game/command', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, team, unitType, count, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`⚔️ [Mini War] Lệnh: ${action}`, 'success');
      fetchStatus();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function setMwTheme(themeId) {
  await sendMwCommand('switch_theme', undefined, undefined, 1, { themeId });
}

async function spawnCustomMwUnit(team) {
  const type = document.getElementById('select-mw-unit-type').value;
  const count = Number(document.getElementById('input-mw-count').value) || 1;
  const laneVal = document.getElementById('select-mw-lane').value;
  const nick = document.getElementById('input-mw-summoner').value.trim() || undefined;
  const lane = laneVal === 'random' ? -1 : Number(laneVal);

  if (type === 'boss') {
    await sendMwCommand('spawn_boss', team, 'boss', 1, { lane: 1, summonerNickname: nick });
  } else {
    await sendMwCommand('spawn_unit', team, type, count, { lane, summonerNickname: nick });
  }
}

async function setMwRound() {
  const r = Number(document.getElementById('input-mw-round-jump').value) || 1;
  await sendMwCommand('set_round', undefined, undefined, r);
}

async function setMwCoreHp(team) {
  const input = document.getElementById(`input-hp-${team}`);
  const hp = Number(input.value) || 0;
  await sendMwCommand('set_core_hp', team, undefined, 1, { amount: hp });
}

// --- 6. Café Mòe Studio Console ---
async function sendCatCommand(action, metadata = {}) {
  playSound('click');
  try {
    const res = await fetch('/api/catcafe/command', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🐱 [Café Mòe] Lệnh: ${action}`, 'success');
      fetchStatus();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
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

async function createCustomCat() {
  const nick = document.getElementById('input-cat-name').value.trim() || 'Mèo Mới';
  const breed = Number(document.getElementById('select-cat-breed').value) || 0;
  const personality = document.getElementById('select-cat-personality').value;
  await sendCatCommand('cat_cafe.add_cat', { nickname: nick, coatVariant: breed, personality });
}

async function setCatLevel() {
  const lvl = Number(document.getElementById('select-cat-level').value) || 1;
  await sendCatCommand('cat_cafe.set_level', { level: lvl });
}

async function updateCatVolume() {
  const bgm = Number(document.getElementById('range-bgm').value) / 100;
  const sfx = Number(document.getElementById('range-sfx').value) / 100;
  const amb = Number(document.getElementById('range-amb').value) / 100;
  await sendCatCommand('cat_cafe.set_volume', { bgm, sfx, ambience: amb });
}

// --- 7. Spectators CRM ---
async function fetchSpectators() {
  try {
    const res = await fetch('/api/spectators');
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById('spectators-tbody');
    if (!tbody) return;

    const countRedEl = document.getElementById('spectators-count-red');
    const countBlueEl = document.getElementById('spectators-count-blue');
    const navSpecsEl = document.getElementById('pill-nav-specs');
    const totalSpecs = (data.counts?.red || 0) + (data.counts?.blue || 0);

    if (countRedEl) countRedEl.innerText = data.counts?.red || 0;
    if (countBlueEl) countBlueEl.innerText = data.counts?.blue || 0;
    if (navSpecsEl) navSpecsEl.innerText = `${totalSpecs}`;

    if (!data.members || data.members.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Chưa có khán giả nào tham gia</td></tr>';
      return;
    }

    tbody.innerHTML = data.members
      .map((m) => {
        const time = new Date(m.updatedAt).toLocaleTimeString();
        const badge = m.team === 'red' ? '<span class="badge badge-red">ĐỘI ĐỎ</span>' : '<span class="badge badge-blue">ĐỘI XANH</span>';
        const otherTeam = m.team === 'red' ? 'blue' : 'red';
        const otherTeamText = m.team === 'red' ? 'Đổi sang Xanh' : 'Đổi sang Đỏ';

        return `<tr>
          <td><strong>${m.nickname}</strong></td>
          <td><code>${m.uniqueId || m.userId}</code></td>
          <td>${badge}</td>
          <td>${time}</td>
          <td>
            <button class="btn-outline" style="font-size:11px; padding:3px 7px;" onclick="moveSpectator('${m.userId}', '${otherTeam}')">
              ⇄ ${otherTeamText}
            </button>
          </td>
        </tr>`;
      })
      .join('');
  } catch (e) {}
}

async function moveSpectator(userId, targetTeam) {
  playSound('click');
  await fetch('/api/spectators/move', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, team: targetTeam }),
  });
  fetchSpectators();
  fetchStatus();
}

async function addManualSpectator() {
  const nick = document.getElementById('input-spec-nick').value.trim() || 'Fan Cuồng';
  const team = document.getElementById('select-spec-team').value;
  await fetch('/api/spectators/add', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ nickname: nick, team }),
  });
  showToast(`✅ Đã thêm khán giả [${nick}] vào đội ${team.toUpperCase()}`, 'success');
  fetchSpectators();
  fetchStatus();
}

async function clearSpectators() {
  const confirmed = await showConfirmModal({
    title: 'Xóa Danh Sách Khán Giả',
    subtitle: 'Quản lý phiên livestream',
    message: 'Xác nhận xóa toàn bộ danh sách khán giả đã tham gia phiên LIVE?',
    confirmText: 'Xóa Danh Sách',
    cancelText: 'Hủy',
    icon: '🗑️',
    variant: 'danger'
  });
  if (!confirmed) return;
  playSound('warn');
  await fetch('/api/spectators/clear', { method: 'POST', headers: authHeaders() });
  showToast('🧹 Đã xóa danh sách khán giả', 'info');
  fetchSpectators();
  fetchStatus();
}

// --- 8. PTPlay Gift Control Center (Catalog, Mappings, Analytics & Pipeline) ---
let currentGiftSubtab = 'catalog';
let currentMappingGameFilter = 'all';
let catalogGiftsCache = [];
let catalogStatsCache = null;
let catalogSearchTimeout = null;
let currentMappingsList = [];
let gameActionsMapCache = {};
let latestAnalyticsData = null;

function switchGiftSubtab(tabName) {
  currentGiftSubtab = tabName;
  try {
    localStorage.setItem('ptplay_admin_gift_subtab', tabName);
  } catch (e) {}
  playSound('click');
  document.querySelectorAll('.gift-subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === `btn-gsub-${tabName}`);
  });
  document.querySelectorAll('.gift-subpanel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `gsubpanel-${tabName}`);
  });

  if (tabName === 'catalog') {
    if (catalogGiftsCache.length === 0) fetchCatalogGifts();
  } else if (tabName === 'mappings') {
    fetchGiftMappings();
    if (Object.keys(gameActionsMapCache).length === 0) onMappingGameChange();
  } else if (tabName === 'analytics' || tabName === 'pipeline') {
    fetchGiftAnalytics();
  } else if (tabName === 'triggers') {
    fetchInteractiveTriggers();
  }
}

async function fetchCatalogGifts() {
  const searchInput = document.getElementById('input-catalog-search');
  const regionSelect = document.getElementById('select-catalog-region');
  const tierSelect = document.getElementById('select-catalog-tier');
  const countBadge = document.getElementById('lbl-catalog-count');

  const query = searchInput ? searchInput.value.trim() : '';
  const region = regionSelect ? regionSelect.value : 'VN';
  const tier = tierSelect ? tierSelect.value : 'all';

  try {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (tier && tier !== 'all') params.set('tier', tier);
    if (query) params.set('q', query);

    const [giftsRes, statsRes] = await Promise.all([
      fetch(`/api/catalog/gifts?${params.toString()}`),
      fetch('/api/catalog/stats').catch(() => null)
    ]);

    if (giftsRes.ok) {
      const data = await giftsRes.json();
      catalogGiftsCache = Array.isArray(data) ? data : (data.gifts || []);
      renderCatalogGrid(catalogGiftsCache);
      const totalCount = (data && typeof data.total === 'number') ? data.total : catalogGiftsCache.length;
      if (countBadge) countBadge.innerText = totalCount.toLocaleString('vi-VN');
    }

    if (statsRes && statsRes.ok) {
      catalogStatsCache = await statsRes.json();
      const totBadge = document.getElementById('badge-stat-total-catalog');
      const vnBadge = document.getElementById('badge-stat-vn-catalog');
      const obsBadge = document.getElementById('badge-stat-observed');
      const mapBadge = document.getElementById('badge-stat-mappings');

      const tot = catalogStatsCache.totalCatalog ?? catalogStatsCache.totalGifts ?? 1711;
      const vn = catalogStatsCache.totalVn ?? catalogStatsCache.vnGifts ?? 727;
      const obs = catalogStatsCache.totalObserved ?? 0;
      const maps = catalogStatsCache.totalMappings ?? 25;

      if (totBadge) totBadge.innerText = `${tot.toLocaleString('vi-VN')} Quà`;
      if (vnBadge) vnBadge.innerText = `${vn.toLocaleString('vi-VN')} Quà`;
      if (obsBadge) obsBadge.innerText = `${obs.toLocaleString('vi-VN')} ID`;
      if (mapBadge && (!currentMappingsList || currentMappingsList.length === 0)) {
        mapBadge.innerText = `${maps} Quy Tắc`;
      }
    }
  } catch (err) {
    console.error('Lỗi tải Catalog:', err);
  }
}

function renderCatalogGrid(gifts) {
  const container = document.getElementById('catalog-grid');
  if (!container) return;

  if (!gifts || gifts.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
        <div>Không tìm thấy quà tặng nào khớp với bộ lọc hiện tại.</div>
        <small style="color: #64748b;">Hãy thử đổi từ khóa tìm kiếm hoặc chọn vùng "Tất Cả Khu Vực (Global)".</small>
      </div>`;
    return;
  }

  const displayList = gifts.slice(0, 120);

  container.innerHTML = displayList.map(g => {
    const iconUrl = g.iconUrl || g.localIcon || '';
    const safeName = (g.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const cleanName = g.cleanName || g.name;
    const diamonds = g.diamonds || 1;
    const isVn = g.isVN || (g.regions && g.regions.includes('VN'));
    const obsId = g.observedId || g.id;
    const hasVerifiedId = !!g.observedId;

    return `
      <div class="catalog-card">
        <div style="position: relative; width: 64px; height: 64px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25); border-radius: 8px;">
          <img src="${iconUrl}" 
               alt="${cleanName}" 
               loading="lazy"
               style="max-width: 58px; max-height: 58px; object-fit: contain;" 
               onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\' viewBox=\\'0 0 24 24\\'><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'central\\' text-anchor=\\'middle\\' font-size=\\'18\\'>🎁</text></svg>';">
        </div>
        <div class="catalog-card-name" title="${g.name}">${cleanName}</div>
        <div class="catalog-card-meta">
          <span class="badge badge-gold" title="Giá Xu tham khảo">💎 ${diamonds.toLocaleString()} Xu</span>
          ${isVn ? '<span class="badge badge-blue">🇻🇳 VN</span>' : ''}
          ${hasVerifiedId ? `<span class="badge badge-green" title="TikFinity Observed ID: ${obsId}">ID: ${obsId}</span>` : ''}
        </div>
        <div class="catalog-card-actions">
          <button class="btn-outline" style="font-size: 10px; padding: 3px 6px;" onclick="prefillMappingFromCatalog('${safeName}', ${diamonds})">+ Ánh Xạ</button>
          <button class="btn-green" style="font-size: 10px; padding: 3px 6px;" onclick="selectGiftForActiveGame('${safeName}', '${iconUrl}')" title="Chọn quà này vào bộ gửi quà giả lập">📥 Chọn</button>
          <button class="btn-gold" style="font-size: 10px; padding: 3px 6px;" onclick="testGiftFromCatalog('${safeName}')">🧪 Thử</button>
        </div>
      </div>
    `;
  }).join('');

  if (gifts.length > 120) {
    const extra = document.createElement('div');
    extra.style.gridColumn = '1 / -1';
    extra.style.textAlign = 'center';
    extra.style.padding = '12px';
    extra.style.color = '#94a3b8';
    extra.style.fontSize = '12px';
    extra.innerHTML = `<em>Đang hiển thị 120 / ${gifts.length} quà phù hợp. Dùng ô tìm kiếm để lọc đích danh món quà bạn cần.</em>`;
    container.appendChild(extra);
  }
}

function onCatalogSearchInput() {
  if (catalogSearchTimeout) clearTimeout(catalogSearchTimeout);
  catalogSearchTimeout = setTimeout(() => {
    fetchCatalogGifts();
  }, 250);
}

function prefillMappingFromCatalog(giftName, coins) {
  switchGiftSubtab('mappings');
  const inputGift = document.getElementById('input-map-gift');
  const inputTts = document.getElementById('input-map-tts');
  const preview = document.getElementById('img-map-gift-preview');
  if (inputGift) {
    inputGift.value = giftName;
    const found = (catalogGiftsCache || []).find(g => (g.name || '').toLowerCase() === giftName.toLowerCase());
    if (preview && found && (found.iconUrl || found.localIcon)) {
      preview.src = found.iconUrl || found.localIcon;
      preview.style.display = 'inline-block';
      inputGift.style.paddingLeft = '38px';
    }
    inputGift.focus();
    inputGift.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (inputTts && (!inputTts.value || inputTts.value.includes('{gift}'))) {
    inputTts.value = `Cảm ơn {viewer} đã tặng {count} ${giftName}!`;
  }
  showToast(`🎯 Đã chọn '${giftName}'. Vui lòng cấu hình hành động cho game bên dưới.`, 'info');
}

function testGiftFromCatalog(giftName) {
  playSound('click');
  const gameMap = {
    'cat-cafe': 'cat',
    'mini-war': 'mini-war',
    'english-class': 'english',
    'english-class-live': 'english',
    'quiz-show': 'quiz',
    'duoi-hinh-bat-chu': 'rebus'
  };
  const targetKey = gameMap[currentActiveGame] || 'cat';
  sendMockGift(targetKey, giftName, 1);
}

function selectGiftForActiveGame(giftName, iconUrl) {
  playSound('click');
  const gameMap = {
    'cat-cafe': 'cat',
    'mini-war': 'mini-war',
    'english-class': 'english',
    'english-class-live': 'english',
    'quiz-show': 'quiz',
    'duoi-hinh-bat-chu': 'rebus'
  };
  const targetKey = gameMap[currentActiveGame] || 'cat';
  const select = document.getElementById(`select-${targetKey}-gift-name`);
  const preview = document.getElementById(`preview-${targetKey}-gift-img`);

  if (select) {
    let exists = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value.toLowerCase() === giftName.toLowerCase()) {
        select.selectedIndex = i;
        exists = true;
        break;
      }
    }
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = giftName;
      opt.textContent = `${giftName} (Catalog TikTok)`;
      if (iconUrl) opt.setAttribute('data-icon', iconUrl);
      select.insertBefore(opt, select.firstChild);
      select.selectedIndex = 0;
    }
    if (preview && iconUrl) {
      preview.src = iconUrl;
    }
    showToast(`✅ Đã chọn "${giftName}" vào bộ gửi quà của ${currentActiveGame}!`, 'success');
  }
}

function openCatalogGiftPicker(gameType) {
  playSound('click');
  switchTab('gifts');
  switchGiftSubtab('catalog');
  const searchInput = document.getElementById('input-catalog-search');
  if (searchInput) {
    searchInput.focus();
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  showToast(`🔍 Duyệt 727+ quà TikTok và nhấn "📥 Chọn" hoặc "🧪 Thử" để gửi ngay!`, 'info');
}

function updateGiftPreview(gameType) {
  const select = document.getElementById(`select-${gameType}-gift-name`);
  const img = document.getElementById(`preview-${gameType}-gift-img`);
  if (!select || !img) return;
  const opt = select.selectedOptions[0];
  const icon = opt ? opt.getAttribute('data-icon') : '';
  if (icon) {
    img.src = icon;
    img.style.display = 'inline-block';
  } else {
    const giftName = select.value.trim().toLowerCase();
    const found = (catalogGiftsCache || []).find(g => (g.name || '').toLowerCase() === giftName);
    if (found && (found.iconUrl || found.localIcon)) {
      img.src = found.iconUrl || found.localIcon;
      img.style.display = 'inline-block';
    }
  }
}

async function syncCatalogFromSource() {
  playSound('click');
  showToast('🔄 Đang đồng bộ catalog từ nguồn chuẩn...', 'info');
  try {
    const res = await fetch('/api/catalog/sync', { method: 'POST', headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      showToast(`✅ Đã đồng bộ thành công ${data.count || 0} quà (${data.vnCount || 0} tại VN)!`, 'success');
      fetchCatalogGifts();
    } else {
      showToast('⚠️ Không thể đồng bộ catalog lúc này', 'warn');
    }
  } catch (e) {
    showToast('❌ Lỗi kết nối khi đồng bộ catalog', 'error');
  }
}

// --- 8.3 Gift Autocomplete & Quick Selector ---
let giftAutocompleteTimer = null;
let giftAutocompleteHighlightedIndex = -1;
let currentGiftSuggestions = [];

function hideGiftDropdown() {
  const dropdown = document.getElementById('gift-autocomplete-dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }
  giftAutocompleteHighlightedIndex = -1;
  currentGiftSuggestions = [];
}

async function onMapGiftInput() {
  const input = document.getElementById('input-map-gift');
  const dropdown = document.getElementById('gift-autocomplete-dropdown');
  const preview = document.getElementById('img-map-gift-preview');
  if (!input || !dropdown) return;

  const query = input.value.trim();

  // If empty, reset preview and hide dropdown
  if (!query) {
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
    input.style.paddingLeft = '';
    hideGiftDropdown();
    return;
  }

  // Check if current text exactly matches a known gift
  const exact = (catalogGiftsCache || []).find(g => (g.name || '').toLowerCase() === query.toLowerCase());
  if (exact && (exact.iconUrl || exact.localIcon) && preview) {
    preview.src = exact.iconUrl || exact.localIcon;
    preview.style.display = 'inline-block';
    input.style.paddingLeft = '38px';
  } else if (!exact && preview) {
    preview.style.display = 'none';
    input.style.paddingLeft = '';
  }

  if (giftAutocompleteTimer) clearTimeout(giftAutocompleteTimer);
  giftAutocompleteTimer = setTimeout(async () => {
    let gifts = [];

    // 1. Search locally in catalogGiftsCache
    if (catalogGiftsCache && catalogGiftsCache.length > 0) {
      const qLower = query.toLowerCase();
      gifts = catalogGiftsCache.filter(g => (g.name || '').toLowerCase().includes(qLower));
    }

    // 2. Query catalog API if local cache is empty or has few matches
    if (gifts.length < 5) {
      try {
        const res = await fetch(`/api/catalog/gifts?q=${encodeURIComponent(query)}&region=VN&limit=15`);
        if (res.ok) {
          const data = await res.json();
          const apiGifts = Array.isArray(data) ? data : (data.gifts || []);
          const seen = new Set(gifts.map(g => (g.name || '').toLowerCase()));
          apiGifts.forEach(g => {
            if (!seen.has((g.name || '').toLowerCase())) {
              gifts.push(g);
              seen.add((g.name || '').toLowerCase());
            }
          });
        }
      } catch (e) {
        // use local
      }
    }

    if (gifts.length === 0) {
      hideGiftDropdown();
      return;
    }

    // 3. Smart ranking: exact match > startsWith > contains
    const qLower = query.toLowerCase();
    gifts.sort((a, b) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aExact = aName === qLower ? 1 : 0;
      const bExact = bName === qLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      const aStarts = aName.startsWith(qLower) ? 1 : 0;
      const bStarts = bName.startsWith(qLower) ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;

      return (a.coins || a.diamonds || 1) - (b.coins || b.diamonds || 1);
    });

    currentGiftSuggestions = gifts.slice(0, 10);
    giftAutocompleteHighlightedIndex = -1;

    dropdown.innerHTML = currentGiftSuggestions.map((g, idx) => {
      const iconUrl = g.iconUrl || g.localIcon || '';
      const safeName = (g.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const coins = g.coins || g.diamonds || 1;
      const isVn = g.isVN || (g.regions && g.regions.includes('VN'));

      // Highlight matched portion
      const name = g.name || '';
      const matchIdx = name.toLowerCase().indexOf(qLower);
      let nameHtml = name;
      if (matchIdx >= 0) {
        const before = name.substring(0, matchIdx);
        const match = name.substring(matchIdx, matchIdx + query.length);
        const after = name.substring(matchIdx + query.length);
        nameHtml = `${before}<span style="color: #38bdf8; text-decoration: underline; font-weight: bold;">${match}</span>${after}`;
      }

      return `
        <div class="gift-autocomplete-item" id="gift-item-${idx}" onclick="selectGiftSuggestion('${safeName}', '${iconUrl}', ${coins})">
          <img src="${iconUrl}" alt="${safeName}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'32\\' height=\\'32\\'><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'central\\' text-anchor=\\'middle\\' font-size=\\'16\\'>🎁</text></svg>';">
          <div class="gift-autocomplete-info">
            <span class="gift-autocomplete-name">${nameHtml}</span>
            <div class="gift-autocomplete-meta">
              <span>💎 ${coins.toLocaleString()} Xu</span>
              ${isVn ? '<span class="gift-autocomplete-badge">🇻🇳 VN</span>' : ''}
            </div>
          </div>
          <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">Chọn ➔</span>
        </div>
      `;
    }).join('');

    dropdown.style.display = 'block';
  }, 120);
}

function selectGiftSuggestion(giftName, iconUrl, coins = 1) {
  const input = document.getElementById('input-map-gift');
  const preview = document.getElementById('img-map-gift-preview');
  const ttsInput = document.getElementById('input-map-tts');

  if (input) {
    input.value = giftName;
    if (preview && iconUrl) {
      preview.src = iconUrl;
      preview.style.display = 'inline-block';
      input.style.paddingLeft = '38px';
    }
  }

  if (ttsInput && (!ttsInput.value || ttsInput.value.includes('{gift}'))) {
    ttsInput.value = `Cảm ơn {viewer} đã tặng {count} ${giftName}!`;
  }

  hideGiftDropdown();
  playSound('click');
  showToast(`🎁 Đã chọn '${giftName}' (💎 ${coins} Xu)`, 'success');
}

function onMapGiftKeydown(e) {
  const dropdown = document.getElementById('gift-autocomplete-dropdown');
  if (!dropdown || dropdown.style.display === 'none' || currentGiftSuggestions.length === 0) {
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    giftAutocompleteHighlightedIndex = (giftAutocompleteHighlightedIndex + 1) % currentGiftSuggestions.length;
    updateGiftAutocompleteHighlight();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    giftAutocompleteHighlightedIndex = (giftAutocompleteHighlightedIndex - 1 + currentGiftSuggestions.length) % currentGiftSuggestions.length;
    updateGiftAutocompleteHighlight();
  } else if (e.key === 'Enter') {
    if (giftAutocompleteHighlightedIndex >= 0 && currentGiftSuggestions[giftAutocompleteHighlightedIndex]) {
      e.preventDefault();
      const g = currentGiftSuggestions[giftAutocompleteHighlightedIndex];
      selectGiftSuggestion(g.name, g.iconUrl || g.localIcon || '', g.coins || g.diamonds || 1);
    }
  } else if (e.key === 'Escape') {
    hideGiftDropdown();
  }
}

function updateGiftAutocompleteHighlight() {
  currentGiftSuggestions.forEach((_, idx) => {
    const el = document.getElementById(`gift-item-${idx}`);
    if (el) {
      if (idx === giftAutocompleteHighlightedIndex) {
        el.classList.add('highlighted');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('highlighted');
      }
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.gift-autocomplete-wrapper')) {
      hideGiftDropdown();
    }
  });
}

function filterMappingsByGame(gameType, syncSelect = true) {
  currentMappingGameFilter = gameType;
  playSound('click');

  const filterButtons = {
    'all': 'btn-map-filter-all',
    'mini-war': 'btn-map-filter-mw',
    'cat-cafe': 'btn-map-filter-cat',
    'english-class': 'btn-map-filter-ec',
    'quiz-show': 'btn-map-filter-qs',
    'duoi-hinh-bat-chu': 'btn-map-filter-dh'
  };

  Object.entries(filterButtons).forEach(([key, btnId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (key === gameType) {
        btn.classList.add('active-filter-btn');
        btn.style.borderColor = 'var(--accent)';
        btn.style.color = '#38bdf8';
        btn.style.background = 'rgba(56, 189, 248, 0.15)';
      } else {
        btn.classList.remove('active-filter-btn');
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.background = '';
      }
    }
  });

  // Automatically sync with "Game Mục Tiêu" dropdown in the form
  if (syncSelect) {
    const gameSelect = document.getElementById('select-map-game');
    if (gameSelect && gameType !== 'all') {
      if (gameSelect.value !== gameType) {
        gameSelect.value = gameType;
        void onMappingGameChange(false);
      }
    }
  }

  renderMappingsTable(currentMappingsList);
}

async function onMappingGameChange(syncFilter = true) {
  const gameSelect = document.getElementById('select-map-game');
  const actionSelect = document.getElementById('select-map-action');
  const unitSelect = document.getElementById('select-map-unit');
  if (!gameSelect || !actionSelect) return;

  const game = gameSelect.value;

  // Sync the top filter button & table if user changes "Game mục tiêu" dropdown
  if (syncFilter && currentMappingGameFilter !== game) {
    filterMappingsByGame(game, false);
  }
  try {
    if (!gameActionsMapCache[game]) {
      const res = await fetch(`/api/gift-mappings/actions?gameType=${game}`);
      if (res.ok) {
        const actionData = await res.json();
        gameActionsMapCache[game] = Array.isArray(actionData) ? actionData : (actionData.actions || []);
      }
    }

    const actions = gameActionsMapCache[game] || [];
    if (actions.length > 0) {
      actionSelect.innerHTML = actions.map(a => `<option value="${a.action}">${a.label} (${a.action})</option>`).join('');
    }

    if (unitSelect) {
      if (game === 'mini-war') {
        unitSelect.innerHTML = `
          <option value="warrior">Chiến Binh (Warrior)</option>
          <option value="archer">Cung Thủ (Archer)</option>
          <option value="tank">Hộ Vệ Giáp Thép (Tank)</option>
          <option value="mage">Pháp Sư (Mage)</option>
          <option value="boss">Đại Tướng Boss</option>
        `;
        unitSelect.parentElement.style.display = 'block';
      } else if (game === 'cat-cafe') {
        unitSelect.innerHTML = `
          <option value="fish">Cá Nướng Thơm</option>
          <option value="fish_basket">Giỏ Cá Lớn</option>
          <option value="yarn">Cuộn Len Vui Nhộn</option>
          <option value="cake">Bánh Kem Sinh Nhật</option>
          <option value="royal">Vương Miện Hoàng Gia</option>
        `;
        unitSelect.parentElement.style.display = 'block';
      } else if (game === 'english-class') {
        unitSelect.innerHTML = `
          <option value="heart">Mưa Tim Khen Thưởng</option>
          <option value="star">Ngôi Sao Điểm 10</option>
          <option value="flower">Hoa Tặng Cô</option>
          <option value="cake">Bánh Ngọt Liên Hoan</option>
        `;
        unitSelect.parentElement.style.display = 'block';
      } else if (game === 'quiz-show') {
        unitSelect.innerHTML = `
          <option value="hint">Mở Gợi Ý Câu Hỏi</option>
          <option value="extra_life">Thêm Mạng Đấu Trí</option>
          <option value="bonus_points">Cộng Điểm Thưởng</option>
          <option value="double_points">Nhân Đôi Điểm</option>
        `;
        unitSelect.parentElement.style.display = 'block';
      } else if (game === 'duoi-hinh-bat-chu') {
        unitSelect.innerHTML = `
          <option value="reveal_char">Mở 1 Ký Tự Gợi Ý</option>
          <option value="extra_time">Gia Hạn 15 Giây</option>
          <option value="bonus_score">Cộng 50 Điểm Đội</option>
          <option value="spotlight">Spotlight Top 1</option>
        `;
        unitSelect.parentElement.style.display = 'block';
      }
    }
  } catch (e) {
    console.error('Lỗi tải danh mục hành động:', e);
  }
}

async function fetchGiftMappings() {
  try {
    const res = await fetch('/api/gift-mappings');
    if (!res.ok) {
      const legacyRes = await fetch('/api/mapping');
      if (legacyRes.ok) {
        const legData = await legacyRes.json();
        currentMappingsList = Array.isArray(legData) ? legData : (legData.rules || []);
      }
    } else {
      const data = await res.json();
      currentMappingsList = Array.isArray(data) ? data : (data.rules || []);
    }

    const badgeStat = document.getElementById('badge-stat-mappings');
    if (badgeStat) {
      badgeStat.innerText = `${currentMappingsList.length} Quy Tắc`;
    }

    renderMappingsTable(currentMappingsList);
  } catch (e) {
    console.error('Lỗi nạp danh sách mappings:', e);
  }
}

function renderMappingsTable(rules) {
  const tbody = document.getElementById('mapping-tbody');
  if (!tbody) return;

  const list = Array.isArray(rules) ? rules : (rules?.rules || []);
  const filtered = list.filter(r => {
    if (currentMappingGameFilter === 'all') return true;
    return (r.gameType || 'mini-war') === currentMappingGameFilter;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding: 24px;">Không có quy tắc mapping nào cho bộ lọc này. Hãy bấm "Tạo Mapping" ở trên để bổ sung.</td></tr>`;
    return;
  }

  const GAME_LABELS = {
    'mini-war': '⚔️ Mini War',
    'cat-cafe': '🐱 Café Mòe',
    'english-class': '🎓 Lớp Học Vui',
    'quiz-show': '🏆 Quiz Show',
    'duoi-hinh-bat-chu': '💡 Đuổi Hình'
  };

  tbody.innerHTML = filtered.map(r => {
    const game = r.gameType || 'mini-war';
    const gameBadge = `<span class="badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3);">${GAME_LABELS[game] || game}</span>`;
    const statusBadge = r.enabled !== false
      ? '<span class="badge badge-green">✓ Bật</span>'
      : '<span class="badge" style="background:#334155; color:#94a3b8;">✕ Tắt</span>';
    const maxVal = r.maxCountPerEvent || r.maxSpawnPerEvent || 10;
    const cdVal = r.cooldownSec || 0;
    const multVal = r.multiplier || 1;
    const paramVal = r.unitType || (r.params ? JSON.stringify(r.params) : '–');
    const safeGiftName = (r.giftName || '').replace(/'/g, "\\'");

    return `<tr>
      <td><strong>${r.giftName}</strong></td>
      <td>${gameBadge}</td>
      <td><code>${r.action}</code></td>
      <td><span class="badge badge-gold">${paramVal}</span></td>
      <td>x${multVal}</td>
      <td>${cdVal}s / ${maxVal}</td>
      <td>${statusBadge}</td>
      <td>
        <div style="display: flex; gap: 4px; align-items: center;">
          <button class="btn-outline" style="font-size:10px; padding:2px 6px;" title="Chỉnh sửa quy tắc này" onclick="editMappingRule('${r.id}')">✏️ Sửa</button>
          <button class="btn-gold" style="font-size:10px; padding:2px 6px;" title="Thử quà mà không cần trừ xu" onclick="testMappingAction('${game}', '${r.id}', '${safeGiftName}')">🧪 Thử</button>
          <button class="btn-outline" style="font-size:10px; padding:2px 6px;" onclick="toggleMappingRule('${r.id}')">Bật/Tắt</button>
          <button class="btn-red" style="font-size:10px; padding:2px 6px;" onclick="deleteMappingRule('${r.id}')">Xóa</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function editMappingRule(ruleId) {
  const rule = currentMappingsList.find(r => r.id === ruleId);
  if (!rule) return;
  playSound('click');

  const giftInput = document.getElementById('input-map-gift');
  const gameSelect = document.getElementById('select-map-game');
  const multInput = document.getElementById('input-map-mult');
  const cdInput = document.getElementById('input-map-cd');
  const maxInput = document.getElementById('input-map-max');
  const ttsInput = document.getElementById('input-map-tts');

  if (giftInput) {
    giftInput.value = rule.giftName || '';
    const preview = document.getElementById('img-map-gift-preview');
    const found = (catalogGiftsCache || []).find(g => (g.name || '').toLowerCase() === (rule.giftName || '').toLowerCase());
    if (preview && found && (found.iconUrl || found.localIcon)) {
      preview.src = found.iconUrl || found.localIcon;
      preview.style.display = 'inline-block';
      giftInput.style.paddingLeft = '38px';
    } else if (preview) {
      preview.style.display = 'none';
      giftInput.style.paddingLeft = '';
    }
  }
  if (multInput) multInput.value = rule.multiplier || 1;
  if (cdInput) cdInput.value = rule.cooldownSec || 0;
  if (maxInput) maxInput.value = rule.maxCountPerEvent || rule.maxSpawnPerEvent || 10;
  if (ttsInput) ttsInput.value = rule.ttsTemplate || '';

  if (rule.gameType) {
    filterMappingsByGame(rule.gameType, true);
    if (gameSelect) gameSelect.value = rule.gameType;
    onMappingGameChange(false).then(() => {
      const actionSelect = document.getElementById('select-map-action');
      if (actionSelect && rule.action) {
        actionSelect.value = rule.action;
      }
      const unitSelect = document.getElementById('select-map-unit');
      if (unitSelect && (rule.unitType || rule.params?.type || rule.params?.effect)) {
        unitSelect.value = rule.unitType || rule.params?.type || rule.params?.effect;
      }
    });
  }

  // Smooth scroll to form
  const formCard = document.querySelector('#gsubpanel-mappings .card');
  if (formCard) {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showToast(`✏️ Đã nạp thông tin "${rule.giftName}" (${rule.gameType}) vào form`, 'info');
}

async function saveNewMappingRule() {
  const giftName = document.getElementById('input-map-gift').value.trim();
  const gameSelect = document.getElementById('select-map-game');
  const actionSelect = document.getElementById('select-map-action');
  const unitSelect = document.getElementById('select-map-unit');
  const multInput = document.getElementById('input-map-mult');
  const cdInput = document.getElementById('input-map-cd');
  const maxInput = document.getElementById('input-map-max');
  const ttsInput = document.getElementById('input-map-tts');

  const gameType = gameSelect ? gameSelect.value : 'mini-war';
  const action = actionSelect ? actionSelect.value : 'spawn_unit';
  const unitType = unitSelect ? unitSelect.value : undefined;
  const multiplier = multInput ? Number(multInput.value) || 1 : 1;
  const cooldownSec = cdInput ? Number(cdInput.value) || 0 : 0;
  const maxCountPerEvent = maxInput ? Number(maxInput.value) || 10 : 10;
  const ttsTemplate = ttsInput ? ttsInput.value.trim() : undefined;

  if (!giftName) {
    showToast('⚠️ Vui lòng nhập tên quà TikTok', 'warn');
    return;
  }

  const cleanId = `map_${gameType}_${giftName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const rule = {
    id: cleanId,
    gameType,
    giftName,
    action,
    unitType,
    params: unitType ? { type: unitType } : {},
    multiplier,
    cooldownSec,
    maxCountPerEvent,
    maxSpawnPerEvent: maxCountPerEvent,
    ttsTemplate,
    enabled: true,
    description: `Quy tắc ${giftName} -> ${action} cho ${gameType}`,
  };

  playSound('click');
  try {
    const res = await fetch('/api/gift-mappings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ rule }),
    });

    fetch('/api/mapping/save', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ rule }),
    }).catch(() => {});

    if (res.ok) {
      showToast(`✅ Đã lưu mapping cho '${giftName}' (${gameType})`, 'success');
      resetMappingForm();
      fetchGiftMappings();
    } else {
      showToast('⚠️ Lưu mapping thất bại', 'warn');
    }
  } catch (e) {
    showToast('❌ Lỗi kết nối khi lưu mapping', 'error');
  }
}

function resetMappingForm() {
  const inputGift = document.getElementById('input-map-gift');
  const multInput = document.getElementById('input-map-mult');
  const cdInput = document.getElementById('input-map-cd');
  const maxInput = document.getElementById('input-map-max');
  const ttsInput = document.getElementById('input-map-tts');
  const preview = document.getElementById('img-map-gift-preview');

  if (inputGift) {
    inputGift.value = '';
    inputGift.style.paddingLeft = '';
  }
  if (preview) {
    preview.style.display = 'none';
    preview.src = '';
  }
  hideGiftDropdown();
  if (multInput) multInput.value = '2';
  if (cdInput) cdInput.value = '0';
  if (maxInput) maxInput.value = '10';
  if (ttsInput) ttsInput.value = '';
}

async function toggleMappingRule(id) {
  playSound('click');
  try {
    await fetch('/api/gift-mappings/toggle', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });
    fetch('/api/mapping/toggle', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    }).catch(() => {});
    showToast('⚙️ Đã chuyển trạng thái rule', 'info');
    fetchGiftMappings();
  } catch (e) {}
}

async function deleteMappingRule(id) {
  const confirmed = await showConfirmModal({
    title: 'Xóa Quy Tắc Mapping',
    subtitle: 'Cấu hình quà tặng & hành động',
    message: 'Bạn có chắc muốn xóa quy tắc mapping này?',
    confirmText: 'Xóa Quy Tắc',
    cancelText: 'Hủy',
    icon: '🗑️',
    variant: 'danger'
  });
  if (!confirmed) return;
  playSound('warn');
  try {
    await fetch('/api/gift-mappings/delete', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    });
    fetch('/api/mapping/delete', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id }),
    }).catch(() => {});
    showToast('🗑️ Đã xóa quy tắc mapping', 'info');
    fetchGiftMappings();
  } catch (e) {}
}

function testMappingAction(gameType, ruleId, giftName) {
  playSound('click');
  sendMockGift(gameType, giftName || 'Rose', 1);
  showToast(`🧪 Đã kích hoạt thử quà '${giftName}' cho [${gameType}]`, 'success');
  setTimeout(fetchGiftAnalytics, 300);
}

async function exportMappingsJson() {
  playSound('click');
  try {
    const res = await fetch('/api/gift-mappings/export');
    let data;
    if (res.ok) {
      const expData = await res.json();
      data = expData.rules || expData;
    } else {
      data = { version: '1.0', exportedAt: new Date().toISOString(), mappings: currentMappingsList };
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ptplay-gift-mappings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Đã tải file cấu hình Mappings JSON!', 'success');
  } catch (e) {
    showToast('❌ Không thể xuất file mappings', 'error');
  }
}

async function importMappingsJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const mappings = Array.isArray(parsed) ? parsed : (parsed.mappings || parsed.rules || []);

    if (!Array.isArray(mappings) || mappings.length === 0) {
      showToast('⚠️ File JSON không chứa danh sách mappings hợp lệ', 'warn');
      return;
    }

    const res = await fetch('/api/gift-mappings/import', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ mappings }),
    });

    if (res.ok) {
      const data = await res.json();
      showToast(`✅ Đã nhập thành công ${data.count || mappings.length} quy tắc!`, 'success');
      fetchGiftMappings();
    } else {
      showToast('⚠️ Không thể lưu mappings nhập khẩu', 'warn');
    }
  } catch (err) {
    showToast('❌ Lỗi định dạng file JSON', 'error');
  } finally {
    event.target.value = '';
  }
}

async function fetchGiftAnalytics() {
  try {
    const res = await fetch('/api/gift-analytics');
    if (!res.ok) return;
    const data = await res.json();
    latestAnalyticsData = data;

    // 1. KPI Badges
    const kpiReal = document.getElementById('kpi-real-gifts');
    const kpiActions = document.getElementById('kpi-real-actions');
    const kpiDiamonds = document.getElementById('kpi-real-diamonds');
    const kpiMock = document.getElementById('kpi-mock-gifts');

    const realGifts = data.real?.totalGifts ?? data.summary?.realGiftsReceived ?? 0;
    const realActions = data.real?.totalActionsExecuted ?? data.summary?.executedActions ?? 0;
    const realDiamonds = data.real?.totalDiamonds ?? data.summary?.realDiamondsReceived ?? 0;
    const mockGifts = data.mock?.totalSimulatedGifts ?? data.summary?.mockGiftsReceived ?? 0;

    if (kpiReal) kpiReal.innerText = realGifts.toLocaleString();
    if (kpiActions) kpiActions.innerText = realActions.toLocaleString();
    if (kpiDiamonds) kpiDiamonds.innerText = realDiamonds.toLocaleString();
    if (kpiMock) kpiMock.innerText = mockGifts.toLocaleString();

    // 2. Top 5 Gifts
    const topGiftsContainer = document.getElementById('analytics-top-gifts-container');
    if (topGiftsContainer) {
      let topList = [];
      if (Array.isArray(data.topGifts)) {
        topList = data.topGifts;
      } else if (data.real?.topGifts && typeof data.real.topGifts === 'object') {
        topList = Object.entries(data.real.topGifts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      }
      if (topList.length === 0) {
        topGiftsContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Chưa có sự kiện quà tặng nào trong phiên</div>';
      } else {
        const maxVal = topList[0]?.count || 1;
        topGiftsContainer.innerHTML = topList.slice(0, 5).map((g, idx) => {
          const pct = Math.round((g.count / maxVal) * 100);
          return `
            <div style="margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
                <span><strong>#${idx + 1}</strong> 🎁 ${g.name}</span>
                <span style="color: #38bdf8; font-weight: bold;">${g.count} lượt</span>
              </div>
              <div style="background: rgba(255,255,255,0.08); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #38bdf8, #818cf8); width: ${pct}%; height: 100%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Per Game Stats
    const perGameContainer = document.getElementById('analytics-per-game-container');
    if (perGameContainer) {
      const perGame = data.perGameStats || data.real?.perGame || {};
      const gameEntries = Object.entries(perGame);
      if (gameEntries.length === 0) {
        perGameContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Chưa có dữ liệu theo game</div>';
      } else {
        const GAME_ICONS = {
          'mini-war': '⚔️ Mini War',
          'cat-cafe': '🐱 Café Mòe',
          'english-class': '🎓 Lớp Học Vui',
          'quiz-show': '🏆 Quiz Show',
          'duoi-hinh-bat-chu': '💡 Đuổi Hình'
        };
        perGameContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
            ${gameEntries.map(([g, s]) => {
              const rcv = s.received ?? s.giftsReceived ?? 0;
              const exe = s.executed ?? s.actionsExecuted ?? 0;
              const fail = s.failed ?? 0;
              return `
              <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-card); border-radius: 6px; padding: 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: bold; color: #38bdf8; margin-bottom: 4px;">${GAME_ICONS[g] || g}</div>
                <div style="font-size: 18px; font-weight: 700; color: #f8fafc;">${rcv}</div>
                <div style="font-size: 10px; color: #10b981;">⚡ ${exe} thực thi</div>
                ${fail > 0 ? `<div style="font-size: 10px; color: #ef4444;">✕ ${fail} lỗi</div>` : ''}
              </div>`;
            }).join('')}
          </div>
        `;
      }
    }

    // 4. Unknown Gifts Alert
    const unknownContainer = document.getElementById('analytics-unknown-gifts-container');
    if (unknownContainer) {
      let unknowns = [];
      if (Array.isArray(data.unknownGifts)) {
        unknowns = data.unknownGifts;
      } else if (data.real?.unknownGifts && typeof data.real.unknownGifts === 'object') {
        unknowns = Object.entries(data.real.unknownGifts).map(([name, info]) => ({
          name,
          giftId: 'Chưa biết',
          count: info.count || 1
        }));
      }
      if (unknowns.length === 0) {
        unknownContainer.innerHTML = '<div style="color: #10b981; font-size: 12px; padding: 10px;">✓ Không phát hiện quà chưa rõ nào. Toàn bộ quà đã được nhận diện hoặc ánh xạ chuẩn xác!</div>';
      } else {
        unknownContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${unknowns.map(u => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 6px; padding: 8px 12px;">
                <div>
                  <strong style="color: #f87171;">⚠️ ${u.name}</strong>
                  <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">(ID: ${u.giftId || 'Chưa biết'})</span>
                  <span class="badge badge-red" style="margin-left: 8px;">${u.count} lần</span>
                </div>
                <button class="btn-outline" style="font-size: 11px; padding: 3px 8px;" onclick="prefillMappingFromCatalog('${(u.name || '').replace(/'/g, "\\'")}', 1)">+ Ánh Xạ Quà Này</button>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 5. Render Pipeline Trace
    const pipeEvents = data.recentPipelineEvents || data.pipelineHistory || [];
    renderPipelineHistory(pipeEvents);

  } catch (e) {
    console.error('Lỗi nạp thống kê quà:', e);
  }
}

function renderPipelineHistory(events) {
  const tbody = document.getElementById('pipeline-tbody');
  if (!tbody) return;

  const rawEvents = events || (latestAnalyticsData?.recentPipelineEvents) || (latestAnalyticsData?.pipelineHistory) || [];
  const filterSelect = document.getElementById('select-pipeline-filter-source');
  const filterSource = filterSelect ? filterSelect.value : 'all';

  const filtered = rawEvents.filter(ev => {
    const isMock = ev.source === 'mock' || !!ev.isMock;
    if (filterSource === 'real') return !isMock;
    if (filterSource === 'mock') return isMock;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding: 24px;">Chưa có sự kiện nào qua pipeline khớp với bộ lọc</td></tr>`;
    return;
  }

  const STATUS_BADGES = {
    'EXECUTED': '<span class="badge badge-green">✓ Đã Thực Thi</span>',
    'FAILED': '<span class="badge badge-red">✕ Thất Bại</span>',
    'IGNORED': '<span class="badge" style="background:#475569; color:#94a3b8;">Bỏ Qua (Khác Game)</span>',
    'FILTERED_INACTIVE': '<span class="badge" style="background:#475569; color:#94a3b8;">Bỏ Qua (Khác Game)</span>',
    'UNMAPPED': '<span class="badge badge-amber">Chưa Có Mapping</span>',
    'UNKNOWN_GIFT': '<span class="badge badge-amber">Quà Chưa Rõ</span>',
    'QUEUED': '<span class="badge badge-blue">Đang Chờ</span>',
    'COOLDOWN': '<span class="badge badge-gold">Hồi Chiêu</span>'
  };

  tbody.innerHTML = filtered.slice(0, 50).map(ev => {
    const timeStr = new Date(ev.timestamp || Date.now()).toLocaleTimeString();
    const isMock = ev.source === 'mock' || !!ev.isMock;
    const sourceBadge = isMock
      ? '<span class="badge" style="background: rgba(192,132,252,0.15); color: #c084fc; border: 1px solid rgba(192,132,252,0.3);">🧪 Mock Sim</span>'
      : '<span class="badge badge-green">🟢 Real LIVE</span>';
    const rawStatus = (ev.status || ev.pipelineStatus || 'EXECUTED').toUpperCase();
    const statusHtml = STATUS_BADGES[rawStatus] || `<span class="badge">${rawStatus}</span>`;
    const actionVal = ev.action || ev.actionExecuted;
    const actionCode = actionVal ? `<code>${actionVal}</code>` : '<span style="color:#64748b;">–</span>';
    const gameLabel = ev.gameType || ev.targetGame || ev.activeGame || '–';
    const senderName = ev.sender || ev.viewerNick || 'Khán giả';

    return `<tr>
      <td style="font-family: monospace; font-size: 11px; color: #94a3b8;">${timeStr}</td>
      <td>${sourceBadge}</td>
      <td><strong>${senderName}</strong></td>
      <td>🎁 <strong>${ev.giftName}</strong> <small style="color:#64748b;">(ID: ${ev.giftId || '?'})</small></td>
      <td><span class="badge badge-gold">x${ev.count || 1}</span></td>
      <td>${gameLabel} ➔ ${actionCode}</td>
      <td>${statusHtml}</td>
    </tr>`;
  }).join('');
}

async function resetAnalyticsData() {
  const confirmed = await showConfirmModal({
    title: 'Đặt Lại Thống Kê & Nhật Ký',
    subtitle: 'Pipeline & Gift Monitor',
    message: 'Bạn có chắc muốn đặt lại toàn bộ thống kê quà và nhật ký pipeline của phiên này?',
    confirmText: 'Đặt Lại',
    cancelText: 'Hủy',
    icon: '🔄',
    variant: 'warning'
  });
  if (!confirmed) return;
  playSound('warn');
  try {
    const res = await fetch('/api/gift-analytics/reset', { method: 'POST', headers: authHeaders() });
    if (res.ok) {
      showToast('🔄 Đã đặt lại toàn bộ thống kê quà & pipeline', 'info');
      fetchGiftAnalytics();
    }
  } catch (e) {
    showToast('❌ Lỗi kết nối khi đặt lại thống kê', 'error');
  }
}

function fetchGiftControlData() {
  fetchCatalogGifts();
  fetchGiftMappings();
  fetchGiftAnalytics();
  fetchInteractiveTriggers();
  onMappingGameChange();
}

// --- 8.5 Interactive Audience Triggers & Heart Goal Milestone Engine ---
let interactiveTriggersCache = {};
let currentTriggerGame = 'quiz-show';

const GAME_TRIGGER_ACTIONS = {
  'quiz-show': [
    { value: 'quiz_show.hint_5050', label: 'Gợi ý 50:50 (Loại 2 đáp án sai)' },
    { value: 'quiz_show.hint_one', label: 'Loại bỏ 1 đáp án sai' },
    { value: 'quiz_show.add_time', label: 'Cộng thêm 10 giây suy nghĩ (+10s)' },
    { value: 'quiz_show.double_points', label: 'Nhân đôi điểm thưởng vòng này (x2)' },
  ],
  'duoi-hinh-bat-chu': [
    { value: 'rebus.hint', label: 'Mở 1 ký tự gợi ý ô chữ' },
    { value: 'rebus.add_time', label: 'Gia hạn thêm 15 giây (+15s)' },
    { value: 'rebus.bonus_score', label: 'Cộng 50 điểm thưởng' },
  ],
  'english-class': [
    { value: 'english_class.hint_5050', label: 'Gợi ý 50:50 cho cả lớp' },
    { value: 'english_class.add_time', label: 'Cộng thêm 10 giây suy nghĩ (+10s)' },
    { value: 'english_class.teacher_dance', label: 'Cô giáo nhảy múa cổ vũ' },
  ],
  'cat-cafe': [
    { value: 'cat_cafe.dance', label: 'Mèo quẩy Disco tập thể' },
    { value: 'cat_cafe.zoomies', label: 'Mèo chạy tăng động (Zoomies)' },
    { value: 'cat_cafe.bath', label: 'Tắm bọt xà phòng' },
    { value: 'cat_cafe.add_purrs', label: 'Cộng 100 điểm Purr' },
  ],
  'mini-war': [
    { value: 'boost_team', label: 'Tăng tốc Morale sĩ khí toàn quân' },
    { value: 'heal_team', label: 'Hồi phục máu thành trì (+HP)' },
    { value: 'spawn_unit', label: 'Triệu hồi quân chi viện' },
  ],
};

async function fetchInteractiveTriggers(gameType) {
  try {
    const q = gameType ? `?gameType=${gameType}` : '';
    const res = await fetch(`/api/interactive-triggers${q}`);
    if (res.ok) {
      const data = await res.json();
      if (data.triggers) {
        if (gameType && data.triggers.likeGoal) {
          interactiveTriggersCache[gameType] = data.triggers;
        } else if (!gameType) {
          interactiveTriggersCache = data.triggers;
        }
      }
    }
  } catch (e) {
    console.warn('Lỗi tải interactive triggers:', e);
  }
  populateTriggerForm(currentTriggerGame);
  renderTriggerOverviewTable();
}

function switchTriggerGame(game) {
  currentTriggerGame = game;
  playSound('click');
  document.querySelectorAll('[id^="btn-trig-filter-"]').forEach(btn => {
    btn.classList.toggle('active-filter-btn', btn.id.endsWith(game === 'duoi-hinh-bat-chu' ? 'dh' : (game === 'english-class' ? 'ec' : (game === 'cat-cafe' ? 'cat' : (game === 'mini-war' ? 'mw' : 'quiz')))));
  });
  const sel = document.getElementById('select-trig-game');
  if (sel) sel.value = game;
  populateTriggerForm(game);
}

function onTriggerGameSelectChange() {
  const sel = document.getElementById('select-trig-game');
  if (sel) {
    switchTriggerGame(sel.value);
  }
}

function populateTriggerForm(game) {
  const trig = interactiveTriggersCache[game] || {
    gameType: game,
    likeGoal: {
      enabled: true,
      targetCount: 10,
      action: (GAME_TRIGGER_ACTIONS[game] && GAME_TRIGGER_ACTIONS[game][0]?.value) || 'quiz_show.hint_5050',
      resetMode: 'per_round',
      ttsAnnouncement: 'Khán giả đã thả đủ {count} tim!',
    }
  };

  const lg = trig.likeGoal || {};

  const enabledSel = document.getElementById('select-trig-enabled');
  if (enabledSel) enabledSel.value = String(lg.enabled !== false);

  const targetInput = document.getElementById('input-trig-target');
  if (targetInput) targetInput.value = lg.targetCount || 10;

  const resetSel = document.getElementById('select-trig-reset');
  if (resetSel) resetSel.value = lg.resetMode || 'per_round';

  const ttsInput = document.getElementById('input-trig-tts');
  if (ttsInput) ttsInput.value = lg.ttsAnnouncement || '';

  const actionSel = document.getElementById('select-trig-action');
  if (actionSel) {
    const list = GAME_TRIGGER_ACTIONS[game] || [];
    actionSel.innerHTML = list.map(a => `<option value="${a.value}">${a.label} (${a.value})</option>`).join('');
    if (lg.action) actionSel.value = lg.action;
  }
}

async function saveCurrentTriggerConfig() {
  playSound('click');
  const game = currentTriggerGame;
  const enabled = document.getElementById('select-trig-enabled')?.value === 'true';
  const targetCount = Number(document.getElementById('input-trig-target')?.value) || 10;
  const action = document.getElementById('select-trig-action')?.value || 'quiz_show.hint_5050';
  const actionLabel = document.getElementById('select-trig-action')?.selectedOptions[0]?.text || '';
  const resetMode = document.getElementById('select-trig-reset')?.value || 'per_round';
  const ttsAnnouncement = document.getElementById('input-trig-tts')?.value || '';

  const payload = {
    gameType: game,
    gameName: getGameNameLabel(game),
    likeGoal: {
      enabled,
      targetCount,
      action,
      actionLabel,
      resetMode,
      ttsAnnouncement,
    }
  };

  try {
    const res = await fetch('/api/interactive-triggers/save', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ config: payload }),
    });
    if (res.ok) {
      interactiveTriggersCache[game] = payload;
      showToast(`💾 Đã lưu cấu hình tương tác cho [${getGameNameLabel(game)}] thành công!`, 'success');
      renderTriggerOverviewTable();
    } else {
      showToast('❌ Lỗi lưu cấu hình tương tác', 'error');
    }
  } catch (e) {
    showToast('❌ Không thể kết nối tới Bridge API', 'error');
  }
}

function renderTriggerOverviewTable() {
  const tbody = document.getElementById('trigger-overview-tbody');
  if (!tbody) return;

  const games = ['quiz-show', 'duoi-hinh-bat-chu', 'english-class', 'cat-cafe', 'mini-war'];
  const rowsHtml = games.map(g => {
    const trig = interactiveTriggersCache[g] || {};
    const lg = trig.likeGoal || {};
    const isEnabled = lg.enabled !== false;
    const count = lg.targetCount || 10;
    const actionLabel = lg.actionLabel || lg.action || 'Gợi ý';
    const reset = lg.resetMode === 'per_session' ? 'Mỗi phiên' : 'Mỗi câu/vòng';

    return `
      <tr>
        <td><strong>${getGameIcon(g)} ${getGameNameLabel(g)}</strong></td>
        <td><span class="badge badge-purple">❤️ Thả Tim (Tap Màn Hình)</span></td>
        <td><strong style="color: #f43f5e;">${count} tim</strong></td>
        <td><span style="color: #38bdf8;">${actionLabel}</span></td>
        <td><small style="color: #94a3b8;">${reset}</small></td>
        <td>
          <span class="badge ${isEnabled ? 'badge-green' : 'badge-red'}">
            ${isEnabled ? '✅ BẬT' : '❌ TẮT'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn-outline" style="font-size: 10px; padding: 2px 6px;" onclick="simulateTapHeart(1, '${g}')">❤️ +1</button>
            <button class="btn-gold" style="font-size: 10px; padding: 2px 6px;" onclick="simulateReachHeartMilestone('${g}')">🎯 Đạt Mốc</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rowsHtml;
}

function getGameNameLabel(g) {
  const map = {
    'quiz-show': 'PTPlay Quiz Show',
    'duoi-hinh-bat-chu': 'Đuổi Hình Bắt Chữ',
    'english-class': 'Lớp Học Vui LIVE',
    'cat-cafe': 'Café Mòe LIVE',
    'mini-war': 'Mini War Arena',
  };
  return map[g] || g;
}

function getGameIcon(g) {
  const map = {
    'quiz-show': '🏆',
    'duoi-hinh-bat-chu': '💡',
    'english-class': '🎓',
    'cat-cafe': '🐱',
    'mini-war': '⚔️',
  };
  return map[g] || '🎮';
}

async function simulateTapHeart(count = 1, targetGame = null) {
  const game = targetGame || currentTriggerGame;
  playSound('click');
  try {
    const res = await fetch('/api/interactive-triggers/trigger', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ gameType: game, count, nickname: 'KhánGiảTap' }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`❤️ Đã gửi +${count} lượt thả tim tới [${getGameNameLabel(game)}]!`, 'info');
    }
  } catch (e) {
    showToast('Lỗi gửi lượt thả tim', 'error');
  }
}

async function simulateReachHeartMilestone(targetGame = null) {
  const game = targetGame || currentTriggerGame;
  const cfg = interactiveTriggersCache[game];
  const targetCount = cfg?.likeGoal?.targetCount || 10;
  playSound('celebrate');
  try {
    const res = await fetch('/api/interactive-triggers/trigger', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ gameType: game, count: targetCount, nickname: 'FanCứngĐạiGia' }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🎯 Đã kích hoạt đạt mốc ${targetCount} tim cho [${getGameNameLabel(game)}]!`, 'success');
    }
  } catch (e) {
    showToast('Lỗi kích hoạt mốc tim', 'error');
  }
}

// --- 9. Queue & Traffic Tuning ---
async function updateQueueConfig() {
  const cap = Number(document.getElementById('range-queue-cap').value) || 35;
  const interval = Number(document.getElementById('range-queue-interval').value) || 200;
  const policy = document.getElementById('select-queue-policy').value;

  await fetch('/api/queue/config', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ maxUnitsPerTeam: cap, batchIntervalMs: interval, overflowPolicy: policy }),
  });
  showToast('⚙️ Đã lưu cấu hình hàng đợi', 'success');
  fetchStatus();
}

// --- 10. Simulator & Diagnostic Prober ---
async function sendMockChat(gameType, customNick, customComment) {
  const isEc = gameType === 'english' || gameType === 'english-class';
  const isCat = gameType === 'cat' || gameType === 'cat-cafe' || gameType === 'catcafe';
  const isQuiz = gameType === 'quiz' || gameType === 'quiz-show';
  const isRebus = gameType === 'rebus' || gameType === 'duoi-hinh-bat-chu';

  const nick = customNick || (isEc ? 'Mai Lan' : (isCat ? 'BéMèoXinh' : (isQuiz ? 'Thí Sinh Pro' : (isRebus ? 'Thám Tử Chibi' : 'ChiếnBinhThầnTốc'))));
  const comment = customComment || (isEc ? 'JOIN' : (isCat ? 'MÈO' : (isQuiz ? 'JOIN' : (isRebus ? 'CÁ VÀNG' : 'ĐỎ CỐ LÊN'))));
  
  let endpoint = '/api/mock/chat';
  if (isEc) endpoint = '/api/english/mock/chat';
  else if (isCat) endpoint = '/api/catcafe/mock/chat';
  else if (isQuiz) endpoint = '/api/quiz/mock/chat';
  else if (isRebus) endpoint = '/api/rebus/mock/chat';

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ nickname: nick, comment }),
    });
    showToast(`💬 Chat [${nick}]: "${comment}"`, 'info');
    fetchStatus();
    fetchSpectators();
    fetchRawLogs();
  } catch (e) {}
}

async function sendMockGift(gameType, giftName, count = 1, customNickname = undefined) {
  const isEc = gameType === 'english' || gameType === 'english-class';
  const isCat = gameType === 'cat' || gameType === 'cat-cafe';
  const isQuiz = gameType === 'quiz' || gameType === 'quiz-show';
  const isRebus = gameType === 'rebus' || gameType === 'duoi-hinh-bat-chu';

  const defaultNick = isEc ? 'PhụHuynhVIP' : (isCat ? 'MèoMêĂn' : (isQuiz ? 'ĐạiGiaNeon' : (isRebus ? 'TrùmĐoánChữ' : 'ĐạiGiaTikTok')));
  const nick = customNickname || defaultNick;

  let endpoint = '/api/mock/gift';
  if (isEc) endpoint = '/api/english/mock/gift';
  else if (isCat) endpoint = '/api/catcafe/mock/gift';
  else if (isQuiz) endpoint = '/api/quiz/mock/gift';
  else if (isRebus) endpoint = '/api/rebus/mock/gift';

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ nickname: nick, giftName, count }),
    });
    showToast(`🎁 Tặng [${nick}]: ${count}x ${giftName}`, 'success');
    fetchStatus();
    fetchRawLogs();
    fetchGiftAnalytics();
  } catch (e) {}
}

async function sendMockFollow(gameType = 'rebus', customNickname) {
  playSound('click');
  const nick = customNickname || (gameType === 'rebus' ? 'FanMớiBấmFollow' : 'KhánGiảBấmFollow');
  try {
    const res = await fetch('/api/mock/follow', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ game: gameType, nickname: nick }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`➕ [TikTok Follow] ${nick} vừa bấm Follow kênh!`, 'success');
      fetchStatus();
      fetchRawLogs();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function sendMockLike(gameType = 'rebus', count = 20, customNickname = undefined) {
  playSound('click');
  const nick = customNickname || (gameType === 'rebus' ? 'KhánGiảThảTim' : 'FanThảTim');
  try {
    const res = await fetch('/api/mock/like', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ game: gameType, nickname: nick, count: count }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`❤️ [TikTok Like] ${nick} vừa thả +${count} tim!`, 'success');
      fetchStatus();
      fetchRawLogs();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function sendCustomMockGift(gameType) {
  playSound('click');
  const nickInput = document.getElementById(`input-${gameType}-gift-nick`);
  const giftSelect = document.getElementById(`select-${gameType}-gift-name`);
  const countInput = document.getElementById(`input-${gameType}-gift-count`);
  const nick = (nickInput && nickInput.value.trim()) || 'ĐạiGiaVIP';
  const gift = (giftSelect && giftSelect.value.trim()) || 'Rose';
  const count = (countInput && parseInt(countInput.value, 10)) || 1;
  await sendMockGift(gameType, gift, count, nick);
}

// --- 10.1 Quiz Show Specific Actions ---
async function sendQuizCommand(action, metadata = {}) {
  playSound('click');
  try {
    const res = await fetch('/api/quiz/command', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🏆 [Quiz Show] Lệnh: ${action}`, 'success');
      fetchStatus();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function sendMockQuizAnswer(choice) {
  const names = ['Ngọc Anh', 'Minh Quân', 'Lan Anh', 'Huy', 'Khánh Vy', 'Bảo Nam'];
  const nick = names[Math.floor(Math.random() * names.length)];
  await sendMockChat('quiz', nick, choice);
}

// --- 10.2 Rebus (Đuổi Hình Bắt Chữ) Specific Actions ---
async function sendRebusCommand(action, metadata = {}) {
  playSound('click');
  try {
    const res = await fetch('/api/rebus/command', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`💡 [Đuổi Hình] Lệnh: ${action}`, 'success');
      fetchStatus();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function sendMockRebusGuess(guess) {
  const names = ['Phan Khánh', 'Cường Bo', 'Mai Trang', 'Hồng Nhung', 'Quang Vinh'];
  const nick = names[Math.floor(Math.random() * names.length)];
  await sendMockChat('rebus', nick, guess);
}

function getRebusJourneyActor() {
  const input = document.getElementById('input-rebus-journey-name');
  const nickname = (input?.value || 'Thám Tử Tí Hon').trim() || 'Thám Tử Tí Hon';
  const userId = 'journey_' + nickname.toLowerCase().replace(/[^a-z0-9]/gi, '_');
  return { userId, nickname };
}

async function testRebusJourneyStep(step) {
  const { userId, nickname } = getRebusJourneyActor();
  if (step === 1) {
    await sendRebusCommand('join', { userId, nickname });
    showToast(`👋 Bước 1: ${nickname} đã vô Sảnh Chờ (ĐANG CHỜ)!`, 'success');
  } else if (step === 2) {
    await sendRebusCommand('follow', { userId, nickname });
    showToast(`🪑 Bước 2: ${nickname} đã đi vô Bàn Nhỏ!`, 'success');
  } else if (step === 3) {
    await sendRebusCommand('test_top5_swap', { userId, nickname });
    showToast(`🚀 Bước 3: ${nickname} đang nhảy lên Đá Bàn Top 5!`, 'success');
  }
}

async function runFullRebusJourney() {
  await testRebusJourneyStep(1);
  setTimeout(() => testRebusJourneyStep(2), 2200);
  setTimeout(() => testRebusJourneyStep(3), 4600);
}

async function testRebusCeremony() {
  playSound('celebrate');
  const mockTopPlayers = [
    {
      userId: 'contestant_huynh_nhu',
      nickname: 'Huỳnh Như ⭐',
      score: 380,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      userId: 'contestant_cuong_bo',
      nickname: 'Cường Bo 🥈',
      score: 260,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      userId: 'contestant_mai_trang',
      nickname: 'Mai Trang 🥉',
      score: 190,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  ];
  await sendRebusCommand('ceremony', { topPlayers: mockTopPlayers });
  showToast('🏆 Đã kích hoạt Lễ Vinh Danh 30 Câu mẫu (Huỳnh Như, Cường Bo, Mai Trang)!', 'success');
}

// --- 10.1 English Class Live Specific Actions ---
async function sendEcCommand(action, metadata = {}) {
  playSound('click');
  try {
    const res = await fetch('/api/english/command', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ action, metadata }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🎓 [Lớp Học Vui] Lệnh: ${action}`, 'success');
      fetchStatus();
    }
  } catch (e) {
    showToast(`Lỗi: ${e.message}`, 'error');
  }
}

async function sendMockAnswer(answer) {
  const names = ['Mai Lan', 'Tuấn Anh', 'Thảo My', 'Minh Trí', 'Hương Giang', 'Bảo Long', 'Hồng Phúc'];
  const nick = names[Math.floor(Math.random() * names.length)];
  await sendMockChat('english', nick, answer);
}

async function joinMockStudents(count = 5) {
  const sampleNames = [
    'Mai Lan', 'Minh Trí', 'Thu Hằng', 'Bảo Nam', 'Ngọc Ánh',
    'Hoàng Long', 'Thảo My', 'Tuấn Anh', 'Phương Thảo', 'Quang Huy',
    'Hương Giang', 'Hải Đăng', 'Thanh Trúc', 'Đức Anh', 'Hồng Phúc',
    'Thùy Linh', 'Văn Hùng', 'Khánh Linh', 'Tấn Phát', 'Minh Châu',
    'Quốc Bảo', 'Bích Ngọc', 'Trung Kiên', 'Yến Nhi', 'Gia Huy'
  ];
  playSound('success');
  showToast(`🎒 Đang cho ${count} học sinh bước vào lớp...`, 'info');
  for (let i = 0; i < count; i++) {
    const nick = sampleNames[i % sampleNames.length] + (i >= sampleNames.length ? ` ${Math.floor(i / sampleNames.length) + 1}` : '');
    await fetch('/api/english/mock/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ nickname: nick, comment: 'JOIN' }),
    });
  }
  showToast(`✅ Đã cho ${count} học sinh tham gia lớp học!`, 'success');
  fetchStatus();
}

// --- 10.4 Unified TTS Studio & Voice Testing System ---
let adminTtsVoices = [];
let adminAudioUnlocked = false;

const VIETNAMESE_VOICE_PRIORITIES = [
  'hoaimy',
  'namminh',
  'google',
  'linh',
  'mai',
  'an',
];

function normalizeVoiceName(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isVietnameseVoice(voice) {
  if (!voice || !voice.lang) return false;
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  return (
    lang.startsWith('vi') ||
    lang.includes('vi-vn') ||
    lang.includes('vi_vn') ||
    lang.includes('vie') ||
    name.includes('vietnam') ||
    name.includes('tiếng việt') ||
    name.includes('hoài my') ||
    name.includes('nam minh')
  );
}

function initAdminTts() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    const badge = document.getElementById('badge-tts-status');
    if (badge) {
      badge.className = 'badge badge-red';
      badge.innerText = 'NO TTS SUPPORT';
    }
    return;
  }

  // Voice list loading
  refreshAdminVoices();
  window.speechSynthesis.onvoiceschanged = () => refreshAdminVoices();

  // Auto-save listeners on change
  const select = document.getElementById('select-tts-voice');
  const rateInput = document.getElementById('slider-tts-rate');
  const pitchInput = document.getElementById('slider-tts-pitch');
  const volumeInput = document.getElementById('slider-tts-volume');
  const targetGame = document.getElementById('select-tts-target-game');

  let sliderTimer;
  const triggerAutoSave = () => {
    clearTimeout(sliderTimer);
    sliderTimer = setTimeout(() => saveTtsVoiceToGame(false), 250);
  };

  if (select) {
    select.addEventListener('change', () => {
      updateTopVoiceIndicator(select.value);
      updateVoiceSupportHint(select.value);
      saveTtsVoiceToGame(false);
    });
  }
  if (rateInput) {
    rateInput.addEventListener('input', () => updateTtsSliderLabel('rate'));
    rateInput.addEventListener('change', triggerAutoSave);
  }
  if (pitchInput) {
    pitchInput.addEventListener('input', () => updateTtsSliderLabel('pitch'));
    pitchInput.addEventListener('change', triggerAutoSave);
  }
  if (volumeInput) {
    volumeInput.addEventListener('input', () => updateTtsSliderLabel('volume'));
    volumeInput.addEventListener('change', triggerAutoSave);
  }
  if (targetGame) targetGame.addEventListener('change', () => saveTtsVoiceToGame(false));
}

function isServerAudioVoice(voiceName) {
  return (
    voiceName === 'google-chigoogle' ||
    (typeof voiceName === 'string' && (voiceName.startsWith('edge-') || /Neural$/i.test(voiceName)))
  );
}

const SERVER_VOICE_LABELS = {
  'edge-hoaimy': { title: '✨ Hoài My (Nữ AI)', gender: '👩 Nữ', lang: 'vi-VN', color: '#ec4899' },
  'edge-namminh': { title: '✨ Nam Minh (Nam AI)', gender: '👨 Nam', lang: 'vi-VN', color: '#38bdf8' },
  'google-chigoogle': { title: '🌟 Chị Google (Nữ)', gender: '👩 Nữ', lang: 'vi-VN', color: '#38bdf8' },
  'edge-jenny': { title: '✨ Jenny (Nữ EN)', gender: '👩 Nữ', lang: 'en-US', color: '#34d399' },
  'edge-guy': { title: '✨ Guy (Nam EN)', gender: '👨 Nam', lang: 'en-US', color: '#34d399' },
};

function updateTopVoiceIndicator(voiceOrName) {
  const viNameEl = document.getElementById('lbl-vi-voice-name');
  if (!viNameEl) return;
  if (!voiceOrName) {
    viNameEl.innerText = 'Chưa chọn giọng';
    viNameEl.style.color = '#fbbf24';
    return;
  }
  const name = typeof voiceOrName === 'string' ? voiceOrName : (voiceOrName.name || '');
  const srv = SERVER_VOICE_LABELS[name];
  if (srv) {
    viNameEl.innerText = srv.title;
    viNameEl.style.color = srv.color;
    return;
  }
  const norm = normalizeVoiceName(name);
  const isFemale = norm.includes('hoaimy') || norm.includes('linh') || norm.includes('mai');
  const isMale = norm.includes('an') || norm.includes('namminh');
  const genderLabel = isFemale ? '👩 Nữ' : (isMale ? '👨 Nam' : '');
  viNameEl.innerText = `${name} ${genderLabel}`.trim();
  viNameEl.style.color = '#34d399';
}

function updateVoiceSupportHint(voiceName) {
  const hintEl = document.getElementById('tts-voice-support-hint');
  if (!hintEl) return;
  if (isServerAudioVoice(voiceName)) {
    hintEl.innerHTML = `✨ <strong>Server Audio:</strong> Tạo MP3 từ Bridge, chạy đồng nhất trên mọi máy & trình duyệt.`;
    return;
  }
  const isOnline = (voiceName || '').toLowerCase().includes('online') || (voiceName || '').toLowerCase().includes('natural');
  if (isOnline) {
    hintEl.innerHTML = `☁️ <strong>Giọng trình duyệt:</strong> Cần mạng & trình duyệt hỗ trợ (nếu lỗi hãy chọn Hoài My AI).`;
  } else {
    hintEl.innerHTML = `🛡️ <strong>Giọng cài sẵn trên máy:</strong> Chạy offline, phụ thuộc gói ngôn ngữ Windows.`;
  }
}

function refreshAdminVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  adminTtsVoices = window.speechSynthesis.getVoices();

  const select = document.getElementById('select-tts-voice');
  const countEl = document.getElementById('lbl-voice-count');
  const viNameEl = document.getElementById('lbl-vi-voice-name');

  const viVoices = adminTtsVoices.filter(isVietnameseVoice);
  const enVoices = adminTtsVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));

  if (countEl) {
    countEl.innerText = `${viVoices.length + 3} Việt · ${enVoices.length + 2} Anh`;
  }

  // Check saved voice in localStorage
  let savedVoiceName = '';
  try {
    const raw = localStorage.getItem('ptplay_tts_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.voiceName) savedVoiceName = parsed.voiceName;
    }
  } catch {}

  // Resolve active voice: saved server voice -> saved local voice -> default 'edge-hoaimy' (cross-device!)
  let bestViVoice = null;
  if (isServerAudioVoice(savedVoiceName)) {
    bestViVoice = { name: savedVoiceName, lang: SERVER_VOICE_LABELS[savedVoiceName]?.lang || 'vi-VN' };
  } else if (savedVoiceName) {
    bestViVoice = viVoices.find(v => v.name === savedVoiceName || normalizeVoiceName(v.name).includes(normalizeVoiceName(savedVoiceName)));
  }

  if (!bestViVoice) {
    bestViVoice = { name: 'edge-hoaimy', lang: 'vi-VN' };
  }

  if (viNameEl) {
    updateTopVoiceIndicator(bestViVoice);
  }

  if (!select) return;
  select.innerHTML = '';

  const optGroupVi = document.createElement('optgroup');
  optGroupVi.label = '🇻🇳 Tiếng Việt';

  const serverViOptions = [
    { value: 'edge-hoaimy', text: '✨ Hoài My — Nữ AI (Chạy mọi máy)' },
    { value: 'edge-namminh', text: '✨ Nam Minh — Nam AI (Chạy mọi máy)' },
    { value: 'google-chigoogle', text: '🌟 Chị Google — Nữ (Chạy mọi máy)' },
  ];
  serverViOptions.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.text;
    if (bestViVoice && bestViVoice.name === item.value) {
      opt.selected = true;
    }
    optGroupVi.appendChild(opt);
  });

  viVoices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const norm = normalizeVoiceName(v.name);
    const isFemale = norm.includes('hoaimy') || norm.includes('linh') || norm.includes('mai');
    const isMale = norm.includes('an') || norm.includes('namminh');
    const gender = isFemale ? '👩 Nữ' : (isMale ? '👨 Nam' : v.lang);
    opt.textContent = `${v.name.replace(' - Vietnamese (Vietnam)', '')} (${gender})`;
    if (bestViVoice && v.name === bestViVoice.name) {
      opt.selected = true;
    }
    optGroupVi.appendChild(opt);
  });
  select.appendChild(optGroupVi);

  const optGroupEn = document.createElement('optgroup');
  optGroupEn.label = '🇺🇸 English';
  [
    { value: 'edge-jenny', text: '✨ Jenny — Nữ EN (Chạy mọi máy)' },
    { value: 'edge-guy', text: '✨ Guy — Nam EN (Chạy mọi máy)' },
  ].forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.text;
    if (bestViVoice && bestViVoice.name === item.value) opt.selected = true;
    optGroupEn.appendChild(opt);
  });
  enVoices.slice(0, 15).forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    optGroupEn.appendChild(opt);
  });
  select.appendChild(optGroupEn);

  if (select.value) {
    updateVoiceSupportHint(select.value);
  }
}

async function saveTtsVoiceToGame(showNotification = true) {
  if (showNotification) playSound('click');
  const voiceSelect = document.getElementById('select-tts-voice');
  const voiceName = voiceSelect?.value || '';
  const rate = parseFloat(document.getElementById('slider-tts-rate')?.value || '1.05');
  const pitch = parseFloat(document.getElementById('slider-tts-pitch')?.value || '1.0');
  const volume = parseFloat(document.getElementById('slider-tts-volume')?.value || '80') / 100;
  const lang = document.getElementById('select-tts-lang')?.value || 'vi-VN';
  const targetGame = document.getElementById('select-tts-target-game')?.value || 'all';

  if (!voiceName) {
    if (showNotification) showToast('Vui lòng chọn một giọng đọc trong danh sách', 'warn');
    return;
  }

  const config = { voiceName, rate, pitch, volume, lang, targetGame, updatedAt: Date.now() };

  // 1. Save to localStorage for instant cross-tab sync to games
  try {
    localStorage.setItem('ptplay_tts_config', JSON.stringify(config));
  } catch (e) {
    console.warn('[Admin TTS] localStorage error:', e);
  }

  // 2. Broadcast to GameBridge server & all active games
  try {
    const res = await fetch('/api/tts/config', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (data.success) {
      if (showNotification) {
        showToast(`💾 Đã lưu thành công giọng "${voiceName}" vào game!`, 'success');
      }
      const statusEl = document.getElementById('lbl-voice-save-status');
      if (statusEl) {
        statusEl.innerHTML = `✓ Đã lưu giọng: <strong style="color: #38bdf8;">${voiceName}</strong> (${targetGame.toUpperCase()})`;
        statusEl.style.display = 'inline-block';
      }
    } else {
      if (showNotification) showToast(`Lưu qua Bridge thất bại, đã lưu vào LocalStorage`, 'warn');
    }
  } catch (e) {
    if (showNotification) showToast(`Đã lưu giọng đọc vào LocalStorage trình duyệt`, 'info');
  }
}

function unlockAdminAudio() {
  playSound('click');
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0.01;
      primer.rate = 2.0;
      window.speechSynthesis.speak(primer);
    }
    adminAudioUnlocked = true;
    const lbl = document.getElementById('lbl-audio-unlocked');
    if (lbl) {
      lbl.innerText = '✓ Đã mở khóa hoàn toàn';
      lbl.style.color = '#10b981';
    }
    showToast('🔓 Đã mở khóa âm thanh & Web Speech API thành công!', 'success');
  } catch (e) {
    showToast(`Không thể mở khóa Audio: ${e.message}`, 'warn');
  }
}

function updateTtsSliderLabel(type) {
  if (type === 'rate') {
    const val = document.getElementById('slider-tts-rate')?.value || '1.05';
    const lbl = document.getElementById('val-tts-rate');
    if (lbl) lbl.innerText = `${val}x`;
  } else if (type === 'pitch') {
    const val = document.getElementById('slider-tts-pitch')?.value || '1.0';
    const lbl = document.getElementById('val-tts-pitch');
    if (lbl) lbl.innerText = val;
  } else if (type === 'volume') {
    const val = document.getElementById('slider-tts-volume')?.value || '80';
    const lbl = document.getElementById('val-tts-volume');
    if (lbl) lbl.innerText = `${val}%`;
  }
}

function resetTtsSliders() {
  playSound('click');
  const rateInput = document.getElementById('slider-tts-rate');
  const pitchInput = document.getElementById('slider-tts-pitch');
  const volumeInput = document.getElementById('slider-tts-volume');

  if (rateInput) rateInput.value = '1.05';
  if (pitchInput) pitchInput.value = '1.0';
  if (volumeInput) volumeInput.value = '80';

  updateTtsSliderLabel('rate');
  updateTtsSliderLabel('pitch');
  updateTtsSliderLabel('volume');
  showToast('↺ Đã đặt lại tham số âm thanh mặc định', 'info');
}

function setSampleTtsText(preset) {
  playSound('click');
  const txtArea = document.getElementById('input-tts-custom-text');
  const langSelect = document.getElementById('select-tts-lang');
  if (!txtArea) return;

  if (preset === 'welcome') {
    txtArea.value = 'Chào mừng quý khán giả thân yêu đã đến với phòng livestream PTPlay! Hãy cùng thả tim và bình luận để ủng hộ các người chơi nhé!';
    if (langSelect) langSelect.value = 'vi-VN';
  } else if (preset === 'gift') {
    txtArea.value = 'Ôi tuyệt vời quá! Xin trân trọng cảm ơn đại gia đã gửi tặng Quả Cầu Vũ Trụ! Cả phòng livestream bùng nổ cùng đại tiệc!';
    if (langSelect) langSelect.value = 'vi-VN';
  } else if (preset === 'hype') {
    txtArea.value = 'Thời khắc quyết định đã đến! Hai bên đang giằng co từng giây! Mau mau tương tác tiếp sức để giành chiến thắng nào!';
    if (langSelect) langSelect.value = 'vi-VN';
  } else if (preset === 'english') {
    txtArea.value = 'Welcome everyone to our live classroom interactive show! Get ready for an amazing adventure!';
    if (langSelect) langSelect.value = 'en-US';
  }
}

let currentAdminAudio = null;

function playLocalAdminTts(text, customLang = undefined) {
  playSound('click');

  const rawText = text || document.getElementById('input-tts-custom-text')?.value || '';
  const cleanText = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 300);
  if (!cleanText) {
    showToast('Vui lòng nhập nội dung cần đọc', 'warn');
    return;
  }

  const voiceName = document.getElementById('select-tts-voice')?.value || 'edge-hoaimy';
  const rateVal = parseFloat(document.getElementById('slider-tts-rate')?.value || '1.05');
  const pitchVal = parseFloat(document.getElementById('slider-tts-pitch')?.value || '1.0');
  const volumeVal = parseFloat(document.getElementById('slider-tts-volume')?.value || '80') / 100;
  const safeRate = isNaN(rateVal) ? 1.05 : rateVal;
  const safePitch = isNaN(pitchVal) ? 1.0 : pitchVal;
  const safeVolume = isNaN(volumeVal) ? 0.8 : volumeVal;

  if (currentAdminAudio) {
    try {
      currentAdminAudio.pause();
      currentAdminAudio = null;
    } catch {}
  }

  // 1. Giọng Server-side Audio (Edge AI Hoài My / Nam Minh / Jenny / Guy hoặc Chị Google)
  if (isServerAudioVoice(voiceName)) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const langCode = customLang || (voiceName === 'edge-jenny' || voiceName === 'edge-guy' ? 'en' : 'vi');
    const url = `/api/tts/audio?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(langCode)}&voice=${encodeURIComponent(voiceName)}&rate=${safeRate}&pitch=${safePitch}`;
    const audio = new Audio(url);
    currentAdminAudio = audio;
    audio.volume = Math.max(0, Math.min(1, safeVolume));
    const label = SERVER_VOICE_LABELS[voiceName]?.title || voiceName;
    showToast(`🔊 [${label}] Đang phát: "${cleanText.slice(0, 45)}..."`, 'info');
    audio.onerror = () => {
      showToast(`⚠️ Server TTS (${label}) không phản hồi. Hãy kiểm tra GameBridge (8088) & kết nối mạng!`, 'warn');
    };
    audio.play().catch(e => {
      console.warn('Audio play error:', e);
      showToast('⚠️ Click chuột vào trang để mở khóa âm thanh!', 'warn');
    });
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    showToast('Trình duyệt không hỗ trợ Web Speech Synthesis', 'error');
    return;
  }

  // 2. Web Speech API chuẩn — delay 80ms sau cancel để tránh lỗi 'interrupted' trên Chromium / Edge
  window.speechSynthesis.cancel();
  const lang = customLang || document.getElementById('select-tts-lang')?.value || 'vi-VN';

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;

    if (!adminTtsVoices || adminTtsVoices.length === 0) {
      adminTtsVoices = window.speechSynthesis.getVoices();
    }

    if (voiceName && adminTtsVoices.length > 0) {
      const chosen = adminTtsVoices.find(
        v => v.name === voiceName || normalizeVoiceName(v.name).includes(normalizeVoiceName(voiceName))
      );
      if (chosen) {
        utterance.voice = chosen;
        utterance.lang = chosen.lang || lang;
      }
    } else if (lang.startsWith('vi')) {
      const vi = adminTtsVoices.find(isVietnameseVoice);
      if (vi) utterance.voice = vi;
    }

    utterance.rate = isNaN(rateVal) ? 1.05 : rateVal;
    utterance.pitch = isNaN(pitchVal) ? 1.0 : pitchVal;
    utterance.volume = isNaN(volumeVal) ? 0.8 : volumeVal;

    utterance.onstart = () => {
      showToast(`🔊 Đang phát: "${cleanText.slice(0, 45)}..."`, 'info');
    };

    utterance.onerror = (e) => {
      console.warn('[Admin TTS] Speak error:', e);
      // KHÔNG tự động fallback sang Chị Google hay An
      showToast(`⚠️ Không thể phát âm thanh: ${e.error || 'Lỗi giọng nói'}`, 'warn');
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }, 80);
}

async function broadcastGameTts(targetGame, text, customLang = undefined) {
  playSound('click');
  let game = targetGame;
  if (!game || game === 'active') {
    game = currentActiveGame;
  }

  const rawText = text || document.getElementById('input-tts-custom-text')?.value || '';
  const cleanText = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 300);
  if (!cleanText) {
    showToast('Vui lòng nhập nội dung cần phát', 'warn');
    return;
  }

  const lang = customLang || document.getElementById('select-tts-lang')?.value || 'vi-VN';
  const voiceName = document.getElementById('select-tts-voice')?.value || '';
  const rateVal = parseFloat(document.getElementById('slider-tts-rate')?.value || '1.05');
  const pitchVal = parseFloat(document.getElementById('slider-tts-pitch')?.value || '1.0');
  const volumeVal = parseFloat(document.getElementById('slider-tts-volume')?.value || '80') / 100;

  const ttsMeta = {
    text: cleanText,
    message: cleanText,
    lang,
    voiceName,
    voice: voiceName,
    rate: isNaN(rateVal) ? 1.05 : rateVal,
    pitch: isNaN(pitchVal) ? 1.0 : pitchVal,
    volume: isNaN(volumeVal) ? 0.8 : volumeVal,
  };

  try {
    let endpoint = '/api/game/command';
    let payload = { action: 'tts_speak', metadata: ttsMeta };

    if (game === 'all') {
      endpoint = '/api/tts/broadcast';
      payload = ttsMeta;
    } else if (game === 'cat-cafe' || game === 'cat') {
      endpoint = '/api/catcafe/command';
      payload = { action: 'cat_cafe.tts_speak', metadata: ttsMeta };
    } else if (game === 'english-class' || game === 'english') {
      endpoint = '/api/english/command';
      payload = { action: 'english_class.tts_speak', metadata: ttsMeta };
    } else if (game === 'quiz-show' || game === 'quiz') {
      endpoint = '/api/quiz/command';
      payload = { action: 'quiz_show.tts_speak', metadata: ttsMeta };
    } else if (game === 'duoi-hinh-bat-chu' || game === 'rebus') {
      endpoint = '/api/rebus/command';
      payload = { action: 'rebus.tts_speak', metadata: ttsMeta };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🚀 [${game.toUpperCase()}] Đã phát giọng: "${cleanText.slice(0, 40)}..."`, 'success');
      fetchRawLogs();
    } else {
      showToast(`Lỗi phát giọng: ${data.error || 'Thất bại'}`, 'error');
    }
  } catch (e) {
    showToast(`Lỗi kết nối GameBridge: ${e.message}`, 'error');
  }
}

function testLocalAdminTts() {
  const txt = document.getElementById('input-tts-custom-text')?.value;
  const lang = document.getElementById('select-tts-lang')?.value;
  playLocalAdminTts(txt, lang);
}

function broadcastCurrentTts() {
  const target = document.getElementById('select-tts-target-game')?.value || 'active';
  const txt = document.getElementById('input-tts-custom-text')?.value;
  const lang = document.getElementById('select-tts-lang')?.value;
  broadcastGameTts(target, txt, lang);
}

function stopAdminTts() {
  playSound('warn');
  if (currentAdminAudio) {
    try {
      currentAdminAudio.pause();
      currentAdminAudio = null;
    } catch {}
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  showToast('⏹ Đã dừng phát mọi giọng nói!', 'warn');
}

async function toggleAutoSim() {
  playSound('click');
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
    let text = '🩺 Báo Cáo Chẩn Đoán:\n';
    text += `• TikFinity (Port 21213): ${probe.tikfinityPort.open ? '✅ ' + probe.tikfinityWs.message : '❌ ' + probe.tikfinityPort.message}\n`;
    text += `• Game Client: ${probe.gameClient.connected ? '✅ Đã kết nối (' + probe.gameClient.clientsCount + ')' : '⚠️ ' + probe.gameClient.message}\n`;
    if (probe.recommendations && probe.recommendations.length > 0) {
      text += `\n💡 Khuyến nghị:\n` + probe.recommendations.map((r) => `  - ${r}`).join('\n');
    }
    if (alertBox) alertBox.innerText = text;
  } catch (e) {
    if (alertBox) alertBox.innerText = `Lỗi probe: ${e.message}`;
  }
}

// --- 10.5 Shared Music Manager & Livestream Audio Mixer ---
let isGlobalBgmMuted = false;
let gameMuteStates = {
  'cat-cafe': false,
  'mini-war': false,
  'english-class': false,
  'quiz-show': false,
  'duoi-hinh-bat-chu': false,
};

const DEFAULT_VOLUMES = {
  master: 0.35,
  'cat-cafe': 0.28,
  'mini-war': 0.32,
  'english-class': 0.26,
  'quiz-show': 0.28,
  'duoi-hinh-bat-chu': 0.28,
};

const GAME_MUSIC_NAMES = {
  'cat-cafe': 'Café Mòe',
  'mini-war': 'Mini War Arena',
  'english-class': 'English Class LIVE',
  'quiz-show': 'Đố Vui Có Thưởng',
  'duoi-hinh-bat-chu': 'Đuổi Hình Bắt Chữ',
};

async function sendMusicControl(payload) {
  try {
    const res = await fetch('/api/music/control', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[MusicControl] Request failed:', err);
    return null;
  }
}

function initAdminMusic() {
  // 1. Restore Master Volume
  const savedMaster = localStorage.getItem('ptplay_master_bgm_vol');
  const masterVal = savedMaster ? Number(savedMaster) / 100 : DEFAULT_VOLUMES.master;
  const masterSlider = document.getElementById('slider-master-bgm');
  const masterLbl = document.getElementById('lbl-master-bgm');
  if (masterSlider) masterSlider.value = Math.round(masterVal * 100);
  if (masterLbl) masterLbl.innerText = `${Math.round(masterVal * 100)}%`;

  // 2. Restore Game Volumes
  const gameIds = ['cat-cafe', 'mini-war', 'english-class', 'quiz-show', 'duoi-hinh-bat-chu'];
  for (const g of gameIds) {
    const saved = localStorage.getItem('ptplay_vol_' + g);
    const vol = saved ? Number(saved) / 100 : (DEFAULT_VOLUMES[g] || 0.3);
    const slider = document.getElementById(`slider-vol-${g}`);
    const lbl = document.getElementById(`lbl-vol-${g}`);
    if (slider) slider.value = Math.round(vol * 100);
    if (lbl) lbl.innerText = `${Math.round(vol * 100)}%`;
  }

  // 3. Restore OBS Audio Protection
  const obsProtection = localStorage.getItem('ptplay_obs_only_audio') === 'true';
  const obsChk = document.getElementById('chk-obs-only-audio');
  if (obsChk) obsChk.checked = obsProtection;

  // 4. Setup Preview Player
  const player = document.getElementById('admin-audio-player');
  if (player) {
    player.volume = 0.3;
    player.addEventListener('play', () => {
      const icon = document.getElementById('icon-preview-playing');
      if (icon) icon.innerText = '🔊';
    });
    player.addEventListener('pause', () => {
      const icon = document.getElementById('icon-preview-playing');
      if (icon) icon.innerText = '🎧';
    });
    player.addEventListener('ended', () => {
      const icon = document.getElementById('icon-preview-playing');
      if (icon) icon.innerText = '🎧';
    });
  }
}

// Master Volume Controls
function onMasterVolumeInput(val) {
  const lbl = document.getElementById('lbl-master-bgm');
  if (lbl) lbl.innerText = `${val}%`;
}

async function onMasterVolumeChange(val) {
  await setMasterBgmVolume(Number(val) / 100);
}

async function setMasterBgmVolume(volume) {
  const clamped = Math.max(0, Math.min(1, Number(volume)));
  const pct = Math.round(clamped * 100);

  const slider = document.getElementById('slider-master-bgm');
  const lbl = document.getElementById('lbl-master-bgm');
  if (slider) slider.value = pct;
  if (lbl) lbl.innerText = `${pct}%`;

  localStorage.setItem('ptplay_master_bgm_vol', String(pct));
  await sendMusicControl({ game: 'all', action: 'set_volume', volume: clamped });
  showToast(`🔊 Master BGM: ${pct}%`, 'info');
}

async function adjustMasterVolume(delta) {
  playSound('click');
  const slider = document.getElementById('slider-master-bgm');
  const curPct = slider ? Number(slider.value) : 35;
  const newPct = Math.max(0, Math.min(100, Math.round(curPct + delta * 100)));
  await setMasterBgmVolume(newPct / 100);
}

async function toggleMasterMute() {
  playSound('click');
  isGlobalBgmMuted = !isGlobalBgmMuted;
  const btn = document.getElementById('btn-master-mute');
  const btnGlobal = document.getElementById('btn-toggle-global-bgm');

  if (isGlobalBgmMuted) {
    if (btn) {
      btn.innerText = '🔇 Đang Mute Tất Cả';
      btn.classList.add('btn-red');
    }
    if (btnGlobal) btnGlobal.innerText = '🔇 Bật Lại BGM (Đang Mute)';
    showToast('🔇 Đã tắt toàn bộ BGM', 'warning');
  } else {
    if (btn) {
      btn.innerText = '🔊 Bật Toàn Bộ BGM';
      btn.classList.remove('btn-red');
    }
    if (btnGlobal) btnGlobal.innerText = '🔊 Bật / Tắt Toàn Bộ BGM';
    showToast('🔊 Đã bật lại toàn bộ BGM', 'success');
  }

  await sendMusicControl({ game: 'all', action: 'mute', mute: isGlobalBgmMuted });
}

function toggleGlobalBgm() {
  toggleMasterMute();
}

async function resetAllVolumesToDefault() {
  playSound('click');
  await setMasterBgmVolume(DEFAULT_VOLUMES.master);
  const gameIds = ['cat-cafe', 'mini-war', 'english-class', 'quiz-show', 'duoi-hinh-bat-chu'];
  for (const g of gameIds) {
    await setGameVolume(g, DEFAULT_VOLUMES[g] || 0.3);
  }
  showToast('🔄 Đã khôi phục mức âm lượng chuẩn livestream!', 'success');
}

// Per-Game Volume Controls
function onGameVolumeInput(gameId, val) {
  const lbl = document.getElementById(`lbl-vol-${gameId}`);
  if (lbl) lbl.innerText = `${val}%`;
}

async function onGameVolumeChange(gameId, val) {
  await setGameVolume(gameId, Number(val) / 100);
}

async function setGameVolume(gameId, volume) {
  const clamped = Math.max(0, Math.min(1, Number(volume)));
  const pct = Math.round(clamped * 100);

  const slider = document.getElementById(`slider-vol-${gameId}`);
  const lbl = document.getElementById(`lbl-vol-${gameId}`);
  if (slider) slider.value = pct;
  if (lbl) lbl.innerText = `${pct}%`;

  localStorage.setItem('ptplay_vol_' + gameId, String(pct));
  const gameName = GAME_MUSIC_NAMES[gameId] || gameId;

  await sendMusicControl({ game: gameId, action: 'set_volume', volume: clamped });
  showToast(`🎵 [${gameName}] Âm lượng: ${pct}%`, 'info');
}

async function adjustGameVolume(gameId, delta) {
  playSound('click');
  const slider = document.getElementById(`slider-vol-${gameId}`);
  const curPct = slider ? Number(slider.value) : 30;
  const newPct = Math.max(0, Math.min(100, Math.round(curPct + delta * 100)));
  await setGameVolume(gameId, newPct / 100);
}

async function toggleGameMute(gameId) {
  playSound('click');
  const isMuted = !gameMuteStates[gameId];
  gameMuteStates[gameId] = isMuted;

  const btn = document.getElementById(`btn-mute-${gameId}`);
  const gameName = GAME_MUSIC_NAMES[gameId] || gameId;

  if (btn) {
    btn.innerText = isMuted ? '🔇 Muted' : '🔊 Mute';
    if (isMuted) btn.classList.add('btn-red');
    else btn.classList.remove('btn-red');
  }

  await sendMusicControl({ game: gameId, action: 'mute', mute: isMuted });
  showToast(`${isMuted ? '🔇' : '🔊'} [${gameName}] ${isMuted ? 'Đã tắt tiếng' : 'Đã bật tiếng'}`, isMuted ? 'warning' : 'success');
}

// Music Switcher Controls
async function switchGameMusic(gameId) {
  playSound('click');
  const select = document.getElementById(`select-music-${gameId}`);
  if (!select) return;

  const val = select.value || '';
  const selectedText = select.options[select.selectedIndex]?.text || val;
  const gameName = GAME_MUSIC_NAMES[gameId] || gameId;

  let cue;
  let trackId;

  if (val.startsWith('cue:')) {
    cue = val.slice(4);
  } else if (val.startsWith('track:')) {
    trackId = val.slice(6);
  } else {
    cue = val;
  }

  const payload = { game: gameId, action: 'switch_music', cue, trackId };
  await sendMusicControl(payload);

  const statusEl = document.getElementById(`status-music-${gameId}`);
  if (statusEl) {
    statusEl.innerText = selectedText.split('(')[0].trim();
  }

  showToast(`🔀 [${gameName}] Đã chuyển sang: ${selectedText}`, 'success');
}

async function playGameMusicCue(gameId, cueName) {
  playSound('click');
  const gameName = GAME_MUSIC_NAMES[gameId] || gameId;
  await sendMusicControl({ game: gameId, action: 'switch_music', cue: cueName });

  const select = document.getElementById(`select-music-${gameId}`);
  if (select) {
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === `cue:${cueName}`) {
        select.selectedIndex = i;
        const statusEl = document.getElementById(`status-music-${gameId}`);
        if (statusEl) statusEl.innerText = select.options[i].text.split('(')[0].trim();
        break;
      }
    }
  }

  showToast(`🎵 [${gameName}] Đang phát cue: ${cueName}`, 'success');
}

// Track Preview & Echo Protection
function previewTrack(url, title, author, gameName) {
  playSound('click');
  const player = document.getElementById('admin-audio-player');
  const lblGame = document.getElementById('lbl-preview-game');
  const lblTitle = document.getElementById('lbl-preview-title');
  const lblMeta = document.getElementById('lbl-preview-meta');

  if (lblGame) lblGame.innerText = `ĐANG NGHE THỬ · ${gameName.toUpperCase()}`;
  if (lblTitle) lblTitle.innerText = title;
  if (lblMeta) lblMeta.innerText = `Tác giả: ${author} · Giấy phép: CC0 · Sẵn sàng cho livestream`;

  if (player) {
    player.src = url;
    player.play().catch((err) => {
      console.warn('[AudioPlayer] Autoplay prevented:', err);
    });
  }
}

function stopMusicPreview() {
  playSound('click');
  const player = document.getElementById('admin-audio-player');
  if (player) player.pause();
  const icon = document.getElementById('icon-preview-playing');
  if (icon) icon.innerText = '🎧';
  showToast('⏹ Đã dừng nghe thử', 'info');
}

function setPreviewVolume(val) {
  const player = document.getElementById('admin-audio-player');
  if (player) player.volume = Number(val);
}

function toggleObsAudioProtection(checked) {
  playSound('click');
  localStorage.setItem('ptplay_obs_only_audio', checked ? 'true' : 'false');
  if (checked) {
    showToast('🛡️ Đã bật Chống Vọng: Âm thanh chỉ phát qua OBS Browser Source!', 'warning');
  } else {
    showToast('🔊 Đã tắt Chống Vọng: Phát âm thanh trên cả Chrome và OBS', 'info');
  }
}

async function testMusicDucking() {
  playSound('click');
  const player = document.getElementById('admin-audio-player');
  if (!player.src || player.paused) {
    previewTrack('/shared-music/cat-cafe/cat_caffe.mp3', 'Cat caffe', 'TAD', 'Café Mòe');
  }

  showToast('🎙️ Bắt đầu mô phỏng: TTS nói, BGM tự hạ ~10-12dB...', 'info');
  const originalVol = player.volume || 0.3;
  // Duck by factor 0.36 (-11 dB)
  player.volume = originalVol * 0.36;

  setTimeout(() => {
    player.volume = originalVol;
    showToast('🎵 TTS đọc xong: BGM tự động khôi phục 100% âm lượng ban đầu!', 'success');
  }, 3500);
}

// --- 11. Multiview 9:16 Preview ---
function setPreviewMode(mode) {
  playSound('click');
  currentPreviewMode = mode;
  document.querySelectorAll('.preview-mode-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-mode') === mode));
  const mwWrapper = document.getElementById('wrapper-preview-mw');
  const catWrapper = document.getElementById('wrapper-preview-cat');
  const ecWrapper = document.getElementById('wrapper-preview-ec');
  const qsWrapper = document.getElementById('wrapper-preview-qs');
  const dhWrapper = document.getElementById('wrapper-preview-dh');

  const hideAll = () => {
    if (mwWrapper) mwWrapper.style.display = 'none';
    if (catWrapper) catWrapper.style.display = 'none';
    if (ecWrapper) ecWrapper.style.display = 'none';
    if (qsWrapper) qsWrapper.style.display = 'none';
    if (dhWrapper) dhWrapper.style.display = 'none';
  };

  if (mode === 'mini-war') {
    hideAll();
    if (mwWrapper) mwWrapper.style.display = 'block';
  } else if (mode === 'cat-cafe') {
    hideAll();
    if (catWrapper) catWrapper.style.display = 'block';
  } else if (mode === 'english-class') {
    hideAll();
    if (ecWrapper) ecWrapper.style.display = 'block';
  } else if (mode === 'quiz-show') {
    hideAll();
    if (qsWrapper) qsWrapper.style.display = 'block';
  } else if (mode === 'duoi-hinh-bat-chu') {
    hideAll();
    if (dhWrapper) dhWrapper.style.display = 'block';
  } else if (mode === 'dual' || mode === 'all') {
    if (mwWrapper) mwWrapper.style.display = 'block';
    if (catWrapper) catWrapper.style.display = 'block';
    if (ecWrapper) ecWrapper.style.display = 'block';
    if (qsWrapper) qsWrapper.style.display = 'block';
    if (dhWrapper) dhWrapper.style.display = 'block';
  }
}

function toggleSafeZoneOverlay() {
  document.querySelectorAll('.safe-zone-overlay').forEach((o) => o.classList.toggle('active'));
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
  const ecFrame = document.getElementById('preview-frame-ec');
  const qsFrame = document.getElementById('preview-frame-qs');
  const dhFrame = document.getElementById('preview-frame-dh');
  if (mwFrame) mwFrame.src = mwFrame.src;
  if (catFrame) catFrame.src = catFrame.src;
  if (ecFrame) ecFrame.src = ecFrame.src;
  if (qsFrame) qsFrame.src = qsFrame.src;
  if (dhFrame) dhFrame.src = dhFrame.src;
  showToast('🔄 Đã tải lại toàn bộ màn hình xem trước', 'info');
}

// --- 12. Logs & RAW JSON Inspector ---
function renderLogs(logs, errorLogs) {
  const tbody = document.getElementById('logs-tbody');
  if (!tbody) return;
  const allRows = [];
  if (errorLogs && errorLogs.length > 0) {
    for (const err of errorLogs) {
      allRows.push({
        timestamp: err.timestamp,
        userName: `[${err.source} ERROR]`,
        team: undefined,
        action: 'ERROR',
        details: err.message,
        status: 'dropped',
        isError: true,
      });
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
  tbody.innerHTML = allRows
    .slice(0, 50)
    .map((l) => {
      const time = new Date(l.timestamp).toLocaleTimeString();
      const teamBadge = l.team ? `<span class="badge badge-${l.team}">${l.team.toUpperCase()}</span>` : '<span style="color:#64748b">–</span>';
      let stBadge = '<span style="color:var(--amber);">Hàng đợi</span>';
      if (l.status === 'dispatched') stBadge = '<span style="color:var(--emerald);font-weight:bold;">Đã thực thi</span>';
      else if (l.status === 'waiting') stBadge = '<span style="color:var(--amber);font-weight:bold;">Chờ chỗ trống</span>';
      else if (l.status === 'dropped') stBadge = '<span style="color:var(--rose);">Lỗi / Bỏ qua</span>';
      const rowStyle = l.isError ? 'style="background:rgba(239,68,68,0.1);"' : '';
      return `<tr ${rowStyle}><td>${time}</td><td><strong>${l.userName}</strong></td><td>${teamBadge}</td><td><code>${l.action}</code></td><td>${stBadge}</td></tr>`;
    })
    .join('');
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
    tbody.innerHTML = rawLogsCache
      .map((item, idx) => {
        const time = new Date(item.timestamp).toLocaleTimeString();
        return `<tr style="cursor:pointer;" onclick="selectRawLog(${idx})"><td>${time}</td><td><strong>${item.event}</strong></td></tr>`;
      })
      .join('');
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

// --- 13. Command Palette (Ctrl+K) ---
const COMMAND_ITEMS = [
  { label: '🖥️ Đi tới: Tiến Trình & Cổng Mạng', badge: 'Tab 1', action: () => switchTab('games') },
  { label: '⚔️ Đi tới: Mini War Arena', badge: 'Tab 2', action: () => switchTab('miniwar') },
  { label: '🐱 Đi tới: Café Mòe LIVE', badge: 'Tab 3', action: () => switchTab('catcafe') },
  { label: '📱 Đi tới: Màn Hình Trực Tiếp (9:16)', badge: 'Tab 4', action: () => switchTab('preview') },
  { label: '👥 Đi tới: Khán Giả CRM', badge: 'Tab 5', action: () => switchTab('spectators') },
  { label: '💎 Đi tới: Quy Tắc Quà Tặng', badge: 'Tab 6', action: () => switchTab('economy') },
  { label: '🧪 Đi tới: TikTok LIVE Studio', badge: 'Tab 7', action: () => switchTab('simulator') },
  { label: '📜 Đi tới: Nhật Ký & Soi RAW', badge: 'Tab 8', action: () => switchTab('logs') },
  { label: '🚦 Đi tới: Hàng Đợi & Quá Tải', badge: 'Tab 9', action: () => switchTab('queue') },

  // Cluster & Service Launch Actions
  { label: '🚀 Khởi chạy: Mini War Arena (Cổng 5173)', badge: 'Start', action: () => startService('mini-war') },
  { label: '🚀 Khởi chạy: Café Mòe LIVE (Cổng 5174)', badge: 'Start', action: () => startService('cat-cafe') },
  { label: '🚀 Khởi chạy: PTPlay Live Bridge (Cổng 8088)', badge: 'Start', action: () => startService('bridge') },
  { label: '⚡ Khởi động tất cả 3 dịch vụ cùng lúc (Start All)', badge: 'Cluster', action: () => startAllServices() },
  { label: '⏹ Dừng máy chủ Mini War Arena (5173)', badge: 'Stop', action: () => stopService('mini-war') },
  { label: '⏹ Dừng máy chủ Café Mòe LIVE (5174)', badge: 'Stop', action: () => stopService('cat-cafe') },
  { label: '⏹ Dừng máy chủ PTPlay Live Bridge (8088)', badge: 'Stop', action: () => stopService('bridge') },
  { label: '⏹ Dừng tất cả dịch vụ (Stop All)', badge: 'Cluster', action: () => stopAllServices() },
  { label: '🎯 Đổi Target LIVE: Mini War Arena', badge: 'Live Target', action: () => switchActiveGame('mini-war') },
  { label: '🎯 Đổi Target LIVE: Café Mòe', badge: 'Live Target', action: () => switchActiveGame('cat-cafe') },
  { label: '⇄ Chuyển nguồn Provider (Mock / TikFinity)', badge: 'Provider', action: () => toggleProvider() },

  // Mini War Actions
  { label: '⚔️ Mini War: Bắt đầu vòng mới (Space)', badge: 'Action', action: () => { switchTab('miniwar'); sendMwCommand('start_round'); } },
  { label: '⏸ Mini War: Tạm dừng trận đấu', badge: 'Action', action: () => sendMwCommand('pause_round') },
  { label: '⏯ Mini War: Tiếp tục trận đấu', badge: 'Action', action: () => sendMwCommand('resume_round') },
  { label: '🧹 Mini War: Xóa sạch toàn bộ quân lính', badge: 'Action', action: () => sendMwCommand('clear_units') },
  { label: '👑 Mini War: Triệu hồi Boss ĐỎ (Infernal)', badge: 'Action', action: () => sendMwCommand('spawn_boss', 'red') },
  { label: '👑 Mini War: Triệu hồi Boss XANH (Titan)', badge: 'Action', action: () => sendMwCommand('spawn_boss', 'blue') },
  { label: '🏰 Mini War: Đổi đấu trường Hoàng Gia', badge: 'Theme', action: () => setMwTheme('castle') },
  { label: '🌋 Mini War: Đổi đấu trường Nham Thạch', badge: 'Theme', action: () => setMwTheme('ember') },

  // Cat Cafe Actions
  { label: '🐾 Café Mòe: Tạo mèo mới vào quán', badge: 'Action', action: () => { switchTab('catcafe'); createCustomCat(); } },
  { label: '🧹 Café Mòe: Xóa mèo khách', badge: 'Action', action: () => sendCatCommand('cat_cafe.clear_cats') },
  { label: '🔄 Café Mòe: Đặt lại quán mèo', badge: 'Action', action: () => sendCatCommand('cat_cafe.reset') },
  { label: '☕ Café Mòe: Chuyển Quán Chính', badge: 'Room', action: () => switchCatRoom('main_cafe') },
  { label: '🌻 Café Mòe: Chuyển Vườn Nắng', badge: 'Room', action: () => switchCatRoom('garden') },
  { label: '🛋️ Café Mòe: Chuyển Gác Lofi', badge: 'Room', action: () => switchCatRoom('loft') },
  { label: '✨ Café Mòe: Thưởng +200 Purrs', badge: 'Action', action: () => addPurrs(200) },

  // Tools & Preview
  { label: '🛡️ Bật/Tắt Vạch An Toàn TikTok LIVE Safe Zone', badge: 'SafeZone', action: () => { switchTab('preview'); toggleSafeZoneOverlay(); } },
  { label: '🔍 Chạy kiểm tra TikFinity Diagnostic Probe', badge: 'Probe', action: () => { switchTab('simulator'); runDiagnosticProbe(); } },
  { label: '⚡ Bật/Tắt Auto Simulator ngẫu nhiên', badge: 'Sim', action: () => toggleAutoSim() },
  { label: '🧹 Xóa sạch nhật ký RAW Logs', badge: 'Logs', action: () => clearRawLogs() },

  // BGM & Shared Music Manager Actions
  { label: '🎵 Đi tới: Thư Viện Nhạc & BGM Mixer', badge: 'Music', action: () => switchTab('musicmanager') },
  { label: '🔊 BGM: Tăng 5% âm lượng Master', badge: 'Audio', action: () => adjustMasterVolume(0.05) },
  { label: '🔉 BGM: Giảm 5% âm lượng Master', badge: 'Audio', action: () => adjustMasterVolume(-0.05) },
  { label: '🔇 BGM: Bật / Tắt Toàn Bộ BGM (Mute All)', badge: 'Audio', action: () => toggleMasterMute() },
  { label: '🔄 BGM: Reset âm lượng chuẩn Livestream (35%)', badge: 'Audio', action: () => resetAllVolumesToDefault() },
  { label: '👑 Mini War: Chuyển nhạc sang Epic Boss Battle', badge: 'Music', action: () => playGameMusicCue('mini-war', 'boss') },
  { label: '⚔️ Mini War: Chuyển nhạc về Heartfelt Battle', badge: 'Music', action: () => playGameMusicCue('mini-war', 'battle') },
  { label: '💤 Café Mòe: Chuyển nhạc sang Mèo Ngủ (Chill Lofi)', badge: 'Music', action: () => playGameMusicCue('cat-cafe', 'nap') },
  { label: '🎵 Café Mòe: Chuyển nhạc sang Cat Caffe (Main Lofi)', badge: 'Music', action: () => playGameMusicCue('cat-cafe', 'gameplay') },
  { label: '❓ English Class: Chuyển nhạc sang Câu Hỏi (In-Game 1)', badge: 'Music', action: () => playGameMusicCue('english-class', 'question') },
  { label: '🎉 English Class: Chuyển nhạc sang Ăn Mừng (Party Loop)', badge: 'Music', action: () => playGameMusicCue('english-class', 'celebration') },
  { label: '🎸 Quiz Show: Chuyển nhạc sang Funked Up', badge: 'Music', action: () => playGameMusicCue('quiz-show', 'question') },
  { label: '🪩 Quiz Show: Chuyển nhạc sang Funky Disco Beats', badge: 'Music', action: () => playGameMusicCue('quiz-show', 'celebration') },
  { label: '🔍 Đuổi Hình: Chuyển nhạc sang Magic Puzzle', badge: 'Music', action: () => playGameMusicCue('duoi-hinh-bat-chu', 'lobby') },
  { label: '🤔 Đuổi Hình: Chuyển nhạc sang Cozy Thinking', badge: 'Music', action: () => playGameMusicCue('duoi-hinh-bat-chu', 'thinking') },
];

function openCmdPalette() {
  playSound('click');
  const modal = document.getElementById('cmd-palette-backdrop');
  const input = document.getElementById('cmd-palette-input');
  if (modal) {
    modal.classList.add('active');
    if (input) {
      input.value = '';
      input.focus();
    }
    renderCmdPalette(COMMAND_ITEMS);
  }
}

function closeCmdPalette() {
  const modal = document.getElementById('cmd-palette-backdrop');
  if (modal) {
    modal.classList.remove('active');
  }
}

function renderCmdPalette(items) {
  const list = document.getElementById('cmd-results-list');
  if (!list) return;
  if (!items || items.length === 0) {
    list.innerHTML = '<div style="padding:16px; text-align:center; color:#64748b;">Không tìm thấy lệnh phù hợp</div>';
    return;
  }
  list.innerHTML = items
    .map((item, idx) => {
      return `<div class="cmd-item" onclick="executeCmdItem(${idx})">
        <div class="cmd-item-left">
          <span>${item.label}</span>
        </div>
        <span class="cmd-badge">${item.badge}</span>
      </div>`;
    })
    .join('');
}

let filteredCmdItems = [...COMMAND_ITEMS];

function filterCmdPalette() {
  const input = document.getElementById('cmd-palette-input');
  const q = (input?.value || '').trim().toLowerCase();
  filteredCmdItems = COMMAND_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.badge.toLowerCase().includes(q));
  renderCmdPalette(filteredCmdItems);
}

function executeCmdItem(idx) {
  const item = filteredCmdItems[idx];
  if (item && item.action) {
    closeCmdPalette();
    item.action();
  }
}

// --- 14. Global Keyboard & Clock Listeners ---
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // 0. Confirm Modal has highest priority: Enter = OK, Esc = Close
    const confirmModal = document.getElementById('confirm-modal-backdrop');
    if (confirmModal && confirmModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        playSound('click');
        handleConfirmDialogAction(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (document.activeElement && document.activeElement.id === 'confirm-modal-btn-cancel') {
          playSound('click');
          handleConfirmDialogAction(false);
        } else {
          playSound('click');
          handleConfirmDialogAction(true);
        }
        return;
      }
      if (e.key === 'Tab') {
        const btnCancel = document.getElementById('confirm-modal-btn-cancel');
        const btnOk = document.getElementById('confirm-modal-btn-ok');
        if (document.activeElement === btnOk && !e.shiftKey) {
          e.preventDefault();
          btnCancel?.focus();
        } else if (document.activeElement === btnCancel && e.shiftKey) {
          e.preventDefault();
          btnOk?.focus();
        }
      }
      return;
    }

    // Ctrl + K to toggle command palette
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modal = document.getElementById('cmd-palette-backdrop');
      if (modal?.classList.contains('active')) {
        closeCmdPalette();
      } else {
        openCmdPalette();
      }
      return;
    }

    // Escape to close palette
    if (e.key === 'Escape') {
      closeCmdPalette();
      return;
    }

    // Number keys 1-9 to switch tabs when not typing in an input
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (!isTyping && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const tabKeys = ['games', 'miniwar', 'catcafe', 'preview', 'spectators', 'economy', 'simulator', 'logs', 'queue'];
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= tabKeys.length) {
        e.preventDefault();
        playSound('click');
        switchTab(tabKeys[num - 1]);
      } else if (e.code === 'Space' && document.getElementById('panel-miniwar')?.classList.contains('active')) {
        e.preventDefault();
        sendMwCommand('start_round');
      }
    }
  });
}

function updateClockAndUptime() {
  const uptimeEl = document.getElementById('sidebar-uptime');
  if (uptimeEl) {
    const elapsedSec = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');
    uptimeEl.innerText = `${hrs}:${mins}:${secs}`;
  }
}

// --- 15. Initial Setup ---
window.addEventListener('DOMContentLoaded', () => {
  fetch('/api/auth/token')
    .then(r => r.json())
    .then(d => { if (d && d.token) authToken = d.token; })
    .catch(() => {});

  initTabs();
  initAdminTts();
  initAdminMusic();
  initKeyboardShortcuts();
  setInterval(updateClockAndUptime, 1000);
  updateClockAndUptime();

  setInterval(() => {
    fetchProcessStatus();
    fetchStatus();
    fetchPorts();
    fetchSpectators();
    fetchRawLogs();
    if (document.getElementById('panel-economy')?.classList.contains('active')) {
      fetchGiftAnalytics();
      fetchGiftMappings();
    }
  }, 1200);

  fetchProcessStatus();
  fetchStatus();
  fetchPorts();
  fetchSpectators();
  fetchGiftControlData();
  fetchRawLogs();
});
