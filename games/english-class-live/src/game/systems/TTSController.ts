import { AudioEngine } from '../audio/AudioEngine.js';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

export type SpeechPriority = 0 | 1 | 2 | 3;

export interface SpeechUtteranceItem {
  text: string;
  lang: 'vi-VN' | 'en-US' | 'en-GB';
  priority: SpeechPriority;
  createdAt: number;
  dedupeKey?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export class TTSController {
  private queue: SpeechUtteranceItem[] = [];
  private isBusy = false;
  private isUnlocked = false;
  private recentKeys = new Map<string, number>();

  public enabled = true;
  public vietnameseEnabled = true;
  public englishEnabled = true;
  public rate = 1.0;
  public volume = 0.85;
  public maxQueue = 6;
  public maxAgeMs = 12000;

  public viVoiceName?: string;
  public enVoiceName?: string;
  public availableVoices: SpeechSynthesisVoice[] = [];

  constructor(private audioEngine?: AudioEngine) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  public loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.availableVoices = window.speechSynthesis.getVoices();

    // Auto-select best Vietnamese and English voices
    if (!this.viVoiceName) {
      const bestVi = VietnameseVoiceHelper.selectBestVietnameseVoice(this.availableVoices, 'female');
      if (bestVi) this.viVoiceName = bestVi.name;
    }
    if (!this.enVoiceName) {
      const en = this.availableVoices.find(
        (v) =>
          (v.lang.toLowerCase().startsWith('en-us') || v.lang.toLowerCase().startsWith('en-gb')) &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha'))
      ) || this.availableVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (en) this.enVoiceName = en.name;
    }
  }

  public unlock(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    this.isUnlocked = true;
    this.enabled = true;
    this.loadVoices();

    // Short silent primer utterance to satisfy Chrome user interaction restriction
    try {
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0.01;
      primer.rate = 2.0;
      window.speechSynthesis.speak(primer);
    } catch {
      // Ignore primer failure
    }
    return true;
  }

  public speak(
    text: string,
    lang: 'vi-VN' | 'en-US' | 'en-GB' = 'vi-VN',
    priority: SpeechPriority = 1,
    dedupeKey?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (!this.enabled || !this.isUnlocked || !text || !text.trim()) return false;
    if (lang === 'vi-VN' && !this.vietnameseEnabled) return false;
    if ((lang === 'en-US' || lang === 'en-GB') && !this.englishEnabled) return false;

    const now = Date.now();
    if (dedupeKey && now - (this.recentKeys.get(dedupeKey) || 0) < 15000) {
      return false;
    }
    if (dedupeKey) this.recentKeys.set(dedupeKey, now);

    // Sanitize string
    const safeText = text
      .replace(/[<>\u0000-\u001F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);

    // Evict expired utterances
    this.queue = this.queue.filter((item) => now - item.createdAt < this.maxAgeMs);

    if (this.queue.length >= this.maxQueue) {
      const minPriority = Math.min(...this.queue.map((q) => q.priority));
      if (priority <= minPriority) return false;
      const removeIdx = this.queue.findIndex((q) => q.priority === minPriority);
      if (removeIdx !== -1) this.queue.splice(removeIdx, 1);
    }

    this.queue.push({
      text: safeText,
      lang,
      priority,
      createdAt: now,
      dedupeKey,
      onStart,
      onEnd,
    });

    // Sort by priority descending, then timestamp ascending
    this.queue.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
    void this.processQueue();
    return true;
  }

  private async processQueue(): Promise<void> {
    if (this.isBusy || !this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    if (Date.now() - item.createdAt > this.maxAgeMs) {
      void this.processQueue();
      return;
    }

    this.isBusy = true;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = item.lang;
    utterance.rate = this.rate;
    utterance.volume = this.volume;

    const voices = window.speechSynthesis.getVoices();
    const targetName = item.lang.startsWith('vi') ? this.viVoiceName : this.enVoiceName;
    const voiceByName = voices.find((v) => v.name === targetName);
    const voiceByLang = voices.find((v) => v.lang.toLowerCase().startsWith(item.lang.slice(0, 2).toLowerCase()));
    if (voiceByName || voiceByLang) {
      utterance.voice = (voiceByName || voiceByLang)!;
    }

    // Duck BGM during voice speech
    if (this.audioEngine) {
      const estimatedDurationMs = Math.max(1500, Math.floor((item.text.length / 15) * 1000));
      this.audioEngine.duckBgm(estimatedDurationMs, 0.2);
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.isBusy = false;
      if (item.onEnd) item.onEnd();
      void this.processQueue();
    };

    utterance.onstart = () => {
      if (item.onStart) item.onStart();
    };
    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    window.speechSynthesis.speak(utterance);
  }

  // --- Host Script Helpers from docs/04_TTS_HOST_SCRIPT.md ---

  public announceWelcome(nickname?: string): void {
    if (nickname) {
      this.speak(`Chào mừng bạn ${nickname} đã vào lớp học vui!`, 'vi-VN', 1, `join_${nickname}`);
    } else {
      this.speak('Xin chào cả lớp! Hôm nay chúng ta cùng học tiếng Anh thật vui nhé!', 'vi-VN', 1, 'welcome_all');
    }
  }

  public announceQuestion(promptVi: string, promptEn: string, audioText?: string): void {
    if (promptVi) {
      this.speak(`Cả lớp chú ý: ${promptVi}`, 'vi-VN', 3, undefined);
    }
    const englishToSpeak = audioText || promptEn;
    if (englishToSpeak) {
      setTimeout(() => {
        this.speak(englishToSpeak, 'en-US', 3, undefined);
      }, 700);
    }
  }

  public announceTimeWarning(): void {
    this.speak('Còn 5 giây, nhanh tay chọn đáp án nhé cả lớp!', 'vi-VN', 2, 'time_warning');
  }

  public announceReveal(correctChoice: string, explanation: string, fastestWinner?: string): void {
    let msg = `Hết giờ! Đáp án chính xác là ${correctChoice}.`;
    if (fastestWinner) {
      msg += ` Chúc mừng ${fastestWinner} đã trả lời nhanh nhất!`;
    }
    if (explanation) {
      msg += ` ${explanation}`;
    }
    this.speak(msg, 'vi-VN', 2, undefined);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      this.speak(`Tuyệt vời! ${nickname} đang có chuỗi ${streak} câu đúng liên tiếp!`, 'vi-VN', 2, `streak_${nickname}`);
    }
  }

  public announceBossIntro(): void {
    this.speak('Đến câu đặc biệt rồi! Câu Boss xuất hiện, cả lớp cùng chung sức nhé!', 'vi-VN', 3, 'boss_intro');
  }

  public announceBossVictory(totalCorrect: number): void {
    this.speak(`Tuyệt vời! Cả lớp đã có ${totalCorrect} câu trả lời đúng và đánh bại câu Boss!`, 'vi-VN', 3, 'boss_win');
  }

  public announceGift(nickname: string, giftName: string): void {
    this.speak(`Cảm ơn ${nickname} đã gửi tặng ${giftName} cổ vũ lớp học!`, 'vi-VN', 1, `gift_${nickname}_${giftName}`);
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Xin chào cả lớp! Mình cùng luyện tiếng Anh nhé! Let us practice English together!', 'vi-VN', 3);
  }

  public stop(): void {
    this.queue = [];
    this.isBusy = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
