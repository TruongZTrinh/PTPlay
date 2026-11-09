import {
  Answer,
  AnswerReceipt,
  QuizMode,
  QuizPhase,
  QuizQuestion,
  StudentPlayer,
  Team,
  ViewerIdentity,
} from '../types.js';
import { StudentRoster } from './StudentRoster.js';
import { QuestionBank } from './QuestionBank.js';
import { TextSanitizer } from '../utils/TextSanitizer.js';

export interface QuizEngineCallbacks {
  onPhaseChange?: (phase: QuizPhase, question?: QuizQuestion | null) => void;
  onAnswerAccepted?: (receipt: AnswerReceipt, player: StudentPlayer) => void;
  onStudentJoin?: (player: StudentPlayer, isNew: boolean) => void;
  onRoundComplete?: (topPlayers: StudentPlayer[], classPoints: number) => void;
  onBossDefeated?: (totalCorrect: number) => void;
}

export class QuizEngine {
  public phase: QuizPhase = 'idle';
  public currentMode: QuizMode = 'quick';
  public currentQuestion: QuizQuestion | null = null;
  public questionIndex = 0;
  public totalQuestionsInRound: number | null = null;
  public classPoints = 0;
  public defaultQuestionDurationSec = 22;

  public questionStartedAt = 0;
  public questionEndsAt = 0;
  public revealEndsAt = 0;

  public teamScores: Record<Team, number> = { red: 0, blue: 0 };
  public readonly answeredThisQuestion = new Map<string, AnswerReceipt>();
  public fastestWinner: { player: StudentPlayer; responseTimeMs: number } | null = null;

  public roster = new StudentRoster();
  public questionBank = new QuestionBank();
  private callbacks: QuizEngineCallbacks = {};

  constructor(callbacks: QuizEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: QuizEngineCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public join(viewer: ViewerIdentity, now = Date.now()): StudentPlayer {
    const res = this.roster.join(viewer, now);
    if (this.callbacks.onStudentJoin) {
      this.callbacks.onStudentJoin(res.player, res.isNew);
    }
    return res.player;
  }

  public assignTeam(userId: string, team: Team): boolean {
    const player = this.roster.getPlayer(userId);
    if (!player) return false;
    player.team = team;
    return true;
  }

  public startRound(mode: QuizMode = 'quick', topic?: string): void {
    this.currentMode = mode;
    this.questionIndex = 0;
    this.classPoints = 0;
    this.teamScores = { red: 0, blue: 0 };

    // Reset survival hearts if in survival mode
    if (mode === 'survival') {
      this.roster.getAllPlayers().forEach((p) => (p.hearts = 3));
    }

    this.nextQuestion(topic);
  }

  public nextQuestion(topic?: string, now = Date.now()): void {
    this.questionIndex++;
    if (this.totalQuestionsInRound && this.questionIndex > this.totalQuestionsInRound) {
      this.finishRound();
      return;
    }

    // Boss question appears periodically (every 10 questions) or in boss mode
    const isBoss = this.currentMode === 'boss' || (this.questionIndex > 0 && this.questionIndex % 10 === 0);
    const modeToFetch: QuizMode = isBoss ? 'boss' : this.currentMode;

    const question = this.questionBank.getNextQuestion(modeToFetch, topic);
    this.currentQuestion = question;
    this.answeredThisQuestion.clear();
    this.fastestWinner = null;

    const targetSec = question.durationSec
      ? Math.max(question.durationSec, 20)
      : this.defaultQuestionDurationSec;
    const durationMs = Math.max(18000, Math.min(45000, targetSec * 1000));
    this.questionStartedAt = now;
    this.questionEndsAt = now + durationMs;
    this.phase = 'question';

    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange('question', question);
    }
  }

