import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('1. PTPlay-Admin project files exist', () => {
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'package.json')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'RUN_ADMIN_WEB.bat')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'README.md')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'src', 'server.js')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'public', 'index.html')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'public', 'styles.css')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'public', 'app.js')));
});

test('2. Public index.html contains all 9 tabs and PTPlay branding', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('PTPLAY'));
  assert.ok(html.includes('Mini War Arena'));
  assert.ok(html.includes('Café Mòe'));
  assert.ok(html.includes('panel-games'));
  assert.ok(html.includes('panel-miniwar'));
  assert.ok(html.includes('panel-catcafe'));
  assert.ok(html.includes('panel-spectators'));
  assert.ok(html.includes('panel-economy'));
  assert.ok(html.includes('panel-preview'));
  assert.ok(html.includes('panel-simulator'));
  assert.ok(html.includes('panel-logs'));
  assert.ok(html.includes('panel-queue'));
  assert.ok(html.includes('safe-zone-overlay'));
});

test('3. Server script has valid syntax and ports config', () => {
  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'server.js'), 'utf-8');
  assert.ok(serverCode.includes('PORT = Number(process.env.PORT) || 8080'));
  assert.ok(serverCode.includes('BRIDGE_PORT = 8088'));
  assert.ok(serverCode.includes('MINI_WAR_PORT = 5173'));
  assert.ok(serverCode.includes('CAT_CAFE_PORT = 5174'));
  assert.ok(serverCode.includes('TIKFINITY_PORT = 21213'));
  assert.ok(serverCode.includes('startManagedProcess'));
  assert.ok(serverCode.includes('stopManagedProcess'));
  assert.ok(serverCode.includes('killProcessOnPort'));
});

test('4. UI contains 1-click launch controls for both games', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes("startService('mini-war')"));
  assert.ok(html.includes("startService('cat-cafe')"));
  assert.ok(html.includes("startService('bridge')"));
  assert.ok(html.includes("startAllServices()"));
  assert.ok(html.includes("stopAllServices()"));
});

test('5. English Class LIVE: Admin console, port 5175 and controls integrated', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('panel-englishclass'));
  assert.ok(html.includes("startService('english-class')"));
  assert.ok(html.includes("switchActiveGame('english-class')"));
  assert.ok(html.includes('English Class LIVE V1.0'));
  assert.ok(html.includes('5175'));

  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'server.js'), 'utf-8');
  assert.ok(serverCode.includes('ENGLISH_CLASS_PORT = 5175'));
  assert.ok(serverCode.includes("'english-class'"));
});

test('6. PTPlay Quiz Show: Admin console, port 5176 and controls integrated', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('panel-quizshow'));
  assert.ok(html.includes("startService('quiz-show')"));
  assert.ok(html.includes("switchActiveGame('quiz-show')"));
  assert.ok(html.includes('PTPlay Quiz Show'));
  assert.ok(html.includes('5176'));
  assert.ok(html.includes('preview-frame-qs'));

  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'server.js'), 'utf-8');
  assert.ok(serverCode.includes('QUIZ_SHOW_PORT = 5176'));
  assert.ok(serverCode.includes("'quiz-show'"));
});

test('7. Đuổi Hình Bắt Chữ: Admin console, port 5177 and controls integrated', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('panel-duoihinh'));
  assert.ok(html.includes("startService('duoi-hinh-bat-chu')"));
  assert.ok(html.includes("switchActiveGame('duoi-hinh-bat-chu')"));
  assert.ok(html.includes('Đuổi Hình Bắt Chữ'));
  assert.ok(html.includes('5177'));
  assert.ok(html.includes('preview-frame-dh'));

  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'server.js'), 'utf-8');
  assert.ok(serverCode.includes('DUOI_HINH_PORT = 5177'));
  assert.ok(serverCode.includes("'duoi-hinh-bat-chu'"));
});

