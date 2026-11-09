import assert from 'node:assert';
import { TextNormalizer } from '../src/game/utils/TextNormalizer';
import { SeatAllocator } from '../src/game/systems/SeatAllocator';
import { StudentRoster } from '../src/game/systems/StudentRoster';
import { RebusEngine } from '../src/game/systems/RebusEngine';
import { AudioEngine } from '../src/game/audio/AudioEngine';
import { TTSController } from '../src/game/systems/TTSController';

console.log('========================================================');
console.log('🧪 RUNNING PTPLAY ĐUỔI HÌNH BẮT CHỮ TEST SUITE');
console.log('========================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
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

  // 1. PUZZLES BANK
  test('1. Puzzles Bank: Exceeds 100+ verified puzzles with 2+ clues and hints', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    const engine = new RebusEngine(roster, audio, tts);
    assert(engine.allPuzzles.length >= 100, `Puzzles count ${engine.allPuzzles.length} must be >= 100`);

    const p = engine.allPuzzles[0];
    assert(p.id.startsWith('dhbc-'), 'Puzzle ID must have prefix dhbc-');
    assert(p.clues && p.clues.length >= 2, 'Puzzle must have at least 2 clues');
    assert(p.hint1, 'Hint 1 must exist');
    assert(p.hint2, 'Hint 2 must exist');
    assert(p.answer, 'Answer must exist');
    engine.destroy();
  });

  // 2. TEXT NORMALIZER & VIETNAMESE ACCENTS
  test('2. Text Normalizer: Exact match, no accent, punctuation & sentence matching', () => {
    assert.strictEqual(TextNormalizer.normalizeExactAnswer('CÁ VÀNG!'), 'cavang');
    assert.strictEqual(TextNormalizer.normalizeExactAnswer('ca-vang'), 'cavang');
    assert.strictEqual(TextNormalizer.normalizeExactAnswer('   cá vàng   '), 'cavang');

    // Matching tests
    assert.strictEqual(TextNormalizer.matchesAnswer('cá vàng', 'Cá vàng'), true);
    assert.strictEqual(TextNormalizer.matchesAnswer('ca vang', 'Cá vàng'), true);
    assert.strictEqual(TextNormalizer.matchesAnswer('CÁ VÀNG NÈ', 'Cá vàng'), true);
    assert.strictEqual(TextNormalizer.matchesAnswer('đáp án là cá vàng nha', 'Cá vàng'), true);
    assert.strictEqual(TextNormalizer.matchesAnswer('cá bạc', 'Cá vàng'), false);
  });

  // 3. RATE LIMITING & COOLDOWN
  test('3. Student Roster: Enforces 4 guesses max per round and cooldown', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);

    const { player } = roster.registerOrGet('detective_1', 'Minh Quân');
    assert(player);

    // First guess allowed
    const c1 = roster.checkCanGuess('detective_1', 4, 1500);
    assert.strictEqual(c1.allowed, true);
    roster.recordGuessAttempt('detective_1');

    // Immediate second guess blocked by cooldown
    const c2 = roster.checkCanGuess('detective_1', 4, 1500);
    assert.strictEqual(c2.allowed, false);
    assert.strictEqual(c2.reason, 'cooldown');

    // Simulate after cooldown
    player.lastGuessTime -= 2000;
    const c3 = roster.checkCanGuess('detective_1', 4, 1500);
    assert.strictEqual(c3.allowed, true);

    // Consume all 4 guesses
    roster.recordGuessAttempt('detective_1');
    roster.recordGuessAttempt('detective_1');
    roster.recordGuessAttempt('detective_1');

    player.lastGuessTime -= 2000;
    const c4 = roster.checkCanGuess('detective_1', 4, 1500);
    assert.strictEqual(c4.allowed, false);
    assert.strictEqual(c4.reason, 'limit_reached');

    // New round resets attempts
    roster.resetRoundAttempts();
    const c5 = roster.checkCanGuess('detective_1', 4, 1500);
    assert.strictEqual(c5.allowed, true);
  });

  // 4. REBUS ENGINE FLOW & SPEED/STREAK SCORING
  test('4. Rebus Engine: Fast solver wins round, receives speed and streak bonus', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    const engine = new RebusEngine(roster, audio, tts);
    engine.startShow();
    assert(engine.currentPuzzle !== null);

    // Set guessing state
    engine.currentState = 'guessing';
    const answer = engine.currentPuzzle.answer;

    // Wrong guess
    const wrongRes = engine.submitGuess('det_1', 'sai rồi');
    assert.strictEqual(wrongRes, false);

    // Simulate cooldown elapsed
    const pBefore = roster.getPlayer('det_1');
    if (pBefore) pBefore.lastGuessTime -= 2000;

    // Correct guess (1st fastest solver)
    const correctRes = engine.submitGuess('det_1', answer);
    assert.strictEqual(correctRes, true);

    // Check 1st player score updated (base + speed + streak)
    const p1 = roster.getPlayer('det_1');
    assert(p1 && p1.score >= 15);
    assert.strictEqual(p1.streak, 1);

    // 2nd fastest solver within grace window
    const p2Res = engine.submitGuess('det_2', answer);
    assert.strictEqual(p2Res, true);
    const p2 = roster.getPlayer('det_2');
    assert(p2 && p2.score >= 10);

    // Duplicate guess by same player in same round rejected
    const dupRes = engine.submitGuess('det_1', answer);
    assert.strictEqual(dupRes, false);

    engine.destroy();
  });

  // 5. ROSE ADDS TIME & FOLLOW UNLOCKS FIRST CHARACTER
  test('5. Rose adds time (+10s) & Follow reveals first letter directly', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    const engine = new RebusEngine(roster, audio, tts);
    engine.startShow();
    engine.currentState = 'guessing';

    let timeAddedSec = 0;
    let timeAddedSponsor = '';
    let hint2Sponsor = '';
    let hint2Char = '';

    engine.setEvents({
      onTimeAdded: (sec, sponsor) => { timeAddedSec = sec; timeAddedSponsor = sponsor || ''; },
      onHint2Triggered: (h2, firstChar, sponsor) => { hint2Sponsor = sponsor || ''; hint2Char = firstChar; },
    });

    const initialRem = engine.remainingTimeMs;

    // 1. User sends Rose -> Adds +10s time
    engine.addTime(10, 'Thám Tử Hoa');
    assert.strictEqual(timeAddedSec, 10);
    assert.strictEqual(timeAddedSponsor, 'Thám Tử Hoa');
    assert.strictEqual(engine.remainingTimeMs, initialRem + 10000);

    // 2. User Follows -> Unlocks first letter directly
    assert.strictEqual(hint2Sponsor, '');
    const followOk = engine.triggerFirstCharHint('Fan Cứng');
    assert.strictEqual(followOk, true);
    assert.strictEqual(hint2Sponsor, 'Fan Cứng');
    assert(hint2Char.length === 1, 'Follow must reveal first character');
    assert.strictEqual(hint2Char, engine.currentPuzzle!.answer.trim().charAt(0).toUpperCase());

    engine.destroy();
  });

  // 6. TTS CONTROLLER & VIETNAMESE ANNOUNCEMENTS
  test('6. TTS Controller: Supports full Vietnamese host announcements and voice test', () => {
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    assert.strictEqual(tts.isEnabled, true);
    assert.strictEqual(tts.rate >= 1.0, true);
    assert.strictEqual(tts.pitch >= 1.0, true);

    // Call voice announcements to verify execution
    tts.announceShowWelcome();
    tts.announcePlayerJoin('Thám Tử Lừng Danh');
    tts.announceRoundStart(1);
    tts.announceHint('Một hiện tượng thời tiết tự nhiên');
    tts.announceFirstChar('C');
    tts.announceTimeWarning();
    tts.announceCorrect('Thám Tử Lừng Danh', 'Cầu Vồng');
    tts.announceTimeout('Cầu Vồng', 'Cầu kết hợp với vồng');
    tts.announceStreak('Thám Tử Lừng Danh', 3);
    tts.announceGift('Thám Tử Lừng Danh', 'Hoa Hồng');
    tts.announceChampion('Thám Tử Lừng Danh');

    tts.setEnabled(false);
    assert.strictEqual(tts.isEnabled, false);
    tts.setEnabled(true);
    assert.strictEqual(tts.isEnabled, true);

    tts.destroy();
  });

  // 7. BGM SYSTEM (FUNNY & CHILL TRACKS)
  test('7. Audio Engine BGM: 4 funny and chill tracks, track cycling, volume and ducking', () => {
    const audio = new AudioEngine();
    assert.strictEqual(audio.bgmEnabled, true);

    const initialTrack = audio.getCurrentTrack();
    assert.strictEqual(initialTrack.id, 'funny_monkeys');

    // Cycle tracks
    const t2 = audio.nextBGMTrack();
    assert.strictEqual(t2.id, 'silly_cartoon');

    const t3 = audio.nextBGMTrack();
    assert.strictEqual(t3.id, 'sneaky_detective');

    const t4 = audio.nextBGMTrack();
    assert.strictEqual(t4.id, 'chill_carefree');

    const tCycle = audio.nextBGMTrack();
    assert.strictEqual(tCycle.id, 'funny_monkeys');

    // Test volume and ducking
    audio.setBGMVolume(0.5);
    assert.strictEqual(audio.bgmVolume, 0.5);

    audio.setDucking(true);
    audio.setDucking(false);

    const toggledOff = audio.toggleBGM();
    assert.strictEqual(toggledOff, false);
    assert.strictEqual(audio.bgmEnabled, false);

    const toggledOn = audio.toggleBGM();
    assert.strictEqual(toggledOn, true);
    assert.strictEqual(audio.bgmEnabled, true);

    audio.stopBGM();
  });

  // 8. CONTINUOUS ROUNDS & REAL-TIME LIVE LEADERBOARD
  test('8. Continuous Rounds & Live Leaderboard: Infinite rounds beyond 10, real-time score ranking', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    // Verify all seeded NPCs start at 0 score so live viewers aren't blocked by fake mock scores
    const npcs = roster.getAllPlayers();
    assert(npcs.length >= 8);
    for (const npc of npcs) {
      assert.strictEqual(npc.score, 0, `NPC ${npc.nickname} should start with 0 score`);
      assert.strictEqual(npc.streak, 0);
      assert.strictEqual(npc.correctCount, 0);
    }

    // Verify real-time score change listener
    let scoreChangedPlayer = '';
    roster.setOnScoreChanged((player) => {
      scoreChangedPlayer = player.nickname;
    });

    const engine = new RebusEngine(roster, audio, tts);
    engine.startShow();
    assert.strictEqual(engine.roundNumber, 1);
    assert(engine.currentPuzzle !== null);

    // Simulate progressing past round 10 to ensure no hard 10-picture cap
    for (let r = 1; r <= 14; r++) {
      engine.nextRound();
      assert(engine.currentPuzzle !== null, `Round ${engine.roundNumber} puzzle should be loaded`);
      assert.notStrictEqual(engine.currentState, 'finished', `Round ${engine.roundNumber} should not trigger ceremony stop`);
    }

    // Now roundNumber should be 15, confirming continuous play without 10-cap stop
    assert.strictEqual(engine.roundNumber, 15);

    // Simulate a player scoring
    const testPlayerId = 'viewer_real_1';
    roster.registerOrGet(testPlayerId, 'Thám Tử Đỉnh Cao');
    roster.addScore(testPlayerId, 31, true);

    assert.strictEqual(scoreChangedPlayer, 'Thám Tử Đỉnh Cao');
    const topPlayers = roster.getTopPlayers(5);
    assert.strictEqual(topPlayers[0].userId, testPlayerId);
    assert.strictEqual(topPlayers[0].score, 31);

    engine.destroy();
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
