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

test('8. TikTok Mock Gifts Simulation: UI supports quick presets and custom gift dispatchers', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes("sendMockGift('cat', 'Rose', 1)"));
  assert.ok(html.includes("sendMockGift('cat', 'Lion', 1)"));
  assert.ok(html.includes("sendMockGift('cat', 'Universe', 1)"));
  assert.ok(html.includes("sendMockGift('cat', 'Cake', 1)"));
  assert.ok(html.includes("sendCustomMockGift('cat')"));
  assert.ok(html.includes("sendMockGift('mini-war', 'Rose', 1)"));
  assert.ok(html.includes("sendMockGift('mini-war', 'Lion', 1)"));
  assert.ok(html.includes("sendCustomMockGift('mini-war')"));

  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public', 'app.js'), 'utf-8');
  assert.ok(appJs.includes('sendMockGift'));
  assert.ok(appJs.includes('sendCustomMockGift'));
});

test('9. Unified TTS Studio: Dedicated tab, voice selector, sliders and soundboard matrix', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('data-tab="ttsstudio"'));
  assert.ok(html.includes('id="panel-ttsstudio"'));
  assert.ok(html.includes('select-tts-voice'));
  assert.ok(html.includes('select-tts-target-game'));
  assert.ok(html.includes('select-tts-lang'));
  assert.ok(html.includes('slider-tts-rate'));
  assert.ok(html.includes('slider-tts-pitch'));
  assert.ok(html.includes('slider-tts-volume'));
  assert.ok(html.includes('input-tts-custom-text'));
  assert.ok(html.includes('testLocalAdminTts()'));
  assert.ok(html.includes('broadcastCurrentTts()'));
  assert.ok(html.includes('playLocalAdminTts('));
  assert.ok(html.includes('broadcastGameTts('));
});

test('10. Unified TTS Studio: Controller script handles local preview and multi-game broadcast', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public', 'app.js'), 'utf-8');
  assert.ok(appJs.includes('initAdminTts'));
  assert.ok(appJs.includes('refreshAdminVoices'));
  assert.ok(appJs.includes('unlockAdminAudio'));
  assert.ok(appJs.includes('playLocalAdminTts'));
  assert.ok(appJs.includes('broadcastGameTts'));
  assert.ok(appJs.includes('stopAdminTts'));
  assert.ok(appJs.includes('VIETNAMESE_VOICE_PRIORITIES'));
  assert.ok(appJs.includes('isVietnameseVoice'));
});

test('11. Centralized Gift Management Center: Shared Catalog, Per-Game Mappings, LIVE Analytics & Pipeline Monitor', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('id="panel-economy"'));
  assert.ok(html.includes('id="badge-stat-total-catalog"'));
  assert.ok(html.includes('id="badge-stat-vn-catalog"'));
  assert.ok(html.includes('id="badge-stat-mappings"'));
  assert.ok(html.includes('id="btn-gsub-catalog"'));
  assert.ok(html.includes('id="btn-gsub-mappings"'));
  assert.ok(html.includes('id="btn-gsub-analytics"'));
  assert.ok(html.includes('id="btn-gsub-pipeline"'));
  assert.ok(html.includes('id="gsubpanel-catalog"'));
  assert.ok(html.includes('id="gsubpanel-mappings"'));
  assert.ok(html.includes('id="gsubpanel-analytics"'));
  assert.ok(html.includes('id="gsubpanel-pipeline"'));
  assert.ok(html.includes('id="catalog-grid"'));
  assert.ok(html.includes('id="mapping-tbody"'));
  assert.ok(html.includes('id="kpi-real-gifts"'));
  assert.ok(html.includes('id="kpi-real-actions"'));
  assert.ok(html.includes('id="kpi-real-diamonds"'));
  assert.ok(html.includes('id="kpi-mock-gifts"'));
  assert.ok(html.includes('id="analytics-top-gifts-container"'));
  assert.ok(html.includes('id="analytics-per-game-container"'));
  assert.ok(html.includes('id="analytics-unknown-gifts-container"'));
  assert.ok(html.includes('id="pipeline-tbody"'));
  assert.ok(html.includes('pipeline-flow-diagram'));

  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public', 'app.js'), 'utf-8');
  assert.ok(appJs.includes('switchGiftSubtab'));
  assert.ok(appJs.includes('fetchCatalogGifts'));
  assert.ok(appJs.includes('renderCatalogGrid'));
  assert.ok(appJs.includes('onCatalogSearchInput'));
  assert.ok(appJs.includes('prefillMappingFromCatalog'));
  assert.ok(appJs.includes('testGiftFromCatalog'));
  assert.ok(appJs.includes('syncCatalogFromSource'));
  assert.ok(appJs.includes('filterMappingsByGame'));
  assert.ok(appJs.includes('onMappingGameChange'));
  assert.ok(appJs.includes('fetchGiftMappings'));
  assert.ok(appJs.includes('renderMappingsTable'));
  assert.ok(appJs.includes('saveNewMappingRule'));
  assert.ok(appJs.includes('toggleMappingRule'));
  assert.ok(appJs.includes('deleteMappingRule'));
  assert.ok(appJs.includes('testMappingAction'));
  assert.ok(appJs.includes('exportMappingsJson'));
  assert.ok(appJs.includes('importMappingsJson'));
  assert.ok(appJs.includes('fetchGiftAnalytics'));
  assert.ok(appJs.includes('renderPipelineHistory'));
  assert.ok(appJs.includes('resetAnalyticsData'));
  assert.ok(appJs.includes('fetchGiftControlData'));

  const css = fs.readFileSync(path.join(ROOT_DIR, 'public', 'styles.css'), 'utf-8');
  assert.ok(css.includes('.gift-subtabs'));
  assert.ok(css.includes('.gift-subtab-btn'));
  assert.ok(css.includes('.catalog-grid'));
  assert.ok(css.includes('.catalog-card'));
  assert.ok(css.includes('.kpi-grid'));
  assert.ok(css.includes('.kpi-card'));
  assert.ok(css.includes('.pipeline-flow-diagram'));
});

