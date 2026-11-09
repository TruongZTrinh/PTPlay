import Phaser from 'phaser';
import { ClassroomPresentation } from '../visuals/ClassroomPresentation.js';
import { TeacherCharacter } from '../visuals/TeacherCharacter.js';
import { StudentCharacter } from '../visuals/StudentCharacter.js';
import { QuestionBoard } from '../ui/QuestionBoard.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { StreamerModal } from '../ui/StreamerModal.js';
import { AudioEngine } from '../audio/AudioEngine.js';
import { TTSController } from '../systems/TTSController.js';
import { AvatarManager } from '../systems/AvatarManager.js';
import { QuizEngine } from '../systems/QuizEngine.js';
import { GiftReactionController, ActiveGiftVisual } from '../systems/GiftReactionController.js';
import { EnglishLiveEventRouter } from '../events/EnglishLiveEventRouter.js';
import { QuizPhase, QuizQuestion, StreamerConfig, StudentPlayer } from '../types.js';

export class EnglishClassScene extends Phaser.Scene {
  private presentation!: ClassroomPresentation;
  private teacher!: TeacherCharacter;
  private questionBoard!: QuestionBoard;
  private scoreboard!: Scoreboard;
  private streamerModal!: StreamerModal;

  private audio!: AudioEngine;
  private tts!: TTSController;
  private avatarManager!: AvatarManager;
  private engine!: QuizEngine;
  private giftFx!: GiftReactionController;
  private eventRouter!: EnglishLiveEventRouter;

  private students = new Map<string, StudentCharacter>();
  private activeVfxParticles: Phaser.GameObjects.Image[] = [];

  private config: StreamerConfig = {
    mode: 'quick',
    theme: 'day',
    questionDurationSec: 12,
    ttsEnabled: true,
    ttsVietnamese: true,
    ttsEnglish: true,
    ttsVolume: 0.85,
    ttsRate: 1.0,
    sfxVolume: 0.7,
    bgmVolume: 0.35,
    hideAvatars: false,
    largeText: false,
    reducedMotion: false,
    autoPlayNPC: true,
  };

  constructor() {
    super({ key: 'EnglishClassScene' });
  }

  create(): void {
    console.log('[EnglishClassScene] Initializing full 9:16 classroom environment...');

    // 1. Audio & TTS Services
    this.audio = new AudioEngine();
    this.tts = new TTSController(this.audio);
    this.avatarManager = new AvatarManager();
    this.giftFx = new GiftReactionController();

    // 2. Classroom Presentation Layer
    this.presentation = new ClassroomPresentation(this);

    // 3. Teacher Host Character
    this.teacher = new TeacherCharacter(this, 94, 420);

    // 4. Question Chalkboard UI
    this.questionBoard = new QuestionBoard(this);

    // 5. Scoreboard & HUD
    this.scoreboard = new Scoreboard(this);

    // 6. Authoritative Quiz Engine
    this.engine = new QuizEngine({
      onPhaseChange: (phase, question) => this.handlePhaseChange(phase, question),
      onStudentJoin: (player, isNew) => this.handleStudentJoin(player, isNew),
      onAnswerAccepted: (receipt, player) => this.handleAnswerAccepted(receipt, player),
      onBossDefeated: (totalCorrect) => this.handleBossDefeated(totalCorrect),
      onRoundComplete: (top, points) => this.handleRoundComplete(top, points),
    });

    // 7. Live Bridge Event Router
    this.eventRouter = new EnglishLiveEventRouter(
      this.engine,
      this.giftFx,
      this.scoreboard,
      this.tts
    );

    // 8. Streamer Control Modal
    this.streamerModal = new StreamerModal(
      this.engine,
      this.tts,
      this.audio,
      this.presentation,
      this.giftFx,
      this.config,
      (newCfg) => this.applyConfigChanges(newCfg)
    );

    // 9. DOM Audio Unlock Event
    this.setupAudioUnlockTrigger();

    // 10. Start the game loop!
    this.engine.startRound('quick');
  }

  private setupAudioUnlockTrigger(): void {
    const btn = document.getElementById('audio-unlock-overlay');
    if (btn) {
      btn.onclick = () => {
        const audioOk = this.audio.unlock();
        const ttsOk = this.tts.unlock();
        if (audioOk && ttsOk) {
          btn.classList.add('hidden');
          this.audio.playBell();
          this.tts.announceWelcome();
        }
      };
    }
  }

  private applyConfigChanges(newCfg: StreamerConfig): void {
    this.config = newCfg;
    this.audio.setVolumes(newCfg.sfxVolume, newCfg.bgmVolume);
    this.presentation.setTheme(newCfg.theme);
  }

