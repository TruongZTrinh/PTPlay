import { ChoiceLetter, QuestionData, QuizShowConfig, QuizShowMode, QuizState } from '../types';
import { QuestionBank } from './QuestionBank';
import { StudentRoster } from './StudentRoster';
import { AudioEngine } from '../audio/AudioEngine';
import { TTSController } from './TTSController';

export interface QuizShowEngineEvents {
  onStateChanged?: (state: QuizState) => void;
  onQuestionStarted?: (question: QuestionData, round: number, totalRounds: number) => void;
  onTick?: (remainingSec: number, totalSec: number) => void;
  onAnswerAccepted?: (userId: string, choice: ChoiceLetter) => void;
  onQuestionLocked?: (question: QuestionData) => void;
  onQuestionRevealed?: (question: QuestionData, correctChoice: ChoiceLetter, winnersCount: number) => void;
  onCeremonyStarted?: () => void;
}

export class QuizShowEngine {
  private config: QuizShowConfig;
  private questionBank: QuestionBank;
  private studentRoster: StudentRoster;
  private audioEngine: AudioEngine;
  private ttsController: TTSController;
  private events: QuizShowEngineEvents = {};

  public currentState: QuizState = 'idle';
  public currentQuestion: QuestionData | null = null;
  public roundNumber: number = 0;
  public readonly totalRounds: number = 10;
  public remainingTimeMs: number = 0;
  public totalTimeMs: number = 12000;

  // Answers locked per round
  private roundAnswers = new Map<string, { choice: ChoiceLetter; timestamp: number }>();
  private timerHandle: any = null;
  private stateTimerHandle: any = null;

  constructor(
    questionBank: QuestionBank,
    studentRoster: StudentRoster,
    audioEngine: AudioEngine,
    ttsController: TTSController,
    config?: Partial<QuizShowConfig>
  ) {
    this.questionBank = questionBank;
    this.studentRoster = studentRoster;
    this.audioEngine = audioEngine;
    this.ttsController = ttsController;

    this.config = {
      introDurationMs: 2500,
      askingDurationMs: 12000,
      revealDurationMs: 3500,
      celebrateDurationMs: 2500,
      basePoints: 10,
      maxSpeedBonus: 5,
      maxStreakBonus: 10,
      soundVolume: 0.8,
      ttsEnabled: true,
      theme: 'studio_purple',
      mode: 'quick',
      ...config,
    };
  }

  public setEvents(events: QuizShowEngineEvents): void {
    this.events = events;
  }

  public setMode(mode: QuizShowMode): void {
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

    if (this.roundNumber > this.totalRounds) {
      this.triggerCeremony();
      return;
    }

    this.currentQuestion = this.questionBank.getNextQuestion(this.config.mode);
    if (!this.currentQuestion) {
      this.triggerCeremony();
      return;
    }

    this.roundAnswers.clear();
    this.totalTimeMs = (this.currentQuestion.durationSec || 12) * 1000;
    this.remainingTimeMs = this.totalTimeMs;

    // 1. INTRO State
    this.setState('intro');
    this.events.onQuestionStarted?.(this.currentQuestion, this.roundNumber, this.totalRounds);

    // Host greets and asks question
    if (this.config.ttsEnabled) {
      this.ttsController.announceQuestion(this.roundNumber, this.currentQuestion.question);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.startAsking();
    }, this.config.introDurationMs);
  }

  private startAsking(): void {
    this.setState('asking');
    this.audioEngine.playCue('question');
    const intervalMs = 200;

    this.timerHandle = setInterval(() => {
      this.remainingTimeMs -= intervalMs;
      const secLeft = Math.ceil(this.remainingTimeMs / 1000);
      this.events.onTick?.(Math.max(0, secLeft), Math.ceil(this.totalTimeMs / 1000));

      // Time warning at 5 seconds
      if (this.remainingTimeMs <= 5000 && this.remainingTimeMs > 4800 && this.config.ttsEnabled) {
        this.ttsController.announceTimeWarning();
      }

      // Play clock tick audio
      if (this.remainingTimeMs > 0 && this.remainingTimeMs <= 4000 && this.remainingTimeMs % 1000 < intervalMs) {
        this.audioEngine.playUrgentTick();
      } else if (this.remainingTimeMs % 1000 < intervalMs && this.remainingTimeMs > 0) {
        this.audioEngine.playTick();
      }

      if (this.remainingTimeMs <= 0) {
        this.lockQuestion();
      }
    }, intervalMs);
  }

  public submitAnswer(userId: string, choice: ChoiceLetter): boolean {
    if (this.currentState !== 'asking') return false;
    // Free-to-play fair rule: 1 answer per viewer per question
    if (this.roundAnswers.has(userId)) return false;

    this.roundAnswers.set(userId, {
      choice,
      timestamp: Date.now(),
    });

    this.events.onAnswerAccepted?.(userId, choice);
    return true;
  }

  public lockQuestion(): void {
    this.clearTimers();
    this.setState('locked');
    this.audioEngine.playLock();
    if (this.currentQuestion) {
      this.events.onQuestionLocked?.(this.currentQuestion);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.revealAnswer();
    }, 1000);
  }

  private revealAnswer(): void {
    if (!this.currentQuestion) return;
    this.setState('reveal');

    const correctChoice = this.currentQuestion.correct;
    let winnersCount = 0;

    // Process all submissions
    for (const [userId, sub] of this.roundAnswers.entries()) {
      const isCorrect = sub.choice === correctChoice;
      let points = 0;
      if (isCorrect) {
        winnersCount++;
        // Calculate speed bonus based on when answer was locked in
        const timeRatio = Math.max(0, this.remainingTimeMs / this.totalTimeMs);
        const speedBonus = Math.round(timeRatio * this.config.maxSpeedBonus);
        const player = this.studentRoster.getPlayer(userId);
        const streakBonus = Math.min(this.config.maxStreakBonus, (player?.streak || 0) + 1);
        points = this.config.basePoints + speedBonus + streakBonus;
      }
      this.studentRoster.addScore(userId, points, isCorrect);
    }

    if (winnersCount > 0) {
      this.audioEngine.playCorrect();
    } else {
      this.audioEngine.playWrong();
    }

    this.events.onQuestionRevealed?.(this.currentQuestion, correctChoice, winnersCount);

    if (this.config.ttsEnabled) {
      const correctText = this.currentQuestion.options[correctChoice];
      this.ttsController.announceReveal(correctChoice, correctText, this.currentQuestion.explanation);
    }

    this.stateTimerHandle = setTimeout(() => {
      this.celebrateAndContinue();
    }, this.config.revealDurationMs);
  }

  private celebrateAndContinue(): void {
    this.setState('celebrate');
    this.audioEngine.playCue('celebration');

    this.stateTimerHandle = setTimeout(() => {
      this.nextRound();
    }, this.config.celebrateDurationMs);
  }

  public triggerCeremony(): void {
    this.clearTimers();
    this.setState('finished');
    this.events.onCeremonyStarted?.();
    this.audioEngine.playStreakFanfare();

    if (this.config.ttsEnabled) {
      const top3 = this.studentRoster.getTopPlayers(3);
      const champion = top3[0] ? top3[0].nickname : 'Cả lớp';
      this.ttsController.announceChampion(champion);
    }

    // After 15 seconds of ceremony, start next show round automatically
    this.stateTimerHandle = setTimeout(() => {
      this.startShow();
    }, 15000);
  }

  public skipQuestion(): void {
    this.clearTimers();
    this.nextRound();
  }

  private setState(state: QuizState): void {
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

