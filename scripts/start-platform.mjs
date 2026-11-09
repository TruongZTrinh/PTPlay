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

const targetGameId = gameArg || config.defaultActiveGame || 'mini-war-arena';
const selectedGame = config.games.find((g) => g.id === targetGameId);

if (!selectedGame) {
  console.error(`❌ Unknown game ID: "${targetGameId}". Use --list to see available games.`);
  process.exit(1);
}

console.log('========================================================');
console.log('🚀 STARTING PTPLAY MULTI-GAME PLATFORM');
console.log('========================================================');
console.log(`• Authoritative LIVE Bridge: http://127.0.0.1:8088`);
console.log(`• Central Admin Portal:     http://127.0.0.1:8080`);
console.log(`• Selected Interactive Game: ${selectedGame.name} (Port ${selectedGame.port})`);
console.log('========================================================\n');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const runningProcesses = [];

function startProcess(name, cwd, cmd, cmdArgs, env = {}) {
  console.log(`[Platform] Launching ${name}...`);
  const child = spawn(cmd, cmdArgs, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: true,
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
  npmCmd,
  ['run', 'start']
);

// 2. Start Central Admin (Port 8080)
startProcess(
  'PTPlay Central Admin (Port 8080)',
  path.join(ROOT_DIR, 'apps', 'admin'),
  npmCmd,
  ['run', 'start']
);

// 3. Start Game(s)
if (shouldStartAll) {
  console.log('[Platform] Starting all active registered games...');
  for (const g of config.games) {
    if (g.active) {
      const gDir = path.join(ROOT_DIR, g.workspace);
      startProcess(`${g.name} (Port ${g.port})`, gDir, npmCmd, ['run', 'dev']);
    }
  }
} else if (selectedGame && selectedGame.active) {
  const gameDir = path.join(ROOT_DIR, selectedGame.workspace);
  startProcess(
    `${selectedGame.name} (Port ${selectedGame.port})`,
    gameDir,
    npmCmd,
    ['run', 'dev']
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

