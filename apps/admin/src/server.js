import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import { spawn, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const WORKSPACE_DIR = path.resolve(__dirname, '../../');

const PORT = Number(process.env.PORT) || 8080;
const BRIDGE_PORT = 8088;
const MINI_WAR_PORT = 5173;
const CAT_CAFE_PORT = 5174;
const TIKFINITY_PORT = 21213;

const PLATFORM_DIR = path.resolve(__dirname, '../../');
const GAMES_CONFIG_PATH = path.join(PLATFORM_DIR, 'config', 'games.json');

const miniWarPath = fs.existsSync(path.join(PLATFORM_DIR, 'games', 'mini-war-arena'))
  ? path.join(PLATFORM_DIR, 'games', 'mini-war-arena')
  : path.join(WORKSPACE_DIR, 'PTPlay-Mini-War-Arena');

const catCafePath = fs.existsSync(path.join(PLATFORM_DIR, 'games', 'cat-cafe'))
  ? path.join(PLATFORM_DIR, 'games', 'cat-cafe')
  : path.join(WORKSPACE_DIR, 'PTPlay-Cat-Cafe');

const bridgePath = fs.existsSync(path.join(PLATFORM_DIR, 'apps', 'bridge'))
  ? path.join(PLATFORM_DIR, 'apps', 'bridge')
  : path.join(WORKSPACE_DIR, 'PTPlay-Live-Bridge');

const GAME_CONFIGS = [
  {
    id: 'mini-war',
    name: 'Mini War Arena V1.0',
    vietnameseName: 'Đấu Trường Chiến Binh',
    genre: '2D Cartoon Auto-Battler (Red vs Blue)',
    path: miniWarPath,
    port: MINI_WAR_PORT,
    url: `http://localhost:${MINI_WAR_PORT}`,
    launcherBat: path.join(miniWarPath, 'RUN_GAME_WINDOWS.bat'),
    icon: '⚔️',
  },
  {
    id: 'cat-cafe',
    name: 'Cat Café LIVE V1.0',
    vietnameseName: 'Café Mòe',
    genre: 'Cozy Cat Simulator & Live Interactive Pet',
    path: catCafePath,
    port: CAT_CAFE_PORT,
    url: `http://localhost:${CAT_CAFE_PORT}`,
    launcherBat: path.join(catCafePath, 'RUN_CAT_CAFE_WINDOWS.bat'),
    icon: '🐱',
  },
];

// In-Memory Managed Child Processes & Logs Buffer
const managedProcesses = {
  'mini-war': {
    process: null,
    pid: null,
    startedAt: null,
    logs: [],
    workDir: miniWarPath,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  },
  'cat-cafe': {
    process: null,
    pid: null,
    startedAt: null,
    logs: [],
    workDir: catCafePath,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
  },
  bridge: {
    process: null,
    pid: null,
    startedAt: null,
    logs: [],
    workDir: bridgePath,
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['start'],
  },
};

function appendLog(serviceKey, text) {
  const item = managedProcesses[serviceKey];
  if (!item) return;
  const lines = text.split(/\r?\n/).filter(Boolean);
  const timestamp = new Date().toLocaleTimeString();
  for (const line of lines) {
    item.logs.push(`[${timestamp}] ${line}`);
  }
  if (item.logs.length > 150) {
    item.logs.splice(0, item.logs.length - 150);
  }
}

// Check if TCP port is active
function checkPort(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Kill any process occupying a target port (handles orphaned/external servers)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve(false);
    exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
      if (err || !stdout) return resolve(false);
      const lines = stdout.trim().split(/\r?\n/);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = parseInt(parts[4], 10);
          if (pid && pid > 0 && pid !== process.pid) pids.add(pid);
        }
      }
      if (pids.size === 0) return resolve(false);
      for (const pid of pids) {
        try {
          spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
        } catch (e) {}
      }
      resolve(true);
    });
  });
}

