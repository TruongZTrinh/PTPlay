import { QuestionData, QuizShowMode } from '../types';
import rawQuestions from '../../data/questions.json';

export class QuestionBank {
  private allQuestions: QuestionData[] = [];
  private historyIds: string[] = [];
  private maxHistory: number = 50;

  constructor() {
    this.allQuestions = (rawQuestions as QuestionData[]).filter((q) => q.verified);
    if (this.allQuestions.length === 0) {
      this.allQuestions = rawQuestions as QuestionData[];
    }
  }

  public getTotalCount(): number {
    return this.allQuestions.length;
  }

  public getNextQuestion(mode: QuizShowMode, categoryFilter?: string): QuestionData | null {
    let pool = this.allQuestions;

    if (categoryFilter && categoryFilter !== 'all') {
      pool = pool.filter((q) => q.category === categoryFilter);
    }

    // Filter out recently asked questions
    let candidatePool = pool.filter((q) => !this.historyIds.includes(q.id));
    if (candidatePool.length === 0) {
      // If pool exhausted, reset history
      this.historyIds = [];
      candidatePool = pool;
    }

    if (candidatePool.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    const selected = { ...candidatePool[randomIndex] };

    // Record history
    this.historyIds.push(selected.id);
    if (this.historyIds.length > this.maxHistory) {
      this.historyIds.shift();
    }

    // Adjust parameters based on mode
    if (mode === 'lightning') {
      selected.durationSec = 8;
    } else if (mode === 'quick') {
      selected.durationSec = 10;
    } else if (mode === 'boss') {
      selected.durationSec = 15;
    } else if (mode === 'true_false') {
      // True/False mode format
      selected.options = {
        A: 'Đúng',
        B: 'Sai',
        C: 'Chưa rõ',
        D: 'Cả hai',
      };
      if (selected.correct !== 'A' && selected.correct !== 'B') {
        selected.correct = 'A';
      }
      selected.durationSec = 10;
    }

    return selected;
  }

  public resetHistory(): void {
    this.historyIds = [];
  }
}
