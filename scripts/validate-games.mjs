import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config', 'games.json');

console.log('========================================================');
console.log('🎮 PTPLAY PLATFORM — GAME REGISTRY VALIDATION');
console.log('========================================================\n');

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Missing configuration file: ${CONFIG_PATH}`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} catch (err) {
  console.error(`❌ Malformed JSON in ${CONFIG_PATH}:`, err.message);
  process.exit(1);
}

if (!Array.isArray(config.games)) {
  console.error('❌ "games" must be an array in games.json');
  process.exit(1);
}

const seenIds = new Set();
const seenPorts = new Set();
let hasErrors = false;

console.log(`Found ${config.games.length} registered games:\n`);

for (const game of config.games) {
  const { id, name, port, active, workspace } = game;

  if (!id || typeof id !== 'string') {
    console.error(`❌ Game missing valid "id":`, game);
    hasErrors = true;
    continue;
  }

  if (seenIds.has(id)) {
    console.error(`❌ Duplicate game ID detected: "${id}"`);
    hasErrors = true;
  }
  seenIds.add(id);

  if (typeof port !== 'number' || port < 1024 || port > 65535) {
    console.error(`❌ Game "${id}" has invalid port: ${port}`);
    hasErrors = true;
  } else if (seenPorts.has(port)) {
    console.error(`❌ Port collision detected: ${port} is used multiple times`);
    hasErrors = true;
  }
  seenPorts.add(port);

  const status = active ? '🟢 Active' : '⚪ Inactive';
  const fullWorkspace = path.join(ROOT_DIR, workspace || `games/${id}`);
  const exists = fs.existsSync(fullWorkspace);

  if (active && !exists) {
    console.error(`❌ Active game "${id}" workspace folder not found: ${fullWorkspace}`);
    hasErrors = true;
  } else {
    console.log(`  [${status}] ${game.icon || '🎮'} ${name} (ID: ${id}) -> Port ${port} [${exists ? 'Folder Exists' : 'Planned'}]`);
  }
}

console.log('\n========================================================');
if (hasErrors) {
  console.error('❌ Validation Failed! Fix errors above.');
  process.exit(1);
} else {
  console.log('✅ All Game Registry records are valid and consistent!');
  process.exit(0);
}
