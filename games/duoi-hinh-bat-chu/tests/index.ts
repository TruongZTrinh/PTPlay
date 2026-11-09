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

  // 5. HINTS: TRIGGERED ON ROSE OR FOLLOW (NO AUTOMATIC TIME PROGRESSION)
  test('5. Hints: Triggered only when users send Rose or Follow (no automatic time countdown reveal)', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    const engine = new RebusEngine(roster, audio, tts);
    engine.startShow();
    engine.currentState = 'guessing';

    let hint1Sponsor = '';
    let hint2Sponsor = '';
    let hint2Char = '';

    engine.setEvents({
      onHint1Triggered: (h1, sponsor) => { hint1Sponsor = sponsor || ''; },
      onHint2Triggered: (h2, firstChar, sponsor) => { hint2Sponsor = sponsor || ''; hint2Char = firstChar; },
    });

    // 1. Initial round has no hints unlocked
    assert.strictEqual(hint1Sponsor, '');
    assert.strictEqual(hint2Sponsor, '');

    // 2. User sends Rose -> unlocks Hint 1
    const roseOk = engine.unlockNextHint('Thám Tử Hoa', 'rose');
    assert.strictEqual(roseOk, true);
    assert.strictEqual(hint1Sponsor, 'Thám Tử Hoa');
    assert.strictEqual(hint2Sponsor, '');

    // 3. User Follows -> unlocks Hint 2 (revealing first character)
    const followOk = engine.unlockNextHint('Fan Cứng', 'follow');
    assert.strictEqual(followOk, true);
    assert.strictEqual(hint2Sponsor, 'Fan Cứng');
    assert(hint2Char.length === 1, 'Hint 2 must reveal first character');

    // 4. Further hints return false as both are already unlocked
    const extraOk = engine.unlockNextHint('Fan Khác', 'rose');
    assert.strictEqual(extraOk, false);

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

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

void runTests();
