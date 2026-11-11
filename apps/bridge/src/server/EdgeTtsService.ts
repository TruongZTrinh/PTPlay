import { EdgeTTS } from '@andresaya/edge-tts';

export const EDGE_VOICE_MAP: Record<string, string> = {
  'edge-hoaimy': 'vi-VN-HoaiMyNeural',
  'edge-namminh': 'vi-VN-NamMinhNeural',
  'edge-jenny': 'en-US-JennyNeural',
  'edge-guy': 'en-US-GuyNeural',
};

export class EdgeTtsService {
  private cache = new Map<string, Buffer>();
  private inFlight = new Map<string, Promise<Buffer>>();
  private queue: Promise<void> = Promise.resolve();
  private lastSynthAt = 0;
  private readonly maxCacheEntries = 150;
  private readonly minGapMs = 350;

  public static isEdgeServerVoice(voiceId?: string): boolean {
    if (!voiceId) return false;
    return voiceId in EDGE_VOICE_MAP || /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z]+Neural$/.test(voiceId);
  }

  public static resolveShortName(voiceId?: string): string {
    if (!voiceId) return 'vi-VN-HoaiMyNeural';
    if (EDGE_VOICE_MAP[voiceId]) return EDGE_VOICE_MAP[voiceId];
    if (/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z]+Neural$/.test(voiceId)) return voiceId;
    return 'vi-VN-HoaiMyNeural';
  }

  public async synthesize(
    text: string,
    voiceId: string = 'edge-hoaimy',
    rate: number = 1.05,
    pitch: number = 1.0
  ): Promise<Buffer> {
    const cleanText = String(text || '').trim().slice(0, 300);
    if (!cleanText) {
      throw new Error('Text is required');
    }

    const shortName = EdgeTtsService.resolveShortName(voiceId);
    const safeRate = Math.max(0.5, Math.min(2.0, Number.isFinite(rate) ? rate : 1.05));
    const safePitch = Math.max(0.5, Math.min(2.0, Number.isFinite(pitch) ? pitch : 1.0));
    const rateOffsetPct = Math.round((safeRate - 1.0) * 100);
    const rateStr = `${rateOffsetPct >= 0 ? '+' : ''}${rateOffsetPct}%`;
    const pitchOffsetHz = Math.round((safePitch - 1.0) * 50);
    const pitchStr = `${pitchOffsetHz >= 0 ? '+' : ''}${pitchOffsetHz}Hz`;

    const cacheKey = `${shortName}|${rateStr}|${pitchStr}|${cleanText}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return cached;
    }

    const existingPromise = this.inFlight.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const work = this.enqueueSynthesis(cacheKey, cleanText, shortName, rateStr, pitchStr);
    this.inFlight.set(cacheKey, work);
    try {
      return await work;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  private enqueueSynthesis(
    cacheKey: string,
    cleanText: string,
    shortName: string,
    rateStr: string,
    pitchStr: string
  ): Promise<Buffer> {
    const runTask = async (): Promise<Buffer> => {
      const waitMs = Math.max(0, this.lastSynthAt + this.minGapMs - Date.now());
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }

      let lastErr: Error | null = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const tts = new EdgeTTS();
          await tts.synthesize(cleanText, shortName, {
            rate: rateStr,
            pitch: pitchStr,
          });
          this.lastSynthAt = Date.now();
          const buffer = tts.toBuffer();
          if (!buffer || buffer.length === 0) {
            throw new Error('Edge TTS returned empty audio buffer');
          }

          if (this.cache.size >= this.maxCacheEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) this.cache.delete(oldestKey);
          }
          this.cache.set(cacheKey, buffer);
          return buffer;
        } catch (err: any) {
          this.lastSynthAt = Date.now();
          lastErr = err instanceof Error ? err : new Error(String(err));
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 600));
          }
        }
      }

      throw lastErr || new Error('Edge TTS synthesis failed');
    };

    const next = this.queue.then(runTask, runTask);
    this.queue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }
}
