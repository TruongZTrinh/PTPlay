/**
 * @ptplay/gift-catalog
 * Centralized, Provider-Agnostic TikTok LIVE Gift Catalog & Mapping Engine for PTPlay
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeName, safeHTTPS, resolveGift, extractGiftOnly } from './gift-utils.js';

export { normalizeName, safeHTTPS, resolveGift, extractGiftOnly };

/** PTPlay shared reference contract (TypeScript, no provider dependency). */
export interface GiftReference {
  referenceKey: string;
  giftId: null; // Public reference does not verify Gift ID; keep null by design.
  name: string;
  coins: number;
  regions: string[];
  iconUrl: string | null;
  localIcon: string | null;
  pageUrl?: string | null;
  priceStatus: 'third-party-reference';
  idStatus: 'unverified';
  iconSource?: string;
  updatedAt?: string | null;
}

export interface ObservedGiftIdentity {
  giftId: string;
  name: string;
  diamondCount: number | null;
  pictureUrl: string | null;
  source: 'observed-tikfinity-gift-event';
  verifiedAt?: string;
}

export interface GiftCatalogSnapshot {
  formatVersion: number;
  source: string;
  sourceUpdatedAt?: string | null;
  importedAt?: string;
  total: number;
  region?: string;
  note?: string;
  gifts: GiftReference[];
}

export type GiftLookupResult =
  | { status: 'observed-id'; match: ObservedGiftIdentity | GiftReference; eventName?: string }
  | { status: 'name-only-unverified'; match: GiftReference; eventName?: string }
  | { status: 'ambiguous' | 'unresolved'; match: null; candidates?: GiftReference[]; eventName?: string };

export interface GameLikeGoalConfig {
  enabled: boolean;
  targetCount: number;
  action: string;
  actionLabel?: string;
  params?: Record<string, any>;
  resetMode: 'per_round' | 'per_session' | 'manual';
  ttsAnnouncement?: string;
  description?: string;
}

export interface GameInteractiveTriggerConfig {
  gameType: string;
  gameName: string;
  likeGoal: GameLikeGoalConfig;
}

export interface GameGiftActionDef {
  action: string;
  label: string;
  gameType: string;
  description: string;
  supportedUnits?: string[];
  allowedParams?: Record<string, any>;
  supportedVfx?: string[];
  supportedSfx?: string[];
  defaultTts?: string;
}

