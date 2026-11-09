import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config', 'games.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const args = process.argv.slice(2);

const gameArg = args.find((a) => a.startsWith('--game='))?.split('=')[1];
const shouldStartAll = args.includes('--all');
const shouldList = args.includes('--list');

if (shouldList) {
  console.log('\n🎮 Available PTPlay Games:');
  for (const g of config.games) {
    console.log(`  - ${g.id} (${g.name}) - Port ${g.port} [${g.active ? 'ACTIVE' : 'PLANNED'}]`);
  }
  process.exit(0);
}

const targetGameId = gameArg;
const selectedGame = targetGameId ? config.games.find((g) => g.id === targetGameId) : null;

if (gameArg && !selectedGame) {
  console.error(`❌ Unknown game ID: "${targetGameId}". Use --list to see available games.`);
  process.exit(1);
}

console.log('\n========================================================');
console.log('🚀 PTPLAY MULTI-GAME PLATFORM READY');
console.log('========================================================');
console.log('• Admin Portal : http://127.0.0.1:8080');
console.log('• LIVE Bridge  : http://127.0.0.1:8088');
if (shouldStartAll) {
  console.log('• Mode         : Khởi động toàn bộ 5 game');
} else if (selectedGame) {
  console.log(`• Game Đã Chọn : ${selectedGame.name} (Cổng ${selectedGame.port})`);
} else {
  console.log('• Trạng Thái   : Sẵn sàng (Bấm nút trên Admin để bật game)');
}
console.log('========================================================\n');

const nodeExe = process.execPath;
const tsxCli = path.join(ROOT_DIR, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const runningProcesses = [];

function startProcess(name, cwd, cmd, cmdArgs, env = {}) {
  const child = spawn(cmd, cmdArgs, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, PTPLAY_MANAGED: '1', ...env },
    shell: false,
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`[Platform] ${name} exited with code ${code}`);
    }
  });

  runningProcesses.push({ name, child });
  return child;
}

// 1. Start LIVE Bridge (Port 8088)
startProcess(
  'PTPlay LIVE Bridge (Port 8088)',
  path.join(ROOT_DIR, 'apps', 'bridge'),
  nodeExe,
  [tsxCli, 'src/index.ts']
);

// 2. Start Central Admin (Port 8080)
startProcess(
  'PTPlay Central Admin (Port 8080)',
  path.join(ROOT_DIR, 'apps', 'admin'),
  nodeExe,
  ['src/server.js']
);

// 3. Start Game(s) (only if explicitly requested via --all or --game=<id>)
if (shouldStartAll) {
  for (const g of config.games) {
    if (g.active) {
      const gDir = path.join(ROOT_DIR, g.workspace);
      startProcess(`${g.name} (Port ${g.port})`, gDir, npmCmd, ['--silent', 'run', 'dev']);
    }
  }
} else if (selectedGame && selectedGame.active) {
  const gameDir = path.join(ROOT_DIR, selectedGame.workspace);
  startProcess(
    `${selectedGame.name} (Port ${selectedGame.port})`,
    gameDir,
    npmCmd,
    ['--silent', 'run', 'dev']
  );
}

function cleanup() {
  console.log('\n[Platform] Shutting down all PTPlay services gracefully...');
  for (const { name, child } of runningProcesses) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/f', '/t']);
      } else {
        child.kill('SIGINT');
      }
    } catch {
      // Process might already be dead
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