// Start Managed Child Process
function startManagedProcess(serviceKey) {
  const item = managedProcesses[serviceKey];
  if (!item) return { success: false, error: 'Unknown service' };
  
  if (item.process) {
    try {
      process.kill(item.pid, 0);
      return { success: true, message: 'Already running', pid: item.pid };
    } catch (e) {
      item.process = null;
      item.pid = null;
      item.startedAt = null;
    }
  }

  if (!fs.existsSync(item.workDir)) {
    return { success: false, error: `Directory not found: ${item.workDir}` };
  }

  try {
    appendLog(serviceKey, `Starting service in ${item.workDir}...`);
    const child = spawn(item.cmd, item.args, {
      cwd: item.workDir,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    item.process = child;
    item.pid = child.pid;
    item.startedAt = Date.now();

    child.stdout.on('data', (chunk) => appendLog(serviceKey, chunk.toString()));
    child.stderr.on('data', (chunk) => appendLog(serviceKey, chunk.toString()));

    child.on('close', (code) => {
      appendLog(serviceKey, `Process exited with code ${code}`);
      item.process = null;
      item.pid = null;
      item.startedAt = null;
    });

    child.on('error', (err) => {
      appendLog(serviceKey, `Process error: ${err.message}`);
      item.process = null;
      item.pid = null;
      item.startedAt = null;
    });

    return { success: true, pid: child.pid };
  } catch (err) {
    appendLog(serviceKey, `Failed to spawn: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Stop Managed Child Process (including tree kill on Windows & clearing port)
function stopManagedProcess(serviceKey) {
  const item = managedProcesses[serviceKey];
  const port = serviceKey === 'mini-war' ? MINI_WAR_PORT : (serviceKey === 'cat-cafe' ? CAT_CAFE_PORT : BRIDGE_PORT);

  try {
    if (item && item.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(item.pid), '/T', '/F'], { stdio: 'ignore' });
      } else if (item.process) {
        item.process.kill('SIGTERM');
      }
    }
    // Also terminate any orphaned process listening on this port
    killProcessOnPort(port);

    appendLog(serviceKey, `Service stopped by admin.`);
    if (item) {
      item.process = null;
      item.pid = null;
      item.startedAt = null;
    }
    return { success: true, message: `Stopped ${serviceKey}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Proxy request to Bridge server (port 8088)
function proxyToBridge(req, res, targetPath) {
  const options = {
    hostname: '127.0.0.1',
    port: BRIDGE_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${BRIDGE_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Bridge Unavailable',
        message: 'PTPlay Live Bridge (Port 8088) is currently not running or unreachable.',
        details: err.message,
      })
    );
  });

  req.pipe(proxyReq, { end: true });
}

function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ptplay-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. Process Status & Health
  if (pathname === '/api/process/status' && req.method === 'GET') {
    const [pMini, pCat, pBridge] = await Promise.all([
      checkPort(MINI_WAR_PORT),
      checkPort(CAT_CAFE_PORT),
      checkPort(BRIDGE_PORT),
    ]);

    const result = {
      timestamp: Date.now(),
      services: {
        'mini-war': {
          running: pMini || !!managedProcesses['mini-war'].process,
          portOpen: pMini,
          port: MINI_WAR_PORT,
          pid: managedProcesses['mini-war'].pid,
          startedAt: managedProcesses['mini-war'].startedAt,
          recentLogs: managedProcesses['mini-war'].logs.slice(-30),
        },
        'cat-cafe': {
          running: pCat || !!managedProcesses['cat-cafe'].process,
          portOpen: pCat,
          port: CAT_CAFE_PORT,
          pid: managedProcesses['cat-cafe'].pid,
          startedAt: managedProcesses['cat-cafe'].startedAt,
          recentLogs: managedProcesses['cat-cafe'].logs.slice(-30),
        },
        bridge: {
          running: pBridge || !!managedProcesses.bridge.process,
          portOpen: pBridge,
          port: BRIDGE_PORT,
          pid: managedProcesses.bridge.pid,
          startedAt: managedProcesses.bridge.startedAt,
          recentLogs: managedProcesses.bridge.logs.slice(-30),
        },
      },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 2. Start / Stop Process Actions
  if (pathname.startsWith('/api/process/start/') && req.method === 'POST') {
    const key = pathname.replace('/api/process/start/', '');
    const out = startManagedProcess(key);
    res.writeHead(out.success ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
    return;
  }

  if (pathname.startsWith('/api/process/stop/') && req.method === 'POST') {
    const key = pathname.replace('/api/process/stop/', '');
    const out = stopManagedProcess(key);
    res.writeHead(out.success ? 200 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
    return;
  }

  if (pathname.startsWith('/api/process/restart/') && req.method === 'POST') {
    const key = pathname.replace('/api/process/restart/', '');
    stopManagedProcess(key);
    setTimeout(() => {
      const out = startManagedProcess(key);
      res.writeHead(out.success ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    }, 1000);
    return;
  }

  if (pathname === '/api/process/start_all' && req.method === 'POST') {
    const rBridge = startManagedProcess('bridge');
    const rMini = startManagedProcess('mini-war');
    const rCat = startManagedProcess('cat-cafe');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, bridge: rBridge, miniWar: rMini, catCafe: rCat }));
    return;
  }

  if (pathname === '/api/process/stop_all' && req.method === 'POST') {
    stopManagedProcess('mini-war');
    stopManagedProcess('cat-cafe');
    stopManagedProcess('bridge');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 3. System Metrics API
  if (pathname === '/api/system/metrics' && req.method === 'GET') {
    const memUsage = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        uptimeSeconds: Math.floor(process.uptime()),
        memoryMb: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        os: {
          platform: os.platform(),
          release: os.release(),
          cpus: os.cpus().length,
          freeMemMb: Math.round(os.freemem() / 1024 / 1024),
          totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
        },
      })
    );
    return;
  }

  // 4. API: Games directory & local paths
  if (pathname === '/api/games' && req.method === 'GET') {
    const [pMini, pCat, pBridge, pTikFinity] = await Promise.all([
      checkPort(MINI_WAR_PORT),
      checkPort(CAT_CAFE_PORT),
      checkPort(BRIDGE_PORT),
      checkPort(TIKFINITY_PORT),
    ]);

    const result = GAME_CONFIGS.map((g) => ({
      ...g,
      isRunning: g.id === 'mini-war' ? pMini : pCat,
      pathExists: fs.existsSync(g.path),
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        games: result,
        system: {
          bridgeRunning: pBridge,
          tikfinityRunning: pTikFinity,
          bridgeUrl: `http://localhost:${BRIDGE_PORT}`,
        },
      })
    );
    return;
  }

  // 5. API: System ports health scan
  if (pathname === '/api/ports' && req.method === 'GET') {
    const [p5173, p5174, p8088, p21213] = await Promise.all([
      checkPort(MINI_WAR_PORT),
      checkPort(CAT_CAFE_PORT),
      checkPort(BRIDGE_PORT),
      checkPort(TIKFINITY_PORT),
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        timestamp: Date.now(),
        adminPort: { port: PORT, open: true },
        bridgePort: { port: BRIDGE_PORT, open: p8088 },
        miniWarPort: { port: MINI_WAR_PORT, open: p5173 },
        catCafePort: { port: CAT_CAFE_PORT, open: p5174 },
        tikfinityPort: { port: TIKFINITY_PORT, open: p21213 },
      })
    );
    return;
  }

  // 6. Proxy all other Bridge APIs to 8088
  if (pathname.startsWith('/api/')) {
    proxyToBridge(req, res, req.url || pathname);
    return;
  }

  // 7. Static Assets
  let targetFile = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const safePath = path.normalize(path.join(PUBLIC_DIR, targetFile));

  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  const ext = path.extname(safePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  const contentType = mimeTypes[ext] || 'text/plain';
  serveStaticFile(res, safePath, contentType);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('====================================================');
  console.log(`[PTPLAY ADMIN WEB] Running at http://127.0.0.1:${PORT}`);
  console.log(`[Mini War Arena] http://127.0.0.1:${MINI_WAR_PORT}`);
  console.log(`[Cat Café LIVE]  http://127.0.0.1:${CAT_CAFE_PORT}`);
  console.log(`[LIVE Bridge]    http://127.0.0.1:${BRIDGE_PORT}`);
  console.log('====================================================');
});