export interface GameGiftMappingRule {
  id: string;
  gameType: string; // 'mini-war' | 'cat-cafe' | 'english-class' | 'quiz-show' | 'duoi-hinh-bat-chu'
  giftName: string;
  giftId?: string | number; // optional verified giftId
  action: string;
  unitType?: string;
  multiplier?: number;
  params?: Record<string, any>;
  vfx?: string;
  sfx?: string;
  ttsTemplate?: string;
  cooldownSec: number;
  maxPerEvent: number;
  enabled: boolean;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface GiftPipelineEvent {
  id: string;
  timestamp: number;
  source: 'real' | 'mock';
  giftName: string;
  giftId?: string;
  count: number;
  diamondCount?: number | null;
  viewerNick: string;
  activeGame: string;
  targetGame: string;
  resolvedStatus: 'observed-id' | 'name-only-unverified' | 'ambiguous' | 'unresolved';
  mappingMatched?: boolean;
  actionExecuted?: string;
  pipelineStatus: 'executed' | 'queued' | 'filtered_inactive' | 'cooldown' | 'unknown_gift' | 'error';
  error?: string;
}

export interface GiftAnalyticsSummary {
  real: {
    totalGifts: number;
    totalDiamonds: number;
    totalActionsExecuted: number;
    totalIgnored: number;
    topGifts: Record<string, number>;
    perGame: Record<string, { giftsReceived: number; actionsExecuted: number }>;
    unknownGifts: Record<string, { count: number; lastSeen: number; pictureUrl?: string | null }>;
    sessionStart: number;
  };
  mock: {
    totalSimulatedGifts: number;
    totalActionsExecuted: number;
    topGifts: Record<string, number>;
    perGame: Record<string, { giftsReceived: number; actionsExecuted: number }>;
  };
  pipelineHistory: GiftPipelineEvent[];
}

/** Pre-validated Game Action Registry preventing arbitrary JS execution */
export const REGISTERED_GAME_ACTIONS: Record<string, GameGiftActionDef[]> = {
  'mini-war': [
    {
      action: 'spawn_unit',
      label: 'Triệu hồi binh chủng (Warrior/Archer/Tank/Mage)',
      gameType: 'mini-war',
      description: 'Triệu hồi số lượng lính tương ứng theo hệ số nhân',
      supportedUnits: ['warrior', 'archer', 'tank', 'mage'],
      supportedVfx: ['unit_spawn_sparkle', 'portal_burst', 'battle_cry'],
      supportedSfx: ['sfx_spawn', 'sfx_charge'],
      defaultTts: 'Quân tiếp viện {unit} đã xuất trận!',
    },
    {
      action: 'spawn_boss',
      label: 'Triệu hồi ĐẠI TƯỚNG BOSS (Infernal / Titan)',
      gameType: 'mini-war',
      description: 'Triệu hồi Đại Tướng Boss khổng lồ cho phe được chọn',
      supportedUnits: ['boss'],
      supportedVfx: ['boss_quake', 'infernal_fire', 'meteor_strike'],
      supportedSfx: ['sfx_boss_roar'],
      defaultTts: 'Báo động! Đại Tướng Boss đã giáng lâm chiến trường!',
    },
    {
      action: 'heal_team',
      label: 'Hồi phục máu Thành Trì (+HP)',
      gameType: 'mini-war',
      description: 'Tăng lượng HP căn cứ thành trì',
      supportedVfx: ['holy_light', 'healing_aura'],
      supportedSfx: ['sfx_heal'],
      defaultTts: 'Căn cứ thành trì vừa được hồi phục sinh lực!',
    },
    {
      action: 'boost_team',
      label: 'Tăng tốc Morale & Sức tấn công',
      gameType: 'mini-war',
      description: 'Gia tăng tốc độ đánh và di chuyển của toàn quân',
      supportedVfx: ['speed_trails', 'frenzy_glow'],
      supportedSfx: ['sfx_boost'],
      defaultTts: 'Sĩ khí toàn quân đang dâng cao ngùn ngụt!',
    },
  ],
  'cat-cafe': [
    {
      action: 'cat_cafe.gift_effect',
      label: 'Hiệu ứng quà đặc biệt Café Mòe',
      gameType: 'cat-cafe',
      description: 'Tạo cá nướng, mưa tim, đăng quang hoàng gia hoặc đại tiệc vũ trụ',
      allowedParams: {
        effect: ['grilled_fish', 'heart_rain', 'royal_cat', 'cosmic_party', 'cake_party', 'yarn_ball', 'fireworks', 'perfume', 'coffee', 'ice_cream', 'crown']
      },
      supportedVfx: ['fish_grill', 'heart_fountain', 'royal_throne', 'cosmic_disco', 'confetti'],
      supportedSfx: ['meow_happy', 'purr_loop', 'fanfare'],
      defaultTts: 'Cảm ơn {viewer} đã thưởng {gift} cho Mèo Béo!',
    },
    {
      action: 'cat_cafe.dance',
      label: 'Mèo nhảy múa Disco tưng bừng',
      gameType: 'cat-cafe',
      description: 'Bật nhạc disco và mèo quẩy nhảy nhót khắp tiệm',
      supportedVfx: ['disco_lights', 'dance_notes'],
      supportedSfx: ['disco_beat'],
      defaultTts: 'Quẩy hết mình nào! Hoàng thượng đang nhảy disco cực cháy!',
    },
    {
      action: 'cat_cafe.angry',
      label: 'Mèo nổi giận xù lông',
      gameType: 'cat-cafe',
      description: 'Mèo cáu kỉnh xù lông biểu cảm hài hước',
      supportedVfx: ['steam_ears', 'fire_eyes'],
      supportedSfx: ['hiss_funny'],
      defaultTts: 'Trời ơi! Bé Mèo đang nổi giận dỗi hờn rồi!',
    },
    {
      action: 'cat_cafe.zoomies',
      label: 'Mèo chạy tăng động (Zoomies)',
      gameType: 'cat-cafe',
      description: 'Mèo phóng nhanh thoăn thoắt khắp các phòng',
      supportedVfx: ['speed_dust', 'blur_trail'],
      supportedSfx: ['run_dash'],
      defaultTts: 'Mèo béo vừa bật mode tăng động phi như bay!',
    },
    {
      action: 'cat_cafe.box',
      label: 'Mèo chui thùng carton',
      gameType: 'cat-cafe',
      description: 'Mèo rình rập trong hộp carton dễ thương',
      supportedVfx: ['cardboard_box', 'peek_eyes'],
      supportedSfx: ['box_rustle'],
      defaultTts: 'Chiếc hộp carton thần thánh đã xuất hiện!',
    },
    {
      action: 'cat_cafe.bath',
      label: 'Mèo tắm bong bóng xà phòng',
      gameType: 'cat-cafe',
      description: 'Bong bóng xà phòng bay rợp quán',
      supportedVfx: ['soap_bubbles', 'splash_drops'],
      supportedSfx: ['bubbles_pop'],
      defaultTts: 'Đến giờ tắm rửa thơm tho sạch sẽ cho bé mòe rồi!',
    },
  ],
  'english-class': [
    {
      action: 'english_class.gift',
      label: 'Hiệu ứng quà tặng lớp học tiếng Anh',
      gameType: 'english-class',
      description: 'Thả hoa hồng, vinh danh học sinh xuất sắc, pháo hoa học tập',
      allowedParams: {
        effect: ['rose_petals', 'heart_rain', 'galaxy_party', 'royal_spotlight', 'fireworks', 'magic_stars', 'teacher_dance', 'class_confetti']
      },
      supportedVfx: ['flower_shower', 'study_sparkles', 'teacher_applause'],
      supportedSfx: ['chime_correct', 'applause'],
      defaultTts: 'Cảm ơn bạn {viewer} đã gửi tặng {gift} tiếp sức cho cả lớp!',
    },
    {
      action: 'english_class.hint_5050',
      label: 'Gợi ý 50:50 cho cả lớp (Loại 2 đáp án sai)',
      gameType: 'english-class',
      description: 'Cô giáo trợ giúp gạch bỏ 2 phương án sai',
      supportedVfx: ['study_sparkles', 'golden_key'],
      supportedSfx: ['chime_correct'],
      defaultTts: 'Gợi ý 50:50 đã được cô giáo mở cho cả lớp!',
    },
    {
      action: 'english_class.add_time',
      label: 'Cộng thêm 10 giây suy nghĩ (+10s)',
      gameType: 'english-class',
      description: 'Thêm thời gian suy nghĩ cho các bạn học sinh',
      supportedVfx: ['magic_stars'],
      supportedSfx: ['chime_correct'],
      defaultTts: 'Cả lớp được cộng thêm 10 giây làm bài!',
    },
    {
      action: 'english_class.teacher_dance',
      label: 'Cô giáo nhảy múa cổ vũ',
      gameType: 'english-class',
      description: 'Cô giáo nhảy múa ăn mừng vui nhộn',
      supportedVfx: ['teacher_dance', 'class_confetti'],
      supportedSfx: ['applause'],
      defaultTts: 'Cô giáo đang nhảy múa ăn mừng cùng cả lớp!',
    },
  ],
  'quiz-show': [
    {
      action: 'quiz_show.gift',
      label: 'Hiệu ứng quà tặng Gameshow Đố Vui',
      gameType: 'quiz-show',
      description: 'Chiếu đèn spotlight, mưa donut bánh ngọt, đại tiệc vũ trụ',
      allowedParams: {
        effect: ['rose', 'heart', 'donut', 'lion_spotlight', 'universe_galaxy', 'fireworks', 'cake']
      },
      supportedVfx: ['stage_spotlight', 'neon_laser', 'stadium_confetti'],
      supportedSfx: ['gameshow_horn', 'cheer_crowd'],
      defaultTts: 'Cảm ơn đại gia {viewer} đã tiếp lửa đấu trường với {gift}!',
    },
    {
      action: 'quiz_show.hint_5050',
      label: 'Gợi ý 50:50 (Loại 2 đáp án sai)',
      gameType: 'quiz-show',
      description: 'Tự động gạch bỏ 2 phương án sai, chỉ để lại 1 đúng và 1 sai',
      supportedVfx: ['stage_spotlight', 'neon_laser'],
      supportedSfx: ['gameshow_horn'],
      defaultTts: 'Khán giả đã thả đủ tim! Gợi ý 50:50 đã loại bỏ 2 đáp án sai!',
    },
    {
      action: 'quiz_show.hint_one',
      label: 'Loại bỏ 1 đáp án sai',
      gameType: 'quiz-show',
      description: 'Gạch bỏ 1 phương án sai ngẫu nhiên',
      supportedVfx: ['stage_spotlight'],
      supportedSfx: ['gameshow_horn'],
      defaultTts: 'Gợi ý đã loại bỏ 1 đáp án sai!',
    },
    {
      action: 'quiz_show.add_time',
      label: 'Cộng thêm 10 giây suy nghĩ (+10s)',
      gameType: 'quiz-show',
      description: 'Gia hạn thêm 10 giây suy nghĩ cho câu hỏi hiện tại',
      supportedVfx: ['neon_laser'],
      supportedSfx: ['cheer_crowd'],
      defaultTts: 'Đấu trường vừa được cộng thêm 10 giây thời gian suy nghĩ!',
    },
    {
      action: 'quiz_show.double_points',
      label: 'Nhân đôi điểm thưởng vòng này (x2)',
      gameType: 'quiz-show',
      description: 'Nhân 2 toàn bộ số điểm người chơi đạt được ở câu hỏi này',
      supportedVfx: ['stadium_confetti'],
      supportedSfx: ['cheer_crowd'],
      defaultTts: 'Đặc biệt! Điểm thưởng câu hỏi này được nhân đôi!',
    },
  ],
  'duoi-hinh-bat-chu': [
    {
      action: 'rebus.gift',
      label: 'Hiệu ứng quà tặng Đuổi Hình Bắt Chữ',
      gameType: 'duoi-hinh-bat-chu',
      description: 'Hiệu ứng hỗ trợ thám tử giải mã hình ảnh',
      allowedParams: {
        effect: ['rose', 'heart', 'donut', 'lion_spotlight', 'universe_galaxy', 'fireworks', 'cake']
      },
      supportedVfx: ['easel_sparkle', 'magnifying_glow'],
      supportedSfx: ['bell_ding', 'puzzle_solve'],
      defaultTts: 'Thám tử {viewer} vừa gửi tặng món quà {gift} tuyệt đỉnh!',
    },
    {
      action: 'rebus.hint',
      label: 'Mở khóa gợi ý manh mối từ khóa',
      gameType: 'duoi-hinh-bat-chu',
      description: 'Lật mở chữ cái đầu tiên của câu đố',
      supportedVfx: ['hint_reveal', 'golden_key'],
      supportedSfx: ['hint_ding'],
      defaultTts: 'Manh mối gợi ý đặc biệt đã được mở!',
    },
    {
      action: 'rebus.add_time',
      label: 'Gia hạn thêm 15 giây (+15s)',
      gameType: 'duoi-hinh-bat-chu',
      description: 'Thêm 15 giây thời gian suy nghĩ cho thám tử',
      supportedVfx: ['easel_sparkle'],
      supportedSfx: ['bell_ding'],
      defaultTts: 'Cộng thêm 15 giây suy nghĩ cho thám tử!',
    },
    {
      action: 'rebus.bonus_score',
      label: 'Cộng 50 điểm thưởng',
      gameType: 'duoi-hinh-bat-chu',
      description: 'Thưởng 50 điểm cho các thám tử',
      supportedVfx: ['magnifying_glow'],
      supportedSfx: ['puzzle_solve'],
      defaultTts: 'Thưởng nóng 50 điểm cho các thám tử kỳ tài!',
    },
  ],
};

/**
 * High-performance, singleton GiftCatalogService
 */
export class GiftCatalogService {
  private static instance: GiftCatalogService;
  private rootDir: string;
  private catalog: GiftReference[] = [];
  private catalogVn: GiftReference[] = [];
  private observedGifts: ObservedGiftIdentity[] = [];
  private mappings: Map<string, GameGiftMappingRule> = new Map();
  private interactiveTriggers: Map<string, GameInteractiveTriggerConfig> = new Map();
  private lastTriggerTimes: Map<string, number> = new Map();

