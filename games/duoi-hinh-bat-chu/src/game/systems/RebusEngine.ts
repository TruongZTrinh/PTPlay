import { RebusConfig, RebusMode, RebusPlayerRecord, RebusPuzzle, RebusState } from '../types';
import { StudentRoster } from './StudentRoster';
import { AudioEngine } from '../audio/AudioEngine';
import { TTSController } from './TTSController';
import { TextNormalizer } from '../utils/TextNormalizer';
import rawPuzzles from '../../data/puzzles.json';
import { CEREMONY_DURATION_MS, CEREMONY_REVEAL_TIMES } from '../constants';

export interface RebusEngineEvents {
  onStateChanged?: (state: RebusState) => void;
  onPuzzleStarted?: (puzzle: RebusPuzzle, round: number, totalRounds?: number) => void;
  onTick?: (remainingSec: number, totalSec: number) => void;
  onTimeAdded?: (seconds: number, sponsorName?: string) => void;
  onHint1Triggered?: (hint1: string, sponsorName?: string) => void;
  onHint2Triggered?: (hint2: string, firstChar: string, sponsorName?: string) => void;
  onGuessAttempt?: (userId: string, guess: string, isCorrect: boolean, solverRank?: number, points?: number) => void;
  onPuzzleSolved?: (puzzle: RebusPuzzle, winner: RebusPlayerRecord, points: number) => void;
  onPuzzleRevealed?: (puzzle: RebusPuzzle, solved: boolean, winner?: RebusPlayerRecord) => void;
  onSeatRebalance?: (onComplete?: () => void) => number | 'async';
  onTestSleepKick?: (userId: string, nickname: string) => void;
  onTestRandomLowerKick?: () => void;
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
  public remainingTimeMs: number = 0;
  public totalTimeMs: number = 20000;

  private hint1Given: boolean = false;
  private hint2Given: boolean = false;
  private isSolvedInCurrentRound: boolean = false;
  private roundWinner: RebusPlayerRecord | null = null;
  private roundSolvers: string[] = [];

  private timerHandle: any = null;
  private stateTimerHandle: any = null;
  private ceremonyAnnouncementTimer: ReturnType<typeof setTimeout> | null = null;
  private puzzleDeck: RebusPuzzle[] = [];

  constructor(
    studentRoster: StudentRoster,
    audioEngine: AudioEngine,
    ttsController: TTSController,
    config?: Partial<RebusConfig>
  ) {
    this.studentRoster = studentRoster;
    this.audioEngine = audioEngine;
    this.ttsController = ttsController;

    // Only include puzzles with authentic rebus images
    this.allPuzzles = (rawPuzzles as RebusPuzzle[]).filter((p) => p.verified && !!p.image);
    if (this.allPuzzles.length === 0) {
      this.allPuzzles = (rawPuzzles as RebusPuzzle[]).filter((p) => !!p.image);
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
    if (this.config.ttsEnabled) {
      this.ttsController.announceShowWelcome();
    }
    this.nextRound();
  }

  public nextRound(): void {
    this.clearTimers();
    this.roundNumber++;

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
    this.roundSolvers = [];

    this.totalTimeMs = (this.currentPuzzle.durationSec || 20) * 1000;
    this.remainingTimeMs = this.totalTimeMs;

    this.setState('intro');
    this.audioEngine.playRoundStart();
    this.events.onPuzzleStarted?.(this.currentPuzzle, this.roundNumber);

    if (this.config.ttsEnabled && this.currentPuzzle) {
      this.ttsController.announceRoundStart(this.roundNumber, this.currentPuzzle.difficulty || 1);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.startGuessing();
    }, this.config.introDurationMs);
  }

