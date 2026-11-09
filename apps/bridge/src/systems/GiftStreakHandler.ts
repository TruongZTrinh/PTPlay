import { NormalizedGiftEvent } from '../types/events.js';

interface ActiveStreak {
  userId: string;
  giftId: string | number;
  groupId?: string;
  lastRepeatCount: number;
  lastUpdated: number;
}

export interface ProcessedStreakResult {
  isDuplicate: boolean;
  deltaCount: number;
  currentStreak: number;
  isStreakEnd: boolean;
  streakId: string;
}

export class GiftStreakHandler {
  private activeStreaks: Map<string, ActiveStreak> = new Map();
  private processedEventIds: Map<string, number> = new Map();
  private readonly deduplicationTtlMs = 60000; // 60s deduplication window
  private readonly streakExpiryMs = 15000;    // 15s inactive streak cleanup

  public totalGiftsProcessed = 0;
  public totalUnitsCalculated = 0;

  public processGift(event: NormalizedGiftEvent): ProcessedStreakResult {
    const now = Date.now();
    this.cleanupOldEntries(now);

    // 1. Deduplication check by event ID
    if (this.processedEventIds.has(event.id)) {
      return {
        isDuplicate: true,
        deltaCount: 0,
        currentStreak: Number(event.repeatCount) || 1,
        isStreakEnd: Boolean(event.repeatEnd),
        streakId: `${event.userId}_${event.giftId}`,
      };
    }
    this.processedEventIds.set(event.id, now);

    // 2. Normalize repeatCount (safeguard against string or NaN)
    const currentRepeat = Math.max(1, Number(event.repeatCount) || 1);
    const isStreakEnd = Boolean(event.repeatEnd);

    // 3. Streak Key
    // If groupId is present from TikFinity, use it as part of key
    const streakKey = `${event.userId}_${event.giftId}_${event.groupId || 'default'}`;
    const existing = this.activeStreaks.get(streakKey);

    let deltaCount = 1;

    if (!existing) {
      // First event in this streak
      deltaCount = currentRepeat;
      if (!isStreakEnd) {
        this.activeStreaks.set(streakKey, {
          userId: event.userId,
          giftId: event.giftId,
          groupId: event.groupId,
          lastRepeatCount: currentRepeat,
          lastUpdated: now,
        });
      }
    } else {
      // Continuation of streak
      if (currentRepeat < existing.lastRepeatCount) {
        // Edge case: A new streak began without groupId change! (e.g. repeatCount reset from 10 down to 1)
        deltaCount = currentRepeat;
        existing.lastRepeatCount = currentRepeat;
        existing.lastUpdated = now;
      } else {
        const rawDelta = currentRepeat - existing.lastRepeatCount;
        deltaCount = rawDelta > 0 ? rawDelta : 0;
        existing.lastRepeatCount = Math.max(existing.lastRepeatCount, currentRepeat);
        existing.lastUpdated = now;
      }

      if (isStreakEnd) {
        this.activeStreaks.delete(streakKey);
      }
    }

    if (!isStreakEnd && existing) {
      existing.lastUpdated = now;
    }

    this.totalGiftsProcessed++;
    this.totalUnitsCalculated += deltaCount;

    return {
      isDuplicate: false,
      deltaCount,
      currentStreak: currentRepeat,
      isStreakEnd,
      streakId: streakKey,
    };
  }

  private cleanupOldEntries(now: number): void {
    // Evict old event IDs
    if (this.processedEventIds.size > 2000) {
      for (const [id, timestamp] of this.processedEventIds.entries()) {
        if (now - timestamp > this.deduplicationTtlMs) {
          this.processedEventIds.delete(id);
        }
      }
    }

    // Evict expired streaks
    for (const [key, streak] of this.activeStreaks.entries()) {
      if (now - streak.lastUpdated > this.streakExpiryMs) {
        this.activeStreaks.delete(key);
      }
    }
  }

  public getActiveStreaksCount(): number {
    return this.activeStreaks.size;
  }

  public clear(): void {
    this.activeStreaks.clear();
    this.processedEventIds.clear();
  }
}
