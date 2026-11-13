import { AudioEngine } from '../audio/AudioEngine';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

export interface TTSQueueItem {
  text: string;
  priority: boolean;
  createdAt: number;
  onEnd?: () => void;
}

export class TTSController {
  private audioEngine: AudioEngine;
  public isEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: TTSQueueItem[] = [];
  private isSpeaking: boolean = false;
  private currentHttpAudio: HTMLAudioElement | null = null;
  private currentSessionId: number = 0;
  private queueTimer?: any;
  private lastSpeakTime: number = 0;
  private cooldownMs: number = 600;
  private recentKeys = new Map<string, number>();
  private cleanupVoiceLoader?: () => void;
  private watchdogTimer?: any;
  public savedVoiceName?: string;

  public rate: number = 1.05;
  public pitch: number = 1.0; // Natural tone for Neural/Standard voices
  public volume: number = 0.8;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      // 1. If explicit voice was configured or loaded via Admin UI, prioritize it!
      const targetName = this.savedVoiceName || this.loadSavedVoiceConfig()?.voiceName;
      if (targetName) {
        if (VietnameseVoiceHelper.isServerAudioVoice(targetName)) {
          this.savedVoiceName = targetName;
          this.selectedVoice = null;
          return;
        }
        const matched = VietnameseVoiceHelper.findVoiceByName(voices, targetName);
        if (matched) {
          this.selectedVoice = matched;
          this.savedVoiceName = matched.name;
          return;
        }
      }

