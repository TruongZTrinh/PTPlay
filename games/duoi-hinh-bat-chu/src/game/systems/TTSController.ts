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

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      // Prioritize female friendly host voice (e.g. HoaiMy, Google Tiếng Việt, Linh)
      const bestVoice =
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'female') ||
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'any');
      if (bestVoice) {
        this.selectedVoice = bestVoice;
      }
    });
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

  // --- Rebus Host Vietnamese Announcements ---

  public announceShowWelcome(): void {
    this.speak('Chào mừng cả lớp đến với Đuổi Hình Bắt Chữ! Cùng trổ tài thám tử nhé!', true);
  }

  public announcePlayerJoin(nickname: string): void {
    // Only speak player join if not currently speaking a puzzle clue
    if (!this.isSpeaking && this.queue.length === 0) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'thám tử mới');
      this.speak(`Chào mừng thám tử ${cleanNick} đã tham gia giải đố!`, false, `join_${nickname}`);
    }
  }

  public announceRoundStart(roundNumber: number): void {
    this.speak(`Câu số ${roundNumber}! Hãy quan sát hình ảnh và nhanh tay đoán từ khóa nào cả lớp!`, false);
  }

  public announceTimeAdded(seconds: number, sponsorName?: string): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn khán giả');
      this.speak(`Cảm ơn bạn ${cleanSponsor} đã tặng Hoa Hồng! Cả lớp được cộng thêm ${seconds} giây suy nghĩ!`, false);
    } else {
      this.speak(`Cả lớp được cộng thêm ${seconds} giây suy nghĩ!`, false);
    }
  }

  public announceHint(hintText: string, sponsorName?: string, reason: 'rose' | 'follow' = 'rose'): void {
    const cleanHint = hintText
      .replace(/[()+=]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanHint) return;

    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn khán giả');
      const actionText = reason === 'follow' ? 'đã theo dõi kênh và' : 'đã tặng quà cổ vũ để';
      this.speak(`Cảm ơn bạn ${cleanSponsor} ${actionText} mở gợi ý cho cả lớp! Gợi ý là: ${cleanHint}`, false);
    } else {
      this.speak(`Gợi ý dành cho cả lớp: ${cleanHint}`, false);
    }
  }

  public announceFirstChar(firstChar: string, sponsorName?: string, reason: 'rose' | 'follow' = 'follow'): void {
    if (sponsorName) {
      const cleanSponsor = VietnameseVoiceHelper.formatNicknameForSpeech(sponsorName, 'bạn khán giả');
      this.speak(`Cảm ơn bạn ${cleanSponsor} đã theo dõi kênh và mở chữ cái đầu tiên! Chữ cái đầu là ${firstChar}!`, false);
    } else {
      this.speak(`Gợi ý chữ cái đầu tiên là chữ ${firstChar}!`, false);
    }
  }

  public announceTimeWarning(): void {
    // Only announce 5s warning if not already speaking a hint to avoid cutting off clues
    if (this.isSpeaking || this.queue.length > 0) return;
    this.speak('Còn 5 giây cuối cùng, cả lớp nhanh tay gõ đáp án nào!', false, 'time_warning');
  }

  public announceCorrect(nickname: string, answer: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
    this.speak(`Chính xác! Bạn ${cleanNick} đã giải đố nhanh nhất với đáp án ${answer}!`, true);
  }

  public announceTimeout(answer: string, explanation?: string): void {
    let msg = `Hết giờ! Đáp án chính xác là: ${answer}.`;
    if (explanation) {
      const cleanExp = explanation
        .replace(/\([^)]*\)/g, '')
        .replace(/\+/g, ' kết hợp cùng ')
        .replace(/=/g, ' tạo thành ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanExp) {
        msg += ` ${cleanExp}`;
      }
    }
    this.speak(msg, true);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
      this.speak(`Tuyệt vời! ${cleanNick} đang có chuỗi ${streak} câu giải đúng liên tiếp!`, false, `streak_${nickname}`);
    }
  }

  public announceGift(nickname: string, giftName: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
    this.speak(`Cảm ơn bạn ${cleanNick} đã gửi tặng ${giftName} cổ vũ lớp học!`, false, `gift_${nickname}_${giftName}`);
  }

  public announceChampion(championName: string): void {
    const cleanChamp = VietnameseVoiceHelper.formatNicknameForSpeech(championName, 'thám tử xuất sắc');
    this.speak(`Vinh danh nhà vô địch Đuổi Hình Bắt Chữ hôm nay: ${cleanChamp}!`, true);
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
