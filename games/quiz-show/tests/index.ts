import assert from 'node:assert';
import { QuestionBank } from '../src/game/systems/QuestionBank';
import { SeatAllocator } from '../src/game/systems/SeatAllocator';
import { StudentRoster } from '../src/game/systems/StudentRoster';
import { TextSanitizer } from '../src/game/utils/TextSanitizer';
import { QuizShowEngine } from '../src/game/systems/QuizShowEngine';
import { AudioEngine } from '../src/game/audio/AudioEngine';
import { TTSController } from '../src/game/systems/TTSController';

console.log('========================================================');
console.log('🧪 RUNNING PTPLAY QUIZ SHOW (ĐỐ VUI CÓ THƯỞNG) TEST SUITE');
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

  // 1. QUESTION BANK
  test('1. Question Bank: Exceeds 500 verified questions with valid structure', () => {
    const qb = new QuestionBank();
    const count = qb.getTotalCount();
    assert(count >= 500, `Question count ${count} must be >= 500`);

    const q = qb.getNextQuestion('quick');
    assert(q !== null, 'Question should not be null');
    assert(q.id.startsWith('qz-'), 'Question ID should have prefix qz-');
    assert(['A', 'B', 'C', 'D'].includes(q.correct), 'Correct option must be A, B, C, or D');
    assert(q.options.A && q.options.B && q.options.C && q.options.D, 'All 4 options must exist');
    assert(q.durationSec >= 8, 'Duration must be at least 8 seconds');
  });

  test('2. Question Bank: Adapts to game modes (Lightning, True/False, Boss)', () => {
    const qb = new QuestionBank();

    const qLightning = qb.getNextQuestion('lightning');
    assert.strictEqual(qLightning?.durationSec, 8);

    const qTF = qb.getNextQuestion('true_false');
    assert.strictEqual(qTF?.options.A, 'Đúng');
    assert.strictEqual(qTF?.options.B, 'Sai');

    const qBoss = qb.getNextQuestion('boss');
    assert.strictEqual(qBoss?.durationSec, 15);
  });

  // 2. SEAT ALLOCATION
  test('3. Seat Allocator: Assigns unique stadium seats & rotates when full', () => {
    const alloc = new SeatAllocator();
    assert.strictEqual(alloc.totalSeats, 20);

    const seat1 = alloc.assignSeat('user_1');
    const seat2 = alloc.assignSeat('user_2');
    assert.notStrictEqual(seat1.index, seat2.index);

    // Re-assigning returns same seat
    const seat1Again = alloc.assignSeat('user_1');
    assert.strictEqual(seat1.index, seat1Again.index);

    // Allocate all 20 seats
    for (let i = 3; i <= 20; i++) {
      alloc.assignSeat(`user_${i}`);
    }
    // 21st user rotates a seat safely without crashing
    const seat21 = alloc.assignSeat('user_21');
    assert(seat21 !== null && typeof seat21.index === 'number');
  });

  // 3. STUDENT ROSTER & SCORING
  test('4. Student Roster: Auto registers, manages streaks, scores and Top 3 podium', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);

    const { player, isNew } = roster.registerOrGet('viewer_101', 'Ngọc Anh 🌟', 'https://cdn.example.com/na.jpg');
    assert.strictEqual(isNew, true);
    assert.strictEqual(player.nickname, 'Ngọc Anh 🌟');

    // Add correct score
    roster.addScore('viewer_101', 15, true);
    const updated = roster.getPlayer('viewer_101');
    assert.strictEqual(updated?.score, 15);
    assert.strictEqual(updated?.streak, 1);

    // Another correct score increases streak
    roster.addScore('viewer_101', 20, true);
    assert.strictEqual(updated?.streak, 2);
    assert.strictEqual(updated?.maxStreak, 2);

    // Wrong score resets streak
    roster.addScore('viewer_101', 0, false);
    assert.strictEqual(updated?.streak, 0);
    assert.strictEqual(updated?.maxStreak, 2); // Max streak preserved

    const top = roster.getTopPlayers(3);
    assert(top.length >= 3);
    assert(top[0].score >= top[1].score);
  });

  // 4. TEXT SANITIZER
  test('5. Text Sanitizer: Cleans nicknames, comments & strips accents', () => {
    const dirtyNick = '<b>Hacker123</b>\u0000 ';
    const cleanNick = TextSanitizer.sanitizeNickname(dirtyNick);
    assert.strictEqual(cleanNick, 'Hacker123');

    const cleanAccent = TextSanitizer.stripVietnameseAccents('ĐÁP ÁN CHUẨN ĐÚNG');
    assert.strictEqual(cleanAccent, 'DAP AN CHUAN DUNG');
  });

  // 5. QUIZ ENGINE LOGIC & ANSWER LOCK
  test('6. Quiz Engine: One answer lock per viewer & speed/streak bonus calculation', () => {
    const alloc = new SeatAllocator();
    const roster = new StudentRoster(alloc);
    const qb = new QuestionBank();
    const audio = new AudioEngine();
    const tts = new TTSController(audio);

    const engine = new QuizShowEngine(qb, roster, audio, tts);
    engine.startShow();
    assert(engine.currentQuestion !== null);

    // Directly set asking state for instant testing
    engine.currentState = 'asking';

    // Submit answer choice
    const accepted1 = engine.submitAnswer('user_1', 'C');
    assert.strictEqual(accepted1, true);

    // Second submission by same user in same round must be rejected
    const accepted2 = engine.submitAnswer('user_1', 'A');
    assert.strictEqual(accepted2, false);

    // Different user is accepted
    const accepted3 = engine.submitAnswer('user_2', 'B');
    assert.strictEqual(accepted3, true);

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