  private analytics: GiftAnalyticsSummary = {
    real: {
      totalGifts: 0,
      totalDiamonds: 0,
      totalActionsExecuted: 0,
      totalIgnored: 0,
      topGifts: {},
      perGame: {},
      unknownGifts: {},
      sessionStart: Date.now(),
    },
    mock: {
      totalSimulatedGifts: 0,
      totalActionsExecuted: 0,
      topGifts: {},
      perGame: {},
    },
    pipelineHistory: [],
  };

  private sourceInfo = {
    sourceDate: null as string | null,
    importedAt: null as string | null,
    provider: 'BeetGames Reference Snapshot',
  };

  constructor(customRootDir?: string) {
    if (customRootDir) {
      this.rootDir = customRootDir;
    } else {
      const __filename = fileURLToPath(import.meta.url);
      this.rootDir = path.resolve(path.dirname(__filename), '..');
    }
    this.loadCatalogData();
    this.loadObservedGifts();
    this.loadMappings();
    this.loadInteractiveTriggers();
  }

  public static getInstance(customRootDir?: string): GiftCatalogService {
    if (!GiftCatalogService.instance) {
      GiftCatalogService.instance = new GiftCatalogService(customRootDir);
    }
    return GiftCatalogService.instance;
  }

  public reloadAll(): void {
    this.loadCatalogData();
    this.loadObservedGifts();
    this.loadMappings();
    this.loadInteractiveTriggers();
  }

