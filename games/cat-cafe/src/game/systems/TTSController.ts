import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { TextSanitizer } from '../utils/TextSanitizer';

export interface TTSOptions {
  enabled?: boolean;
  rate?: number;
  pitch?: number;
  cooldownMs?: number;
}

export class TTSController {
  private static instance: TTSController;
  private isEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: Array<{ text: string; priority?: boolean }> = [];
  private isSpeaking: boolean = false;
  private lastSpeakTime: number = 0;
  private cooldownMs: number = 1200;
  private rate: number = 1.05;
  private pitch: number = 1.15; // Cheerful, warm cafe host tone
  private recentWelcomeViewers: Set<string> = new Set();

  private constructor() {
    this.initVoices();
  }

  public static getInstance(): TTSController {
    if (!TTSController.instance) {
      TTSController.instance = new TTSController();
    }
    return TTSController.instance;
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prioritize Vietnamese voices (e.g. Microsoft HoaiMy, NamMinh, Google Tiếng Việt)
      const viVoice = voices.find((v) => v.lang.toLowerCase().includes('vi'));
      if (viVoice) {
        this.selectedVoice = viVoice;
      } else {
        // Fallback to English or default system voice
        const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
        this.selectedVoice = enVoice || voices[0] || null;
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.queue = [];
      this.isSpeaking = false;
      CafeAudioEngine.getInstance().setDucking(false);
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Welcomes a newly joined viewer and their cat into the cafe with warm, varied greetings.
   */
  public welcomeNewViewer(nickname: string, coatName?: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';

    // Debounce recently welcomed viewers (10s)
    if (this.recentWelcomeViewers.has(cleanNick)) return '';
    this.recentWelcomeViewers.add(cleanNick);
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        this.recentWelcomeViewers.delete(cleanNick);
      }, 10000);
    }

    const greetings = coatName
      ? [
          `Chào mừng bạn ${cleanNick} đã đến với Café Mòe! Bé mèo ${coatName} xinh xắn quá!`,
          `Quán chào bạn ${cleanNick}! Bé mèo ${coatName} đã có chỗ nằm êm ái rồi nhé!`,
          `Meo meo! Hoan nghênh bạn ${cleanNick} và bé mèo ${coatName} đã ghé chơi quán!`,
          `Chào bạn ${cleanNick}! Chúc bạn và bé mèo ${coatName} có một buổi ngắm mèo thư giãn nhé!`,
        ]
      : [
          `Chào mừng bạn ${cleanNick} đã ghé thăm quán Café Mòe!`,
          `Meo meo! Quán chào bạn ${cleanNick} nhé! Chúc bạn xem live vui vẻ!`,
          `Hoan nghênh bạn ${cleanNick} đã đến với ngôi nhà chung của các bé mèo!`,
        ];

    const text = greetings[Math.floor(Math.random() * greetings.length)];
    if (this.isEnabled) {
      this.speak(text);
    }
    return text;
  }

  /**
   * Welcomes back an existing viewer who returned to the cafe.
   */
  public welcomeReturningViewer(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';

    if (this.recentWelcomeViewers.has(cleanNick)) return '';
    this.recentWelcomeViewers.add(cleanNick);
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        this.recentWelcomeViewers.delete(cleanNick);
      }, 15000);
    }

    const welcomeBack = [
      `Chào mừng bạn ${cleanNick} đã trở lại quán Café Mòe!`,
      `Bé mèo đang vẫy đuôi mừng bạn ${cleanNick} quay lại quán nè!`,
    ];
    const text = welcomeBack[Math.floor(Math.random() * welcomeBack.length)];
    if (this.isEnabled) {
      this.speak(text);
    }
    return text;
  }

  public speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (priority) {
      window.speechSynthesis.cancel();
      this.queue = [{ text, priority: true }];
      this.isSpeaking = false;
    } else {
      // Discard stale greetings if queue builds up during busy stream traffic
      if (this.queue.length >= 3) {
        this.queue.shift();
      }
      this.queue.push({ text });
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (now - this.lastSpeakTime < this.cooldownMs) {
      setTimeout(() => this.processQueue(), this.cooldownMs);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    CafeAudioEngine.getInstance().setDucking(true);

    const utterance = new SpeechSynthesisUtterance(item.text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      CafeAudioEngine.getInstance().setDucking(false);
      setTimeout(() => this.processQueue(), 300);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      CafeAudioEngine.getInstance().setDucking(false);
      setTimeout(() => this.processQueue(), 200);
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
    CafeAudioEngine.getInstance().setDucking(false);
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
