export type Team = 'red' | 'blue';
export type UnitType = 'warrior' | 'archer' | 'tank' | 'mage' | 'boss';
export type ArenaThemeId = 'castle' | 'forest' | 'crystal' | 'ember';
export type MatchPhase =
  | 'BOOT'
  | 'ATTRACT'
  | 'ROUND_INTRO'
  | 'BATTLE'
  | 'ROUND_RESULT'
  | 'INTERMISSION'
  | 'PAUSED'
  | 'DISCONNECTED'
  | 'RECOVERY';

export type QualityLevel = 'high' | 'medium' | 'low';

export interface UnitStatDef {
  name: string;
  vietnameseName: string;
  maxHp: number;
  damage: number;
  attackCooldown: number; // in seconds
  speed: number;          // pixels per second
  range: number;          // pixels
  defense: number;        // flat damage reduction
  scale: number;
  projectileSpeed?: number;
  aoeRadius?: number;
}

export interface ArenaThemeDef {
  id: ArenaThemeId;
  name: string;
  vietnameseName: string;
  bgColor: number;
  groundColor: number;
  pathColor: number;
  laneLineColor: number;
  accentColor: number;
  particleType: 'sparkles' | 'leaves' | 'snow' | 'embers';
  particleColor: number;
  description: string;
}

export interface MatchRecord {
  id: string;
  roundNumber: number;
  themeId: ArenaThemeId;
  winner: Team | 'draw';
  durationSeconds: number;
  redScore: number;
  blueScore: number;
  redKills: number;
  blueKills: number;
  redCoreHp: number;
  blueCoreHp: number;
  topSupporters: Array<{ nickname: string; team: Team; action: string }>;
  timestamp: number;
}

