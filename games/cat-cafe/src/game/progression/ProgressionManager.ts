import { LEVEL_MILESTONES, LevelMilestone, SESSION_CHALLENGES, ChallengeDef, RoomId, TimeOfDay, WeatherType } from '../config/CafeConfig';

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  muted: boolean;
  quality: 'high' | 'med' | 'low';
  reducedMotion: boolean;
  safeZoneVisible: boolean;
  activeRoom: RoomId;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
}

export interface SaveDataV1 {
  version: 1;
  purrPoints: number;
  level: number;
  unlockedItems: string[];
  placedDecor: Record<string, string>; // key: `${roomId}_${socketId}`, value: decorId
  completedChallenges: string[];
  challengeProgress: Record<string, number>;
  discoveredBreeds: number[];
  settings: GameSettings;
  lastSavedAt: number;
}

const STORAGE_KEY = 'ptplay_cat_cafe_save_v1';

export class ProgressionManager {
  private static instance: ProgressionManager;

  public data: SaveDataV1;
  public onLeveledUp?: (milestone: LevelMilestone) => void;
  public onChallengeCompleted?: (ch: ChallengeDef) => void;
  public onPurrsChanged?: (total: number, gained: number) => void;

  private constructor() {
    this.data = this.loadFromStorage();
  }

  public static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
  }

  private getDefaultData(): SaveDataV1 {
    return {
      version: 1,
      purrPoints: 0,
      level: 1,
      unlockedItems: ['decor_lamp', 'decor_plant', 'bowl_standard'],
      placedDecor: {
        cafe_table: 'decor_lamp',
        cafe_corner: 'decor_plant',
      },
      completedChallenges: [],
      challengeProgress: {},
      discoveredBreeds: [0, 1, 4], // Initial 3 NPC breeds
      settings: {
        bgmVolume: 0.6,
        sfxVolume: 0.8,
        ambienceVolume: 0.5,
        muted: false,
        quality: 'high',
        reducedMotion: false,
        safeZoneVisible: false,
        activeRoom: 'cafe',
        timeOfDay: 'day',
        weather: 'sunny',
      },
      lastSavedAt: Date.now(),
    };
  }

  private loadFromStorage(): SaveDataV1 {
    try {
      if (typeof localStorage === 'undefined') return this.getDefaultData();
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        // Merge with default in case new fields were added
        return {
          ...this.getDefaultData(),
          ...parsed,
          settings: { ...this.getDefaultData().settings, ...(parsed.settings || {}) },
        };
      }
      return this.getDefaultData();
    } catch {
      return this.getDefaultData();
    }
  }

  public save(): void {
    try {
      this.data.lastSavedAt = Date.now();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('[ProgressionManager] Failed to save to localStorage', e);
    }
  }

  public addPurrPoints(pts: number): { leveledUp: boolean; newMilestone?: LevelMilestone } {
    if (pts <= 0) return { leveledUp: false };
    this.data.purrPoints += pts;
    this.onPurrsChanged?.(this.data.purrPoints, pts);

    let leveledUp = false;
    let newMilestone: LevelMilestone | undefined;

    // Check level thresholds
    for (let i = LEVEL_MILESTONES.length - 1; i >= 0; i--) {
      const ms = LEVEL_MILESTONES[i];
      if (this.data.purrPoints >= ms.requiredPurrs) {
        if (ms.level > this.data.level) {
          this.data.level = ms.level;
          leveledUp = true;
          newMilestone = ms;
          if (ms.unlockedItem && !this.data.unlockedItems.includes(ms.unlockedItem)) {
            this.data.unlockedItems.push(ms.unlockedItem);
          }
          this.onLeveledUp?.(ms);
        }
        break;
      }
    }

    this.save();
    return { leveledUp, newMilestone };
  }

  public trackAction(type: 'join' | 'feed' | 'play' | 'nap' | 'love' | 'photo' | 'garden'): void {
    // Award 5 base purrs for every valid audience interaction
    this.addPurrPoints(5);

    // Update active challenges matching this type
    for (const ch of SESSION_CHALLENGES) {
      if (ch.type === type && !this.data.completedChallenges.includes(ch.id)) {
        const cur = (this.data.challengeProgress[ch.id] || 0) + 1;
        this.data.challengeProgress[ch.id] = cur;

        if (cur >= ch.targetCount) {
          this.data.completedChallenges.push(ch.id);
          this.addPurrPoints(ch.rewardPurrs);
          this.onChallengeCompleted?.(ch);
        }
      }
    }
    this.save();
  }

  public discoverBreed(variant: number): void {
    if (!this.data.discoveredBreeds.includes(variant)) {
      this.data.discoveredBreeds.push(variant);
      this.addPurrPoints(25); // Bonus purrs for discovering a new breed
      this.save();
    }
  }

  public placeDecor(roomId: RoomId, socketId: string, decorId: string): void {
    const key = `${roomId}_${socketId}`;
    this.data.placedDecor[key] = decorId;
    this.save();
  }

  public getPlacedDecor(roomId: RoomId, socketId: string): string | undefined {
    return this.data.placedDecor[`${roomId}_${socketId}`];
  }

  public isItemUnlocked(itemId: string): boolean {
    return this.data.unlockedItems.includes(itemId);
  }

  public getCurrentMilestone(): LevelMilestone {
    return (
      LEVEL_MILESTONES.find((m) => m.level === this.data.level) || LEVEL_MILESTONES[0]
    );
  }

  public getNextMilestone(): LevelMilestone | null {
    const nextIdx = this.data.level;
    return LEVEL_MILESTONES[nextIdx] || null;
  }

  public exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.version === 1) {
        this.data = parsed;
        this.save();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public resetAll(): void {
    this.data = this.getDefaultData();
    this.save();
  }
}
