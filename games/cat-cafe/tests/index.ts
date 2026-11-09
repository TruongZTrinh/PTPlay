import assert from 'node:assert';
import { TextSanitizer } from '../src/game/utils/TextSanitizer';
import { CafeCommandAdapter } from '../src/game/events/CafeCommandAdapter';
import { CAFE_CONFIG, COAT_VARIANTS, PERSONALITY_DEFS, LEVEL_MILESTONES, SESSION_CHALLENGES } from '../src/game/config/CafeConfig';
import { ProgressionManager } from '../src/game/progression/ProgressionManager';
import { TTSController } from '../src/game/systems/TTSController';

console.log('========================================================');
console.log('🧪 RUNNING PTPLAY CAT CAFÉ FULL V1.0 TEST SUITE');
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

  // --- 1. TEXT SANITIZATION & PRIVACY ---
  await test('1.1 Nickname Sanitization: Strips XSS and trims whitespace', () => {
    const raw = '  <script>alert("hack")</script>Mèo Con <b>Xinh</b>  ';
    const clean = TextSanitizer.sanitizeNickname(raw, 16);
    assert.strictEqual(clean, 'alert("hack")Mèo');
    assert(!clean.includes('<script>'), 'Must not contain HTML tags');
  });

  await test('1.2 Nickname Truncation: Bounded to 16 visible characters', () => {
    const longName = 'BéMèoDễThươngSiêuCấpVôĐịchVũTrụNày';
    const truncated = TextSanitizer.sanitizeNickname(longName, 16);
    assert.strictEqual(Array.from(truncated).length, 16);
  });

  await test('1.3 Nickname Fallback: Empty string returns default nickname', () => {
    const empty = TextSanitizer.sanitizeNickname('    ');
    assert.strictEqual(empty, 'Bé Mèo Khách');
  });

  await test('1.4 Privacy: Masks TikTok User IDs accurately', () => {
    const masked = TextSanitizer.maskUserId('72938491029384');
    assert.strictEqual(masked, '729****384');
    const shortMasked = TextSanitizer.maskUserId('1234');
    assert.strictEqual(shortMasked, '****');
  });

  await test('1.5 Vietnamese Diacritic Stripping: Handles accents properly', () => {
    assert.strictEqual(TextSanitizer.stripVietnameseAccents('MÈO ƠI ĂN CƠM'), 'MEO OI AN COM');
    assert.strictEqual(TextSanitizer.stripVietnameseAccents('ĐI NGỦ VÀ CHƠI ĐÙA'), 'DI NGU VA CHOI DUA');
    assert.strictEqual(TextSanitizer.stripVietnameseAccents('YÊU THƯƠNG QUÁN MÈO'), 'YEU THUONG QUAN MEO');
    assert.strictEqual(TextSanitizer.stripVietnameseAccents('GỌI CHỤP VƯỜN HOA'), 'GOI CHUP VUON HOA');
  });

  await test('1.6 Deterministic Coat Assignment: Same userId gets same coat hash across 8 breeds', () => {
    const uid = 'user_tiktok_998877';
    const hash1 = TextSanitizer.hashString(uid) % COAT_VARIANTS.length;
    const hash2 = TextSanitizer.hashString(uid) % COAT_VARIANTS.length;
    assert.strictEqual(hash1, hash2);
    assert(hash1 >= 0 && hash1 < 8);
    assert.strictEqual(COAT_VARIANTS.length, 8, 'Must have exactly 8 illustrated cat breeds');
  });

  // --- 2. COMMAND ADAPTER & ALIASES (ALL 8 COMMANDS + GIFTS) ---
  const adapter = new CafeCommandAdapter();

  await test('2.1 Join Command: Recognizes MÈO, MEO, MEOW, CAT, and diacritic variants', () => {
    const variants = ['MÈO', 'mèo', 'MEO', 'meo', 'Meow', 'CAT', 'cat', '  mèo ơi  ', 'xin mèo'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as join`);
      assert.strictEqual(res.action, 'cat_cafe.join');
    }
  });

  await test('2.2 Feed Command: Recognizes ĂN, AN, FEED, EAT, and diacritic variants', () => {
    const variants = ['ĂN', 'ăn', 'AN', 'an', 'FEED', 'eat', 'cho ăn'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as feed`);
      assert.strictEqual(res.action, 'cat_cafe.feed');
    }
  });

  await test('2.3 Play Command: Recognizes CHƠI, CHOI, PLAY', () => {
    const variants = ['CHƠI', 'chơi', 'CHOI', 'play', 'chơi đùa'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as play`);
      assert.strictEqual(res.action, 'cat_cafe.play');
    }
  });

  await test('2.4 Nap Command: Recognizes NGỦ, NGU, SLEEP, NAP', () => {
    const variants = ['NGỦ', 'ngủ', 'NGU', 'sleep', 'nap', 'đi ngủ'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as nap`);
      assert.strictEqual(res.action, 'cat_cafe.nap');
    }
  });

  await test('2.5 Love Command: Recognizes YÊU, YEU, LOVE, TIM', () => {
    const variants = ['YÊU', 'yêu', 'YEU', 'love', 'tim', 'thả tim'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as love`);
      assert.strictEqual(res.action, 'cat_cafe.love');
    }
  });

  await test('2.6 Call Command: Recognizes GỌI, GOI, CALL, COME', () => {
    const variants = ['GỌI', 'gọi', 'GOI', 'goi', 'CALL', 'come', 'gọi mèo'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as call`);
      assert.strictEqual(res.action, 'cat_cafe.call');
    }
  });

  await test('2.7 Photo Command: Recognizes CHỤP, CHUP, PHOTO, PIC', () => {
    const variants = ['CHỤP', 'chụp', 'CHUP', 'chup', 'PHOTO', 'pic', 'chụp ảnh'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as photo`);
      assert.strictEqual(res.action, 'cat_cafe.photo');
    }
  });

  await test('2.8 Garden Command: Recognizes VƯỜN, VUON, GARDEN, OUT', () => {
    const variants = ['VƯỜN', 'vườn', 'VUON', 'vuon', 'GARDEN', 'out', 'ra vườn'];
    for (const v of variants) {
      const res = adapter.parseComment('u1', '@u1', 'Nick', v);
      assert(res !== null, `Variant '${v}' should be recognized as garden`);
      assert.strictEqual(res.action, 'cat_cafe.garden');
    }
  });

  await test('2.9 Unrelated Chat: Ignored cleanly and increments unknown counter', () => {
    const initialUnknown = adapter.unknownCommandCount;
    const res1 = adapter.parseComment('u1', '@u1', 'Nick', 'Xin chào shop');
    const res2 = adapter.parseComment('u1', '@u1', 'Nick', 'ĐỎ CỐ LÊN'); // Mini war command
    assert.strictEqual(res1, null);
    assert.strictEqual(res2, null);
    assert.strictEqual(adapter.unknownCommandCount, initialUnknown + 2);
  });

  await test('2.10 Gift Parsing: Generates cat_cafe.gift_effect with delta counts for Rose, Heart, Universe', () => {
    const giftCmd = adapter.parseGift('u1', '@u1', 'ViewerA', 'Rose', 5);
    assert.strictEqual(giftCmd.action, 'cat_cafe.gift_effect');
    assert.strictEqual(giftCmd.metadata?.giftName, 'Rose');
    assert.strictEqual(giftCmd.metadata?.count, 5);

    const giftHeart = adapter.parseGift('u2', '@u2', 'ViewerB', 'Heart Me', 1);
    assert.strictEqual(giftHeart.metadata?.giftName, 'Heart Me');

    const giftUniverse = adapter.parseGift('u3', '@u3', 'ViewerC', 'TikTok Universe', 1);
    assert.strictEqual(giftUniverse.metadata?.giftName, 'TikTok Universe');
  });

  // --- 3. GAME CONFIG & WORLD SPECIFICATIONS ---
  await test('3.1 Max Capacity & Bounds: CAFE_CONFIG has 20 max cats & 3 initial NPCs', () => {
    assert.strictEqual(CAFE_CONFIG.maxCats, 20);
    assert.strictEqual(CAFE_CONFIG.initialNpcCount, 3);
    assert.strictEqual(CAFE_CONFIG.initialNpcs.length, 3);
  });

  await test('3.2 Mobile 9:16 Portrait Layout & Brand Theme Specifications', () => {
    assert.strictEqual(CAFE_CONFIG.width, 540);
    assert.strictEqual(CAFE_CONFIG.height, 960);
    assert.strictEqual(CAFE_CONFIG.safeMargin, 40);
    assert.strictEqual(CAFE_CONFIG.colors.brandBlue, 0x0066FF);
    assert.strictEqual(CAFE_CONFIG.colors.brandGold, 0xFFD700);
    assert.strictEqual(CAFE_CONFIG.colors.darkNavy, 0x08142D);
  });

  await test('3.3 6 Behavioral Personalities & 10 Progression Levels Defined', () => {
    const personalities = Object.keys(PERSONALITY_DEFS);
    assert.strictEqual(personalities.length, 6);
    assert(personalities.includes('sleepy'));
    assert(personalities.includes('playful'));
    assert(personalities.includes('foodie'));
    assert(personalities.includes('curious'));
    assert(personalities.includes('affectionate'));
    assert(personalities.includes('shy'));

    assert.strictEqual(LEVEL_MILESTONES.length, 10);
    assert.strictEqual(LEVEL_MILESTONES[0].level, 1);
    assert.strictEqual(LEVEL_MILESTONES[9].level, 10);
    assert.strictEqual(SESSION_CHALLENGES.length, 12);
  });

  // --- 4. JOIN IDEMPOTENCY SIMULATION ---
  await test('4.1 Join Idempotency Model: 1 cat per viewer ID', () => {
    const mockCatStorage = new Map<string, { catId: string; nickname: string; joinCount: number }>();

    function join(viewerId: string, nickname: string) {
      if (mockCatStorage.has(viewerId)) {
        const existing = mockCatStorage.get(viewerId)!;
        existing.nickname = nickname;
        existing.joinCount++;
        return { isNew: false, cat: existing };
      }
      const newCat = { catId: `cat_${viewerId}`, nickname, joinCount: 1 };
      mockCatStorage.set(viewerId, newCat);
      return { isNew: true, cat: newCat };
    }

    const r1 = join('user_101', 'Ngọc Ánh');
    assert.strictEqual(r1.isNew, true);
    assert.strictEqual(mockCatStorage.size, 1);

    // Repeated join by same user with different nickname
    const r2 = join('user_101', 'Ngọc Ánh VIP');
    assert.strictEqual(r2.isNew, false);
    assert.strictEqual(mockCatStorage.size, 1, 'Must not create duplicate cat!');
    assert.strictEqual(r2.cat.nickname, 'Ngọc Ánh VIP');

    // Different user with same display name
    const r3 = join('user_202', 'Ngọc Ánh VIP');
    assert.strictEqual(r3.isNew, true);
    assert.strictEqual(mockCatStorage.size, 2, 'Different user ID gets distinct cat');
  });

  // --- 5. PER-USER COOLDOWN SIMULATION ---
  await test('5.1 Per-User Rate Limiting: Blocks bursts within 2000ms', () => {
    const cooldowns = new Map<string, number>();
    const cooldownMs = CAFE_CONFIG.userCooldownMs;

    function canExecute(userId: string, now: number): boolean {
      const last = cooldowns.get(userId) || 0;
      if (now - last < cooldownMs) return false;
      cooldowns.set(userId, now);
      return true;
    }

    let clock = 10000;
    assert.strictEqual(canExecute('u1', clock), true);
    // 500ms later (spam)
    assert.strictEqual(canExecute('u1', clock + 500), false);
    // Different user is not blocked
    assert.strictEqual(canExecute('u2', clock + 500), true);
    // After 2100ms
    assert.strictEqual(canExecute('u1', clock + 2100), true);
  });

  // --- 6. EVENT DE-DUPLICATION SIMULATION ---
  await test('6.1 Message ID Deduplication: Prevents double-processing identical event IDs', () => {
    const seen = new Set<string>();
    let processed = 0;

    function handleEvent(id: string) {
      if (seen.has(id)) return;
      seen.add(id);
      processed++;
    }

    handleEvent('evt_abc_1');
    handleEvent('evt_abc_1'); // duplicate
    handleEvent('evt_abc_2');
    handleEvent('evt_abc_1'); // duplicate again

    assert.strictEqual(processed, 2);
  });

  // --- 7. PROGRESSION MANAGER & LEVEL MILESTONES ---
  await test('7.1 Progression Manager: Starts at Level 1, handles Purrs and Milestone Unlocks', () => {
    const pm = ProgressionManager.getInstance();
    pm.resetAll();

    assert.strictEqual(pm.data.level, 1);
    assert.strictEqual(pm.data.purrPoints, 0);

    // Add purr points to cross Level 2 milestone (100 purrs required)
    let leveledUpFired = false;
    pm.onLeveledUp = (ms) => {
      leveledUpFired = true;
      assert.strictEqual(ms.level, 2);
    };

    const res = pm.addPurrPoints(100);
    assert.strictEqual(res.leveledUp, true);
    assert.strictEqual(pm.data.level, 2);
    assert.strictEqual(pm.data.purrPoints, 100);
    assert(pm.data.unlockedItems.includes('decor_lamp'), 'Level 2 unlocks decor_lamp');
    assert.strictEqual(leveledUpFired, true);
  });

  await test('7.2 Progression Manager: Tracks Challenges and Awards Rewards', () => {
    const pm = ProgressionManager.getInstance();
    pm.resetAll();

    let completedChallengeId = '';
    pm.onChallengeCompleted = (ch) => {
      completedChallengeId = ch.id;
    };

    // Photo 3 times to complete 'ch_6' challenge (target: 3, reward: 60 purrs)
    pm.trackAction('photo');
    pm.trackAction('photo');
    pm.trackAction('photo');

    assert(pm.data.completedChallenges.includes('ch_6'));
    assert.strictEqual(completedChallengeId, 'ch_6');
    // 3 actions * 5 base purrs = 15 + 60 challenge reward = 75 purrs
    assert.strictEqual(pm.data.purrPoints, 75);
  });

  await test('7.3 Progression Manager: Discovers New Breeds and Awards Album Bonus', () => {
    const pm = ProgressionManager.getInstance();
    pm.resetAll();

    const initialPurrs = pm.data.purrPoints;
    const initialBreedCount = pm.data.discoveredBreeds.length;

    // Discover breed variant 7 (Royal Siamese)
    pm.discoverBreed(7);
    assert(pm.data.discoveredBreeds.includes(7));
    assert.strictEqual(pm.data.discoveredBreeds.length, initialBreedCount + 1);
    assert.strictEqual(pm.data.purrPoints, initialPurrs + 25, 'Awards 25 bonus purrs for new breed discovery');

    // Re-discovering the same breed should not award double points
    pm.discoverBreed(7);
    assert.strictEqual(pm.data.purrPoints, initialPurrs + 25);
  });

  await test('7.4 Progression Manager: JSON Serialization & Restore', () => {
    const pm = ProgressionManager.getInstance();
    pm.resetAll();
    pm.addPurrPoints(250);
    pm.placeDecor('cafe', 'table', 'decor_cat_tree');

    const jsonStr = pm.exportJson();
    assert(jsonStr.length > 50);

    const freshPm = ProgressionManager.getInstance();
    freshPm.resetAll();
    assert.strictEqual(freshPm.data.purrPoints, 0);

    const importSuccess = freshPm.importJson(jsonStr);
    assert.strictEqual(importSuccess, true);
    assert.strictEqual(freshPm.data.purrPoints, 250);
    assert.strictEqual(freshPm.getPlacedDecor('cafe', 'table'), 'decor_cat_tree');
  });

  // --- 8. TTS WELCOMING CONTROLLER ---
  await test('8.1 TTS Controller: Generates warm Vietnamese welcoming message for new viewer', () => {
    const tts = TTSController.getInstance();
    const msg = tts.welcomeNewViewer('LanAnh', 'Mèo Vàng Cam');
    assert(msg.length > 10, 'Must generate non-empty greeting');
    assert(msg.includes('LanAnh'), 'Greeting must include sanitized nickname');
    assert(msg.includes('Mèo Vàng Cam'), 'Greeting must include cat breed');
  });

  await test('8.2 TTS Controller: Debounces rapid duplicate welcomes within 10s', () => {
    const tts = TTSController.getInstance();
    const secondMsg = tts.welcomeNewViewer('LanAnh', 'Mèo Vàng Cam');
    assert.strictEqual(secondMsg, '', 'Must debounce duplicate greeting within 10s window');
  });

  await test('8.3 TTS Controller: Generates welcome back message for returning viewer', () => {
    const tts = TTSController.getInstance();
    const returnMsg = tts.welcomeReturningViewer('MinhQuân');
    assert(returnMsg.length > 10, 'Must generate return greeting');
    assert(returnMsg.includes('MinhQuân'), 'Greeting must include returning nickname');
  });

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