  private selectNextPuzzle(): RebusPuzzle | null {
    // If deck is empty, refill from verified image puzzles and shuffle
    if (this.puzzleDeck.length === 0) {
      const candidates = this.allPuzzles.filter((p) => !!p.image);
      if (candidates.length === 0) return null;

      // Fisher-Yates shuffle
      const shuffled = [...candidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      this.puzzleDeck = shuffled;
    }

    const selected = this.puzzleDeck.pop();
    if (!selected) return null;

    const puzzleCopy: RebusPuzzle = { ...selected };

    this.historyIds.push(puzzleCopy.id);
    if (this.historyIds.length > 50) {
      this.historyIds.shift();
    }

    if (this.config.mode === 'speed8') {
      puzzleCopy.durationSec = 8;
    } else if (this.config.mode === 'boss') {
      puzzleCopy.durationSec = 24;
    }

    return puzzleCopy;
  }

  private startGuessing(): void {
    this.setState('guessing');
    const intervalMs = 200;

    this.timerHandle = setInterval(() => {
      this.remainingTimeMs -= intervalMs;
      const secLeft = Math.ceil(this.remainingTimeMs / 1000);
      this.events.onTick?.(Math.max(0, secLeft), Math.ceil(this.totalTimeMs / 1000));

      const elapsedRatio = 1 - this.remainingTimeMs / this.totalTimeMs;

      // Hints are NOT automatically revealed by time - only shown when users send Rose or Follow!

      // Time warning at 5 seconds remaining
      if (this.remainingTimeMs <= 5000 && this.remainingTimeMs > 4800 && this.config.ttsEnabled) {
        const isHard = (this.currentPuzzle?.difficulty || 1) >= 3;
        this.ttsController.announceTimeWarning(isHard);
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
    // Disallow duplicate correct guesses from the same player in one round
    if (this.roundSolvers.includes(userId)) return false;

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
      this.roundSolvers.push(userId);
      const solverRank = this.roundSolvers.length;
      const player = this.studentRoster.getPlayer(userId);
      const timeRatio = Math.max(0, this.remainingTimeMs / this.totalTimeMs);

      if (solverRank === 1) {
        // --- #1 FASTEST SOLVER (Round Winner) ---
        this.isSolvedInCurrentRound = true;
        this.clearTimers();

        const speedBonus = Math.round(timeRatio * this.config.maxSpeedBonus);
        const streakBonus = Math.min(this.config.maxStreakBonus, (player?.streak || 0) + 1);
        const totalPoints = this.config.basePoints + speedBonus + streakBonus;

        this.studentRoster.addScore(userId, totalPoints, true);
        this.roundWinner = player || null;

        this.audioEngine.playCorrect();
        this.events.onGuessAttempt?.(userId, comment, true, 1, totalPoints);
        if (this.roundWinner) {
          this.events.onPuzzleSolved?.(this.currentPuzzle, this.roundWinner, totalPoints);
        }

        if (this.config.ttsEnabled && player) {
          this.ttsController.announceCorrect(player.nickname, this.currentPuzzle.answer);
        }

        // 1500ms grace window before revealing answer to viewers
        this.stateTimerHandle = setTimeout(() => {
          this.revealPuzzle();
        }, 1500);

        return true;
      } else if (solverRank <= 3) {
        // --- 2nd & 3rd FASTEST SOLVERS (Grace period bonus) ---
        const runnerUpBase = solverRank === 2 ? 10 : 8;
        const runnerUpSpeed = Math.round(timeRatio * (solverRank === 2 ? 4 : 2));
        const totalPoints = runnerUpBase + runnerUpSpeed + 1;

        this.studentRoster.addScore(userId, totalPoints, true);
        this.audioEngine.playCorrect();
        this.events.onGuessAttempt?.(userId, comment, true, solverRank, totalPoints);

        return true;
      }

      return false;
    } else {
      this.audioEngine.playWrong();
      this.events.onGuessAttempt?.(userId, comment, false);
      return false;
    }
  }

  public addTime(seconds: number = 10, sponsorName?: string, silentTTS: boolean = false): void {
    if (this.currentState !== 'guessing') return;
    this.remainingTimeMs += seconds * 1000;
    this.totalTimeMs = Math.max(this.totalTimeMs, this.remainingTimeMs);

    this.audioEngine.playGiftRose();
    this.events.onTimeAdded?.(seconds, sponsorName);

    const secLeft = Math.ceil(this.remainingTimeMs / 1000);
    this.events.onTick?.(secLeft, Math.ceil(this.totalTimeMs / 1000));

    if (this.config.ttsEnabled && !silentTTS) {
      this.ttsController.announceTimeAdded(seconds, sponsorName);
    }
  }

  public triggerFirstCharHint(sponsorName?: string, addedSeconds?: number): boolean {
    if (this.currentState !== 'guessing' || !this.currentPuzzle) return false;
    this.triggerHint2(sponsorName, 'rose', addedSeconds);
    return true;
  }

  public unlockNextHint(sponsorName?: string, reason: 'rose' | 'follow' = 'follow'): boolean {
    if (this.currentState !== 'guessing' || !this.currentPuzzle) return false;
    if (!this.hint1Given) {
      this.triggerHint1(sponsorName, reason);
      return true;
    } else if (!this.hint2Given) {
      this.triggerHint2(sponsorName, reason);
      return true;
    }
    return false;
  }

  public triggerHint1(sponsorName?: string, reason: 'rose' | 'follow' = 'follow'): void {
    if (this.hint1Given || !this.currentPuzzle) return;
    this.hint1Given = true;
    this.audioEngine.playHintChime();
    this.events.onHint1Triggered?.(this.currentPuzzle.hint1, sponsorName);

    if (this.config.ttsEnabled) {
      this.ttsController.announceHint(this.currentPuzzle.hint1, sponsorName, reason);
    }
  }

  public triggerHint2(sponsorName?: string, reason: 'rose' | 'follow' = 'follow', addedSeconds?: number): void {
    if (!this.currentPuzzle) return;
    this.hint2Given = true;
    this.audioEngine.playHintChime();
    const firstChar = this.currentPuzzle.answer.trim().charAt(0).toUpperCase();
    this.events.onHint2Triggered?.(this.currentPuzzle.hint2, firstChar, sponsorName);

    if (this.config.ttsEnabled) {
      this.ttsController.announceFirstChar(firstChar, sponsorName, reason, addedSeconds);
    }
  }

  public lockPuzzle(): void {
    this.clearTimers();
    this.setState('locked');
    this.audioEngine.playLock();
    this.audioEngine.playRoundEnd();

    this.stateTimerHandle = setTimeout(() => {
      this.revealPuzzle();
    }, 1000);
  }

  private revealPuzzle(): void {
    if (!this.currentPuzzle) return;
    this.setState('reveal');
    this.events.onPuzzleRevealed?.(this.currentPuzzle, this.isSolvedInCurrentRound, this.roundWinner || undefined);

    if (!this.isSolvedInCurrentRound && this.config.ttsEnabled) {
      this.ttsController.announceTimeout(this.currentPuzzle.answer, this.currentPuzzle.explanation);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.celebrateAndContinue();
    }, this.config.revealDurationMs);
  }

  public triggerSeatRebalance(): void {
    this.events.onSeatRebalance?.();
  }

  public triggerTestSleepKick(userId: string, nickname: string): void {
    this.events.onTestSleepKick?.(userId, nickname);
  }

  public triggerTestRandomLowerKick(): void {
    this.events.onTestRandomLowerKick?.();
  }

  private celebrateAndContinue(): void {
    this.setState('celebrate');
    let finished = false;
    const proceed = () => {
      if (finished) return;
      finished = true;
      if (this.roundNumber > 0 && this.roundNumber % 30 === 0) {
        this.triggerCeremony();
      } else {
        this.nextRound();
      }
    };

    const result = this.events.onSeatRebalance?.(proceed);
    if (result === 'async') {
      // Safety fallback in case TTS/animation callback never fires
      this.stateTimerHandle = setTimeout(proceed, Math.max(this.config.celebrateDurationMs, 8000));
      return;
    }

    const extraRebalanceMs = Math.max(0, result || 0);
    this.stateTimerHandle = setTimeout(proceed, this.config.celebrateDurationMs + extraRebalanceMs);
  }

  public triggerCeremony(): void {
    this.clearTimers();
    this.setState('finished');
    this.events.onCeremonyStarted?.();
    this.audioEngine.playCeremonyCelebration();

    if (this.config.ttsEnabled) {
      const top3 = this.studentRoster.getTopPlayers(3).filter(player => player.score > 0);
      this.ceremonyAnnouncementTimer = setTimeout(() => {
        this.ceremonyAnnouncementTimer = null;
        this.ttsController.announceCeremony(top3[0]?.nickname, top3[1]?.nickname, top3[2]?.nickname);
      }, CEREMONY_REVEAL_TIMES[0]);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.audioEngine.playCue('lobby');
      this.nextRound();
    }, CEREMONY_DURATION_MS);
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
    if (this.ceremonyAnnouncementTimer) {
      clearTimeout(this.ceremonyAnnouncementTimer);
      this.ceremonyAnnouncementTimer = null;
    }
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
