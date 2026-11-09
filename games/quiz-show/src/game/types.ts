export type QuizShowMode =
  | 'quick'
  | 'true_false'
  | 'picture'
  | 'lightning'
  | 'team'
  | 'boss'
  | 'daily'
  | 'ceremony';

export type QuizState =
  | 'idle'
  | 'intro'
  | 'asking'
  | 'locked'
  | 'reveal'
  | 'celebrate'
  | 'finished';

export type StageTheme = 'studio_purple' | 'festival_gold' | 'neon_blue';

export type ChoiceLetter = 'A' | 'B' | 'C' | 'D';

export interface QuestionData {
  id: string;
  category: string;
  level: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: ChoiceLetter;
  explanation: string;
  durationSec: number;
  tags?: string[];
  verified?: boolean;
}

export interface PlayerRecord {
  userId: string;
  uniqueId: string;
  nickname: string;
  avatarUrl?: string;
  team?: 'red' | 'blue';
  score: number;
  streak: number;
  maxStreak: number;
  answersCount: number;
  correctCount: number;
  lastActiveTime: number;
  skinIndex: number;
  seatIndex: number;
}

export interface AnswerSubmission {
  userId: string;
  choice: ChoiceLetter;
  timestamp: number;
  isCorrect?: boolean;
  pointsEarned?: number;
  speedBonus?: number;
  streakBonus?: number;
}

export interface QuizShowConfig {
  introDurationMs: number;
  askingDurationMs: number;
  revealDurationMs: number;
  celebrateDurationMs: number;
  basePoints: number;
  maxSpeedBonus: number;
  maxStreakBonus: number;
  soundVolume: number;
  ttsEnabled: boolean;
  theme: StageTheme;
  mode: QuizShowMode;
}