  private handlePhaseChange(phase: QuizPhase, q?: QuizQuestion | null): void {
    if (phase === 'question' && q) {
      // 1. New Question Starts
      this.audio.playBell();
      this.questionBoard.showQuestion(q, this.engine.questionIndex);
      this.teacher.setState('point', 1800);

      // Clear answer badges on desks
      for (const student of this.students.values()) {
        student.clearAnswerBadge();
      }

      // Teacher speaks prompt
      this.tts.announceQuestion(q.promptVi || '', q.prompt, q.audioText);

      // Update team mode bar
      this.scoreboard.updateTeamMode(
        q.mode === 'team',
        this.engine.teamScores.red,
        this.engine.teamScores.blue
      );
    } else if (phase === 'reveal' && q) {
      // 2. Question Revealed
      const fastest = this.engine.fastestWinner?.player.nickname;
      this.questionBoard.revealCorrectAnswer(q.correct, q.explanation, fastest);

      const hasCorrect = Array.from(this.engine.answeredThisQuestion.values()).some((r) => r.correct);
      if (hasCorrect) {
        this.audio.playCorrect();
        this.teacher.setState('happy', 2500);
      } else {
        this.audio.playWrong();
        this.teacher.setState('sad', 2000);
      }

      // Animate reactions for seated students
      for (const [userId, receipt] of this.engine.answeredThisQuestion.entries()) {
        const student = this.students.get(userId);
        if (student) {
          if (receipt.correct) {
            student.reactCorrect(receipt.points || 10);
          } else {
            student.reactWrong();
          }
        }
      }

      // Teacher speaks explanation
      this.tts.announceReveal(q.correct, q.explanation, fastest);

      // Update leaderboard
      const top = this.engine.roster.getTopPlayers(3).map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        streak: p.streak,
        totalCorrect: p.totalCorrect,
      }));
      this.scoreboard.updateTop3(top);
      this.scoreboard.updateStats(this.engine.classPoints, this.engine.roster.totalRegistered);

      // Update team scores if team mode
      if (q.mode === 'team') {
        this.scoreboard.updateTeamMode(
          true,
          this.engine.teamScores.red,
          this.engine.teamScores.blue
        );
      }
    } else if (phase === 'break') {
      this.teacher.setState('idle');
      // Refresh seat visual assignments after seat rotation
      this.refreshVisibleStudents();
    } else if (phase === 'celebration') {
      this.audio.playFanfare();
      this.teacher.celebrateVictory();
      this.audio.setPartyBgm(true);
      for (const student of this.students.values()) {
        student.danceParty();
      }
      this.time.delayedCall(6000, () => {
        this.audio.setPartyBgm(false);
        this.engine.startRound('quick');
      });
    }
  }

  private handleStudentJoin(player: StudentPlayer, isNew: boolean): void {
    if (this.students.has(player.id)) return;

    if (player.seatIndex >= 0) {
      const seat = this.engine.roster.seatAllocator.getSeat(player.seatIndex);
      if (seat) {
        const student = new StudentCharacter(this, player, seat.x, seat.y, this.avatarManager);
        this.students.set(player.id, student);

        if (isNew) {
          // Walk in from classroom doorway on left
          student.walkInFromDoor(-40, seat.y + 10, seat.x, seat.y);
          this.audio.playBell();
          this.tts.announceWelcome(player.nickname);
        }
      }
    }

    this.scoreboard.updateStats(this.engine.classPoints, this.engine.roster.totalRegistered);
  }

  private handleAnswerAccepted(receipt: any, player: StudentPlayer): void {
    const student = this.students.get(player.id);
    if (student && receipt.answer) {
      student.showAnswerChoice(receipt.answer);
    }
  }

  private handleBossDefeated(totalCorrect: number): void {
    this.audio.playFanfare();
    this.teacher.celebrateVictory();
    this.tts.announceBossVictory(totalCorrect);
    this.triggerUniversePartyVisual('Cả Lớp');
  }

  private handleRoundComplete(top: StudentPlayer[], points: number): void {
    console.log(`[EnglishClassScene] Round finished! Total class points: ${points}`);
  }

  private refreshVisibleStudents(): void {
    // Synchronize visible sprites with seatAllocator occupancy
    const occupiedSeats = this.engine.roster.seatAllocator.getAllSeats();

    occupiedSeats.forEach((seat) => {
      const occupantId = this.engine.roster.seatAllocator.getOccupant(seat.index);
      if (occupantId) {
        let student = this.students.get(occupantId);
        const player = this.engine.roster.getPlayer(occupantId);
        if (!student && player) {
          student = new StudentCharacter(this, player, seat.x, seat.y, this.avatarManager);
          this.students.set(occupantId, student);
        } else if (student) {
          student.container.setPosition(seat.x, seat.y);
        }
      }
    });

    // Remove sprites for players who were unseated during rotation
    for (const [id, student] of this.students.entries()) {
      const player = this.engine.roster.getPlayer(id);
      if (player && player.seatIndex === -1) {
        student.destroy();
        this.students.delete(id);
      }
    }
  }

  // --- Visual Gift Effects Trigger ---

  private triggerGiftVfx(visual: ActiveGiftVisual): void {
    switch (visual.type) {
      case 'rose_petals':
        this.spawnPetals();
        break;
      case 'heart_rain':
        this.spawnHearts();
        break;
      case 'galaxy_party':
        this.triggerUniversePartyVisual(visual.senderName);
        break;
      case 'royal_spotlight':
        this.triggerRoyalCrownVisual();
        break;
      case 'fireworks':
        this.spawnFireworks();
        break;
      case 'teacher_dance':
        this.teacher.setState('cheer', 3000);
        break;
      case 'class_confetti':
      default:
        this.spawnConfetti();
        break;
    }
  }

  private spawnPetals(): void {
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(40, 500);
      const petal = this.add.image(x, -20, 'fx_rose').setDisplaySize(20, 20).setDepth(40);
      this.tweens.add({
        targets: petal,
        y: 920,
        x: x + Phaser.Math.Between(-40, 40),
        angle: Phaser.Math.Between(90, 360),
        duration: Phaser.Math.Between(1800, 2600),
        delay: i * 80,
        ease: 'Sine.easeInOut',
        onComplete: () => petal.destroy(),
      });
    }
  }

  private spawnHearts(): void {
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(50, 490);
      const heart = this.add.image(x, 860, 'fx_heart').setDisplaySize(22, 22).setDepth(40);
      this.tweens.add({
        targets: heart,
        y: 120,
        x: x + Phaser.Math.Between(-30, 30),
        scale: 1.4,
        alpha: 0,
        duration: Phaser.Math.Between(1900, 2700),
        delay: i * 70,
        ease: 'Cubic.easeOut',
        onComplete: () => heart.destroy(),
      });
    }
  }

  private spawnFireworks(): void {
    this.audio.playConfetti();
    for (let b = 0; b < 3; b++) {
      const cx = Phaser.Math.Between(150, 420);
      const cy = Phaser.Math.Between(120, 320);

      this.time.delayedCall(b * 300, () => {
        for (let i = 0; i < 12; i++) {
          const spark = this.add.image(cx, cy, 'fx_sparkle').setDisplaySize(18, 18).setDepth(45);
          const angle = (i / 12) * Math.PI * 2;
          const dist = Phaser.Math.Between(40, 90);
          this.tweens.add({
            targets: spark,
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            alpha: 0,
            scale: 0.2,
            duration: 850,
            ease: 'Quad.easeOut',
            onComplete: () => spark.destroy(),
          });
        }
      });
    }
  }

  private spawnConfetti(): void {
    this.audio.playConfetti();
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(30, 510);
      const conf = this.add.image(x, -20, 'fx_confetti').setDisplaySize(18, 18).setDepth(40);
      this.tweens.add({
        targets: conf,
        y: 930,
        x: x + Phaser.Math.Between(-50, 50),
        angle: Phaser.Math.Between(180, 720),
        duration: Phaser.Math.Between(1600, 2400),
        delay: i * 50,
        ease: 'Sine.easeInOut',
        onComplete: () => conf.destroy(),
      });
    }
  }

  private triggerRoyalCrownVisual(): void {
    this.audio.playFanfare();
    const crown = this.add.image(94, 260, 'fx_crown').setDisplaySize(54, 46).setDepth(35).setAlpha(0);
    this.tweens.add({
      targets: crown,
      alpha: 1,
      y: 280,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 4,
      ease: 'Back.easeOut',
      onComplete: () => crown.destroy(),
    });
  }

  private triggerUniversePartyVisual(sender: string): void {
    this.audio.playFanfare();
    const overlay = this.add.graphics().setDepth(50);
    overlay.fillStyle(0x020617, 0.7);
    overlay.fillRect(0, 0, 540, 960);

    const banner = this.add.text(270, 360, `🌌 TIỆC VŨ TRỤ CỦA ${sender.toUpperCase()}!`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(51);

    const universeIcon = this.add.image(270, 460, 'fx_universe').setDisplaySize(120, 120).setDepth(51);

    this.tweens.add({
      targets: universeIcon,
      angle: 360,
      scale: 1.3,
      duration: 3500,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(4500, () => {
      this.tweens.add({
        targets: [overlay, banner, universeIcon],
        alpha: 0,
        duration: 800,
        onComplete: () => {
          overlay.destroy();
          banner.destroy();
          universeIcon.destroy();
        },
      });
    });
  }

  update(time: number, delta: number): void {
    const now = Date.now();

    // 1. Tick engine for monotonic countdown & phase transitions
    this.engine.tick(now);

    // 2. Update timer bar if question is active
    if (this.engine.phase === 'question') {
      const progress = this.engine.getProgressRatio(now);
      const remainingSec = this.engine.getSecondsRemaining(now);
      this.questionBoard.drawTimerBar(progress, remainingSec);

      // Audio tick during last 4 seconds
      if (remainingSec <= 4 && remainingSec > 0 && Math.floor(now / 1000) !== Math.floor((now - delta) / 1000)) {
        this.audio.playTick();
        if (remainingSec === 4) {
          this.tts.announceTimeWarning();
        }
      }
    }

    // 3. Tick cosmetic gift reactions
    const activeVisual = this.giftFx.tick(now);
    if (activeVisual && !activeVisual.startedAt) {
      this.triggerGiftVfx(activeVisual);
    }
  }

  shutdown(): void {
    if (this.eventRouter) this.eventRouter.disconnect();
    if (this.audio) this.audio.stop();
    if (this.tts) this.tts.stop();
    this.students.clear();
  }
}