  private loadCatalogData(): void {
    const dataDir = path.join(this.rootDir, 'data');
    const allPath = path.join(dataDir, 'tiktok-gifts.all.json');
    const vnPath = path.join(dataDir, 'tiktok-gifts.vn.json');
    const samplePath = path.join(dataDir, 'gifts.sample.json');

    try {
      if (fs.existsSync(allPath)) {
        const raw = JSON.parse(fs.readFileSync(allPath, 'utf8'));
        this.catalog = Array.isArray(raw.gifts) ? raw.gifts : [];
        this.sourceInfo.sourceDate = raw.sourceUpdatedAt || null;
        this.sourceInfo.importedAt = raw.importedAt || null;
      } else if (fs.existsSync(samplePath)) {
        const raw = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
        this.catalog = Array.isArray(raw.gifts) ? raw.gifts : [];
      }

      if (fs.existsSync(vnPath)) {
        const rawVn = JSON.parse(fs.readFileSync(vnPath, 'utf8'));
        this.catalogVn = Array.isArray(rawVn.gifts) ? rawVn.gifts : [];
      } else {
        this.catalogVn = this.catalog.filter(g => (g.regions || []).includes('VN'));
      }
    } catch (e: any) {
      console.warn('[GiftCatalogService] Failed loading catalog files, falling back to empty list:', e.message);
    }
  }

  private loadObservedGifts(): void {
    const dest = path.join(this.rootDir, 'data', 'gifts.observed-ids.json');
    try {
      if (fs.existsSync(dest)) {
        const raw = JSON.parse(fs.readFileSync(dest, 'utf8'));
        this.observedGifts = Array.isArray(raw.gifts) ? raw.gifts : [];
      }
    } catch {}
  }

  private loadMappings(): void {
    const configPath = path.join(this.rootDir, 'config', 'gift-mappings.json');
    const examplePath = path.join(this.rootDir, 'config', 'gift-actions.example.json');

    if (fs.existsSync(configPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const list: GameGiftMappingRule[] = Array.isArray(raw.rules) ? raw.rules : [];
        this.mappings.clear();
        for (const r of list) {
          if (r && r.id) this.mappings.set(r.id, r);
        }
        return;
      } catch (e) {
        console.warn('[GiftCatalogService] Failed to read gift-mappings.json, loading defaults');
      }
    }

    // Initialize robust default mappings for all 5 games
    this.initDefaultMappings();
    this.saveMappingsToFile();
  }

