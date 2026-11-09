export type GiftEffectType =
  | 'rose_petals'
  | 'heart_rain'
  | 'galaxy_party'
  | 'royal_spotlight'
  | 'fireworks'
  | 'magic_stars'
  | 'teacher_dance'
  | 'class_confetti';

export interface ActiveGiftVisual {
  id: string;
  type: GiftEffectType;
  senderName: string;
  giftName: string;
  count: number;
  startedAt: number;
  durationMs: number;
}

export class GiftReactionController {
  private activeVisual: ActiveGiftVisual | null = null;
  private queue: ActiveGiftVisual[] = [];
  private lastTriggerTime = new Map<string, number>();
  private readonly maxQueue = 8;

  public resolveEffectType(giftName: string): GiftEffectType {
    const clean = (giftName || '').toLowerCase().trim();
    if (clean.includes('rose') || clean.includes('hoa') || clean.includes('bông')) {
      return 'rose_petals';
    }
    if (clean.includes('heart') || clean.includes('tim') || clean.includes('love')) {
      return 'heart_rain';
    }
    if (clean.includes('universe') || clean.includes('vũ trụ') || clean.includes('galaxy') || clean.includes('hành tinh')) {
      return 'galaxy_party';
    }
    if (clean.includes('lion') || clean.includes('sư tử') || clean.includes('crown') || clean.includes('vương miện')) {
      return 'royal_spotlight';
    }
    if (clean.includes('firework') || clean.includes('pháo')) {
      return 'fireworks';
    }
    if (clean.includes('magic') || clean.includes('wand') || clean.includes('phép')) {
      return 'magic_stars';
    }
    if (clean.includes('dance') || clean.includes('nhảy')) {
      return 'teacher_dance';
    }
    return 'class_confetti';
  }

  public enqueueGift(senderName: string, giftName: string, count = 1, now = Date.now()): ActiveGiftVisual | null {
    const effectType = this.resolveEffectType(giftName);

    // Cooldown check for major cinematic effects (galaxy party 8s, spotlight 5s)
    const lastTime = this.lastTriggerTime.get(effectType) || 0;
    const cooldownMs = effectType === 'galaxy_party' ? 8000 : effectType === 'royal_spotlight' ? 5000 : 1500;
    if (now - lastTime < cooldownMs && this.activeVisual?.type === effectType) {
      return null;
    }
    this.lastTriggerTime.set(effectType, now);

    const durationMap: Record<GiftEffectType, number> = {
      rose_petals: 2200,
      heart_rain: 2400,
      galaxy_party: 5500,
      royal_spotlight: 4000,
      fireworks: 3200,
      magic_stars: 2500,
      teacher_dance: 3500,
      class_confetti: 2800,
    };

    const visual: ActiveGiftVisual = {
      id: `gift_fx_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type: effectType,
      senderName,
      giftName,
      count,
      startedAt: now,
      durationMs: durationMap[effectType],
    };

    if (!this.activeVisual) {
      this.activeVisual = visual;
    } else if (this.queue.length < this.maxQueue) {
      this.queue.push(visual);
    }

    return visual;
  }

  public tick(now = Date.now()): ActiveGiftVisual | null {
    if (this.activeVisual && now - this.activeVisual.startedAt >= this.activeVisual.durationMs) {
      this.activeVisual = this.queue.shift() || null;
      if (this.activeVisual) {
        this.activeVisual.startedAt = now;
      }
    }
    return this.activeVisual;
  }

  public getActiveVisual(): ActiveGiftVisual | null {
    return this.activeVisual;
  }

  public clear(): void {
    this.activeVisual = null;
    this.queue = [];
  }
}
