import { RebusConfig, RebusMode, RebusPlayerRecord, RebusPuzzle, RebusState } from '../types';
import { StudentRoster } from './StudentRoster';
import { AudioEngine } from '../audio/AudioEngine';
import { TTSController } from './TTSController';
import { TextNormalizer } from '../utils/TextNormalizer';
import rawPuzzles from '../../data/puzzles.json';

export interface RebusEngineEvents {
  onStateChanged?: (state: RebusState) => void;
  onPuzzleStarted?: (puzzle: RebusPuzzle, round: number, totalRounds: number) => void;
  onTick?: (remainingSec: number, totalSec: number) => void;
  onHint1Triggered?: (hint1: string) => void;
  onHint2Triggered?: (hint2: string, firstChar: string) => void;
  onGuessAttempt?: (userId: string, guess: string, isCorrect: boolean) => void;
  onPuzzleSolved?: (puzzle: RebusPuzzle, winner: RebusPlayerRecord, points: number) => void;
  onPuzzleRevealed?: (puzzle: RebusPuzzle, solved: boolean) => void;
  onCeremonyStarted?: () => void;
}

export class RebusEngine {
  private config: RebusConfig;
  private studentRoster: StudentRoster;
  private audioEngine: AudioEngine;
  private ttsController: TTSController;
  private events: RebusEngineEvents = {};

  public allPuzzles: RebusPuzzle[] = [];
  public historyIds: string[] = [];
  public currentPuzzle: RebusPuzzle | null = null;
  public currentState: RebusState = 'idle';
  public roundNumber: number = 0;
  public readonly totalRounds: number = 10;
  public remainingTimeMs: number = 0;
  public totalTimeMs: number = 20000;

  private hint1Given: boolean = false;
  private hint2Given: boolean = false;
  private isSolvedInCurrentRound: boolean = false;
  private roundWinner: RebusPlayerRecord | null = null;

  private timerHandle: any = null;
  private stateTimerHandle: any = null;

  constructor(
    studentRoster: StudentRoster,
    audioEngine: AudioEngine,
    ttsController: TTSController,
    config?: Partial<RebusConfig>
  ) {
    this.studentRoster = studentRoster;
    this.audioEngine = audioEngine;
    this.ttsController = ttsController;

    this.allPuzzles = (rawPuzzles as RebusPuzzle[]).filter((p) => p.verified);
    if (this.allPuzzles.length === 0) {
      this.allPuzzles = rawPuzzles as RebusPuzzle[];
    }

    this.config = {
      introDurationMs: 2500,
      guessingDurationMs: 20000,
      revealDurationMs: 3500,
      celebrateDurationMs: 2500,
      basePoints: 15,
      maxSpeedBonus: 8,
      maxStreakBonus: 8,
      maxGuessesPerRound: 4,
      cooldownMs: 1500,
      soundVolume: 0.8,
      ttsEnabled: true,
      theme: 'outdoor_sun',
      mode: 'word',
      ...config,
    };
  }

  public setEvents(events: RebusEngineEvents): void {
    this.events = events;
  }

  public setMode(mode: RebusMode): void {
    this.config.mode = mode;
  }

  public startShow(): void {
    this.roundNumber = 0;
    this.nextRound();
  }

