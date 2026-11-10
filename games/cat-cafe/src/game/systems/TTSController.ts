import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { TextSanitizer } from '../utils/TextSanitizer';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

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
  private cooldownMs: number = 1100;
  public rate: number = 1.05;
  public pitch: number = 1.15; // Cheerful, warm cafe host tone
  public volume: number = 0.8;
  public savedVoiceName?: string;
  private recentWelcomeViewers: Set<string> = new Set();
  private recentKeys: Map<string, number> = new Map();
  private cleanupVoiceLoader?: () => void;

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

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      if (this.savedVoiceName) {
        const customVoice = VietnameseVoiceHelper.findVoiceByName(voices, this.savedVoiceName);
        if (customVoice) {
          this.selectedVoice = customVoice;
          return;
        }
      }
      // Prioritize warm female cafe host voice (e.g. HoaiMy, Google Tiếng Việt, Linh)
      const bestVoice =
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'female') ||
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'any');
      if (bestVoice) {
        this.selectedVoice = bestVoice;
      }
    });

    this.loadSavedVoiceConfig();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ptplay_tts_voice' && e.newValue) {
          this.setVoiceByName(e.newValue);
        }
      });
    }
  }

  public setVoiceByName(voiceName: string): boolean {
    this.savedVoiceName = voiceName;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const match = VietnameseVoiceHelper.findVoiceByName(voices, voiceName);
      if (match) {
        this.selectedVoice = match;
        return true;
      }
    }
    return false;
  }

  public applyVoiceConfig(config: { voiceName?: string; rate?: number; pitch?: number; volume?: number }): void {
    if (!config) return;
    if (config.voiceName) {
      this.setVoiceByName(config.voiceName);
      try {
        localStorage.setItem('ptplay_tts_voice', config.voiceName);
      } catch {}
    }
    if (config.rate !== undefined && !isNaN(Number(config.rate))) {
      this.rate = Math.max(0.5, Math.min(2.0, Number(config.rate)));
    }
    if (config.pitch !== undefined && !isNaN(Number(config.pitch))) {
      this.pitch = Math.max(0.5, Math.min(2.0, Number(config.pitch)));
    }
    if (config.volume !== undefined && !isNaN(Number(config.volume))) {
      this.volume = Math.max(0, Math.min(1.0, Number(config.volume)));
    }
  }

  public loadSavedVoiceConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      const local = localStorage.getItem('ptplay_tts_voice');
      if (local) {
        this.setVoiceByName(local);
      }
    } catch {}

    if (typeof fetch !== 'undefined') {
      fetch('http://127.0.0.1:8088/api/tts/config')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.config) {
            this.applyVoiceConfig(data.config);
          }
        })
        .catch(() => {});
    }
  }

  public unlock(): boolean {
    return VietnameseVoiceHelper.unlockAudioContext();
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

  /**
   * Announces viewer gift donations with delightful cat-themed commentary.
   */
  public announceGift(nickname: string, giftName: string, count: number = 1): void {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return;

    const lower = giftName.toLowerCase();
    let text = '';
    let priority = false;

    if (lower.includes('lion') || lower.includes('su tu') || lower.includes('sư tử')) {
      text = `Đại lễ hoàng gia! Bạn ${cleanNick} vừa tặng Sư Tử x${count}, bé mèo chính thức đăng quang Hoàng Gia!`;
      priority = true;
    } else if (lower.includes('universe') || lower.includes('vũ trụ')) {
      text = `Đại tiệc vũ trụ! Bạn ${cleanNick} vừa tặng Vũ Trụ x${count}, cả quán mèo mở hội tưng bừng!`;
      priority = true;
    } else if (lower.includes('rose') || lower.includes('hoa') || lower.includes('cá') || lower.includes('fish')) {
      text = `Cảm ơn bạn ${cleanNick} đã tặng ${giftName} x${count}! Quán thưởng ngay một bữa cá thơm ngon cho các bé mèo!`;
    } else if (lower.includes('heart') || lower.includes('tim')) {
      text = `Cơn mưa tim ngập tràn từ bạn ${cleanNick}! Cả quán mèo meo meo cảm ơn bạn!`;
    } else if (lower.includes('cake') || lower.includes('bánh')) {
      text = `Cảm ơn bạn ${cleanNick} đã gửi tặng Bánh Kem x${count} mở tiệc sinh nhật ngọt ngào cho các bé mèo!`;
    } else if (lower.includes('yarn') || lower.includes('len')) {
      text = `Cảm ơn bạn ${cleanNick} đã tặng Cuộn Len x${count}! Các bé mèo thích mê luôn!`;
    } else if (lower.includes('fireworks') || lower.includes('pháo')) {
      text = `Pháo hoa rực rỡ! Cảm ơn bạn ${cleanNick} đã bắn Pháo Hoa x${count} chúc mừng quán mèo!`;
    } else if (lower.includes('coffee') || lower.includes('cà phê')) {
      text = `Cảm ơn bạn ${cleanNick} đã gửi tặng Cà Phê x${count} tiếp năng lượng cho streamer và các bé mèo!`;
    } else {
      text = `Cảm ơn bạn ${cleanNick} đã gửi tặng ${giftName} x${count} mở tiệc cho cả quán mèo!`;
    }

    this.speak(text, priority, `gift_${cleanNick}_${giftName}`);
  }

  /**
   * Announces cafe level progression milestone.
   */
  public announceLevelUp(newLevel: number): void {
    const text = `Chúc mừng quán Café Mòe đã chính thức thăng cấp lên Cấp ${newLevel}! Cảm ơn cả nhà đã chung tay chăm sóc các bé mèo!`;
    this.speak(text, true);
  }

  /**
   * Announces humorous cat reaction states.
   */
  public announceAngry(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';
    const lines = [
      `Úi chà! Bé mèo của bạn ${cleanNick} đang giận dỗi tím người kìa! Mau nựng hoặc cho ăn cá để dỗ hoàng thượng đi nào!`,
      `Căng thẳng rồi! Bé mèo của ${cleanNick} đang khè và quạu quọ rồi! Cần cấp cứu bằng cá nướng gấp!`,
      `Hoàng thượng của ${cleanNick} hờn cả thế giới rồi! Ai làm bé giận thì mau vào xin lỗi đi nhé!`,
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.speak(text, false, `angry_${cleanNick}`);
    return text;
  }

  public announceDance(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';
    const lines = [
      `Bé mèo của ${cleanNick} đang bật chế độ quẩy tưng bừng! Nhảy cực sung luôn!`,
      `Lên nhạc là quẩy! Bé mèo của ${cleanNick} đang lắc mông siêu dẻo kìa cả nhà ơi!`,
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.speak(text, false, `dance_${cleanNick}`);
    return text;
  }

  public announceZoomies(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';
    const lines = [
      `Bé mèo của ${cleanNick} bị ngáo ba giờ sáng rồi, đang phóng bạt mạng khắp quán kìa!`,
      `Né đường gấp! Bé mèo của ${cleanNick} đang bật số tua-bô chạy không phanh!`,
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.speak(text, false, `zoom_${cleanNick}`);
    return text;
  }

  public announceBox(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';
    const lines = [
      `Bé mèo của ${cleanNick} chui tọt vào hộp các-tông ngồi tự kỷ rồi, đúng là pháo đài bất khả xâm phạm!`,
      `Giường êm không nằm, bé mèo của ${cleanNick} lại thích chui thùng các-tông ngộ ghê!`,
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.speak(text, false, `box_${cleanNick}`);
    return text;
  }

  public announceBath(nickname: string): string {
    const cleanNick = TextSanitizer.sanitizeNickname(nickname);
    if (!cleanNick) return '';
    const lines = [
      `Bé mèo của ${cleanNick} đang tắm rửa liếm lông siêu điệu đà, xinh xắn quá đi thôi!`,
      `Xì-pa thư giãn! Bé mèo của ${cleanNick} đang tút lại nhan sắc chuẩn bị lên hình triệu view!`,
    ];
    const text = lines[Math.floor(Math.random() * lines.length)];
    this.speak(text, false, `bath_${cleanNick}`);
    return text;
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Meo meo! Quán Café Mòe xin chào! Giọng đọc tiếng Việt đã sẵn sàng phục vụ quý khách!', true);
  }

  public speak(text: string, priority: boolean = false, dedupeKey?: string): void {
    if (!this.isEnabled || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (dedupeKey) {
      const last = this.recentKeys.get(dedupeKey) || 0;
      if (now - last < 8000) return;
      this.recentKeys.set(dedupeKey, now);
    }

    const cleanText = VietnameseVoiceHelper.sanitizeTTSText(text, 200);
    if (!cleanText) return;

    if (priority) {
      window.speechSynthesis.cancel();
      this.queue = [{ text: cleanText, priority: true }];
      this.isSpeaking = false;
    } else {
      if (this.queue.length >= 3) {
        this.queue.shift();
      }
      this.queue.push({ text: cleanText });
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

    const utterance = VietnameseVoiceHelper.createVietnameseUtterance(item.text, {
      voice: this.selectedVoice,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
    });

    if (!utterance) {
      this.isSpeaking = false;
      CafeAudioEngine.getInstance().setDucking(false);
      return;
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      CafeAudioEngine.getInstance().setDucking(false);
      setTimeout(() => this.processQueue(), 300);
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
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
