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
  private cooldownMs: number = 1000;
  private recentKeys = new Map<string, number>();
  private cleanupVoiceLoader?: () => void;

  public rate: number = 1.05;
  public pitch: number = 1.1; // Cheerful, warm host tone

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
      window.speechSynthesis.cancel();
      this.queue = [{ text: cleanText, priority: true, createdAt: now }];
      this.isSpeaking = false;
    } else {
      if (this.queue.length >= 3) {
        this.queue.shift();
      }
      this.queue.push({ text: cleanText, priority: false, createdAt: now });
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
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
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

  // --- Rebus Host Vietnamese Announcements ---

  public announceShowWelcome(): void {
    this.speak('Chào mừng cả lớp đến với Đuổi Hình Bắt Chữ! Cùng trổ tài thám tử nhé!', true);
  }

  public announcePlayerJoin(nickname: string): void {
    this.speak(`Chào mừng thám tử ${nickname} đã tham gia giải đố!`, false, `join_${nickname}`);
  }

  public announceRoundStart(roundNumber: number): void {
    this.speak(`Câu đố số ${roundNumber}! Hai hình ảnh ghép thành từ gì nào cả lớp!`, false);
  }

  public announceHint(hintText: string): void {
    this.speak(`Gợi ý: ${hintText}`, false);
  }

  public announceFirstChar(firstChar: string): void {
    this.speak(`Gợi ý chữ cái đầu là chữ: ${firstChar}`, false);
  }

  public announceTimeWarning(): void {
    this.speak('Còn 5 giây cuối cùng, cả lớp nhanh tay gõ đáp án nào!', true, 'time_warning');
  }

  public announceCorrect(nickname: string, answer: string): void {
    this.speak(`Chính xác! ${nickname} đã đoán đúng đáp án ${answer}!`, true);
  }

  public announceTimeout(answer: string, explanation?: string): void {
    let msg = `Hết giờ! Đáp án chính xác là: ${answer}.`;
    if (explanation) {
      msg += ` ${explanation}`;
    }
    this.speak(msg, true);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      this.speak(`Tuyệt vời! ${nickname} đang có chuỗi ${streak} câu giải đúng liên tiếp!`, false, `streak_${nickname}`);
    }
  }

  public announceGift(nickname: string, giftName: string): void {
    this.speak(`Cảm ơn bạn ${nickname} đã gửi tặng ${giftName} cổ vũ lớp học!`, false, `gift_${nickname}_${giftName}`);
  }

  public announceChampion(championName: string): void {
    this.speak(`Vinh danh nhà vô địch Đuổi Hình Bắt Chữ hôm nay: ${championName}!`, true);
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
