/**
 * PTPlay Shared Music Integration Types
 * Standardized across all 5 platform games & Admin control suite.
 */

export type MusicCue =
  | 'lobby'
  | 'gameplay'
  | 'battle'
  | 'boss'
  | 'final_boss'
  | 'question'
  | 'results'
  | 'celebration'
  | 'thinking'
  | 'transition'
  | 'nap'
  | 'alternate';

export interface MusicTrack {
  id: string;
  gameId: string;
  title: string;
  author: string;
  sourcePage: string;
  file: string;
  url: string;
  licenseClaim: 'CC0' | string;
  role: string;
  suggestedUse: string;
  status: 'verified' | 'needs-download-and-audio-review';
  bpm?: number;
  tags?: string[];
}

export interface GameMusicProfile {
  gameId: string;
  gameName: string;
  defaultVolume: number;
  duckFactor: number; // 0.35 corresponds to -10dB ~ -12dB reduction, keeping BGM pleasantly audible
  cues: Record<string, string[]>;
  playlist: string[];
  playlistRotation: boolean;
  crossfadeDurationSec: number;
}

export interface MusicManagerOptions {
  gameId: string;
  baseUrl?: string;
  defaultVolume?: number;
  duckFactor?: number;
  autoUnlock?: boolean;
  protectSingleStreamer?: boolean; // Protects OBS vs Chrome double audio echo
  profile?: GameMusicProfile;
}

export interface MusicPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  isDucked: boolean;
  volume: number;
  currentTrack: MusicTrack | null;
  currentCue: string | null;
  currentTrackIndex: number;
  playlist: MusicTrack[];
}

export type MusicStateListener = (state: MusicPlaybackState) => void;