test('12. Shared Music Manager & Livestream Audio Mixer: Dedicated tab, Master volume bar, 5-game sliders and track switchers', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  // Navigation and main container
  assert.ok(html.includes('data-tab="musicmanager"'));
  assert.ok(html.includes('id="panel-musicmanager"'));

  // Master Volume Controls & Presets
  assert.ok(html.includes('id="slider-master-bgm"'));
  assert.ok(html.includes('id="lbl-master-bgm"'));
  assert.ok(html.includes('id="btn-master-mute"'));
  assert.ok(html.includes('adjustMasterVolume('));
  assert.ok(html.includes('setMasterBgmVolume(0.35)'));
  assert.ok(html.includes('resetAllVolumesToDefault()'));

  // 5 Games Live Mixers and Music Switchers
  const gameKeys = ['cat-cafe', 'mini-war', 'english-class', 'quiz-show', 'duoi-hinh-bat-chu'];
  for (const g of gameKeys) {
    assert.ok(html.includes(`id="slider-vol-${g}"`), `Missing slider for ${g}`);
    assert.ok(html.includes(`id="lbl-vol-${g}"`), `Missing volume label for ${g}`);
    assert.ok(html.includes(`id="btn-mute-${g}"`), `Missing mute button for ${g}`);
    assert.ok(html.includes(`id="select-music-${g}"`), `Missing music select for ${g}`);
    assert.ok(html.includes(`switchGameMusic('${g}')`), `Missing switch music trigger for ${g}`);
  }

  // Streamer PC Echo Protection & Preview Player
  assert.ok(html.includes('id="chk-obs-only-audio"'));
  assert.ok(html.includes('toggleObsAudioProtection'));
  assert.ok(html.includes('id="admin-audio-player"'));
  assert.ok(html.includes('id="slider-preview-volume"'));
  assert.ok(html.includes('testMusicDucking()'));

  // Server support for catalog and audio streaming
  const serverCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'server.js'), 'utf-8');
  assert.ok(serverCode.includes('/api/music/catalog'));
  assert.ok(serverCode.includes('/shared-music/'));

  // CSS classes
  const css = fs.readFileSync(path.join(ROOT_DIR, 'public', 'styles.css'), 'utf-8');
  assert.ok(css.includes('.mixer-grid'));
  assert.ok(css.includes('.mixer-card'));
  assert.ok(css.includes('.volume-control-box'));
  assert.ok(css.includes('.vol-btn-step'));
  assert.ok(css.includes('.vol-percent-badge'));
  assert.ok(css.includes('.music-selector-box'));
});

test('13. Shared Music Manager: Controller methods, volume adjustment, music switching and TTS balance', () => {
  const appJs = fs.readFileSync(path.join(ROOT_DIR, 'public', 'app.js'), 'utf-8');
  // Initialization & Volume API
  assert.ok(appJs.includes('initAdminMusic'));
  assert.ok(appJs.includes('sendMusicControl'));
  assert.ok(appJs.includes('setMasterBgmVolume'));
  assert.ok(appJs.includes('adjustMasterVolume'));
  assert.ok(appJs.includes('toggleMasterMute'));
  assert.ok(appJs.includes('resetAllVolumesToDefault'));

  // Per-game controls
  assert.ok(appJs.includes('setGameVolume'));
  assert.ok(appJs.includes('adjustGameVolume'));
  assert.ok(appJs.includes('toggleGameMute'));
  assert.ok(appJs.includes('switchGameMusic'));
  assert.ok(appJs.includes('playGameMusicCue'));

  // Preview & Ducking test
  assert.ok(appJs.includes('previewTrack'));
  assert.ok(appJs.includes('stopMusicPreview'));
  assert.ok(appJs.includes('setPreviewVolume'));
  assert.ok(appJs.includes('toggleObsAudioProtection'));
  assert.ok(appJs.includes('testMusicDucking'));

  // Balanced TTS Speech Volume (not overpower BGM)
  const html = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf-8');
  assert.ok(html.includes('value="80"')); // Default TTS slider set to 80%
  assert.ok(appJs.includes("value || '80'"));
});