export const GAME_CONFIG = {
  // Display & Canvas
  WIDTH: 720,
  HEIGHT: 1280,
  TARGET_FPS: 60,

  // Lanes (9:16 portrait vertical space allocated between 460 and 780 for readable battle)
  LANES: [460, 620, 780] as const,
  SPAWN_X_RED: 130,
  SPAWN_X_BLUE: 590,
  BASE_X_RED: 105,
  BASE_X_BLUE: 615,

  // Teams & Brand Colors
  COLORS: {
    RED_PRIMARY: 0xff3355,
    RED_DARK: 0xa8142f,
    RED_ACCENT: 0xffa0b0,
    BLUE_PRIMARY: 0x0066ff,
    BLUE_DARK: 0x0a3c94,
    BLUE_ACCENT: 0x82b8ff,
    GOLD: 0xffd700,
    GOLD_DARK: 0xb58a00,
    NAVY: 0x08142d,
    DARK_BG: 0x040c1a,
    WHITE: 0xffffff,
  },

  // Core & Towers
  MAX_CORE_HP: 1500,
  CORE_BREACH_DAMAGE: 90,
  ROUND_SECONDS: 90,
  LOBBY_SECONDS: 15,
  INTRO_SECONDS: 4,
  RESULT_SECONDS: 7,
  INTERMISSION_SECONDS: 10,
  MAX_UNITS_PER_TEAM: 35,

  // Spawning
  AUTO_SPAWN_INTERVAL: 1.4, // seconds
  SPAWN_DUAL_CHANCE: 0.22,

  // Unit Stats
  UNITS: {
    warrior: {
      name: 'Chiến Binh',
      vietnameseName: 'Chiến Binh',
      maxHp: 125,
      damage: 19,
      attackCooldown: 0.85,
      speed: 56,
      range: 46,
      defense: 3,
      scale: 0.78,
    },
    archer: {
      name: 'Cung Thủ',
      vietnameseName: 'Cung Thủ',
      maxHp: 80,
      damage: 23,
      attackCooldown: 1.25,
      speed: 50,
      range: 220,
      defense: 0,
      scale: 0.74,
      projectileSpeed: 380,
    },
    tank: {
      name: 'Hộ Vệ Giáp Thép',
      vietnameseName: 'Hộ Vệ Giáp Thép',
      maxHp: 330,
      damage: 15,
      attackCooldown: 1.35,
      speed: 36,
      range: 46,
      defense: 7,
      scale: 0.88,
    },
    mage: {
      name: 'Pháp Sư',
      vietnameseName: 'Pháp Sư',
      maxHp: 85,
      damage: 34,
      attackCooldown: 1.45,
      speed: 46,
      range: 190,
      defense: 1,
      scale: 0.75,
      projectileSpeed: 290,
      aoeRadius: 48,
    },
    boss: {
      name: 'Đại Tướng Boss',
      vietnameseName: 'Đại Tướng Boss',
      maxHp: 1250,
      damage: 50,
      attackCooldown: 1.7,
      speed: 28,
      range: 65,
      defense: 12,
      scale: 1.25,
      aoeRadius: 160,
    },
  } as Record<UnitType, UnitStatDef>,

  // Boss Unique Attributes
  BOSSES: {
    red: {
      name: 'Infernal Warlord',
      vietnameseName: 'Đại Tướng Lửa Đỏ',
      skillName: 'Hỏa Diệm Trảm (Ground Slam)',
      skillCooldown: 7.5,
      skillAoe: 165,
      skillMultiplier: 1.6,
      auraColor: 0xff4411,
    },
    blue: {
      name: 'Crystal Titan',
      vietnameseName: 'Khổng Lồ Pha Lê',
      skillName: 'Băng Tinh Kích (Crystal Shatter)',
      skillCooldown: 7.5,
      skillAoe: 165,
      skillMultiplier: 1.6,
      auraColor: 0x00d4ff,
    },
  },

  // Four Atmospheric Arena Presets
  ARENAS: {
    castle: {
      id: 'castle',
      name: 'Castle Courtyard',
      vietnameseName: 'Sân Thành Hoàng Gia',
      bgColor: 0x07152d,
      groundColor: 0x142845,
      pathColor: 0x485c75,
      laneLineColor: 0x243e62,
      accentColor: 0xffd700,
      particleType: 'sparkles',
      particleColor: 0xffe680,
      description: 'Lâu đài hoàng gia với tường đá hoa cương và cờ hiệu rực rỡ.',
    },
    forest: {
      id: 'forest',
      name: 'Enchanted Forest',
      vietnameseName: 'Rừng Phép Thuật',
      bgColor: 0x061c16,
      groundColor: 0x0e3223,
      pathColor: 0x3d5440,
      laneLineColor: 0x1c4731,
      accentColor: 0x10b981,
      particleType: 'leaves',
      particleColor: 0x4ade80,
      description: 'Cổ thạch bám rêu phủ bóng dưới tán cây ngàn năm và đom đóm thần bí.',
    },
    crystal: {
      id: 'crystal',
      name: 'Crystal Pass',
      vietnameseName: 'Hẻm Núi Pha Lê',
      bgColor: 0x09142b,
      groundColor: 0x122543,
      pathColor: 0x406085,
      laneLineColor: 0x223f66,
      accentColor: 0x38bdf8,
      particleType: 'snow',
      particleColor: 0xbae6fd,
      description: 'Mỏm đá đóng băng lấp lánh tinh thể sapphire cùng gió tuyết huyền ảo.',
    },
    ember: {
      id: 'ember',
      name: 'Ember Keep',
      vietnameseName: 'Pháo Đài Nham Thạch',
      bgColor: 0x1c090c,
      groundColor: 0x321316,
      pathColor: 0x5a2d28,
      laneLineColor: 0x431b1c,
      accentColor: 0xf97316,
      particleType: 'embers',
      particleColor: 0xfb923c,
      description: 'Vực sâu núi lửa với nham thạch nóng đỏ và pháo đài đá hắc diện.',
    },
  } as Record<ArenaThemeId, ArenaThemeDef>,

  THEME_ROTATION: ['castle', 'forest', 'crystal', 'ember'] as ArenaThemeId[],

  // Audio settings
  AUDIO: {
    DEFAULT_MASTER: 0.8,
    DEFAULT_MUSIC: 0.45,
    DEFAULT_SFX: 0.7,
  },

  // Anti-Snowball Catchup mechanic
  CATCHUP: {
    LOW_HP_THRESHOLD: 0.45, // Base HP < 45%
    SPAWN_RATE_BOOST: 1.35, // 35% faster reinforcement spawn
    DEFENSE_BOOST: 2,       // +2 flat defense for defending units
  },

  // Viewer Interaction & Moderation
  VIEWER: {
    MAX_NICKNAME_LENGTH: 14,
    DEFAULT_NICKNAME: 'Khán Giả',
    MAX_TEAM_SWAP_PER_ROUND: 1,
  },
};