  public submitAnswer(userId: string, rawAnswer: string, viewerData?: ViewerIdentity, now = Date.now()): AnswerReceipt {
    if (this.phase !== 'question' || !this.currentQuestion || now >= this.questionEndsAt) {
      return { accepted: false, reason: 'closed' };
    }

    const answer = TextSanitizer.parseAnswer(rawAnswer);
    if (!answer) {
      return { accepted: false, reason: 'invalid' };
    }

    // Auto-join if user has not joined yet
    let player = this.roster.getPlayer(userId);
    if (!player && viewerData) {
      player = this.join(viewerData, now);
    } else if (!player) {
      player = this.join({ id: userId, nickname: 'Học Sinh' }, now);
    }

    // In survival mode, check if player has been eliminated
    if (this.currentMode === 'survival' && player.hearts <= 0) {
      return { accepted: false, reason: 'eliminated' };
    }

    // Check duplicate answer for this question
    if (this.answeredThisQuestion.has(userId)) {
      return { accepted: false, reason: 'duplicate' };
    }

    const correct = answer === this.currentQuestion.correct;
    const elapsedMs = Math.max(0, now - this.questionStartedAt);
    const totalDurationMs = this.questionEndsAt - this.questionStartedAt;

    // Speed bonus: up to +5 points for faster response
    const speedRatio = Math.max(0, Math.min(1, 1 - elapsedMs / totalDurationMs));
    const speedBonus = correct ? Math.floor(speedRatio * 5) : 0;

    // Streak bonus: +2 per streak, capped at +10
    const streakBonus = correct ? Math.min(10, player.streak * 2) : 0;
    const points = correct ? 10 + speedBonus + streakBonus : 0;

    player.totalAnswered++;
    player.lastSeenAt = now;
    player.lastAnswer = answer;

    if (correct) {
      player.score += points;
      player.streak++;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
      player.totalCorrect++;
      this.classPoints += points;

      if (this.currentMode === 'team' && player.team) {
        this.teamScores[player.team] += points;
      }

      if (!this.fastestWinner || elapsedMs < this.fastestWinner.responseTimeMs) {
        this.fastestWinner = { player, responseTimeMs: elapsedMs };
      }
    } else {
      player.streak = 0;
      if (this.currentMode === 'survival') {
        player.hearts = Math.max(0, player.hearts - 1);
      }
    }

    const receipt: AnswerReceipt = {
      accepted: true,
      answer,
      correct,
      points,
      streak: player.streak,
      speedBonus,
      questionId: this.currentQuestion.id,
      viewerId: userId,
    };

    this.answeredThisQuestion.set(userId, receipt);

    if (this.callbacks.onAnswerAccepted) {
      this.callbacks.onAnswerAccepted(receipt, player);
    }

    return receipt;
  }

  public revealAnswer(now = Date.now()): void {
    if (this.phase !== 'question') return;
    this.phase = 'reveal';
    this.revealEndsAt = now + 5000;

    // If boss question, check cooperative goal (e.g. >= 3 correct answers or 60% accuracy)
    const correctCount = Array.from(this.answeredThisQuestion.values()).filter((r) => r.correct).length;
    if (this.currentQuestion?.mode === 'boss' && correctCount >= 2) {
      if (this.callbacks.onBossDefeated) {
        this.callbacks.onBossDefeated(correctCount);
      }
    }

    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange('reveal', this.currentQuestion);
    }
  }

  public tick(now = Date.now()): void {
    if (this.phase === 'question' && now >= this.questionEndsAt) {
      this.revealAnswer(now);
    } else if (this.phase === 'reveal' && now >= this.revealEndsAt) {
      this.phase = 'break';
      if (this.callbacks.onPhaseChange) {
        this.callbacks.onPhaseChange('break', this.currentQuestion);
      }

      // Rotate seats for unseated players every question
      this.roster.rotateSeats();

      // Proceed to next question after 2 seconds break
      setTimeout(() => {
        this.nextQuestion();
      }, 2000);
    }
  }

  public finishRound(): void {
    this.phase = 'celebration';
    const top = this.roster.getTopPlayers(10);
    if (this.callbacks.onRoundComplete) {
      this.callbacks.onRoundComplete(top, this.classPoints);
    }
    if (this.callbacks.onPhaseChange) {
      this.callbacks.onPhaseChange('celebration', null);
    }
  }

  public getSecondsRemaining(now = Date.now()): number {
    if (this.phase !== 'question') return 0;
    return Math.max(0, Math.ceil((this.questionEndsAt - now) / 1000));
  }

  public getProgressRatio(now = Date.now()): number {
    if (this.phase !== 'question') return 0;
    const total = this.questionEndsAt - this.questionStartedAt;
    if (total <= 0) return 0;
    const remaining = this.questionEndsAt - now;
    return Math.max(0, Math.min(1, remaining / total));
  }
}