  private initDefaultMappings(): void {
    this.mappings.clear();
    const defaults: GameGiftMappingRule[] = [
      // MINI WAR ARENA
      { id: 'mw_rose', gameType: 'mini-war', giftName: 'Rose', action: 'spawn_unit', unitType: 'warrior', multiplier: 2, cooldownSec: 0, maxPerEvent: 20, enabled: true, description: 'Triệu hồi 2 Chiến Binh' },
      { id: 'mw_heart', gameType: 'mini-war', giftName: 'Heart', action: 'spawn_unit', unitType: 'archer', multiplier: 2, cooldownSec: 0.5, maxPerEvent: 10, enabled: true, description: 'Triệu hồi 2 Cung Thủ' },
      { id: 'mw_fireworks', gameType: 'mini-war', giftName: 'Fireworks', action: 'spawn_unit', unitType: 'tank', multiplier: 1, cooldownSec: 2, maxPerEvent: 4, enabled: true, description: 'Triệu hồi Hộ Vệ Giáp Thép' },
      { id: 'mw_icecream', gameType: 'mini-war', giftName: 'Ice Cream', action: 'spawn_unit', unitType: 'mage', multiplier: 1, cooldownSec: 1, maxPerEvent: 6, enabled: true, description: 'Triệu hồi Pháp Sư Lửa' },
      { id: 'mw_lion', gameType: 'mini-war', giftName: 'Lion', action: 'spawn_boss', unitType: 'boss', multiplier: 1, cooldownSec: 10, maxPerEvent: 1, enabled: true, description: 'Triệu hồi ĐẠI TƯỚNG BOSS' },
      { id: 'mw_universe', gameType: 'mini-war', giftName: 'TikTok Universe', action: 'spawn_boss', unitType: 'boss', multiplier: 1, cooldownSec: 10, maxPerEvent: 1, enabled: true, description: 'Triệu hồi Boss Vũ Trụ' },

      // CAT CAFE LIVE
      { id: 'cat_rose', gameType: 'cat-cafe', giftName: 'Rose', action: 'cat_cafe.gift_effect', params: { effect: 'grilled_fish' }, cooldownSec: 0, maxPerEvent: 20, enabled: true, description: 'Thưởng Cá Nướng thơm lừng' },
      { id: 'cat_heart', gameType: 'cat-cafe', giftName: 'Heart', action: 'cat_cafe.gift_effect', params: { effect: 'heart_rain' }, cooldownSec: 0.5, maxPerEvent: 15, enabled: true, description: 'Mưa tim hạnh phúc' },
      { id: 'cat_lion', gameType: 'cat-cafe', giftName: 'Lion', action: 'cat_cafe.gift_effect', params: { effect: 'royal_cat' }, cooldownSec: 5, maxPerEvent: 1, enabled: true, description: 'Mèo Hoàng Gia Đăng Quang' },
      { id: 'cat_universe', gameType: 'cat-cafe', giftName: 'TikTok Universe', action: 'cat_cafe.gift_effect', params: { effect: 'cosmic_party' }, cooldownSec: 10, maxPerEvent: 1, enabled: true, description: 'Đại Tiệc Mèo Vũ Trụ' },
      { id: 'cat_cake', gameType: 'cat-cafe', giftName: 'Cake', action: 'cat_cafe.gift_effect', params: { effect: 'cake_party' }, cooldownSec: 3, maxPerEvent: 2, enabled: true, description: 'Tiệc Bánh Kem Sinh Nhật' },
      { id: 'cat_yarn', gameType: 'cat-cafe', giftName: 'Yarn Ball', action: 'cat_cafe.gift_effect', params: { effect: 'yarn_ball' }, cooldownSec: 1, maxPerEvent: 5, enabled: true, description: 'Cuộn len đùa nghịch' },
      { id: 'cat_fireworks', gameType: 'cat-cafe', giftName: 'Fireworks', action: 'cat_cafe.gift_effect', params: { effect: 'fireworks' }, cooldownSec: 3, maxPerEvent: 2, enabled: true, description: 'Pháo hoa rực rỡ' },
      { id: 'cat_dance', gameType: 'cat-cafe', giftName: 'Perfume', action: 'cat_cafe.dance', cooldownSec: 4, maxPerEvent: 1, enabled: true, description: 'Mèo quẩy Disco tưng bừng' },

      // ENGLISH CLASS LIVE
      { id: 'ec_rose', gameType: 'english-class', giftName: 'Rose', action: 'english_class.gift', params: { effect: 'rose_petals' }, cooldownSec: 0, maxPerEvent: 10, enabled: true, description: 'Mưa cánh hoa hồng' },
      { id: 'ec_heart', gameType: 'english-class', giftName: 'Heart', action: 'english_class.gift', params: { effect: 'heart_rain' }, cooldownSec: 0.5, maxPerEvent: 10, enabled: true, description: 'Mưa tim yêu thích lớp học' },
      { id: 'ec_lion', gameType: 'english-class', giftName: 'Lion', action: 'english_class.gift', params: { effect: 'royal_spotlight' }, cooldownSec: 5, maxPerEvent: 1, enabled: true, description: 'Spotlight Vinh Danh Học Sinh' },
      { id: 'ec_universe', gameType: 'english-class', giftName: 'TikTok Universe', action: 'english_class.gift', params: { effect: 'galaxy_party' }, cooldownSec: 8, maxPerEvent: 1, enabled: true, description: 'Đại Tiệc Dải Ngân Hà' },

      // QUIZ SHOW
      { id: 'qs_rose', gameType: 'quiz-show', giftName: 'Rose', action: 'quiz_show.gift', params: { effect: 'rose' }, cooldownSec: 0, maxPerEvent: 10, enabled: true, description: 'Hoa hồng cổ vũ thí sinh' },
      { id: 'qs_heart', gameType: 'quiz-show', giftName: 'Heart', action: 'quiz_show.gift', params: { effect: 'heart' }, cooldownSec: 0.5, maxPerEvent: 10, enabled: true, description: 'Thả tim khán đài' },
      { id: 'qs_lion', gameType: 'quiz-show', giftName: 'Lion', action: 'quiz_show.gift', params: { effect: 'lion_spotlight' }, cooldownSec: 5, maxPerEvent: 1, enabled: true, description: 'Spotlight Đấu Trường Sư Tử' },
      { id: 'qs_universe', gameType: 'quiz-show', giftName: 'TikTok Universe', action: 'quiz_show.gift', params: { effect: 'universe_galaxy' }, cooldownSec: 8, maxPerEvent: 1, enabled: true, description: 'Bão Vũ Trụ Sân Khấu' },

      // DUOI HINH BAT CHU
      { id: 'dh_rose', gameType: 'duoi-hinh-bat-chu', giftName: 'Rose', action: 'rebus.gift', params: { effect: 'rose' }, cooldownSec: 0, maxPerEvent: 10, enabled: true, description: 'Hoa hồng tặng thám tử' },
      { id: 'dh_lion', gameType: 'duoi-hinh-bat-chu', giftName: 'Lion', action: 'rebus.gift', params: { effect: 'lion_spotlight' }, cooldownSec: 5, maxPerEvent: 1, enabled: true, description: 'Vinh quang Thám Tử Kỳ Tài' },
      { id: 'dh_perfume', gameType: 'duoi-hinh-bat-chu', giftName: 'Perfume', action: 'rebus.hint', cooldownSec: 6, maxPerEvent: 1, enabled: true, description: 'Mở khóa gợi ý chữ cái đầu' },
    ];

    for (const d of defaults) {
      this.mappings.set(d.id, d);
    }
  }

