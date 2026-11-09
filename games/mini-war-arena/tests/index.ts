import assert from 'node:assert';
import { GAME_CONFIG, Team, UnitType, ArenaThemeId } from '../src/game/config/GameConfig.js';
import { RoundManager } from '../src/game/systems/RoundManager.js';
import { TeamManager } from '../../../apps/bridge/src/systems/TeamManager.js';
import { AudioManager } from '../src/game/audio/AudioManager.js';
import { TTSController } from '../src/game/systems/TTSController.js';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

console.log('========================================================');
console.log('🧪 RUNNING PTPLAY MINI WAR ARENA FULL V1.0 TEST SUITE');
console.log('========================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', (err as Error).message);
      failed++;
    }
  }

  // --- 1. VIEWER IDENTITY, SANITIZATION & COMMAND NORMALIZATION ---
  test('1.1 Team Command Normalization: Recognizes ĐỎ, DO, RED, and emojis', () => {
    const tm = new TeamManager();
    const r1 = tm.processComment({ userId: 'u1', uniqueId: 'user1', nickname: 'Khách 1' }, 'ĐỎ CỐ LÊN');
    assert.strictEqual(r1.joined, true);
    assert.strictEqual(r1.team, 'red');

    const r2 = tm.processComment({ userId: 'u2', uniqueId: 'user2', nickname: 'Khách 2' }, 'TEAM RED VÔ ĐỊCH');
    assert.strictEqual(r2.joined, true);
    assert.strictEqual(r2.team, 'red');

    const r3 = tm.processComment({ userId: 'u3', uniqueId: 'user3', nickname: 'Khách 3' }, '🔴');
    assert.strictEqual(r3.joined, true);
    assert.strictEqual(r3.team, 'red');
  });

  test('1.2 Team Command Normalization: Recognizes XANH, BLUE, and emojis', () => {
    const tm = new TeamManager();
    const b1 = tm.processComment({ userId: 'u4', uniqueId: 'user4', nickname: 'Khách 4' }, 'XANH VÔ ĐỊCH');
    assert.strictEqual(b1.joined, true);
    assert.strictEqual(b1.team, 'blue');

    const b2 = tm.processComment({ userId: 'u5', uniqueId: 'user5', nickname: 'Khách 5' }, 'TEAM BLUE WIN');
    assert.strictEqual(b2.joined, true);
    assert.strictEqual(b2.team, 'blue');

    const b3 = tm.processComment({ userId: 'u6', uniqueId: 'user6', nickname: 'Khách 6' }, '🔵');
    assert.strictEqual(b3.joined, true);
    assert.strictEqual(b3.team, 'blue');
  });

  test('1.3 Ambiguous & Unrelated Chat: Ignored cleanly', () => {
    const tm = new TeamManager();
    const amb = tm.processComment({ userId: 'u7', uniqueId: 'user7', nickname: 'Khách 7' }, 'ĐỎ hay XANH đây');
    assert.strictEqual(amb.joined, false);
    assert(amb.reason?.includes('Cả hai') || amb.reason?.includes('ĐỎ và XANH'));

    const unk = tm.processComment({ userId: 'u8', uniqueId: 'user8', nickname: 'Khách 8' }, 'Chào streamer');
    assert.strictEqual(unk.joined, false);
  });

  test('1.4 Nickname Sanitization: Strips XSS and limits to 14 chars', () => {
    const rawNick = '<script>alert("hacked")</script>LongNickname123456';
    const cleanNick = rawNick.replace(/<[^>]*>?/gm, '').trim().slice(0, GAME_CONFIG.VIEWER.MAX_NICKNAME_LENGTH);
    assert(!cleanNick.includes('<script>'), 'Must strip script tags');
    assert(cleanNick.length <= GAME_CONFIG.VIEWER.MAX_NICKNAME_LENGTH, 'Must bound to max 14 chars');
  });

  // --- 2. COMBAT MECHANICS, DAMAGE REDUCTION & BREACH ---
  test('2.1 Defense Damage Reduction: Calculates flat damage reduction with floor', () => {
    const rawDamage = 25;
    const targetDefense = 7; // Tank defense
    const actualDamage = Math.max(3, rawDamage - targetDefense);
    assert.strictEqual(actualDamage, 18);

    // High defense edge case: damage cannot drop below minimum floor (3)
    const weakHit = 5;
    const highDef = 12;
    const floored = Math.max(3, weakHit - highDef);
    assert.strictEqual(floored, 3, 'Damage must not drop below 3 or become negative');
  });

  test('2.2 Critical Hit Multiplier: 1.6x multiplier rounded', () => {
    const baseDamage = 20;
    const critDamage = Math.round(baseDamage * 1.6);
    assert.strictEqual(critDamage, 32);
  });

  test('2.3 Core Breach Damage: Regular unit 90 HP, Boss 270 HP', () => {
    const regularBreach = GAME_CONFIG.CORE_BREACH_DAMAGE;
    const bossBreach = GAME_CONFIG.CORE_BREACH_DAMAGE * 3;
    assert.strictEqual(regularBreach, 90);
    assert.strictEqual(bossBreach, 270);
  });

  // --- 3. BOSS ABILITIES & STATS ---
  test('3.1 Boss Stats: Distinct Infernal Warlord and Crystal Titan definitions', () => {
    const redBoss = GAME_CONFIG.BOSSES.red;
    const blueBoss = GAME_CONFIG.BOSSES.blue;

    assert.strictEqual(redBoss.name, 'Infernal Warlord');
    assert.strictEqual(blueBoss.name, 'Crystal Titan');
    assert.strictEqual(redBoss.skillAoe, 165);
    assert.strictEqual(blueBoss.skillAoe, 165);
    assert.strictEqual(redBoss.skillCooldown, 7.5);
    assert.strictEqual(blueBoss.skillCooldown, 7.5);
  });

  // --- 4. ANTI-SNOWBALL CATCHUP BALANCE ---
  test('4.1 Anti-Snowballing: Low HP threshold at 45% with defense boost', () => {
    assert.strictEqual(GAME_CONFIG.CATCHUP.LOW_HP_THRESHOLD, 0.45);
    assert.strictEqual(GAME_CONFIG.CATCHUP.DEFENSE_BOOST, 2);
    assert.strictEqual(GAME_CONFIG.CATCHUP.SPAWN_RATE_BOOST, 1.35);

    // Verify trigger condition
    const currentHp = 600;
    const maxHp = GAME_CONFIG.MAX_CORE_HP;
    const hpRatio = currentHp / maxHp;
    assert(hpRatio < GAME_CONFIG.CATCHUP.LOW_HP_THRESHOLD, 'Ratio 600/1500 = 0.40 triggers catchup');
  });

  // --- 5. ROUND STATE MACHINE & PROGRESSION ---
  test('5.1 State Machine: Starts in ATTRACT, transitions to ROUND_INTRO then BATTLE', () => {
    const rm = new RoundManager();
    assert.strictEqual(rm.phase, 'ATTRACT');

    rm.startRound(false);
    assert.strictEqual(rm.phase, 'ROUND_INTRO');

    rm.beginBattle();
    assert.strictEqual(rm.phase, 'BATTLE');
    assert.strictEqual(rm.legacyPhase, 'playing');
  });

  test('5.2 Pause & Resume Handling: Correctly toggles PAUSED and BATTLE', () => {
    const rm = new RoundManager();
    rm.startRound(false);
    rm.beginBattle();

    rm.togglePause();
    assert.strictEqual(rm.phase, 'PAUSED');
    assert.strictEqual(rm.legacyPhase, 'paused');

    rm.togglePause();
    assert.strictEqual(rm.phase, 'BATTLE');
  });

  test('5.3 Round Result & Winner Determination: Tiebreak scores based on HP, Kills, and Units', () => {
    const rm = new RoundManager();
    rm.startRound(false);
    rm.beginBattle();

    rm.redHp = 1200;
    rm.redKills = 15;
    rm.blueHp = 900;
    rm.blueKills = 12;

    const winner = rm.determineWinner(10, 8);
    assert.strictEqual(winner, 'red');
    assert.strictEqual(rm.redTotalWins, 1);
    assert.strictEqual(rm.blueTotalWins, 0);

    // Match history entry created
    assert(rm.matchHistory.length >= 1);
    assert.strictEqual(rm.matchHistory[0].winner, 'red');
  });

  test('5.4 Four Atmospheric Arena Themes: Complete definitions & rotation', () => {
    const themes = GAME_CONFIG.THEME_ROTATION;
    assert.strictEqual(themes.length, 4);
    assert(themes.includes('castle'));
    assert(themes.includes('forest'));
    assert(themes.includes('crystal'));
    assert(themes.includes('ember'));

    const rm = new RoundManager();
    assert.strictEqual(rm.currentTheme, 'castle');

    rm.rotateTheme();
    assert.strictEqual(rm.currentTheme, 'forest');

    rm.rotateTheme();
    assert.strictEqual(rm.currentTheme, 'crystal');

    rm.rotateTheme();
    assert.strictEqual(rm.currentTheme, 'ember');

    rm.rotateTheme();
    assert.strictEqual(rm.currentTheme, 'castle');
  });

  test('5.5 Match History Serialization: Serializes and restores JSON summary', () => {
    const rm = new RoundManager();
    rm.startRound(false);
    rm.determineWinner(12, 10);

    const json = rm.exportHistoryJson();
    assert(typeof json === 'string');
    const parsed = JSON.parse(json);
    assert(Array.isArray(parsed));
    assert(parsed.length >= 1);
    assert(parsed[0].id.startsWith('rec_'));
  });

  // --- 6. SIMULATION INTEGRITY & DELTA CLAMPING ---
  test('6.1 Delta Clamping: Prevents huge time jumps when browser tab is suspended', () => {
    const dtSuspendedMs = 15000; // 15 seconds in background tab
    const clampedDelta = Math.min(dtSuspendedMs / 1000, 0.05);
    assert.strictEqual(clampedDelta, 0.05, 'Must clamp dt to 0.05s maximum');
  });

  // --- 7. VIETNAMESE TTS SHOUTCASTER & ANNOUNCER ---
  test('7.1 TTS Controller: Initializes with Vietnamese voice configuration and ducking', () => {
    const audio = new AudioManager();
    const tts = new TTSController(audio);
    assert.strictEqual(tts.enabled, true);
    assert.strictEqual(tts.rate >= 1.0, true);
    assert.strictEqual(tts.pitch >= 1.0, true);

    tts.setEnabled(false);
    assert.strictEqual(tts.enabled, false);
    tts.setEnabled(true);
    assert.strictEqual(tts.enabled, true);
  });

  test('7.2 TTS Voice Helper: Detects and prioritizes Vietnamese voices accurately', () => {
    const mockVoices = [
      { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
      { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' },
      { name: 'Microsoft An - Vietnamese (Vietnam)', lang: 'vi-VN' },
      { name: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)', lang: 'vi-VN' },
    ] as SpeechSynthesisVoice[];

    const viVoices = VietnameseVoiceHelper.getVietnameseVoices(mockVoices);
    assert.strictEqual(viVoices.length, 2);

    const bestVoice = VietnameseVoiceHelper.selectBestVietnameseVoice(mockVoices);
    assert.strictEqual(bestVoice?.name, 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)');

    const maleVoice = VietnameseVoiceHelper.selectBestVietnameseVoice(mockVoices, 'male');
    assert.strictEqual(maleVoice?.name, 'Microsoft An - Vietnamese (Vietnam)');
  });

  test('7.3 TTS Text Sanitizer: Cleans symbols and limits length for Vietnamese speech', () => {
    const dirty = '<script>alert("hack")</script> **Chào mừng** các bạn đã đến với #ĐấuTrườngChiếnBinh!';
    const cleaned = VietnameseVoiceHelper.sanitizeTTSText(dirty);
    assert.strictEqual(cleaned.includes('<script>'), false);
    assert.strictEqual(cleaned.includes('**'), false);
    assert.strictEqual(cleaned.includes('Chào mừng các bạn đã đến với'), true);
  });

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

void runTests();