  public nextRound(): void {
    this.clearTimers();
    this.roundNumber++;

    if (this.roundNumber > this.totalRounds) {
      this.triggerCeremony();
      return;
    }

    this.currentPuzzle = this.selectNextPuzzle();
    if (!this.currentPuzzle) {
      this.triggerCeremony();
      return;
    }

    this.studentRoster.resetRoundAttempts();
    this.hint1Given = false;
    this.hint2Given = false;
    this.isSolvedInCurrentRound = false;
    this.roundWinner = null;

    this.totalTimeMs = (this.currentPuzzle.durationSec || 20) * 1000;
    this.remainingTimeMs = this.totalTimeMs;

    this.setState('intro');
    this.events.onPuzzleStarted?.(this.currentPuzzle, this.roundNumber, this.totalRounds);

    if (this.config.ttsEnabled) {
      this.ttsController.speak(`Câu đố số ${this.roundNumber}! Hai hình ảnh ghép thành từ gì nào cả lớp!`);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.startGuessing();
    }, this.config.introDurationMs);
  }

  private selectNextPuzzle(): RebusPuzzle | null {
    let pool = this.allPuzzles.filter((p) => !this.historyIds.includes(p.id));
    if (pool.length === 0) {
      this.historyIds = [];
      pool = this.allPuzzles;
    }
    if (pool.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = { ...pool[randomIndex] };

    this.historyIds.push(selected.id);
    if (this.historyIds.length > 50) {
      this.historyIds.shift();
    }

    if (this.config.mode === 'speed8') {
      selected.durationSec = 8;
    } else if (this.config.mode === 'boss') {
      selected.durationSec = 24;
    }

    return selected;
  }

  private startGuessing(): void {
    this.setState('guessing');
    const intervalMs = 200;

    this.timerHandle = setInterval(() => {
      this.remainingTimeMs -= intervalMs;
      const secLeft = Math.ceil(this.remainingTimeMs / 1000);
      this.events.onTick?.(Math.max(0, secLeft), Math.ceil(this.totalTimeMs / 1000));

      const elapsedRatio = 1 - this.remainingTimeMs / this.totalTimeMs;

      // 1. Hint 1 at 60% elapsed time
      if (!this.hint1Given && elapsedRatio >= 0.6) {
        this.triggerHint1();
      }

      // 2. Hint 2 at 85% elapsed time
      if (!this.hint2Given && elapsedRatio >= 0.85) {
        this.triggerHint2();
      }

      // Audio ticks
      if (this.remainingTimeMs > 0 && this.remainingTimeMs <= 5000 && this.remainingTimeMs % 1000 < intervalMs) {
        this.audioEngine.playUrgentTick();
      } else if (this.remainingTimeMs % 1000 < intervalMs && this.remainingTimeMs > 0) {
        this.audioEngine.playTick();
      }

      if (this.remainingTimeMs <= 0) {
        this.lockPuzzle();
      }
    }, intervalMs);
  }

  public submitGuess(userId: string, comment: string): boolean {
    if (this.currentState !== 'guessing' || !this.currentPuzzle) return false;
    if (this.isSolvedInCurrentRound) return false;

    // Auto-register contestant if not yet in roster
    this.studentRoster.registerOrGet(userId, userId);

    // Check rate limit and cooldown
    const check = this.studentRoster.checkCanGuess(
      userId,
      this.config.maxGuessesPerRound,
      this.config.cooldownMs
    );
    if (!check.allowed) return false;

    this.studentRoster.recordGuessAttempt(userId);

    const isMatch = TextNormalizer.matchesAnswer(
      comment,
      this.currentPuzzle.answer,
      this.currentPuzzle.aliases
    );

    if (isMatch) {
      this.isSolvedInCurrentRound = true;
      this.clearTimers();

      const timeRatio = Math.max(0, this.remainingTimeMs / this.totalTimeMs);
      const speedBonus = Math.round(timeRatio * this.config.maxSpeedBonus);
      const player = this.studentRoster.getPlayer(userId);
      const streakBonus = Math.min(this.config.maxStreakBonus, (player?.streak || 0) + 1);
      const totalPoints = this.config.basePoints + speedBonus + streakBonus;

      this.studentRoster.addScore(userId, totalPoints, true);
      this.roundWinner = player || null;

      this.audioEngine.playCorrect();
      this.events.onGuessAttempt?.(userId, comment, true);
      if (this.roundWinner) {
        this.events.onPuzzleSolved?.(this.currentPuzzle, this.roundWinner, totalPoints);
      }

      if (this.config.ttsEnabled && player) {
        this.ttsController.speak(
          `Chính xác! ${player.nickname} đã đoán đúng đáp án ${this.currentPuzzle.answer}!`,
          true
        );
      }

      this.stateTimerHandle = setTimeout(() => {
        this.revealPuzzle();
      }, 1500);

      return true;
    } else {
      this.audioEngine.playWrong();
      this.events.onGuessAttempt?.(userId, comment, false);
      return false;
    }
  }

  public triggerHint1(): void {
    if (this.hint1Given || !this.currentPuzzle) return;
    this.hint1Given = true;
    this.audioEngine.playHintChime();
    this.events.onHint1Triggered?.(this.currentPuzzle.hint1);

    if (this.config.ttsEnabled) {
      this.ttsController.speak(`Gợi ý: ${this.currentPuzzle.hint1}`);
    }
  }

  public triggerHint2(): void {
    if (this.hint2Given || !this.currentPuzzle) return;
    this.hint2Given = true;
    this.audioEngine.playHintChime();
    const firstChar = this.currentPuzzle.answer.trim().charAt(0).toUpperCase();
    this.events.onHint2Triggered?.(this.currentPuzzle.hint2, firstChar);

    if (this.config.ttsEnabled) {
      this.ttsController.speak(`Gợi ý chữ cái đầu là chữ: ${firstChar}`);
    }
  }

  public lockPuzzle(): void {
    this.clearTimers();
    this.setState('locked');
    this.audioEngine.playLock();

    this.stateTimerHandle = setTimeout(() => {
      this.revealPuzzle();
    }, 1000);
  }

  private revealPuzzle(): void {
    if (!this.currentPuzzle) return;
    this.setState('reveal');
    this.events.onPuzzleRevealed?.(this.currentPuzzle, this.isSolvedInCurrentRound);

    if (!this.isSolvedInCurrentRound && this.config.ttsEnabled) {
      this.ttsController.speak(
        `Hết giờ! Đáp án chính xác là: ${this.currentPuzzle.answer}. ${this.currentPuzzle.explanation}`
      );
    }

    this.stateTimerHandle = setTimeout(() => {
      this.celebrateAndContinue();
    }, this.config.revealDurationMs);
  }

  private celebrateAndContinue(): void {
    this.setState('celebrate');

    this.stateTimerHandle = setTimeout(() => {
      this.nextRound();
    }, this.config.celebrateDurationMs);
  }

  public triggerCeremony(): void {
    this.clearTimers();
    this.setState('finished');
    this.events.onCeremonyStarted?.();
    this.audioEngine.playFanfare();

    if (this.config.ttsEnabled) {
      const top3 = this.studentRoster.getTopPlayers(3);
      const champion = top3[0] ? top3[0].nickname : 'Cả lớp';
      this.ttsController.speak(`Vinh danh nhà vô địch Đuổi Hình Bắt Chữ hôm nay: ${champion}!`);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.startShow();
    }, 15000);
  }

  public skipPuzzle(): void {
    this.clearTimers();
    this.nextRound();
  }

  private setState(state: RebusState): void {
    this.currentState = state;
    this.events.onStateChanged?.(state);
  }

  private clearTimers(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    if (this.stateTimerHandle) {
      clearTimeout(this.stateTimerHandle);
      this.stateTimerHandle = null;
    }
  }

  public destroy(): void {
    this.clearTimers();
  }
}
