// ==========================================================================
// PTPLAY ENTERPRISE ADMIN CENTER — ENGINE & INTERACTIVITY SCRIPT
// ==========================================================================

let authToken = '';
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
  economy: { cat: 'Audience & CRM', name: 'Quy Tắc Quà Tặng (Gifts)' },
  simulator: { cat: 'Operations & Control', name: 'TikTok LIVE Studio & Giả Lập' },
  logs: { cat: 'Operations & Control', name: 'Nhật Ký & Soi RAW JSON' },
  queue: { cat: 'Operations & Control', name: 'Hàng Đợi & Quá Tải' },
};

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playSound('click');
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${tabId}`);
  });

  // Update Breadcrumbs
  const crumbInfo = TAB_BREADCRUMBS[tabId];
  if (crumbInfo) {
    const catEl = document.getElementById('crumb-category');
    const actEl = document.getElementById('crumb-active');
    if (catEl) catEl.innerText = crumbInfo.cat;
    if (actEl) actEl.innerText = crumbInfo.name;
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

async function fetchPorts() {
  try {
    const res = await fetch('/api/ports');
    if (!res.ok) return;
    const p = await res.json();

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
}

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
  if (!confirm(`Xác nhận đổi game tiếp nhận luồng sự kiện TikTok LIVE sang: ${targetName}?`)) return;
  try {
    const res = await fetch('/api/active_game', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ activeGame: target }),
    });
    const data = await res.json();
    if (data.success) {
      playSound('success');
      showToast(`🎯 Đã chuyển sang nhận LIVE cho ${targetName}!`, 'success');
      updateActiveGameUI(data.activeGame);
    }
  } catch (e) {
    showToast(`Lỗi chuyển game: ${e.message}`, 'error');
  }
}

async function toggleProvider() {
  playSound('click');
  const isMock = currentProvider.includes('Mock');
  const target = isMock ? 'tikfinity' : 'mock';
  try {
    const res = await fetch('/api/provider/switch', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ provider: target }),
    });
    const d = await res.json();
    if (d.success) {
      playSound('success');
      showToast(`⚡ Đã chuyển Provider: ${target.toUpperCase()}`, 'success');
      fetchStatus();
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
  if (!confirm('Xác nhận xóa toàn bộ danh sách khán giả đã tham gia?')) return;
  playSound('warn');
  await fetch('/api/spectators/clear', { method: 'POST', headers: authHeaders() });
  showToast('🧹 Đã xóa danh sách khán giả', 'info');
  fetchSpectators();
  fetchStatus();
}

// --- 8. Gift Economy Mapping ---
async function fetchGiftMappings() {
  try {
    const res = await fetch('/api/mapping');
    if (!res.ok) return;
    const rules = await res.json();
    const tbody = document.getElementById('mapping-tbody');
    if (!tbody) return;

    tbody.innerHTML = rules
      .map((r) => {
        const statusBadge = r.enabled
          ? '<span class="badge badge-green">Bật</span>'
          : '<span class="badge" style="background:#334155; color:#94a3b8;">Tắt</span>';
        return `<tr>
          <td><strong>${r.giftName}</strong></td>
          <td><code>${r.action}</code></td>
          <td><span class="badge badge-gold">${r.unitType || '–'}</span></td>
          <td>x${r.multiplier}</td>
          <td>${r.cooldownSec}s</td>
          <td>${r.maxSpawnPerEvent}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-outline" style="font-size:10px; padding:2px 6px;" onclick="toggleMappingRule('${r.id}')">Bật/Tắt</button>
            <button class="btn-red" style="font-size:10px; padding:2px 6px;" onclick="deleteMappingRule('${r.id}')">Xóa</button>
          </td>
        </tr>`;
      })
      .join('');
  } catch (e) {}
}

async function toggleMappingRule(id) {
  playSound('click');
  await fetch('/api/mapping/toggle', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id }) });
  fetchGiftMappings();
}

async function deleteMappingRule(id) {
  if (!confirm('Xóa quy tắc mapping này?')) return;
  playSound('warn');
  await fetch('/api/mapping/delete', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ id }) });
  fetchGiftMappings();
}

async function saveNewMappingRule() {
  const giftName = document.getElementById('input-map-gift').value.trim();
  const action = document.getElementById('select-map-action').value;
  const unitType = document.getElementById('select-map-unit').value || undefined;
  const multiplier = Number(document.getElementById('input-map-mult').value) || 1;
  const cooldownSec = Number(document.getElementById('input-map-cd').value) || 0;
  const maxSpawn = Number(document.getElementById('input-map-max').value) || 10;

  if (!giftName) {
    showToast('Vui lòng nhập tên quà tặng', 'warn');
    return;
  }

  const rule = {
    id: `rule_${giftName.toLowerCase().replace(/\s+/g, '_')}`,
    giftName,
    action,
    unitType,
    multiplier,
    cooldownSec,
    maxSpawnPerEvent: maxSpawn,
    enabled: true,
    description: `Triệu hồi ${unitType || action} x${multiplier}`,
  };

  await fetch('/api/mapping/save', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rule }),
  });

  showToast(`✅ Đã lưu mapping cho '${giftName}'`, 'success');
  fetchGiftMappings();
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
  const isCat = gameType === 'cat';
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

async function sendMockGift(gameType, giftName, count = 1) {
  const isEc = gameType === 'english' || gameType === 'english-class';
  const isCat = gameType === 'cat';
  const isQuiz = gameType === 'quiz' || gameType === 'quiz-show';
  const isRebus = gameType === 'rebus' || gameType === 'duoi-hinh-bat-chu';

  const nick = isEc ? 'PhụHuynhVIP' : (isCat ? 'MèoMêĂn' : (isQuiz ? 'ĐạiGiaNeon' : (isRebus ? 'TrùmĐoánChữ' : 'ĐạiGiaTikTok')));

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
  } catch (e) {}
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
  const clockEl = document.getElementById('header-clock');
  const uptimeEl = document.getElementById('sidebar-uptime');

  if (clockEl) {
    clockEl.innerText = new Date().toLocaleTimeString();
  }

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
  initTabs();
  initKeyboardShortcuts();
  setInterval(updateClockAndUptime, 1000);
  updateClockAndUptime();

  setInterval(() => {
    fetchProcessStatus();
    fetchStatus();
    fetchPorts();
    fetchSpectators();
    fetchGiftMappings();
    fetchRawLogs();
  }, 1200);

  fetchProcessStatus();
  fetchStatus();
  fetchPorts();
  fetchSpectators();
  fetchGiftMappings();
  fetchRawLogs();
});