      // 2. Default: Server-side Neural Female Voice (edge-hoaimy) via GameBridge — works identically on ANY machine
      this.savedVoiceName = VietnameseVoiceHelper.DEFAULT_SERVER_VOICE;
      this.selectedVoice = null;
    });

    // Initial load from local storage & bridge REST API
    this.loadSavedVoiceConfig();

    // Cross-tab synchronization from Admin UI
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if ((e.key === 'ptplay_tts_config' || e.key === 'ptplay_tts_voice') && e.newValue) {
          try {
            if (e.key === 'ptplay_tts_voice') {
              this.setVoiceByName(e.newValue);
            } else {
              const cfg = JSON.parse(e.newValue);
              this.applyVoiceConfig(cfg);
            }
          } catch {}
        }
      });
    }
  }

  public loadSavedVoiceConfig(): { voiceName?: string; rate?: number; pitch?: number; volume?: number } | null {
    if (typeof window === 'undefined') return null;
    let localConfig: any = null;
    try {
      const raw = localStorage.getItem('ptplay_tts_config');
      if (raw) localConfig = JSON.parse(raw);
      const voiceOnly = localStorage.getItem('ptplay_tts_voice');
      if (voiceOnly && !localConfig) localConfig = { voiceName: voiceOnly };

      if (localConfig?.voiceName) {
        this.savedVoiceName = localConfig.voiceName;
        this.setVoiceByName(localConfig.voiceName);
        if (typeof localConfig.rate === 'number') this.rate = localConfig.rate;
        if (typeof localConfig.pitch === 'number') this.pitch = localConfig.pitch;
        if (typeof localConfig.volume === 'number') this.volume = localConfig.volume;
      }
    } catch {}

    // Cross-origin REST API fetch from GameBridge (Port 8088)
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

    return localConfig;
  }

  public setVoiceByName(voiceName: string): boolean {
    if (!voiceName) return false;
    this.savedVoiceName = voiceName;
    if (VietnameseVoiceHelper.isServerAudioVoice(voiceName)) {
      this.selectedVoice = null;
      return true;
    }
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
    if (!config) return;
    if (config.voiceName) {
      this.savedVoiceName = config.voiceName;
      this.setVoiceByName(config.voiceName);
      try {
        localStorage.setItem('ptplay_tts_voice', config.voiceName);
        localStorage.setItem(
          'ptplay_tts_config',
          JSON.stringify({
            voiceName: config.voiceName,
            rate: config.rate ?? this.rate,
            pitch: config.pitch ?? this.pitch,
            volume: config.volume ?? this.volume,
            updatedAt: Date.now(),
          })
        );
      } catch {}
    }
    if (config.pitch !== undefined && !isNaN(Number(config.pitch))) {
      this.pitch = config.pitch;
    }
    if (config.rate !== undefined && !isNaN(Number(config.rate))) this.rate = config.rate;
    if (config.volume !== undefined && !isNaN(Number(config.volume))) {
      this.volume = Math.max(0, Math.min(1.0, Number(config.volume)));
    }
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice;
  }

  public unlock(): boolean {
    return VietnameseVoiceHelper.unlockAudioContext();
  }

  public isSpeakingNow(): boolean {
    return this.isSpeaking || this.currentHttpAudio !== null || this.queue.length > 0;
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

  public speak(text: string, priority: boolean = false, dedupeKey?: string, onEnd?: () => void): void {
    if (!this.isEnabled || !text || !text.trim()) {
      onEnd?.();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    const now = Date.now();
    if (dedupeKey) {
      const last = this.recentKeys.get(dedupeKey) || 0;
      if (now - last < 8000) {
        onEnd?.();
        return;
      }
      this.recentKeys.set(dedupeKey, now);
    }

    const cleanText = VietnameseVoiceHelper.sanitizeTTSText(text, 220);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    if (priority) {
      this.cancel();
      this.queue = [{ text: cleanText, priority: true, createdAt: now, onEnd }];
      this.isSpeaking = false;
      this.scheduleProcessQueue(40);
      return;
    }

    if (this.queue.length >= 2) {
      this.queue.shift();
    }
    this.queue.push({ text: cleanText, priority: false, createdAt: now, onEnd });

    this.scheduleProcessQueue(0);
  }

  private scheduleProcessQueue(delayMs: number = 0): void {
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = undefined;
    }
    if (delayMs <= 0) {
      this.processQueue();
    } else {
      this.queueTimer = setTimeout(() => {
        this.queueTimer = undefined;
        this.processQueue();
      }, delayMs);
    }
  }

  private processQueue(): void {
    if (!this.isEnabled || this.isSpeaking || this.currentHttpAudio !== null || this.queue.length === 0) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    const elapsed = now - this.lastSpeakTime;
    if (elapsed < this.cooldownMs) {
      this.scheduleProcessQueue(this.cooldownMs - elapsed);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    this.audioEngine.setDucking(true);
    const sessionId = ++this.currentSessionId;

    let finished = false;
    const cleanup = () => {
      if (finished || sessionId !== this.currentSessionId) return;
      finished = true;
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = undefined;
      }
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
      try {
        item.onEnd?.();
      } catch {}
      this.scheduleProcessQueue(250);
    };

    if (VietnameseVoiceHelper.isServerAudioVoice(this.savedVoiceName)) {
      this.playHttpTts(item.text, cleanup, sessionId);
      return;
    }

    const utterance = VietnameseVoiceHelper.createVietnameseUtterance(item.text, {
      voice: this.selectedVoice,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
    });

    if (!utterance) {
      cleanup();
      return;
    }

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('[Rebus TTS] Utterance error:', e.error || e);
      cleanup();
    };

    // Safety watchdog: Chromium speech synthesis can sometimes hang or fail to emit onend
    this.watchdogTimer = setTimeout(() => {
      if (this.isSpeaking && sessionId === this.currentSessionId) {
        cleanup();
      }
    }, 12000);

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Rebus TTS] Speak threw error:', err);
      cleanup();
    }
  }

  private playHttpTts(text: string, onEnd: () => void, sessionId: number): void {
    try {
      if (this.currentHttpAudio) {
        const prev = this.currentHttpAudio;
        this.currentHttpAudio = null;
        prev.onended = null;
        prev.onerror = null;
        try {
          prev.pause();
          prev.currentTime = 0;
          prev.src = '';
        } catch {}
      }

      const url = VietnameseVoiceHelper.buildServerTtsUrl(text, {
        voiceName: this.savedVoiceName,
        lang: 'vi',
        rate: this.rate,
        pitch: this.pitch,
      });
      const audio = new Audio(url);
      this.currentHttpAudio = audio;
      audio.volume = Math.max(0, Math.min(1.0, this.volume));

      const handleEnd = () => {
        if (sessionId !== this.currentSessionId) return;
        if (this.currentHttpAudio === audio) {
          this.currentHttpAudio = null;
        }
        audio.onended = null;
        audio.onerror = null;
        onEnd();
      };

      this.watchdogTimer = setTimeout(handleEnd, 15000);
      audio.onended = handleEnd;
      audio.onerror = () => {
        console.warn('[Rebus TTS] Server HTTP audio error');
        handleEnd();
      };
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          if (sessionId === this.currentSessionId) {
            console.warn('[Rebus TTS] Audio play blocked or interrupted:', err);
            handleEnd();
          }
        });
      }
    } catch {
      if (sessionId === this.currentSessionId) {
        if (this.currentHttpAudio) {
          this.currentHttpAudio = null;
        }
        onEnd();
      }
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
    // Nếu MC đang bận nói hoặc có câu trong hàng đợi, bỏ qua câu giới thiệu round để tránh dồn câu
    if (this.isSpeaking || this.currentHttpAudio !== null || this.queue.length > 0) return;
    if (difficulty >= 4) {
      this.speak(`Câu ${roundNumber}! Siêu khó nha, tặng hoa để mở chữ đầu nào!`, false, `round_${roundNumber}`);
    } else if (difficulty === 3) {
      this.speak(`Câu ${roundNumber}! Câu này khó nha, ai giải được không?`, false, `round_${roundNumber}`);
    } else {
      this.speak(`Câu ${roundNumber}! Nhìn hình đoán nhanh nào!`, false, `round_${roundNumber}`);
    }
  }

  public announceInteractiveGuide(): void {
    if (this.isSpeakingNow()) return;
    const guides = [
      'Follow mở chữ đầu, tặng hoa cộng 10 giây, thả tim mở gợi ý nào!',
      'Bấm Follow mở chữ đầu, tặng một bông hoa cộng 10 giây và mở thêm chữ nhé!',
      'Follow mở chữ cái đầu, thả tim nhận gợi ý, tặng hoa cứu giờ nào cả lớp!',
    ];
    const picked = guides[Math.floor(Math.random() * guides.length)];
    this.speak(picked, false, 'guide_reminder');
  }

  public announceTimeAdded(seconds: number, sponsorName?: string): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn');
      if (cleanSponsor.toLowerCase().includes('tim')) {
        this.speak(`Cả phòng đã thả đủ tim! Đã cộng thêm ${seconds} giây suy nghĩ!`, true);
      } else {
        this.speak(`Cảm ơn ${cleanSponsor} tặng Hoa Hồng! Đã cộng thêm ${seconds} giây!`, true);
      }
    } else {
      this.speak(`Cả lớp được cộng thêm ${seconds} giây!`, false);
    }
  }

  public announceLikeBonus(likesCount: number = 20, _unusedCount: number = 1): void {
    const phrases = [
      `Cả phòng đã thả đủ ${likesCount} tim! Mở một chữ cái gợi ý cho cả lớp nhé!`,
      `Tuyệt vời! Đạt mốc ${likesCount} tim rồi, mở một ký tự gợi ý, nhanh tay gõ đáp án nào!`,
      `Cảm ơn cả lớp đã thả đủ ${likesCount} tim! Đã mở thêm một chữ cái trên ô chữ!`,
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
      this.speak(`Cảm ơn ${cleanSponsor} ${action}! Gợi ý: ${cleanHint}!`, true);
    } else {
      this.speak(`Gợi ý: ${cleanHint}!`, false);
    }
  }

  public announceFirstChar(firstChar: string, sponsorName?: string, reason: 'rose' | 'follow' = 'rose', addedSeconds?: number): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn');
      const timePart = addedSeconds ? ` và cộng thêm ${addedSeconds} giây` : '';
      if (reason === 'rose') {
        if (firstChar) {
          this.speak(`Cảm ơn ${cleanSponsor} tặng Hoa Hồng! Mở chữ cái: ${firstChar}${timePart}!`, true);
        } else {
          this.speak(`Cảm ơn ${cleanSponsor} tặng Hoa Hồng! Mở thêm chữ cái${timePart}!`, true);
        }
      } else {
        this.speak(`Cảm ơn ${cleanSponsor} đã Follow! Mở chữ cái đầu là chữ: ${firstChar}!`, true);
      }
    } else {
      this.speak(`Gợi ý chữ cái đầu là chữ: ${firstChar}!`, true);
    }
  }

  public announceTimeWarning(isHard: boolean = false): void {
    if (this.isSpeaking || this.queue.length > 0 || this.currentHttpAudio) return;
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

  public announceTop5Takeover(challengerName: string, rank: number, displacedName?: string, onEnd?: () => void): void {
    const cleanChallenger = VietnameseVoiceHelper.formatNicknameForSpeech(challengerName, 'bạn');
    if (displacedName) {
      const cleanDisplaced = VietnameseVoiceHelper.formatNicknameForSpeech(displacedName, 'bạn');
      this.speak(
        `Yeah! ${cleanChallenger} bứt phá đá bay ${cleanDisplaced} để chiếm ghế VIP hạng ${rank}!`,
        true,
        `top5_${challengerName}_${rank}`,
        onEnd
      );
    } else {
      this.speak(
        `Yeah! Tuyệt vời! ${cleanChallenger} nhảy thẳng lên ghế VIP hạng ${rank}!`,
        true,
        `top5_${challengerName}_${rank}`,
        onEnd
      );
    }
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
    this.currentSessionId++;
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = undefined;
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = undefined;
    }
    if (this.currentHttpAudio) {
      const a = this.currentHttpAudio;
      this.currentHttpAudio = null;
      a.onended = null;
      a.onerror = null;
      try {
        a.pause();
        a.currentTime = 0;
        a.src = '';
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
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
