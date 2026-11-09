export type RebusMode =
  | 'word'
  | 'idiom'
  | 'emoji'
  | 'silhouette'
  | 'zoom'
  | 'speed8'
  | 'team_race'
  | 'boss'
  | 'chain';

export type RebusState =
  | 'idle'
  | 'intro'
  | 'guessing'
  | 'locked'
  | 'reveal'
  | 'celebrate'
  | 'finished';

export type StageTheme = 'outdoor_sun' | 'studio_neon' | 'resort_night';

export interface RebusPuzzle {
  id: string;
  category: string;
  answer: string;
  aliases: string[];
  clues: string[];
  hint1: string;
  hint2: string;
  explanation: string;
  durationSec: number;
  difficulty: number;
  mode: string;
  verified?: boolean;
}

export interface RebusPlayerRecord {
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
  lastGuessTime: number;
  guessesInCurrentRound: number;
}

export interface GuessSubmission {
  userId: string;
  rawGuess: string;
  normalizedGuess: string;
  timestamp: number;
  isCorrect?: boolean;
  pointsEarned?: number;
  speedBonus?: number;
  streakBonus?: number;
}

export interface RebusConfig {
  introDurationMs: number;
  guessingDurationMs: number;
  revealDurationMs: number;
  celebrateDurationMs: number;
  basePoints: number;
  maxSpeedBonus: number;
  maxStreakBonus: number;
  maxGuessesPerRound: number;
  cooldownMs: number;
  soundVolume: number;
  ttsEnabled: boolean;
  theme: StageTheme;
  mode: RebusMode;
}