  private saveMappingsToFile(): void {
    try {
      const configDir = path.join(this.rootDir, 'config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      const dest = path.join(configDir, 'gift-mappings.json');
      const payload = {
        formatVersion: 1,
        updatedAt: new Date().toISOString(),
        total: this.mappings.size,
        rules: Array.from(this.mappings.values()),
      };
      fs.writeFileSync(dest, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e: any) {
      console.warn('[GiftCatalogService] Error saving mappings:', e.message);
    }
  }

  private loadInteractiveTriggers(): void {
    const configPath = path.join(this.rootDir, 'config', 'interactive-triggers.json');
    if (fs.existsSync(configPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const triggersObj = raw.triggers || {};
        this.interactiveTriggers.clear();
        for (const [key, val] of Object.entries(triggersObj)) {
          if (val && typeof val === 'object') {
            this.interactiveTriggers.set(key, val as GameInteractiveTriggerConfig);
          }
        }
        return;
      } catch (e: any) {
        console.warn('[GiftCatalogService] Failed reading interactive-triggers.json:', e.message);
      }
    }
    this.initDefaultInteractiveTriggers();
    this.saveInteractiveTriggersToFile();
  }

  private initDefaultInteractiveTriggers(): void {
    this.interactiveTriggers.clear();
    const defaults: Record<string, GameInteractiveTriggerConfig> = {
      'quiz-show': {
        gameType: 'quiz-show',
        gameName: 'PTPlay Quiz Show',
        likeGoal: {
          enabled: true,
          targetCount: 10,
          action: 'quiz_show.hint_5050',
          actionLabel: 'Gợi ý 50:50 (Loại 2 đáp án sai)',
          resetMode: 'per_round',
          ttsAnnouncement: 'Khán giả đã thả đủ {count} tim! Gợi ý 50:50 loại bỏ 2 đáp án sai đã xuất hiện!',
          description: 'Khi khán giả tap màn hình đạt 10 tim trong 1 câu hỏi, tự động loại bỏ 2 đáp án sai.',
        },
      },
      'duoi-hinh-bat-chu': {
        gameType: 'duoi-hinh-bat-chu',
        gameName: 'Đuổi Hình Bắt Chữ',
        likeGoal: {
          enabled: true,
          targetCount: 15,
          action: 'rebus.hint',
          actionLabel: 'Mở 1 ký tự gợi ý ô chữ',
          resetMode: 'per_round',
          ttsAnnouncement: 'Khán giả đã thả đủ {count} tim! Manh mối gợi ý chữ cái đã được mở!',
          description: 'Khi khán giả tap màn hình đạt 15 tim, tự động mở chữ cái đầu tiên của câu đố.',
        },
      },
      'english-class': {
        gameType: 'english-class',
        gameName: 'Lớp Học Vui LIVE',
        likeGoal: {
          enabled: true,
          targetCount: 20,
          action: 'english_class.hint_5050',
          actionLabel: 'Gợi ý 50:50 cho cả lớp',
          resetMode: 'per_round',
          ttsAnnouncement: 'Cả lớp đã nhận được trợ giúp 50:50 nhờ {count} lượt thả tim từ khán giả!',
          description: 'Khi khán giả thả đủ 20 tim, cô giáo trợ giúp loại bỏ 2 đáp án sai.',
        },
      },
      'cat-cafe': {
        gameType: 'cat-cafe',
        gameName: 'Café Mòe LIVE',
        likeGoal: {
          enabled: true,
          targetCount: 25,
          action: 'cat_cafe.dance',
          actionLabel: 'Mèo quẩy Disco tập thể',
          resetMode: 'per_round',
          ttsAnnouncement: 'Khán giả thả đủ {count} tim! Toàn bộ mèo trong quán đang nhảy Disco cực cháy!',
          description: 'Khi đạt 25 tim, mèo mở tiệc quẩy disco và tăng điểm Purr.',
        },
      },
      'mini-war': {
        gameType: 'mini-war',
        gameName: 'Mini War Arena',
        likeGoal: {
          enabled: true,
          targetCount: 30,
          action: 'boost_team',
          actionLabel: 'Tăng tốc Morale sĩ khí',
          resetMode: 'per_round',
          ttsAnnouncement: 'Sĩ khí toàn quân tăng vọt nhờ {count} lượt thả tim cổ vũ từ khán giả!',
          description: 'Khi khán giả thả đủ 30 tim, tăng tốc độ di chuyển và tấn công.',
        },
      },
    };
    for (const [k, v] of Object.entries(defaults)) {
      this.interactiveTriggers.set(k, v);
    }
  }

  public saveInteractiveTriggersToFile(): void {
    try {
      const configDir = path.join(this.rootDir, 'config');
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      const dest = path.join(configDir, 'interactive-triggers.json');
      const obj: Record<string, GameInteractiveTriggerConfig> = {};
      for (const [k, v] of this.interactiveTriggers.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(
        dest,
        JSON.stringify({ formatVersion: 1, updatedAt: new Date().toISOString(), triggers: obj }, null, 2),
        'utf8'
      );
    } catch (e: any) {
      console.warn('[GiftCatalogService] Error saving interactive triggers:', e.message);
    }
  }

  public getInteractiveTriggers(gameType?: string): Record<string, GameInteractiveTriggerConfig> | GameInteractiveTriggerConfig | null {
    if (!gameType || gameType === 'all') {
      const result: Record<string, GameInteractiveTriggerConfig> = {};
      for (const [k, v] of this.interactiveTriggers.entries()) {
        result[k] = v;
      }
      return result;
    }
    const norm = gameType === 'cat' ? 'cat-cafe' : (gameType === 'miniwar' ? 'mini-war' : (gameType === 'english' ? 'english-class' : (gameType === 'quiz' ? 'quiz-show' : (gameType === 'rebus' ? 'duoi-hinh-bat-chu' : gameType))));
    return this.interactiveTriggers.get(norm) || null;
  }

  public saveInteractiveTrigger(config: GameInteractiveTriggerConfig): GameInteractiveTriggerConfig {
    if (!config || !config.gameType) throw new Error('Invalid interactive trigger config: gameType required');
    const norm = config.gameType === 'cat' ? 'cat-cafe' : (config.gameType === 'miniwar' ? 'mini-war' : (config.gameType === 'english' ? 'english-class' : (config.gameType === 'quiz' ? 'quiz-show' : (config.gameType === 'rebus' ? 'duoi-hinh-bat-chu' : config.gameType))));
    config.gameType = norm;
    this.interactiveTriggers.set(norm, config);
    this.saveInteractiveTriggersToFile();
    return config;
  }

  /**
   * Search / filter catalog gifts
   */
  public searchGifts(options: {
    query?: string;
    region?: string;
    tier?: 'all' | 'low' | 'mid' | 'high';
    limit?: number;
    offset?: number;
  }): { total: number; gifts: GiftReference[] } {
    const q = (options.query || '').trim().toLowerCase();
    const region = options.region || 'VN';
    const tier = options.tier || 'all';
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const offset = Math.max(0, options.offset || 0);

    const source = (region === 'VN' && this.catalogVn.length > 0) ? this.catalogVn : this.catalog;

    const filtered = source.filter(g => {
      if (region !== 'ALL' && region !== 'VN' && !(g.regions || []).includes(region)) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      if (tier === 'low' && g.coins >= 100) return false;
      if (tier === 'mid' && (g.coins < 100 || g.coins >= 1000)) return false;
      if (tier === 'high' && g.coins < 1000) return false;
      return true;
    });

    return {
      total: filtered.length,
      gifts: filtered.slice(offset, offset + limit),
    };
  }

  /**
   * Return high-level catalog statistics
   */
  public getStats(): {
    totalCatalog: number;
    totalVn: number;
    totalObserved: number;
    totalMappings: number;
    sourceDate: string | null;
    importedAt: string | null;
  } {
    return {
      totalCatalog: this.catalog.length,
      totalVn: this.catalogVn.length,
      totalObserved: this.observedGifts.length,
      totalMappings: this.mappings.size,
      sourceDate: this.sourceInfo.sourceDate,
      importedAt: this.sourceInfo.importedAt,
    };
  }

  /**
   * Resolves an incoming gift event against verified observed IDs and reference catalog
   */
  public resolveGiftEvent(giftId: string | number | null, giftName: string, verifiedCoinPrice?: number): GiftLookupResult {
    const result = resolveGift({ giftId, giftName, verifiedCoinPrice }, this.catalog, this.observedGifts);
    return {
      status: result.status,
      match: result.record,
      candidates: result.candidates,
      eventName: giftName,
    };
  }

  /**
   * Get all registered actions for a game
   */
  public getGameActions(gameType: string): GameGiftActionDef[] {
    const key = gameType === 'cat' ? 'cat-cafe' : (gameType === 'miniwar' ? 'mini-war' : (gameType === 'english' ? 'english-class' : (gameType === 'quiz' ? 'quiz-show' : (gameType === 'rebus' ? 'duoi-hinh-bat-chu' : gameType))));
    return REGISTERED_GAME_ACTIONS[key] || [];
  }

  /**
   * Get all rules or rules for a specific game
   */
  public getMappings(gameType?: string): GameGiftMappingRule[] {
    const all = Array.from(this.mappings.values());
    if (!gameType || gameType === 'all') return all;
    const norm = gameType === 'cat' ? 'cat-cafe' : (gameType === 'miniwar' ? 'mini-war' : (gameType === 'english' ? 'english-class' : (gameType === 'quiz' ? 'quiz-show' : (gameType === 'rebus' ? 'duoi-hinh-bat-chu' : gameType))));
    return all.filter(r => r.gameType === norm);
  }

  /**
   * Find a rule matching an incoming gift for a game
   */
  public findMatchingRule(gameType: string, giftName: string, giftId?: string | number): GameGiftMappingRule | null {
    const normGame = gameType === 'cat' ? 'cat-cafe' : (gameType === 'miniwar' ? 'mini-war' : (gameType === 'english' ? 'english-class' : (gameType === 'quiz' ? 'quiz-show' : (gameType === 'rebus' ? 'duoi-hinh-bat-chu' : gameType))));
    const rules = this.getMappings(normGame).filter(r => r.enabled);

    // 1. If giftId is provided, check explicit giftId match first
    if (giftId != null) {
      const byId = rules.find(r => r.giftId && String(r.giftId) === String(giftId));
      if (byId) return byId;
    }

    // 2. Match by normalized name
    const n = normalizeName(giftName);
    const byName = rules.find(r => normalizeName(r.giftName) === n);
    if (byName) return byName;

    // 3. Fallback partial matching
    const partial = rules.find(r => n.includes(normalizeName(r.giftName)) || normalizeName(r.giftName).includes(n));
    return partial || null;
  }

  /**
   * Save or update a mapping rule
   */
  public saveMapping(rule: Partial<GameGiftMappingRule>): GameGiftMappingRule {
    const id = rule.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = this.mappings.get(id);

    const saved: GameGiftMappingRule = {
      id,
      gameType: rule.gameType || existing?.gameType || 'mini-war',
      giftName: String(rule.giftName || existing?.giftName || 'Rose').trim(),
      giftId: rule.giftId || existing?.giftId,
      action: rule.action || existing?.action || 'spawn_unit',
      unitType: rule.unitType || existing?.unitType,
      multiplier: Number(rule.multiplier) || existing?.multiplier || 1,
      params: rule.params || existing?.params || {},
      vfx: rule.vfx || existing?.vfx,
      sfx: rule.sfx || existing?.sfx,
      ttsTemplate: rule.ttsTemplate || existing?.ttsTemplate,
      cooldownSec: Number(rule.cooldownSec ?? existing?.cooldownSec ?? 0),
      maxPerEvent: Number(rule.maxPerEvent ?? existing?.maxPerEvent ?? 20),
      enabled: rule.enabled ?? existing?.enabled ?? true,
      description: rule.description || existing?.description || `${rule.action} for ${rule.giftName}`,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    this.mappings.set(id, saved);
    this.saveMappingsToFile();
    return saved;
  }

  /**
   * Delete a mapping rule
   */
  public deleteMapping(id: string): boolean {
    const existed = this.mappings.delete(id);
    if (existed) this.saveMappingsToFile();
    return existed;
  }

  /**
   * Toggle enabled state
   */
  public toggleMapping(id: string): boolean {
    const r = this.mappings.get(id);
    if (!r) return false;
    r.enabled = !r.enabled;
    r.updatedAt = Date.now();
    this.saveMappingsToFile();
    return r.enabled;
  }

  /**
   * Import mappings from JSON
   */
  public importMappings(rawRules: GameGiftMappingRule[]): number {
    if (!Array.isArray(rawRules)) return 0;
    let count = 0;
    for (const r of rawRules) {
      if (r && r.giftName && r.action && r.gameType) {
        this.saveMapping(r);
        count++;
      }
    }
    return count;
  }

  /**
   * Record a gift pipeline event & update real vs mock analytics
   */
  public recordPipelineEvent(event: GiftPipelineEvent): void {
    // Add to circular buffer (last 150 events)
    this.analytics.pipelineHistory.unshift(event);
    if (this.analytics.pipelineHistory.length > 150) {
      this.analytics.pipelineHistory.pop();
    }

    if (event.source === 'real') {
      this.analytics.real.totalGifts += event.count;
      if (event.diamondCount && Number.isFinite(event.diamondCount)) {
        this.analytics.real.totalDiamonds += event.diamondCount;
      }
      if (event.pipelineStatus === 'executed') {
        this.analytics.real.totalActionsExecuted += 1;
      } else if (event.pipelineStatus === 'filtered_inactive' || event.pipelineStatus === 'unknown_gift') {
        this.analytics.real.totalIgnored += 1;
      }

      // Top gifts
      const currentGiftCount = this.analytics.real.topGifts[event.giftName] || 0;
      this.analytics.real.topGifts[event.giftName] = currentGiftCount + event.count;

      // Per game
      if (!this.analytics.real.perGame[event.targetGame]) {
        this.analytics.real.perGame[event.targetGame] = { giftsReceived: 0, actionsExecuted: 0 };
      }
      this.analytics.real.perGame[event.targetGame].giftsReceived += event.count;
      if (event.pipelineStatus === 'executed') {
        this.analytics.real.perGame[event.targetGame].actionsExecuted += 1;
      }

      // Unknown gifts tracking
      if (event.pipelineStatus === 'unknown_gift' || event.resolvedStatus === 'unresolved') {
        const u = this.analytics.real.unknownGifts[event.giftName] || { count: 0, lastSeen: Date.now() };
        u.count += event.count;
        u.lastSeen = Date.now();
        this.analytics.real.unknownGifts[event.giftName] = u;
      }
    } else {
      // Mock / Simulated
      this.analytics.mock.totalSimulatedGifts += event.count;
      if (event.pipelineStatus === 'executed') {
        this.analytics.mock.totalActionsExecuted += 1;
      }
      const cur = this.analytics.mock.topGifts[event.giftName] || 0;
      this.analytics.mock.topGifts[event.giftName] = cur + event.count;

      if (!this.analytics.mock.perGame[event.targetGame]) {
        this.analytics.mock.perGame[event.targetGame] = { giftsReceived: 0, actionsExecuted: 0 };
      }
      this.analytics.mock.perGame[event.targetGame].giftsReceived += event.count;
      if (event.pipelineStatus === 'executed') {
        this.analytics.mock.perGame[event.targetGame].actionsExecuted += 1;
      }
    }
  }

  /**
   * Get analytics snapshot
   */
  public getAnalytics(): GiftAnalyticsSummary {
    return {
      real: { ...this.analytics.real },
      mock: { ...this.analytics.mock },
      pipelineHistory: [...this.analytics.pipelineHistory],
    };
  }

  /**
   * Reset analytics counters
   */
  public resetAnalytics(): void {
    this.analytics.real = {
      totalGifts: 0,
      totalDiamonds: 0,
      totalActionsExecuted: 0,
      totalIgnored: 0,
      topGifts: {},
      perGame: {},
      unknownGifts: {},
      sessionStart: Date.now(),
    };
    this.analytics.mock = {
      totalSimulatedGifts: 0,
      totalActionsExecuted: 0,
      topGifts: {},
      perGame: {},
    };
    this.analytics.pipelineHistory = [];
  }

  /**
   * Import observed gift identities from sanitized events
   */
  public importObservedEvents(rawEvents: any[]): { total: number; added: number } {
    const list = Array.isArray(rawEvents) ? rawEvents : [rawEvents];
    const byId = new Map(this.observedGifts.map(x => [String(x.giftId), x]));
    let added = 0;

    for (const raw of list) {
      const extracted = extractGiftOnly(raw);
      if (!extracted) continue;
      const existed = byId.has(extracted.giftId);
      byId.set(extracted.giftId, extracted);
      if (!existed) added++;
    }

    this.observedGifts = Array.from(byId.values());
    try {
      const dest = path.join(this.rootDir, 'data', 'gifts.observed-ids.json');
      fs.writeFileSync(
        dest,
        JSON.stringify(
          {
            formatVersion: 1,
            source: 'sanitized actual event snapshots',
            total: this.observedGifts.length,
            gifts: this.observedGifts.sort((a, b) => a.name.localeCompare(b.name)),
          },
          null,
          2
        ),
        'utf8'
      );
    } catch (e: any) {
      console.warn('[GiftCatalogService] Error writing observed-ids.json:', e.message);
    }

    return { total: this.observedGifts.length, added };
  }
}
