export type Answer = 'A' | 'B' | 'C' | 'D';

export type QuizMode =
  | 'quick'
  | 'picture'
  | 'listening'
  | 'spelling'
  | 'team'
  | 'survival'
  | 'boss'
  | 'challenge';

export type QuizPhase =
  | 'idle'
  | 'intro'
  | 'question'
  | 'reveal'
  | 'break'
  | 'results'
  | 'celebration';

export type Team = 'red' | 'blue';

export type ClassroomTheme = 'day' | 'evening' | 'party';

export type TeacherState =
  | 'idle'
  | 'point'
  | 'talk'
  | 'happy'
  | 'think'
  | 'surprise'
  | 'sad'
  | 'cheer'
  | 'clap'
  | 'explain';

export type StudentSkin =
  | 'blue'
  | 'pink'
  | 'green'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'navy'
  | 'coral';

export type StudentAction = 'idle' | 'walk' | 'cheer' | 'wrong' | 'dance';

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  mode: QuizMode;
  prompt: string;
  promptVi?: string;
  choices: Record<Answer, string>;
  correct: Answer;
  explanation: string;
  durationSec?: number;
  imageKey?: string;
  audioText?: string;
}

export interface ViewerIdentity {
  id: string;
  nickname: string;
  avatarUrl?: string;
  team?: Team;
}

export interface StudentPlayer extends ViewerIdentity {
  score: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  hearts: number; // for survival mode (starts at 3)
  skin: StudentSkin;
  seatIndex: number; // 0..24 or -1 for queue
  joinedAt: number;
  lastSeenAt: number;
  lastAnswer?: Answer;
}

export interface AnswerReceipt {
  accepted: boolean;
  reason?: 'closed' | 'duplicate' | 'invalid' | 'unknown_viewer' | 'eliminated';
  answer?: Answer;
  correct?: boolean;
  points?: number;
  streak?: number;
  speedBonus?: number;
  questionId?: string;
  viewerId?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  nickname: string;
  score: number;
  streak: number;
  totalCorrect: number;
  team?: Team;
  avatarUrl?: string;
}

export interface StreamerConfig {
  mode: QuizMode;
  theme: ClassroomTheme;
  questionDurationSec: number;
  ttsEnabled: boolean;
  ttsVietnamese: boolean;
  ttsEnglish: boolean;
  ttsVolume: number;
  ttsRate: number;
  sfxVolume: number;
  bgmVolume: number;
  hideAvatars: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  autoPlayNPC: boolean;
  challengeTopic?: string;
}
