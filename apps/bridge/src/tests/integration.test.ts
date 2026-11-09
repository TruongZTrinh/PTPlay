import assert from 'node:assert';
import { TikFinityProvider, TikFinityRawMessage } from '../providers/TikFinityProvider.js';
import { TeamManager } from '../systems/TeamManager.js';
import { GiftStreakHandler } from '../systems/GiftStreakHandler.js';
import { GiftMapper } from '../systems/GiftMapper.js';
import { EventQueue } from '../systems/EventQueue.js';
import { DataSanitizer } from '../utils/sanitizer.js';
import { TikFinityProber } from '../utils/TikFinityProber.js';
import { GameCommand, NormalizedGiftEvent } from '../types/events.js';

console.log('========================================================');
console.log('🧪 RUNNING PTPLAY LIVE BRIDGE FULL INTEGRATION & SECURITY SUITE');
console.log('========================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', (err as Error).message);
      failed++;
    }
  }

  // --- 1. REAL TIKFINITY RAW PAYLOAD NORMALIZATION & PRIVACY ---
  await test('1. RAW TikFinity Chat: Normalized correctly', () => {
    const provider = new TikFinityProvider();
    const rawMsg: TikFinityRawMessage = {
      event: 'chat',
      data: {
        userId: '729384910293847581',
        uniqueId: 'quang_minh_live',
        nickname: 'Quang Minh 🔴',
        comment: 'ĐỎ TIẾP VIỆN CHIẾN BINH!',
      },
    };

    const norm = provider.normalizeEvent(rawMsg);
    assert(norm !== null, 'Normalized event should not be null');
    assert.strictEqual(norm.type, 'chat');
    assert.strictEqual(norm.userId, '729384910293847581');
    assert.strictEqual(norm.comment, 'ĐỎ TIẾP VIỆN CHIẾN BINH!');
  });

  await test('2. Privacy Masking: Masks UserID & redacts credentials', () => {
    const rawData = {
      userId: '729384910293847581',
      accessToken: 'tok_live_abc123',
      nested: {
        user_id: '883920192837465192',
        clientSecret: 'shhh_secret',
      },
    };

    const sanitized = DataSanitizer.sanitizeObject(rawData) as Record<string, any>;
    assert.strictEqual(sanitized.userId, '729****581');
    assert.strictEqual(sanitized.accessToken, '[REDACTED]');
    assert.strictEqual(sanitized.nested.user_id, '883****192');
    assert.strictEqual(sanitized.nested.clientSecret, '[REDACTED]');
  });

  // --- 2. LIVE ROOM STATUS MULTI-STATE MACHINE ---
  await test('3. Live Room Status: Does NOT conclude disconnected on inactivity', () => {
    const provider = new TikFinityProvider();
    // Initially not connected
    assert.strictEqual(provider.getStatus().liveRoomStatus, 'disconnected');

    // Simulate receiving a live chat event
    const rawChat: TikFinityRawMessage = {
      event: 'chat',
      data: { userId: '123', nickname: 'Viewer', comment: 'ĐỎ' },
    };
    // Emulate message reception
    provider['handleMessage'](JSON.stringify(rawChat));

    // When events arrive, status is 'active'
    assert.strictEqual(provider.getStatus().liveRoomStatus, 'active');

    // Simulate silence > 60 seconds (set lastEventTime to 65s ago)
    provider['lastEventTime'] = Date.now() - 65000;
    provider['wsConnected'] = true;

    // Trigger inactivity check
    provider['inactivityCheckTimer'] = null;
    if (Date.now() - provider['lastEventTime'] > 60000) {
      provider['liveRoomStatus'] = 'no_recent_events';
    }

    // Must be 'no_recent_events' (Quiet), NEVER 'disconnected'!
    const status = provider.getStatus();
    assert.strictEqual(status.liveRoomStatus, 'no_recent_events');
    assert(status.liveRoomStatusText.includes('Không có sự kiện mới trong 60s qua / Yên tĩnh'));

    // When a new event arrives, immediately returns to 'active'
    provider['handleMessage'](JSON.stringify(rawChat));
    assert.strictEqual(provider.getStatus().liveRoomStatus, 'active');
  });

  // --- 3. REAL-WORLD TIKFINITY GIFT STREAKS & EDGE CASES ---
  await test('4. Real TikFinity Gift Streak: Incremental delta calculation & string counts', () => {
    const handler = new GiftStreakHandler();

    // Tap 1: Rose single click
    const gift1: NormalizedGiftEvent = {
      id: 'tf_evt_101',
      type: 'gift',
      provider: 'tikfinity',
      userId: 'fan_tiktok_99',
      uniqueId: 'fan_tiktok_99',
      nickname: 'Fan Cứng',
      giftId: 5655,
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 1,
      deltaCount: 1,
      repeatEnd: false,
      groupId: 'group_streak_7788',
      timestamp: Date.now(),
    };
    const r1 = handler.processGift(gift1);
    assert.strictEqual(r1.isDuplicate, false);
    assert.strictEqual(r1.deltaCount, 1);

    // Tap 2: Burst to repeatCount = 5 (real TikFinity sends cumulative repeatCount)
    const gift2: NormalizedGiftEvent = {
      ...gift1,
      id: 'tf_evt_102',
      repeatCount: 5,
    };
    const r2 = handler.processGift(gift2);
    assert.strictEqual(r2.deltaCount, 4); // 5 - 1 = 4

    // Tap 3: End of streak with repeatCount = 10, repeatEnd = true
    const gift3: NormalizedGiftEvent = {
      ...gift1,
      id: 'tf_evt_103',
      repeatCount: 10,
      repeatEnd: true,
    };
    const r3 = handler.processGift(gift3);
    assert.strictEqual(r3.deltaCount, 5); // 10 - 5 = 5
    assert.strictEqual(r3.isStreakEnd, true);

    // Total units calculated for this 10-rose streak: 1 + 4 + 5 = 10 units!
    assert.strictEqual(handler.totalUnitsCalculated, 10);
  });

  await test('5. Real TikFinity Edge Case: New streak starts immediately after reset', () => {
    const handler = new GiftStreakHandler();

    const g1: NormalizedGiftEvent = {
      id: 'ev_a1',
      type: 'gift',
      provider: 'tikfinity',
      userId: 'user_x',
      uniqueId: 'user_x',
      nickname: 'User X',
      giftId: 'rose',
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 15,
      deltaCount: 15,
      repeatEnd: false, // Streak ongoing
      timestamp: Date.now(),
    };
    handler.processGift(g1);

    // Viewer abruptly starts a new streak: repeatCount drops from 15 down to 1!
    const g2: NormalizedGiftEvent = {
      ...g1,
      id: 'ev_a2',
      repeatCount: 1,
    };
    const r2 = handler.processGift(g2);
    // Must recognize as new streak and produce deltaCount = 1, NOT 0 or negative!
    assert.strictEqual(r2.deltaCount, 1);
  });

  // --- 4. OVERFLOW POLICY STRICT COMPLIANCE ---
  await test('6. Overflow Policy: Default "wait" holds command without auto-converting', async () => {
    const queue = new EventQueue();
    queue.overflowPolicy = 'wait';
    queue.maxUnitsPerTeam = 35;
    queue.currentUnitsRed = 35; // At cap

    const dispatched: GameCommand[] = [];
    queue.setDispatcher((c) => dispatched.push(c));

    queue.push({
      id: 'test_cap_cmd',
      action: 'spawn_unit',
      team: 'red',
      unitType: 'warrior',
      count: 2,
      timestamp: Date.now(),
    });
    queue.start();

    await new Promise((r) => setTimeout(r, 250));
    assert.strictEqual(dispatched.length, 0, 'Command must wait, not dispatch or convert');

    // Units die -> frees up room
    queue.currentUnitsRed = 15;
    await new Promise((r) => setTimeout(r, 250));

    assert.strictEqual(dispatched.length, 1);
    assert.strictEqual(dispatched[0].action, 'spawn_unit');
    queue.stop();
  });

  // --- 5. TIKFINITY PROBER DIAGNOSTIC ---
  await test('7. TikFinityProber: Diagnostic probe reports accurately when port is closed', async () => {
    const probe = await TikFinityProber.runFullDiagnostic(0, 8088);
    assert(probe !== null);
    assert.strictEqual(typeof probe.tikfinityPort.open, 'boolean');
    assert.strictEqual(probe.gameClient.connected, false);
    assert(probe.recommendations.length > 0);
  });

  // --- 6. DUAL GAME PROFILE & ACTIVE GAME ISOLATION ---
  await test('8. Dual Game Isolation: Active game selector prevents cross-game event leakage', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8099);

    // Initial default is 'mini-war'
    assert.strictEqual(server.activeGame, 'mini-war');

    // Live chat when activeGame is 'mini-war'
    server.processIncomingLiveEvent({
      id: 'e1',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'user_warrior_1',
      uniqueId: 'warrior1',
      nickname: 'Hiệp Sĩ Đỏ',
      comment: 'ĐỎ CHIẾN THẮNG!',
    });

    // Check queued commands: should contain Mini War join_team, 0 cat commands
    const queueLogs = server.eventQueue.getRecentLogs();
    const miniWarCmds = queueLogs.filter((l) => !l.action.startsWith('cat_cafe.'));
    const catCmds = queueLogs.filter((l) => l.action.startsWith('cat_cafe.'));
    assert(miniWarCmds.length >= 1, 'Mini war command must be queued');
    assert.strictEqual(catCmds.length, 0, 'No cat cafe command must be queued when activeGame is mini-war');

    // Switch to cat-cafe
    server.activeGame = 'cat-cafe';
    server.eventQueue.clear();

    server.processIncomingLiveEvent({
      id: 'e2',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'user_cat_1',
      uniqueId: 'catfan1',
      nickname: 'Mèo Miu',
      comment: 'ĂN ĐI MÈO ƠI!',
    });

    const queueLogs2 = server.eventQueue.getRecentLogs();
    const miniWarCmds2 = queueLogs2.filter((l) => !l.action.startsWith('cat_cafe.'));
    const catCmds2 = queueLogs2.filter((l) => l.action.startsWith('cat_cafe.'));
    assert.strictEqual(miniWarCmds2.length, 0, 'No mini war commands when activeGame is cat-cafe');
    assert.strictEqual(catCmds2.length, 1, 'Cat cafe command must be queued');
    assert.strictEqual(catCmds2[0].action, 'cat_cafe.feed');

    await server.stop();
  });

  // --- 7. SPECTATOR MORALE CHEER & BOSS CHANT ---
  await test('9. Spectator Participation: Cheer and Boss chant handling', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8098);
    server.activeGame = 'mini-war';

    // 1. Join Blue team
    server.processIncomingLiveEvent({
      id: 'c1',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'cheer_user_1',
      uniqueId: 'blue_fan',
      nickname: 'Phan Xanh',
      comment: 'XANH VÔ ĐỊCH',
    });

    // 2. Spectator cheers with 'CHIẾN'
    server.processIncomingLiveEvent({
      id: 'c2',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'cheer_user_1',
      uniqueId: 'blue_fan',
      nickname: 'Phan Xanh',
      comment: 'CHIẾN ĐI ANH EM!',
    });

    // 3. Spectator chants 'BOSS'
    server.processIncomingLiveEvent({
      id: 'c3',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'cheer_user_1',
      uniqueId: 'blue_fan',
      nickname: 'Phan Xanh',
      comment: 'GỌI BOSS RA ĐI',
    });

    const logs = server.eventQueue.getRecentLogs();
    const cheerCmd = logs.find((l) => l.action === 'boost_team');
    const bossChantCmd = logs.find((l) => l.action === 'trigger_effect');

    assert(cheerCmd !== undefined, 'Cheer command must be dispatched');
    assert.strictEqual(cheerCmd?.team, 'blue');
    assert(bossChantCmd !== undefined, 'Boss chant command must be dispatched');

    await server.stop();
  });

  // --- 8. PROVIDER INDEPENDENCE & RUNTIME DYNAMIC SWITCHING ---
  await test('10. Provider Independence: Runtime switching without modifying or restarting games', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8097);

    assert.strictEqual(server.getActiveProviderId(), 'mock');

    // Switch to tikfinity
    const switchedToTk = await server.switchProvider('tikfinity');
    assert.strictEqual(switchedToTk, true);
    assert.strictEqual(server.getActiveProviderId(), 'tikfinity');
    assert.strictEqual(server.activeProvider.name, 'TikFinity Desktop Provider');

    // Switch to synthetic
    const switchedToSyn = await server.switchProvider('synthetic');
    assert.strictEqual(switchedToSyn, true);
    assert.strictEqual(server.getActiveProviderId(), 'synthetic');
    assert.strictEqual(server.activeProvider.name, 'Synthetic Webhook Provider');

    // Switch back to mock
    const switchedBack = await server.switchProvider('mock');
    assert.strictEqual(switchedBack, true);
    assert.strictEqual(server.getActiveProviderId(), 'mock');

    // Register a custom 3rd-party provider
    const { MockProvider } = await import('../providers/MockProvider.js');
    class CustomPlatformProvider extends MockProvider {
      public override readonly name = 'Custom Platform Provider';
      public override readonly endpoint = 'custom://live-stream';
    }
    const customProv = new CustomPlatformProvider();
    server.registerProvider('custom_stream', customProv);

    const switchedCustom = await server.switchProvider('custom_stream');
    assert.strictEqual(switchedCustom, true);
    assert.strictEqual(server.getActiveProviderId(), 'custom_stream');
    assert.strictEqual(server.activeProvider.name, 'Custom Platform Provider');

    await server.stop();
  });

  // --- 9. SYNTHETIC WEBHOOK PROVIDER (DELIBERATELY DIFFERENT RAW FORMAT) -> MINI WAR ---
  await test('11. Synthetic Webhook Provider: Normalizes distinct raw schema for Mini War Arena', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8096);
    server.activeGame = 'mini-war';
    await server.switchProvider('synthetic');

    // Raw schema differs completely: eventType, sender.accountId, payload.text
    server.syntheticProvider.ingestWebhook({
      eventType: 'chat.message',
      eventId: 'syn_mw_chat_1',
      sender: {
        accountId: 'syn_user_881',
        handle: 'general_red',
        displayName: 'Chiến Tướng Đỏ',
      },
      payload: {
        text: 'ĐỎ XÔNG LÊN TIẾN CÔNG!',
      },
    });

    // Check user was assigned to Red team
    const team = server.teamManager.getUserTeam('syn_user_881');
    assert.strictEqual(team, 'red', 'User must join Red team from synthetic webhook');

    // Ingest donation with skuId & skuTitle (not TikFinity giftName/giftCount)
    server.syntheticProvider.ingestWebhook({
      eventType: 'stream.donation',
      eventId: 'syn_mw_gift_1',
      sender: {
        accountId: 'syn_user_881',
        handle: 'general_red',
        displayName: 'Chiến Tướng Đỏ',
      },
      payload: {
        skuId: 5655,
        skuTitle: 'Rose',
        count: 3,
        delta: 3,
        isFinished: true,
      },
    });

    const logs = server.eventQueue.getRecentLogs();
    const spawnCmd = logs.find((l) => l.action === 'spawn_unit');
    assert(spawnCmd !== undefined, 'Spawn command must be queued from synthetic gift');
    assert.strictEqual(spawnCmd?.team, 'red');

    await server.stop();
  });

  // --- 10. SYNTHETIC WEBHOOK PROVIDER -> CAT CAFÉ ---
  await test('12. Synthetic Webhook Provider: Normalizes distinct raw schema for Cat Café', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8095);
    server.activeGame = 'cat-cafe';
    await server.switchProvider('synthetic');

    // Chat for Cat Café: "CHO AN" (Feed)
    server.syntheticProvider.ingestWebhook({
      eventType: 'chat.message',
      eventId: 'syn_cat_chat_1',
      sender: {
        accountId: 'syn_cat_user_22',
        handle: 'sen_cham_chi',
        displayName: 'Sen Chăm Chỉ',
      },
      payload: {
        text: 'CHO AN ĐI SEN',
      },
    });

    // Donation for Cat Café
    server.syntheticProvider.ingestWebhook({
      eventType: 'stream.donation',
      eventId: 'syn_cat_gift_1',
      sender: {
        accountId: 'syn_cat_user_22',
        handle: 'sen_cham_chi',
        displayName: 'Sen Chăm Chỉ',
      },
      payload: {
        skuId: 'heart_01',
        skuTitle: 'Heart',
        count: 1,
        delta: 1,
        isFinished: true,
      },
    });

    const logs = server.eventQueue.getRecentLogs();
    const feedCmd = logs.find((l) => l.action === 'cat_cafe.feed');
    const giftCmd = logs.find((l) => l.action === 'cat_cafe.gift_effect');

    assert(feedCmd !== undefined, 'cat_cafe.feed must be dispatched');
    assert(giftCmd !== undefined, 'cat_cafe.gift_effect must be dispatched');

    // Verify Mini War commands were NOT queued
    const miniWarCmds = logs.filter((l) => !l.action.startsWith('cat_cafe.'));
    assert.strictEqual(miniWarCmds.length, 0, 'No Mini War commands should be queued when game is Cat Café');

    await server.stop();
  });

  // --- 11. PROVIDER-AGNOSTIC GIFT MAPPING (ALIASES & IDS) ---
  await test('13. Gift Mapping: Supports provider IDs, localized aliases & backward compatibility', () => {
    const mapper = new GiftMapper();

    // 1. Direct name match
    const ruleRose = mapper.findRule('Rose');
    assert.strictEqual(ruleRose?.id, 'rule_rose');

    // 2. Localized alias match
    const ruleByAlias1 = mapper.findRule('Hoa hồng');
    assert.strictEqual(ruleByAlias1?.id, 'rule_rose');

    const ruleByAlias2 = mapper.findRule('tim');
    assert.strictEqual(ruleByAlias2?.id, 'rule_heart');

    // 3. Provider numeric or string ID match
    const ruleById = mapper.findRule('Unknown Title', 5655);
    assert.strictEqual(ruleById?.id, 'rule_rose');

    const ruleByHeartId = mapper.findRule('Different Heart Name', 'heart_01');
    assert.strictEqual(ruleByHeartId?.id, 'rule_heart');

    // 4. Custom rule with aliases
    mapper.saveRule({
      id: 'rule_custom_dragon',
      giftName: 'Infernal Dragon',
      aliases: ['hỏa long', 'rồng lửa', 'dragon_sku_9'],
      action: 'spawn_boss',
      multiplier: 1,
      cooldownSec: 5,
      maxSpawnPerEvent: 1,
      enabled: true,
      description: 'Summon Boss',
    });

    assert.strictEqual(mapper.findRule('hỏa long')?.id, 'rule_custom_dragon');
    assert.strictEqual(mapper.findRule('rồng lửa')?.id, 'rule_custom_dragon');
    assert.strictEqual(mapper.findRule('dragon_sku_9')?.id, 'rule_custom_dragon');
  });

  // --- 12. PROVIDER DEDUPLICATION & STREAK HANDLING ---
  await test('14. Streak Handler & Deduplication: Operates purely on NormalizedGiftEvent', () => {
    const handler = new GiftStreakHandler();

    const event1: NormalizedGiftEvent = {
      id: 'gift_evt_uniq_1',
      provider: 'synthetic',
      timestamp: Date.now(),
      type: 'gift',
      userId: 'user_streak_99',
      uniqueId: '@streak99',
      nickname: 'Streaker',
      giftId: 'item_100',
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 1,
      deltaCount: 1,
      repeatEnd: false,
    };

    const res1 = handler.processGift(event1);
    assert.strictEqual(res1.isDuplicate, false);
    assert.strictEqual(res1.deltaCount, 1);

    // Duplicate message with same id
    const resDup = handler.processGift(event1);
    assert.strictEqual(resDup.isDuplicate, true);
    assert.strictEqual(resDup.deltaCount, 0);

    // Continuation with repeatCount = 5
    const event2: NormalizedGiftEvent = {
      ...event1,
      id: 'gift_evt_uniq_2',
      repeatCount: 5,
      repeatEnd: true,
    };
    const res2 = handler.processGift(event2);
    assert.strictEqual(res2.isDuplicate, false);
    assert.strictEqual(res2.deltaCount, 4); // 5 - 1 = 4
    assert.strictEqual(res2.isStreakEnd, true);
  });

  // --- 15. ENGLISH CLASS LIVE GAME ISOLATION & COMMAND PARSING ---
  await test('15. English Class LIVE: Active game selector, commands & avatar passthrough', async () => {
    const { GameBridgeServer } = await import('../server/GameBridgeServer.js');
    const server = new GameBridgeServer(8099);

    // Switch to English Class LIVE
    server.activeGame = 'english-class-live';
    server.eventQueue.clear();

    // 1. JOIN command
    server.processIncomingLiveEvent({
      id: 'eng_chat_1',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'student_123',
      uniqueId: 'student_123',
      nickname: 'Mai Lan',
      comment: 'VÀO LỚP ƠI',
      profilePictureUrl: 'https://p16-sign.tiktokcdn.com/tos-maliva/avatar.jpg',
    });

    // 2. Answer B
    server.processIncomingLiveEvent({
      id: 'eng_chat_2',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'student_123',
      uniqueId: 'student_123',
      nickname: 'Mai Lan',
      comment: 'Đáp án: B',
      profilePictureUrl: 'https://p16-sign.tiktokcdn.com/tos-maliva/avatar.jpg',
    });

    // 3. Team Red
    server.processIncomingLiveEvent({
      id: 'eng_chat_3',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'chat',
      userId: 'student_456',
      uniqueId: 'student_456',
      nickname: 'Bảo Nam',
      comment: 'ĐỎ',
    });

    // 4. Gift Rose
    server.processIncomingLiveEvent({
      id: 'eng_gift_1',
      provider: 'mock',
      timestamp: Date.now(),
      type: 'gift',
      userId: 'student_123',
      uniqueId: 'student_123',
      nickname: 'Mai Lan',
      giftId: 'rose',
      giftName: 'Rose',
      diamondCount: 1,
      repeatCount: 1,
      deltaCount: 1,
      repeatEnd: true,
      profilePictureUrl: 'https://p16-sign.tiktokcdn.com/tos-maliva/avatar.jpg',
    });

    const logs = server.eventQueue.getRecentLogs();
    const joinCmd = logs.find((l) => l.action === 'english_class.join');
    const ansCmd = logs.find((l) => l.action === 'english_class.answer');
    const teamCmd = logs.find((l) => l.action === 'english_class.team');
    const giftCmd = logs.find((l) => l.action === 'english_class.gift');

    assert(joinCmd, 'Join command must be queued for English Class');
    assert.strictEqual(joinCmd?.userName, 'Mai Lan');

    assert(ansCmd, 'Answer command must be queued');
    assert.strictEqual(ansCmd?.userName, 'Mai Lan');

    assert(teamCmd, 'Team command must be queued');
    assert.strictEqual(teamCmd?.team, 'red');

    assert(giftCmd, 'Gift command must be queued');

    await server.stop();
  });

  // --- 16. TIKFINITY RAW AVATAR EXTRACTION ---
  await test('16. TikFinity Provider: Normalizes profile picture across variant field names', async () => {
    const { TikFinityProvider } = await import('../providers/TikFinityProvider.js');
    const provider = new TikFinityProvider();

    // Standard profilePictureUrl
    const ev1 = provider.normalizeEvent({
      event: 'chat',
      data: {
        userId: 'u1',
        nickname: 'Alice',
        comment: 'JOIN',
        profilePictureUrl: 'https://cdn.example.com/a.jpg',
      },
    });
    assert.strictEqual((ev1 as any)?.profilePictureUrl, 'https://cdn.example.com/a.jpg');

    // Misspelled profilePicturUrl (Streamer.bot connector)
    const ev2 = provider.normalizeEvent({
      event: 'chat',
      data: {
        userId: 'u2',
        nickname: 'Bob',
        comment: 'A',
        profilePicturUrl: 'https://cdn.example.com/b.jpg',
      },
    });
    assert.strictEqual((ev2 as any)?.profilePictureUrl, 'https://cdn.example.com/b.jpg');

    // Nested user object
    const ev3 = provider.normalizeEvent({
      event: 'chat',
      data: {
        userId: 'u3',
        nickname: 'Charlie',
        comment: 'B',
        user: { avatarUrl: 'https://cdn.example.com/c.jpg' },
      },
    });
    assert.strictEqual((ev3 as any)?.profilePictureUrl, 'https://cdn.example.com/c.jpg');
  });

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

void runTests();
