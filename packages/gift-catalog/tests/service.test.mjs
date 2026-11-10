import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GiftCatalogService, REGISTERED_GAME_ACTIONS } from '../src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

test('1. GiftCatalogService loads data and returns statistics', () => {
  const service = new GiftCatalogService(rootDir);
  const stats = service.getStats();
  assert.ok(stats.totalCatalog >= 4);
  assert.ok(stats.totalMappings >= 10);
});

test('2. Search gifts supports query, region, tier', () => {
  const service = new GiftCatalogService(rootDir);
  const res = service.searchGifts({ query: 'Rose', region: 'ALL' });
  assert.ok(res.total >= 1);
  assert.ok(res.gifts.some(g => g.name.toLowerCase().includes('rose')));
});

test('3. Registered game actions covers all 5 games without arbitrary code', () => {
  assert.ok(REGISTERED_GAME_ACTIONS['mini-war'].length >= 3);
  assert.ok(REGISTERED_GAME_ACTIONS['cat-cafe'].length >= 5);
  assert.ok(REGISTERED_GAME_ACTIONS['english-class'].length >= 1);
  assert.ok(REGISTERED_GAME_ACTIONS['quiz-show'].length >= 1);
  assert.ok(REGISTERED_GAME_ACTIONS['duoi-hinh-bat-chu'].length >= 2);
});

test('4. Per-game mapping lookup and CRUD operations', () => {
  const service = new GiftCatalogService(rootDir);
  const mwRule = service.findMatchingRule('mini-war', 'Rose');
  assert.ok(mwRule);
  assert.equal(mwRule.action, 'spawn_unit');

  const catRule = service.findMatchingRule('cat-cafe', 'Rose');
  assert.ok(catRule);
  assert.equal(catRule.action, 'cat_cafe.gift_effect');

  // Add custom mapping
  const created = service.saveMapping({
    gameType: 'cat-cafe',
    giftName: 'CustomCake',
    action: 'cat_cafe.dance',
    cooldownSec: 5,
  });
  assert.ok(created.id);
  assert.equal(service.findMatchingRule('cat-cafe', 'CustomCake')?.action, 'cat_cafe.dance');

  // Toggle
  const enabledState = service.toggleMapping(created.id);
  assert.equal(enabledState, false);

  // Delete
  const deleted = service.deleteMapping(created.id);
  assert.equal(deleted, true);
});

test('5. Real vs Mock analytics separation', () => {
  const service = new GiftCatalogService(rootDir);
  service.resetAnalytics();

  // Record Real gift
  service.recordPipelineEvent({
    id: 'evt_real_1',
    timestamp: Date.now(),
    source: 'real',
    giftName: 'Rose',
    count: 5,
    diamondCount: 5,
    viewerNick: 'RealFan',
    activeGame: 'mini-war',
    targetGame: 'mini-war',
    resolvedStatus: 'observed-id',
    pipelineStatus: 'executed',
  });

  // Record Mock gift
  service.recordPipelineEvent({
    id: 'evt_mock_1',
    timestamp: Date.now(),
    source: 'mock',
    giftName: 'Lion',
    count: 1,
    viewerNick: 'Tester',
    activeGame: 'cat-cafe',
    targetGame: 'cat-cafe',
    resolvedStatus: 'name-only-unverified',
    pipelineStatus: 'executed',
  });

  const analytics = service.getAnalytics();
  // Real stats must only contain the Rose event
  assert.equal(analytics.real.totalGifts, 5);
  assert.equal(analytics.real.totalDiamonds, 5);
  assert.equal(analytics.real.totalActionsExecuted, 1);
  assert.equal(analytics.real.topGifts['Rose'], 5);
  assert.equal(analytics.real.topGifts['Lion'], undefined);

  // Mock stats must only contain Lion
  assert.equal(analytics.mock.totalSimulatedGifts, 1);
  assert.equal(analytics.mock.totalActionsExecuted, 1);
  assert.equal(analytics.mock.topGifts['Lion'], 1);
  assert.equal(analytics.mock.topGifts['Rose'], undefined);

  // Pipeline history contains both in chronological order
  assert.equal(analytics.pipelineHistory.length, 2);
});

test('6. Unknown gift tracking and fallback', () => {
  const service = new GiftCatalogService(rootDir);
  const resolution = service.resolveGiftEvent(null, 'UnknownMysteryBox999');
  assert.equal(resolution.status, 'unresolved');
  assert.equal(resolution.match, null);

  service.recordPipelineEvent({
    id: 'evt_unknown_1',
    timestamp: Date.now(),
    source: 'real',
    giftName: 'UnknownMysteryBox999',
    count: 3,
    viewerNick: 'SecretViewer',
    activeGame: 'mini-war',
    targetGame: 'mini-war',
    resolvedStatus: 'unresolved',
    pipelineStatus: 'unknown_gift',
  });

  const a = service.getAnalytics();
  assert.ok(a.real.unknownGifts['UnknownMysteryBox999']);
  assert.equal(a.real.unknownGifts['UnknownMysteryBox999'].count, 3);
});

test('7. Interactive triggers management across games', () => {
  const service = new GiftCatalogService(rootDir);
  const allTriggers = service.getInteractiveTriggers();
  assert.ok(allTriggers['quiz-show']);
  assert.ok(allTriggers['duoi-hinh-bat-chu']);
  assert.equal(allTriggers['quiz-show'].likeGoal.targetCount, 10);
  assert.equal(allTriggers['quiz-show'].likeGoal.action, 'quiz_show.hint_5050');

  // Update trigger for quiz-show
  const updated = service.saveInteractiveTrigger({
    gameType: 'quiz-show',
    gameName: 'PTPlay Quiz Show',
    likeGoal: {
      enabled: true,
      targetCount: 15,
      action: 'quiz_show.add_time',
      actionLabel: 'Cộng thêm 10 giây',
      resetMode: 'per_round',
      ttsAnnouncement: 'Khán giả thả đủ 15 tim!',
    },
  });
  assert.equal(updated.likeGoal.targetCount, 15);
  const fetchSingle = service.getInteractiveTriggers('quiz-show');
  assert.equal(fetchSingle.likeGoal.targetCount, 15);

  // Restore back to default 10 for consistency
  service.saveInteractiveTrigger({
    gameType: 'quiz-show',
    gameName: 'PTPlay Quiz Show',
    likeGoal: {
      enabled: true,
      targetCount: 10,
      action: 'quiz_show.hint_5050',
      actionLabel: 'Gợi ý 50:50 (Loại 2 đáp án sai)',
      resetMode: 'per_round',
      ttsAnnouncement: 'Khán giả đã thả đủ {count} tim! Gợi ý 50:50 loại bỏ 2 đáp án sai đã xuất hiện!',
    },
  });
});


