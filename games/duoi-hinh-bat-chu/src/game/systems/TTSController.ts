import { AudioEngine } from '../audio/AudioEngine';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

export interface TTSQueueItem {
  text: string;
  priority: boolean;
  createdAt: number;
}

export class TTSController {
  private audioEngine: AudioEngine;
  public isEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: TTSQueueItem[] = [];
  private isSpeaking: boolean = false;
  private lastSpeakTime: number = 0;
  private cooldownMs: number = 600;
  private recentKeys = new Map<string, number>();
  private cleanupVoiceLoader?: () => void;
  private watchdogTimer?: any;

  public rate: number = 1.05;
  public pitch: number = 1.05; // Cheerful, warm host tone
  public volume: number = 0.8;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      // 1. Check if user configured a voice in localStorage
      const savedConfig = this.loadSavedVoiceConfig();
      if (savedConfig?.voiceName) {
        const matched = VietnameseVoiceHelper.findVoiceByName(voices, savedConfig.voiceName);
        if (matched) {
          this.selectedVoice = matched;
          if (typeof savedConfig.rate === 'number') this.rate = savedConfig.rate;
          if (typeof savedConfig.pitch === 'number') this.pitch = savedConfig.pitch;
          return;
        }
      }

      // 2. Default: Prioritize female friendly host voice (Microsoft Hoài My, Google Tiếng Việt, Linh)
      const bestVoice =
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'female') ||
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'any');
      if (bestVoice) {
        this.selectedVoice = bestVoice;
      }
    });

    // Cross-tab synchronization from Admin UI
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ptplay_tts_config' && e.newValue) {
          try {
            const cfg = JSON.parse(e.newValue);
            this.applyVoiceConfig(cfg);
          } catch {}
        }
      });
    }
  }

  private loadSavedVoiceConfig(): { voiceName?: string; rate?: number; pitch?: number; volume?: number } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('ptplay_tts_config');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setVoiceByName(voiceName: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const voices = window.speechSynthesis.getVoices();
    const matched = VietnameseVoiceHelper.findVoiceByName(voices, voiceName);
    if (matched) {
      this.selectedVoice = matched;
      return true;
    }
    return false;
  }

  public applyVoiceConfig(config: { voiceName?: string; rate?: number; pitch?: number; volume?: number }): void {
    if (config.voiceName) {
      this.setVoiceByName(config.voiceName);
    }
    if (typeof config.rate === 'number') this.rate = config.rate;
    if (typeof config.pitch === 'number') this.pitch = config.pitch;
    if (typeof config.volume === 'number') this.volume = Math.max(0, Math.min(1.0, config.volume));
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
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
      this.audioEngine.setDucking(false);
    }
  }

  public speak(text: string, priority: boolean = false, dedupeKey?: string): void {
    if (!this.isEnabled || !text || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (dedupeKey) {
      const last = this.recentKeys.get(dedupeKey) || 0;
      if (now - last < 8000) return;
      this.recentKeys.set(dedupeKey, now);
    }

    const cleanText = VietnameseVoiceHelper.sanitizeTTSText(text, 220);
    if (!cleanText) return;

    if (priority) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.queue = [{ text: cleanText, priority: true, createdAt: now }];
      this.isSpeaking = false;
      // Allow 60ms for Chromium audio engine to reset cleanly before firing new utterance
      setTimeout(() => this.processQueue(), 60);
      return;
    }

    if (this.queue.length >= 3) {
      this.queue.shift();
    }
    this.queue.push({ text: cleanText, priority: false, createdAt: now });

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (now - this.lastSpeakTime < this.cooldownMs) {
      setTimeout(() => this.processQueue(), this.cooldownMs - (now - this.lastSpeakTime));
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    this.audioEngine.setDucking(true);

    const utterance = VietnameseVoiceHelper.createVietnameseUtterance(item.text, {
      voice: this.selectedVoice,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
    });

    if (!utterance) {
      this.isSpeaking = false;
      this.audioEngine.setDucking(false);
      return;
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = undefined;
      }
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
      setTimeout(() => this.processQueue(), 250);
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    // Safety watchdog: Chromium speech synthesis can sometimes hang or fail to emit onend
    this.watchdogTimer = setTimeout(() => {
      if (this.isSpeaking) {
        cleanup();
      }
    }, 12000);

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
  }

  // --- Rebus Host Vietnamese Announcements (Focused & Natural) ---

  public announceShowWelcome(): void {
    this.speak('Chào mừng cả lớp đến với Đuổi Hình Bắt Chữ! Cùng trổ tài đoán từ nhé!', true);
  }

  public announcePlayerJoin(_nickname: string): void {
    // Intentionally silent: avoid spamming TTS during high-concurrency streams
  }

  public announceRoundStart(roundNumber: number, difficulty: number = 1): void {
    if (difficulty >= 4) {
      this.speak(`Câu ${roundNumber}! Siêu khó nha, tặng hoa để mở chữ đầu nào!`, false);
    } else if (difficulty === 3) {
      this.speak(`Câu ${roundNumber}! Câu này khó nha, ai giải được không?`, false);
    } else {
      this.speak(`Câu ${roundNumber}! Nhìn hình đoán nhanh nào!`, false);
    }
  }

  public announceTimeAdded(seconds: number, sponsorName?: string): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn');
      if (cleanSponsor.toLowerCase().includes('tim')) {
        this.speak(`Cả phòng đã thả đủ tim! Đã cộng thêm ${seconds} giây suy nghĩ!`, true);
      } else {
        this.speak(`Cảm ơn ${cleanSponsor} tặng Hoa Hồng! Đã cộng thêm ${seconds} giây!`, false);
      }
    } else {
      this.speak(`Cả lớp được cộng thêm ${seconds} giây!`, false);
    }
  }

  public announceLikeBonus(likesCount: number = 20, seconds: number = 5): void {
    const phrases = [
      `Cả phòng đã thả đủ ${likesCount} tim! Tặng thêm ${seconds} giây suy nghĩ cho cả lớp nhé!`,
      `Tuyệt vời! Đạt mốc ${likesCount} tim rồi, cộng thêm ${seconds} giây suy nghĩ, nhanh tay gõ đáp án nào!`,
      `Cảm ơn cả lớp đã thả đủ ${likesCount} tim! Đã cộng thêm ${seconds} giây suy nghĩ!`,
    ];
    const picked = phrases[Math.floor(Math.random() * phrases.length)];
    this.speak(picked, true, 'like_bonus');
  }

  public announceHint(hintText: string, sponsorName?: string, reason: 'rose' | 'follow' = 'follow'): void {
    const cleanHint = hintText
      .replace(/[()+=]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanHint) return;

    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn');
      const action = reason === 'follow' ? 'đã Follow' : 'tặng quà';
      this.speak(`Cảm ơn ${cleanSponsor} ${action}! Gợi ý: ${cleanHint}!`, false);
    } else {
      this.speak(`Gợi ý: ${cleanHint}!`, false);
    }
  }

  public announceFirstChar(firstChar: string, sponsorName?: string, reason: 'rose' | 'follow' = 'rose', addedSeconds?: number): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn');
      const timePart = addedSeconds ? ` và thêm ${addedSeconds} giây` : '';
      if (reason === 'rose') {
        this.speak(`Cảm ơn ${cleanSponsor} tặng Hoa Hồng! Mở chữ đầu là: ${firstChar}${timePart}!`, true);
      } else {
        this.speak(`Cảm ơn ${cleanSponsor} đã Follow! Chữ cái đầu là: ${firstChar}!`, false);
      }
    } else {
      this.speak(`Gợi ý chữ cái đầu là chữ: ${firstChar}!`, false);
    }
  }

  public announceTimeWarning(isHard: boolean = false): void {
    if (this.isSpeaking || this.queue.length > 0) return;
    if (isHard) {
      this.speak('Còn 5 giây! Tặng Hoa Hồng để mở chữ đầu cứu cả lớp nào!', false, 'time_warning');
    } else {
      this.speak('Còn 5 giây cuối cùng! Nhanh tay gõ đáp án nào!', false, 'time_warning');
    }
  }

  public announceCorrect(nickname: string, answer: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn');
    this.speak(`Chính xác! ${cleanNick} đã đoán đúng: ${answer}!`, true);
  }

  public announceTimeout(answer: string, _explanation?: string): void {
    // Speak straight to the point without reciting lengthy formulas
    this.speak(`Hết giờ! Đáp án chính xác là: ${answer}!`, true);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn');
      this.speak(`Tuyệt vời! ${cleanNick} đang có chuỗi ${streak} câu đúng!`, false, `streak_${nickname}`);
    }
  }

  public announceGift(nickname: string, giftName: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn');
    this.speak(`Cảm ơn ${cleanNick} đã tặng ${giftName}!`, false, `gift_${nickname}_${giftName}`);
  }

  public announceChampion(championName: string): void {
    const cleanChamp = VietnameseVoiceHelper.formatNicknameForSpeech(championName, 'thám tử');
    this.speak(`Vinh danh nhà vô địch: ${cleanChamp}! Chúc mừng bạn đã đoạt Cúp Vàng!`, true);
  }

  public announceCeremony(top1?: string, top2?: string, top3?: string): void {
    if (!top1) {
      this.speak('Đại lễ trao giải vinh danh các thám tử xuất sắc nhất phòng Live! Chúc mừng cả lớp!', true);
      return;
    }
    const clean1 = VietnameseVoiceHelper.formatNicknameForSpeech(top1, 'thám tử');
    if (top2 && top3) {
      const clean2 = VietnameseVoiceHelper.formatNicknameForSpeech(top2, 'bạn');
      const clean3 = VietnameseVoiceHelper.formatNicknameForSpeech(top3, 'bạn');
      this.speak(`Vinh danh Tân Quán Quân: ${clean1}! Cùng Á Quân ${clean2} và Quý Quân ${clean3}! Chúc mừng các bạn!`, true);
    } else if (top2) {
      const clean2 = VietnameseVoiceHelper.formatNicknameForSpeech(top2, 'bạn');
      this.speak(`Vinh danh Quán Quân: ${clean1}! Cùng Á Quân ${clean2}! Chúc mừng các bạn!`, true);
    } else {
      this.speak(`Vinh danh Quán Quân: ${clean1}! Xuất sắc đoạt Cúp Vàng hôm nay!`, true);
    }
  }

  public getVoiceInfo(): { name: string; isVietnamese: boolean } {
    if (this.selectedVoice) {
      return { name: this.selectedVoice.name, isVietnamese: true };
    }
    return { name: 'Mặc định OS (Chưa cài Tiếng Việt)', isVietnamese: false };
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Xin chào cả lớp! MC tiếng Việt của Đuổi Hình Bắt Chữ đã sẵn sàng hỗ trợ các bạn!', true);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
    this.audioEngine.setDucking(false);
  }

  public destroy(): void {
    this.cancel();
    if (this.cleanupVoiceLoader) {
      this.cleanupVoiceLoader();
    }
  }
}
