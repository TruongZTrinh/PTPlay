import { GameMusicProfile, MusicTrack } from './types';

export const PTPLAY_MUSIC_CATALOG: MusicTrack[] = [
  // --- 1. Café Mòe (cat-cafe) ---
  {
    id: 'cat-cafe-main_bgm',
    gameId: 'cat-cafe',
    title: 'Cat caffe',
    author: 'TAD',
    sourcePage: 'https://opengameart.org/content/lofi-compilation',
    file: 'cat_caffe.mp3',
    url: '/shared-music/cat-cafe/cat_caffe.mp3',
    licenseClaim: 'CC0',
    role: 'main_bgm',
    suggestedUse: 'Soft cozy café lofi hip-hop',
    status: 'verified',
    bpm: 80,
    tags: ['lofi', 'chill', 'cafe', 'guitar'],
  },
  {
    id: 'cat-cafe-alternate_bgm',
    gameId: 'cat-cafe',
    title: 'A cup of tea',
    author: 'TAD',
    sourcePage: 'https://opengameart.org/content/lofi-compilation',
    file: 'cup_of_tea.mp3',
    url: '/shared-music/cat-cafe/cup_of_tea.mp3',
    licenseClaim: 'CC0',
    role: 'alternate_bgm',
    suggestedUse: 'Calm late-night café lofi',
    status: 'verified',
    bpm: 75,
    tags: ['lofi', 'chill', 'piano'],
  },
  {
    id: 'cat-cafe-nap_bgm',
    gameId: 'cat-cafe',
    title: 'Chill lofi inspired [loop edit]',
    author: 'qubodup / omfgdude',
    sourcePage: 'https://opengameart.org/content/chill-lofi-inspired-loop-edit',
    file: 'chill_lofi_loop.ogg',
    url: '/shared-music/cat-cafe/chill_lofi_loop.ogg',
    licenseClaim: 'CC0',
    role: 'nap_bgm',
    suggestedUse: 'Soft seamless loop for sleeping cats & relaxation',
    status: 'verified',
    tags: ['loop', 'ambient', 'sleep'],
  },

  // --- 2. Mini War Arena (mini-war-arena) ---
  {
    id: 'mini-war-arena-battle_bgm',
    gameId: 'mini-war-arena',
    title: 'Heartfelt Battle',
    author: 'request',
    sourcePage: 'https://opengameart.org/content/heartfelt-battle-loopable-fantasy-stringspianohorn',
    file: 'heartfelt_battle.ogg',
    url: '/shared-music/mini-war-arena/heartfelt_battle.ogg',
    licenseClaim: 'CC0',
    role: 'battle_bgm',
    suggestedUse: 'Fantasy battle encounter with strings & piano',
    status: 'verified',
    tags: ['fantasy', 'orchestral', 'battle', 'loopable'],
  },
  {
    id: 'mini-war-arena-boss_bgm',
    gameId: 'mini-war-arena',
    title: 'Epic Boss Battle',
    author: 'SubspaceAudio / Juhani Junkala',
    sourcePage: 'https://opengameart.org/content/boss-battle-music',
    file: 'epic_boss_battle.wav',
    url: '/shared-music/mini-war-arena/epic_boss_battle.wav',
    licenseClaim: 'CC0',
    role: 'boss_bgm',
    suggestedUse: 'Dramatic orchestral boss battle for Infernal Warlord & Crystal Titan',
    status: 'verified',
    tags: ['epic', 'boss', 'drums', 'seamless'],
  },
  {
    id: 'mini-war-arena-final_boss_bgm',
    gameId: 'mini-war-arena',
    title: 'Boss Battle Theme',
    author: 'Cleyton Kauffman',
    sourcePage: 'https://opengameart.org/content/boss-battle-theme',
    file: 'boss_battle_theme.ogg',
    url: '/shared-music/mini-war-arena/boss_battle_theme.ogg',
    licenseClaim: 'CC0',
    role: 'final_boss_bgm',
    suggestedUse: 'Climax RPG battle variation',
    status: 'verified',
    tags: ['action', 'jrpg', 'intense'],
  },

  // --- 3. English Class LIVE (english-class-live) ---
  {
    id: 'english-class-lobby_bgm',
    gameId: 'english-class',
    title: 'Cozy Puzzle Stage Select',
    author: 'MintoDog',
    sourcePage: 'https://opengameart.org/content/cozy-puzzle-stage-select',
    file: 'stage_select.ogg',
    url: '/shared-music/english-class/stage_select.ogg',
    licenseClaim: 'CC0',
    role: 'lobby_bgm',
    suggestedUse: 'Warm welcoming classroom lobby',
    status: 'verified',
    bpm: 100,
    tags: ['cozy', 'lobby', 'cheerful'],
  },
  {
    id: 'english-class-question_bgm',
    gameId: 'english-class',
    title: 'Cozy Puzzle In-Game 1',
    author: 'MintoDog',
    sourcePage: 'https://opengameart.org/content/cozy-puzzle-in-game-1',
    file: 'in_game_1.ogg',
    url: '/shared-music/english-class/in_game_1.ogg',
    licenseClaim: 'CC0',
    role: 'question_bgm',
    suggestedUse: 'Gentle flute & bossa nova while teacher asks question',
    status: 'verified',
    bpm: 118,
    tags: ['bossa', 'classroom', 'gentle'],
  },
  {
    id: 'english-class-results_bgm',
    gameId: 'english-class',
    title: 'Party and Gameover Loop',
    author: 'gilzoide',
    sourcePage: 'https://opengameart.org/content/party-and-gameover-loop',
    file: 'happy_party_loop.ogg',
    url: '/shared-music/english-class/happy_party_loop.ogg',
    licenseClaim: 'CC0',
    role: 'results_bgm',
    suggestedUse: 'Joyful celebration & summary podium',
    status: 'verified',
    tags: ['party', 'celebration', 'happy'],
  },

  // --- 4. Đố Vui Có Thưởng (quiz-show) ---
  {
    id: 'quiz-show-main_bgm',
    gameId: 'quiz-show',
    title: 'Funky Disco Beats to Boogie/Woogie to',
    author: 'Fupi',
    sourcePage: 'https://opengameart.org/content/funky-disco-beats-to-boogiewoogie-to',
    file: 'funky_disco_beats.ogg',
    url: '/shared-music/quiz-show/funky_disco_beats.ogg',
    licenseClaim: 'CC0',
    role: 'main_bgm',
    suggestedUse: 'Energetic neon gameshow stage & celebration',
    status: 'verified',
    tags: ['disco', 'funk', 'gameshow', 'energy'],
  },
  {
    id: 'quiz-show-question_bgm',
    gameId: 'quiz-show',
    title: 'Funked Up',
    author: 'Joth',
    sourcePage: 'https://opengameart.org/content/funked-up',
    file: 'funked_up.mp3',
    url: '/shared-music/quiz-show/funked_up.mp3',
    licenseClaim: 'CC0',
    role: 'question_bgm',
    suggestedUse: 'Funky groove maintaining question timer tempo',
    status: 'verified',
    tags: ['groove', 'funk', 'questions'],
  },
  {
    id: 'quiz-show-lobby_bgm',
    gameId: 'quiz-show',
    title: 'Catchy Swing',
    author: 'Doge',
    sourcePage: 'https://opengameart.org/content/catchy-swing',
    file: 'catchy_swing.ogg',
    url: '/shared-music/quiz-show/catchy_swing.ogg',
    licenseClaim: 'CC0',
    role: 'lobby_bgm',
    suggestedUse: 'Catchy swing jazz for lobby & round intermission',
    status: 'verified',
    tags: ['swing', 'jazz', 'lobby'],
  },

  // --- 5. Đuổi Hình Bắt Chữ (duoi-hinh-bat-chu) ---
  {
    id: 'duoi-hinh-bat-chu-main_bgm',
    gameId: 'duoi-hinh-bat-chu',
    title: 'Magic Puzzle In-Game 1',
    author: 'MintoDog',
    sourcePage: 'https://opengameart.org/content/magic-puzzle-in-game-1',
    file: 'magic_puzzle_1.ogg',
    url: '/shared-music/duoi-hinh-bat-chu/magic_puzzle_1.ogg',
    licenseClaim: 'CC0',
    role: 'main_bgm',
    suggestedUse: 'Playful mystery & curiosity when puzzle image hints appear',
    status: 'verified',
    bpm: 110,
    tags: ['puzzle', 'mystery', 'curious'],
  },
  {
    id: 'duoi-hinh-bat-chu-thinking_bgm',
    gameId: 'duoi-hinh-bat-chu',
    title: 'Cozy Puzzle In-Game 3',
    author: 'MintoDog',
    sourcePage: 'https://opengameart.org/content/cozy-puzzle-in-game-3',
    file: 'cozy_puzzle_3.ogg',
    url: '/shared-music/duoi-hinh-bat-chu/cozy_puzzle_3.ogg',
    licenseClaim: 'CC0',
    role: 'thinking_bgm',
    suggestedUse: 'Comfortable focus while audience guesses answers',
    status: 'verified',
    bpm: 108,
    tags: ['thinking', 'focus', 'cozy'],
  },
  {
    id: 'duoi-hinh-bat-chu-round_transition',
    gameId: 'duoi-hinh-bat-chu',
    title: 'Music Loops',
    author: 'pauliuw',
    sourcePage: 'https://opengameart.org/content/music-loops',
    file: 'music_loops_four.mp3',
    url: '/shared-music/duoi-hinh-bat-chu/music_loops_four.mp3',
    licenseClaim: 'CC0',
    role: 'round_transition',
    suggestedUse: 'Short celebratory round transitions and clue reveals',
    status: 'verified',
    tags: ['transition', 'celebration', 'short'],
  },
];

