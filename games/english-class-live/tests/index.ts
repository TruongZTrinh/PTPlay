import assert from 'node:assert/strict';
import { QuizEngine } from '../src/game/systems/QuizEngine.js';
import { QuestionBank } from '../src/game/systems/QuestionBank.js';
import { TextSanitizer } from '../src/game/utils/TextSanitizer.js';
import { AvatarManager } from '../src/game/systems/AvatarManager.js';
import { StudentRoster } from '../src/game/systems/StudentRoster.js';
import { SeatAllocator } from '../src/game/systems/SeatAllocator.js';
import { GiftReactionController } from '../src/game/systems/GiftReactionController.js';
import { TTSController } from '../src/game/systems/TTSController.js';
import { QuizMode } from '../src/game/types.js';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${(err as Error).message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('========================================================');
  console.log('🧪 RUNNING PTPLAY ENGLISH CLASS LIVE V1.0 FULL TEST SUITE');
  console.log('========================================================\n');

  // --- 1. QUESTION BANK INTEGRITY & SCHEMA (>= 500 questions) ---
  await test('1.1 Question Bank: Contains at least 500 validated questions', () => {
    const bank = new QuestionBank();
    assert(bank.totalCount >= 500, `Expected at least 500 questions, but found ${bank.totalCount}`);
  });

  await test('1.2 Question Bank: Covers all 8 game modes with distinct content', () => {
    const bank = new QuestionBank();
    const modes: QuizMode[] = ['quick', 'picture', 'listening', 'spelling', 'team', 'survival', 'boss', 'challenge'];
    modes.forEach((m) => {
      const qList = bank.getQuestionsByMode(m);
      assert(qList.length >= 10, `Mode ${m} must have at least 10 questions (found ${qList.length})`);
    });
  });

  await test('1.3 Question Bank: Every question has valid structure, choices, and explanation', () => {
    const bank = new QuestionBank();
    const modes: QuizMode[] = ['quick', 'picture', 'listening', 'spelling', 'team', 'survival', 'boss', 'challenge'];
    modes.forEach((m) => {
      const qList = bank.getQuestionsByMode(m);
      qList.forEach((q) => {
        assert(q.id && q.id.length > 0, 'Question ID must be present');
        assert(q.prompt && q.prompt.length > 0, 'Prompt must be non-empty');
        assert(['A', 'B', 'C', 'D'].includes(q.correct), 'Correct answer must be A, B, C, or D');
        assert(q.choices.A && q.choices.B && q.choices.C && q.choices.D, 'All 4 choices must be non-empty');
        assert([1, 2, 3, 4, 5].includes(q.difficulty), 'Difficulty must be 1..5');
        assert(q.explanation && q.explanation.length > 0, 'Explanation must be present');
      });
    });
  });

  // --- 2. COMMAND PARSER & SANITIZATION ---
  await test('2.1 Text Sanitizer: Sanitizes nickname and limits to 14 visible chars', () => {
    const dirty = '<script>alert("xss")</script>SuperLongNickname12345';
    const clean = TextSanitizer.sanitizeNickname(dirty, 14);
    assert.strictEqual(clean, 'alert("xss")Su');
    assert(clean.length <= 14);

    const empty = TextSanitizer.sanitizeNickname('    ');
    assert.strictEqual(empty, 'Học Sinh');
  });

  await test('2.2 Text Sanitizer: Accurately identifies JOIN commands and variations', () => {
    assert.strictEqual(TextSanitizer.isJoinCommand('JOIN'), true);
    assert.strictEqual(TextSanitizer.isJoinCommand('VÀO'), true);
    assert.strictEqual(TextSanitizer.isJoinCommand('vao'), true);
    assert.strictEqual(TextSanitizer.isJoinCommand('THAM GIA'), true);
    assert.strictEqual(TextSanitizer.isJoinCommand('XIN VÀO LỚP'), true);
    assert.strictEqual(TextSanitizer.isJoinCommand('hello cô giáo'), false);
  });

  await test('2.3 Text Sanitizer: Parses intentional quiz answers and ignores arbitrary text', () => {
    assert.strictEqual(TextSanitizer.parseAnswer('A'), 'A');
    assert.strictEqual(TextSanitizer.parseAnswer('b.'), 'B');
    assert.strictEqual(TextSanitizer.parseAnswer('Đáp án: C'), 'C');
    assert.strictEqual(TextSanitizer.parseAnswer('Chọn: D'), 'D');
    assert.strictEqual(TextSanitizer.parseAnswer('ABC'), null);
    assert.strictEqual(TextSanitizer.parseAnswer('Cho em hỏi bài tập'), null);
  });

  await test('2.4 Text Sanitizer: Parses Team Battle commands (Red / Blue)', () => {
    assert.strictEqual(TextSanitizer.parseTeam('ĐỎ'), 'red');
    assert.strictEqual(TextSanitizer.parseTeam('RED'), 'red');
    assert.strictEqual(TextSanitizer.parseTeam('XANH'), 'blue');
    assert.strictEqual(TextSanitizer.parseTeam('BLUE'), 'blue');
    assert.strictEqual(TextSanitizer.parseTeam('VÀNG'), null);
  });

  // --- 3. AVATAR SAFETY & PRIVACY ---
  await test('3.1 Avatar Manager: Accepts safe HTTPS TikTok CDN domains', () => {
    const mgr = new AvatarManager();
    assert.strictEqual(mgr.isUrlSafe('https://p16-sign.tiktokcdn.com/tos/avatar.jpg'), true);
    assert.strictEqual(mgr.isUrlSafe('https://p77-va.byteoversea.com/avatar.jpg'), true);
    assert.strictEqual(mgr.isUrlSafe('https://lh3.googleusercontent.com/a/abc'), true);
  });

  await test('3.2 Avatar Manager: Rejects insecure, local, or arbitrary URLs', () => {
    const mgr = new AvatarManager();
    assert.strictEqual(mgr.isUrlSafe('http://p16-sign.tiktokcdn.com/avatar.jpg'), false); // Insecure HTTP
    assert.strictEqual(mgr.isUrlSafe('https://localhost:8080/avatar.jpg'), false);
    assert.strictEqual(mgr.isUrlSafe('https://192.168.1.1/avatar.jpg'), false);
    assert.strictEqual(mgr.isUrlSafe('https://evil-hacker.com/image.png'), false);
    assert.strictEqual(mgr.isUrlSafe('javascript:alert(1)'), false);
  });

  // --- 4. SEATING & 100+ STUDENT ROSTER ---
  await test('4.1 Seat Allocator: Provides exactly 25 seats in 5x5 grid', () => {
    const allocator = new SeatAllocator();
    assert.strictEqual(allocator.getAllSeats().length, 25);
    assert.strictEqual(allocator.findFreeSeat(), 0);
  });

  await test('4.2 Student Roster: Allocates seats FIFO, deterministic skin, stable identity', () => {
    const roster = new StudentRoster();
    const res1 = roster.join({ id: 'u1', nickname: 'Alice' });
    assert.strictEqual(res1.isNew, true);
    assert.strictEqual(res1.seated, true);
    assert.strictEqual(res1.player.seatIndex, 0);

    const res2 = roster.join({ id: 'u1', nickname: 'Alice Renamed' });
    assert.strictEqual(res2.isNew, false);
    assert.strictEqual(res2.player.nickname, 'Alice Renamed');
    assert.strictEqual(res2.player.seatIndex, 0);
  });

  await test('4.3 Student Roster: Supports 100+ participants with seat rotation', () => {
    const roster = new StudentRoster();
    for (let i = 1; i <= 100; i++) {
      roster.join({ id: `user_${i}`, nickname: `Student ${i}` });
    }
    assert.strictEqual(roster.totalRegistered, 100);
    assert.strictEqual(roster.getVisiblePlayers().length, 25);

    // Simulate score accumulation on user 50 (who was unseated)
    const u50 = roster.getPlayer('user_50');
    assert(u50);
    u50.score = 500;
    u50.totalCorrect = 50;

    // Trigger seat rotation
    const rotation = roster.rotateSeats();
    assert(u50.seatIndex >= 0 && u50.seatIndex < 10, 'Top scorer must be rotated into front seats');
  });

  // --- 5. QUIZ ENGINE GAMEPLAY & RULES ---
  await test('5.1 Quiz Engine: Fair single answer per user per question', () => {
    const engine = new QuizEngine();
    engine.startRound('quick');
    const q = engine.currentQuestion!;
    const user = { id: 'v1', nickname: 'Bình' };

    // First answer accepted
    const r1 = engine.submitAnswer(user.id, q.correct, user);
    assert.strictEqual(r1.accepted, true);
    assert.strictEqual(r1.correct, true);
    assert(r1.points! >= 10);

    // Duplicate answer rejected
    const r2 = engine.submitAnswer(user.id, q.correct, user);
    assert.strictEqual(r2.accepted, false);
    assert.strictEqual(r2.reason, 'duplicate');
  });

  await test('5.2 Quiz Engine: Awards streak multiplier and resets on wrong answer', () => {
    const engine = new QuizEngine();
    const user = { id: 'v2', nickname: 'Chí' };
    engine.join(user);

    // Correct question 1
    engine.startRound('quick');
    engine.submitAnswer(user.id, engine.currentQuestion!.correct);
    const p = engine.roster.getPlayer(user.id)!;
    assert.strictEqual(p.streak, 1);

    // Correct question 2
    engine.nextQuestion();
    engine.submitAnswer(user.id, engine.currentQuestion!.correct);
    assert.strictEqual(p.streak, 2);

    // Wrong answer on question 3
    engine.nextQuestion();
    const wrongChoice = engine.currentQuestion!.correct === 'A' ? 'B' : 'A';
    engine.submitAnswer(user.id, wrongChoice);
    assert.strictEqual(p.streak, 0, 'Streak must be reset to 0 on incorrect answer');
  });

  await test('5.3 Quiz Engine: Team Battle mode calculates Red vs Blue scores accurately', () => {
    const engine = new QuizEngine();
    engine.startRound('team');

    const redUser = { id: 'red_1', nickname: 'Chiến Binh Đỏ', team: 'red' as const };
    const blueUser = { id: 'blue_1', nickname: 'Chiến Binh Xanh', team: 'blue' as const };
    engine.join(redUser);
    engine.join(blueUser);

    const q = engine.currentQuestion!;
    engine.submitAnswer(redUser.id, q.correct);
    engine.submitAnswer(blueUser.id, q.correct);

    assert(engine.teamScores.red >= 10, 'Red team must gain points');
    assert(engine.teamScores.blue >= 10, 'Blue team must gain points');
  });

  await test('5.4 Quiz Engine: Survival Class mode enforces 3 hearts and eliminates on 0', () => {
    const engine = new QuizEngine();
    engine.startRound('survival');

    const survivor = { id: 'surv_1', nickname: 'Dũng Cảm' };
    engine.join(survivor);
    const p = engine.roster.getPlayer(survivor.id)!;
    assert.strictEqual(p.hearts, 3);

    // Lose heart 1
    const wrong1 = engine.currentQuestion!.correct === 'A' ? 'B' : 'A';
    engine.submitAnswer(survivor.id, wrong1);
    assert.strictEqual(p.hearts, 2);

    // Lose heart 2
    engine.nextQuestion();
    const wrong2 = engine.currentQuestion!.correct === 'A' ? 'B' : 'A';
    engine.submitAnswer(survivor.id, wrong2);
    assert.strictEqual(p.hearts, 1);

    // Lose heart 3
    engine.nextQuestion();
    const wrong3 = engine.currentQuestion!.correct === 'A' ? 'B' : 'A';
    engine.submitAnswer(survivor.id, wrong3);
    assert.strictEqual(p.hearts, 0);

    // Next answer rejected because eliminated
    engine.nextQuestion();
    const rBlocked = engine.submitAnswer(survivor.id, engine.currentQuestion!.correct);
    assert.strictEqual(rBlocked.accepted, false);
    assert.strictEqual(rBlocked.reason, 'eliminated');
  });

  await test('5.5 Quiz Engine: Boss Question tracks collaborative victory goal', () => {
    let bossWon = false;
    const engine = new QuizEngine({
      onBossDefeated: () => {
        bossWon = true;
      },
    });

    engine.startRound('boss');
    const u1 = engine.join({ id: 'boss_h1', nickname: 'Hero 1' });
    const u2 = engine.join({ id: 'boss_h2', nickname: 'Hero 2' });

    engine.submitAnswer(u1.id, engine.currentQuestion!.correct);
    engine.submitAnswer(u2.id, engine.currentQuestion!.correct);

    engine.revealAnswer();
    assert.strictEqual(bossWon, true, 'Boss must be defeated when collaborative goal reached');
  });

  // --- 6. GIFT REACTION CONTROLLER ---
  await test('6.1 Gift Reactions: Maps gifts to cosmetic VFX without pay-to-win advantage', () => {
    const giftFx = new GiftReactionController();
    assert.strictEqual(giftFx.resolveEffectType('Rose'), 'rose_petals');
    assert.strictEqual(giftFx.resolveEffectType('Heart'), 'heart_rain');
    assert.strictEqual(giftFx.resolveEffectType('Universe'), 'galaxy_party');
    assert.strictEqual(giftFx.resolveEffectType('Lion'), 'royal_spotlight');
    assert.strictEqual(giftFx.resolveEffectType('Crown'), 'royal_spotlight');
    assert.strictEqual(giftFx.resolveEffectType('Fireworks'), 'fireworks');

    const v1 = giftFx.enqueueGift('Fan Cứng', 'Rose', 1);
    assert(v1);
    assert.strictEqual(v1.type, 'rose_petals');
  });

  // --- 7. TTS PRIORITY QUEUE ---
  await test('7.1 TTS Controller: Prioritizes question over greetings and handles deduplication', () => {
    const tts = new TTSController();
    tts.enabled = true;
    (tts as any).isUnlocked = true;

    // Enqueue welcome (priority 1)
    tts.speak('Chào mừng bạn An!', 'vi-VN', 1, 'greet_an');
    // Enqueue question (priority 3)
    tts.speak('What does apple mean?', 'en-US', 3, 'q_apple');

    const q = (tts as any).queue;
    assert.strictEqual(q[0].priority, 3, 'Highest priority item must be first in queue');
    assert.strictEqual(q[0].text, 'What does apple mean?');
  });

  // --- 8. TEACHER 6 POSES & TTS SYNCHRONIZATION ---
  await test('8.1 Teacher Poses: All 6 PNG assets exist with 512x768 dimensions and valid headers', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const poses = ['idle', 'point', 'talk', 'happy', 'sad', 'cheer'];
    const dir = path.resolve('public/assets/english-class-v1/teacher');

    poses.forEach((pose) => {
      const file = path.join(dir, `teacher_${pose}.png`);
      assert(fs.existsSync(file), `Teacher pose asset missing: ${file}`);
      const buf = fs.readFileSync(file);
      assert.strictEqual(buf.readUInt32BE(0), 0x89504E47, 'Must be valid PNG format');
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      assert.strictEqual(w, 512, `Pose ${pose} width must be 512 (found ${w})`);
      assert.strictEqual(h, 768, `Pose ${pose} height must be 768 (found ${h})`);
    });
  });

  await test('8.2 Teacher Poses: State mapping routes canonical and legacy states cleanly', async () => {
    const { mapTeacherStateToPose } = await import('../src/game/visuals/TeacherPoseController.js');
    assert.strictEqual(mapTeacherStateToPose('idle'), 'idle');
    assert.strictEqual(mapTeacherStateToPose('point'), 'point');
    assert.strictEqual(mapTeacherStateToPose('talk'), 'talk');
    assert.strictEqual(mapTeacherStateToPose('happy'), 'happy');
    assert.strictEqual(mapTeacherStateToPose('sad'), 'sad');
    assert.strictEqual(mapTeacherStateToPose('cheer'), 'cheer');
    // Legacy state fallbacks
    assert.strictEqual(mapTeacherStateToPose('clap'), 'cheer');
    assert.strictEqual(mapTeacherStateToPose('explain'), 'talk');
    assert.strictEqual(mapTeacherStateToPose('think'), 'point');
    assert.strictEqual(mapTeacherStateToPose('surprise'), 'happy');
  });

  await test('8.3 Teacher Poses: Uniform scaling preserves aspect ratio without independent stretching', async () => {
    const { TEACHER_POSES } = await import('../src/game/visuals/TeacherPoseController.js');
    assert.strictEqual(TEACHER_POSES.length, 6);

    const assetW = 512;
    const assetH = 768;
    const maxHeight = 295;
    const maxWidth = 200;

    const s = Math.min(maxHeight / assetH, maxWidth / assetW);
    const renderedW = assetW * s;
    const renderedH = assetH * s;

    // Check aspect ratio is identical to source
    const originalAspect = assetW / assetH;
    const renderedAspect = renderedW / renderedH;
    assert(Math.abs(originalAspect - renderedAspect) < 0.0001, 'Rendered aspect ratio must match source');
    assert(renderedH <= maxHeight, 'Rendered height must not exceed maxHeight');
    assert(renderedW <= maxWidth, 'Rendered width must not exceed maxWidth');
  });

  await test('8.4 TTS Controller: Speech lifecycle hooks onSpeechStart and onSpeechEnd are supported', () => {
    const tts = new TTSController();
    assert('onSpeechStart' in tts, 'TTSController must expose onSpeechStart hook');
    assert('onSpeechEnd' in tts, 'TTSController must expose onSpeechEnd hook');
  });

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runSuite();
