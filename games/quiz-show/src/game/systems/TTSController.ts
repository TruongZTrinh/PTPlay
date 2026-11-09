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
  public pitch: number = 1.1; // Cheerful, energetic gameshow host tone

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      // Prioritize enthusiastic female gameshow host voice
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

  // --- Host Gameshow Vietnamese Announcements ---

  public announceShowWelcome(): void {
    this.speak('Chào mừng quý vị khán giả đến với trường quay gameshow Đố Vui Có Thưởng!', true);
  }

  public announcePlayerJoin(nickname: string): void {
    this.speak(`Chào mừng bạn ${nickname} đã vào trường quay!`, false, `join_${nickname}`);
  }

  public announceQuestion(roundNumber: number, questionText: string): void {
    this.speak(`Câu hỏi số ${roundNumber}! ${questionText}`, false);
  }

  public announceTimeWarning(): void {
    this.speak('Còn 5 giây cuối cùng, quý vị hãy nhanh tay chốt đáp án!', true, 'time_warning');
  }

  public announceReveal(correctChoice: string, correctText: string, explanation?: string, fastestWinner?: string): void {
    let msg = `Hết giờ! Đáp án chính xác là ${correctChoice}: ${correctText}.`;
    if (fastestWinner) {
      msg += ` Chúc mừng ${fastestWinner} đã trả lời nhanh nhất!`;
    }
    if (explanation) {
      msg += ` ${explanation}`;
    }
    this.speak(msg, true);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      this.speak(`Tuyệt vời! ${nickname} đang có chuỗi ${streak} câu trả lời đúng liên tiếp!`, false, `streak_${nickname}`);
    }
  }

  public announceGift(nickname: string, giftName: string): void {
    this.speak(`Trân trọng cảm ơn bạn ${nickname} đã gửi tặng ${giftName} cổ vũ trường quay!`, false, `gift_${nickname}_${giftName}`);
  }

  public announceChampion(championName: string): void {
    this.speak(`Chúc mừng ${championName} đã xuất sắc đạt ngôi vô địch vòng chơi hôm nay!`, true);
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Xin chào quý vị khán giả! MC ảo tiếng Việt của Đố Vui Có Thưởng đã sẵn sàng dẫn dắt chương trình!', true);
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