export const GAME_MUSIC_PROFILES: Record<string, GameMusicProfile> = {
  'cat-cafe': {
    gameId: 'cat-cafe',
    gameName: 'Café Mòe',
    defaultVolume: 0.28,
    duckFactor: 0.38, // -10 dB ducking (leaves music clearly heard under TTS and meows)
    cues: {
      lobby: ['cat-cafe-main_bgm'],
      gameplay: ['cat-cafe-main_bgm', 'cat-cafe-alternate_bgm'],
      nap: ['cat-cafe-nap_bgm'],
      alternate: ['cat-cafe-alternate_bgm'],
    },
    playlist: ['cat-cafe-main_bgm', 'cat-cafe-alternate_bgm', 'cat-cafe-nap_bgm'],
    playlistRotation: true, // auto rotates so streamer/viewers don't get bored over long 8-hour sessions
    crossfadeDurationSec: 2.0,
  },

  'mini-war-arena': {
    gameId: 'mini-war-arena',
    gameName: 'Mini War Arena',
    defaultVolume: 0.32,
    duckFactor: 0.35, // -11 dB ducking (battle music remains in background under shoutcaster)
    cues: {
      lobby: ['mini-war-arena-battle_bgm'],
      gameplay: ['mini-war-arena-battle_bgm'],
      battle: ['mini-war-arena-battle_bgm'],
      boss: ['mini-war-arena-boss_bgm'],
      final_boss: ['mini-war-arena-final_boss_bgm'],
    },
    playlist: ['mini-war-arena-battle_bgm'],
    playlistRotation: false,
    crossfadeDurationSec: 1.5,
  },

  'english-class': {
    gameId: 'english-class',
    gameName: 'English Class LIVE',
    defaultVolume: 0.26,
    duckFactor: 0.38, // -10 dB ducking (pleasant flute/piano audible behind teacher voice)
    cues: {
      lobby: ['english-class-lobby_bgm'],
      gameplay: ['english-class-question_bgm'],
      question: ['english-class-question_bgm'],
      results: ['english-class-results_bgm'],
      celebration: ['english-class-results_bgm'],
    },
    playlist: ['english-class-lobby_bgm', 'english-class-question_bgm'],
    playlistRotation: false,
    crossfadeDurationSec: 1.5,
  },
  'english-class-live': {
    // Alias for workspace name consistency
    gameId: 'english-class-live',
    gameName: 'English Class LIVE',
    defaultVolume: 0.26,
    duckFactor: 0.38,
    cues: {
      lobby: ['english-class-lobby_bgm'],
      gameplay: ['english-class-question_bgm'],
      question: ['english-class-question_bgm'],
      results: ['english-class-results_bgm'],
      celebration: ['english-class-results_bgm'],
    },
    playlist: ['english-class-lobby_bgm', 'english-class-question_bgm'],
    playlistRotation: false,
    crossfadeDurationSec: 1.5,
  },

  'quiz-show': {
    gameId: 'quiz-show',
    gameName: 'Đố Vui Có Thưởng',
    defaultVolume: 0.28,
    duckFactor: 0.35, // -11 dB ducking
    cues: {
      lobby: ['quiz-show-lobby_bgm'],
      gameplay: ['quiz-show-question_bgm'],
      question: ['quiz-show-question_bgm'],
      celebration: ['quiz-show-main_bgm'],
      results: ['quiz-show-main_bgm'],
    },
    playlist: ['quiz-show-lobby_bgm', 'quiz-show-question_bgm'],
    playlistRotation: false,
    crossfadeDurationSec: 1.2,
  },

  'duoi-hinh-bat-chu': {
    gameId: 'duoi-hinh-bat-chu',
    gameName: 'Đuổi Hình Bắt Chữ',
    defaultVolume: 0.28,
    duckFactor: 0.36, // -11 dB ducking
    cues: {
      lobby: ['duoi-hinh-bat-chu-main_bgm'],
      gameplay: ['duoi-hinh-bat-chu-main_bgm'],
      thinking: ['duoi-hinh-bat-chu-thinking_bgm'],
      transition: ['duoi-hinh-bat-chu-round_transition'],
      celebration: ['duoi-hinh-bat-chu-round_transition'],
    },
    playlist: ['duoi-hinh-bat-chu-main_bgm', 'duoi-hinh-bat-chu-thinking_bgm'],
    playlistRotation: false,
    crossfadeDurationSec: 1.2,
  },
};

export function getTrackById(trackId: string): MusicTrack | undefined {
  return PTPLAY_MUSIC_CATALOG.find((t) => t.id === trackId);
}

export function getTracksByGame(gameId: string): MusicTrack[] {
  const norm = gameId.toLowerCase().replace(/_/g, '-');
  return PTPLAY_MUSIC_CATALOG.filter((t) => {
    const tGame = t.gameId.toLowerCase().replace(/_/g, '-');
    return tGame === norm || norm.includes(tGame) || tGame.includes(norm);
  });
}

export function getProfileByGame(gameId: string): GameMusicProfile | undefined {
  return (
    GAME_MUSIC_PROFILES[gameId] ||
    GAME_MUSIC_PROFILES[gameId.toLowerCase().replace(/_/g, '-')] ||
    Object.values(GAME_MUSIC_PROFILES).find((p) =>
      gameId.toLowerCase().includes(p.gameId) || p.gameId.includes(gameId.toLowerCase())
    )
  );
}
