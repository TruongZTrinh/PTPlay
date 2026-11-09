import { QuizMode, QuizQuestion } from '../types.js';
import questionsData from '../../data/questions.json';

export class QuestionBank {
  private questions: QuizQuestion[] = [];
  private recentHistory: string[] = [];
  private maxHistory = 40;

  constructor() {
    this.questions = (questionsData as unknown as QuizQuestion[]) || [];
    this.validateBank();
  }

  public get totalCount(): number {
    return this.questions.length;
  }

  public getQuestionsByMode(mode: QuizMode): QuizQuestion[] {
    return this.questions.filter((q) => q.mode === mode);
  }

  public getNextQuestion(mode: QuizMode = 'quick', topic?: string, preferredDifficulty?: number): QuizQuestion {
    let pool = this.questions.filter((q) => q.mode === mode);

    if (pool.length === 0) {
      // Fallback to all questions if specific mode empty
      pool = this.questions;
    }

    if (topic) {
      const topicPool = pool.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
      if (topicPool.length > 0) {
        pool = topicPool;
      }
    }

    if (preferredDifficulty) {
      const diffPool = pool.filter((q) => q.difficulty === preferredDifficulty);
      if (diffPool.length > 0) {
        pool = diffPool;
      }
    }

    // Filter out recently asked questions to avoid immediate repeats
    const freshPool = pool.filter((q) => !this.recentHistory.includes(q.id));
    const candidates = freshPool.length > 0 ? freshPool : pool;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];

    this.recentHistory.push(chosen.id);
    if (this.recentHistory.length > this.maxHistory) {
      this.recentHistory.shift();
    }

    return chosen;
  }

  public validateBank(): void {
    const ids = new Set<string>();
    for (const q of this.questions) {
      if (!q.id || ids.has(q.id)) {
        console.warn(`[QuestionBank] Duplicate or missing ID: ${q.id}`);
      }
      ids.add(q.id);
      if (!['A', 'B', 'C', 'D'].includes(q.correct)) {
        console.warn(`[QuestionBank] Question ${q.id} has invalid correct letter: ${q.correct}`);
      }
    }
  }
}
