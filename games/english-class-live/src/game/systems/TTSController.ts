import { AudioEngine } from '../audio/AudioEngine.js';
import { VietnameseVoiceHelper, EnglishVoiceHelper } from '@ptplay/game-sdk';
import type { QuizQuestion } from '../types.js';

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
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeUtterances = new Set<SpeechSynthesisUtterance>();
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;

  public enabled = true;
  public vietnameseEnabled = true;
  public englishEnabled = true;
  public rate = 1.0;
  public volume = 0.85;
  public maxQueue = 8;
  public maxAgeMs = 15000;

  public isSpeakingQuestionPrompt = false;
  public viVoiceName?: string;
  public enVoiceName?: string;
  public availableVoices: SpeechSynthesisVoice[] = [];

  public onSpeechStart?: (item: SpeechUtteranceItem) => void;
  public onSpeechEnd?: (item: SpeechUtteranceItem) => void;

  constructor(private audioEngine?: AudioEngine) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();

      // Chrome keep-alive: prevent browser synthesis stall
      this.keepAliveInterval = setInterval(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      }, 5000);
    }
  }

  public loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;
    this.availableVoices = voices;

    // Auto-select best Vietnamese and English voices
    const bestVi = VietnameseVoiceHelper.selectBestVietnameseVoice(this.availableVoices, 'female');
    if (bestVi) this.viVoiceName = bestVi.name;

    const bestEn = EnglishVoiceHelper.selectBestEnglishVoice(this.availableVoices, 'female');
    if (bestEn) this.enVoiceName = bestEn.name;
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
      .slice(0, 240);

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

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
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

    // Guard against Chromium GC bug: retain references in class fields
    this.currentUtterance = utterance;
    this.activeUtterances.add(utterance);

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0 && (!this.viVoiceName || !this.enVoiceName)) {
      this.loadVoices();
    }

    // Select explicit voice matching language
    if (item.lang.startsWith('vi')) {
      const viVoice =
        voices.find((v) => v.name === this.viVoiceName) ||
        VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'female') ||
        voices.find((v) => VietnameseVoiceHelper.isVietnameseVoice(v));
      if (viVoice) {
        utterance.voice = viVoice;
      }
    } else {
      // English pronunciation: strictly assign English voice
      const enVoice =
        voices.find((v) => v.name === this.enVoiceName) ||
        EnglishVoiceHelper.selectBestEnglishVoice(voices, 'female') ||
        voices.find((v) => EnglishVoiceHelper.isEnglishVoice(v));
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    // Duck BGM during voice speech
    if (this.audioEngine) {
      const estimatedDurationMs = Math.max(1500, Math.floor((item.text.length / 14) * 1000));
      this.audioEngine.duckBgm(estimatedDurationMs, 0.2);
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.clearWatchdog();
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
      }
      this.activeUtterances.delete(utterance);
      this.isBusy = false;
      if (item.onEnd) item.onEnd();
      if (this.onSpeechEnd) this.onSpeechEnd(item);
      void this.processQueue();
    };

    // Watchdog timer to prevent Chromium synthesis hanging indefinitely
    const estimatedMs = Math.max(2000, Math.floor((item.text.length / 10) * 1000));
    const watchdogMs = Math.max(7000, estimatedMs + 4000);
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      cleanup();
    }, watchdogMs);

    utterance.onstart = () => {
      if (item.onStart) item.onStart();
      if (this.onSpeechStart) this.onSpeechStart(item);
    };
    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    window.speechSynthesis.speak(utterance);
  }

  public isSpeakingQuestion(): boolean {
    return this.isSpeakingQuestionPrompt || this.queue.some((q) => q.priority >= 3);
  }

  // --- Host Script Helpers from docs/04_TTS_HOST_SCRIPT.md ---

  public announceWelcome(nickname?: string): void {
    if (nickname) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'học sinh mới');
      this.speak(`Chào mừng bạn ${cleanNick} đã vào lớp học vui!`, 'vi-VN', 1, `join_${nickname}`);
    } else {
      this.speak('Xin chào cả lớp! Hôm nay chúng ta cùng học tiếng Anh thật vui nhé!', 'vi-VN', 1, 'welcome_all');
    }
  }

  /**
   * Announces question bilingually:
   * 1. Vietnamese intro spoken by Vietnamese voice (host).
   * 2. English vocabulary / sentence spoken clearly by English voice.
   * Sequential chaining ensures no words are cut off and voice switching is natural.
   */
  public announceQuestion(
    promptViOrQuestion: string | QuizQuestion,
    promptEn?: string,
    audioText?: string
  ): void {
    let viIntro = '';
    let enText = '';

    if (typeof promptViOrQuestion === 'object' && promptViOrQuestion !== null) {
      const q = promptViOrQuestion;
      const parsed = this.extractBilingualQuestionParts(q);
      viIntro = parsed.viIntro;
      enText = parsed.enText;
    } else {
      const pVi = promptViOrQuestion || '';
      const pEn = promptEn || '';
      const aText = audioText || '';

      const quotedEn = (pEn.match(/"([^"]+)"/) || [])[1];
      const quotedVi = (pVi.match(/"([^"]+)"/) || [])[1];
      const englishWord = aText || (quotedEn && /^[A-Za-z\s'-]+$/.test(quotedEn) ? quotedEn : quotedVi);

      if (pVi.includes('nghĩa là gì')) {
        viIntro = 'Cả lớp chú ý: Nghĩa của từ sau đây là gì?';
        enText = englishWord ? `${englishWord}. ${pEn}` : pEn;
      } else if (pVi.includes('hoàn thành câu')) {
        viIntro = 'Cả lớp chú ý: Hãy chọn từ đúng để hoàn thành câu.';
        enText = pEn.replace(/^Complete:\s*/i, '').replace(/___+/g, 'blank').trim();
      } else {
        viIntro = pVi ? `Cả lớp chú ý: ${pVi}` : 'Cả lớp chú ý câu hỏi:';
        enText = aText || pEn;
      }
    }

    this.isSpeakingQuestionPrompt = true;

    // Speak Vietnamese intro, then chain English voice pronunciation
    if (viIntro) {
      this.speak(
        viIntro,
        'vi-VN',
        3,
        undefined,
        undefined,
        () => {
          if (enText) {
            this.speak(
              enText,
              'en-US',
              3,
              undefined,
              undefined,
              () => {
                this.isSpeakingQuestionPrompt = false;
              }
            );
          } else {
            this.isSpeakingQuestionPrompt = false;
          }
        }
      );
    } else if (enText) {
      this.speak(
        enText,
        'en-US',
        3,
        undefined,
        undefined,
        () => {
          this.isSpeakingQuestionPrompt = false;
        }
      );
    } else {
      this.isSpeakingQuestionPrompt = false;
    }
  }

  private extractBilingualQuestionParts(q: QuizQuestion): { viIntro: string; enText: string } {
    const quotedEn = (q.prompt.match(/"([^"]+)"/) || [])[1];
    const quotedVi = q.promptVi ? (q.promptVi.match(/"([^"]+)"/) || [])[1] : undefined;
    const englishWord =
      q.audioText ||
      (quotedEn && /^[A-Za-z\s'-]+$/.test(quotedEn) ? quotedEn : (quotedVi && /^[A-Za-z\s'-]+$/.test(quotedVi) ? quotedVi : ''));

    let viIntro = '';
    let enText = '';

    if (q.mode === 'listening') {
      viIntro = 'Cả lớp hãy lắng nghe từ sau đây và chọn đáp án đúng nhé:';
      enText = q.audioText ? `${q.audioText}. ... ${q.audioText}.` : q.prompt;
    } else if (q.mode === 'spelling') {
      viIntro = 'Cả lớp hãy tìm từ viết đúng chính tả cho từ sau:';
      enText = englishWord || q.choices[q.correct] || q.prompt;
    } else if (q.promptVi && q.promptVi.includes('nghĩa là gì')) {
      viIntro = 'Cả lớp chú ý: Nghĩa của từ sau đây là gì?';
      enText = englishWord ? `${englishWord}! ${q.prompt}` : q.prompt;
    } else if (q.promptVi && q.promptVi.includes('hoàn thành câu')) {
      viIntro = 'Cả lớp chú ý: Hãy chọn từ đúng để hoàn thành câu.';
      enText = q.prompt.replace(/^Complete:\s*/i, '').replace(/___+/g, 'blank').trim();
    } else {
      let cleanVi = q.promptVi || 'Cả lớp cùng trả lời câu hỏi sau:';
      if (englishWord && cleanVi.includes(`"${englishWord}"`)) {
        cleanVi = cleanVi.replace(`"${englishWord}"`, 'từ tiếng Anh này');
      }
      viIntro = cleanVi.startsWith('Cả lớp') ? cleanVi : `Cả lớp chú ý: ${cleanVi}`;
      enText = q.prompt;
    }

    return { viIntro, enText };
  }

  public announceTimeWarning(): void {
    this.speak('Còn 5 giây, nhanh tay chọn đáp án nhé cả lớp!', 'vi-VN', 2, 'time_warning');
  }

  /**
   * Announces answer reveal bilingually:
   * 1. Vietnamese answer letter and winner congratulations.
   * 2. English word / sentence read by native English voice.
   * 3. Vietnamese meaning / explanation.
   */
  public announceReveal(
    qOrChoice: string | QuizQuestion,
    explanationOrFastest?: string,
    fastestWinner?: string
  ): void {
    let letter = '';
    let explanation = '';
    let winner = fastestWinner;
    let targetEnWord = '';
    let targetViMeaning = '';

    if (typeof qOrChoice === 'object' && qOrChoice !== null) {
      const q = qOrChoice;
      letter = q.correct;
      explanation = q.explanation || '';
      winner = explanationOrFastest;

      const matchA = explanation.match(/"([^"]+)"\s*nghĩa là\s*"([^"]+)"/i);
      const matchB = explanation.match(/"([^"]+)"\s*trong tiếng Anh là\s*"([^"]+)"/i);
      const matchC = explanation.match(/Correct spelling:\s*([A-Za-z]+)/i);

      if (matchA) {
        targetEnWord = matchA[1];
        targetViMeaning = matchA[2];
      } else if (matchB) {
        targetViMeaning = matchB[1];
        targetEnWord = matchB[2];
      } else if (matchC) {
        targetEnWord = matchC[1];
      } else if (q.audioText) {
        targetEnWord = q.audioText;
      }
    } else {
      letter = qOrChoice;
      explanation = explanationOrFastest || '';

      const matchA = explanation.match(/"([^"]+)"\s*nghĩa là\s*"([^"]+)"/i);
      const matchB = explanation.match(/"([^"]+)"\s*trong tiếng Anh là\s*"([^"]+)"/i);
      if (matchA) {
        targetEnWord = matchA[1];
        targetViMeaning = matchA[2];
      } else if (matchB) {
        targetViMeaning = matchB[1];
        targetEnWord = matchB[2];
      }
    }

    let viMsg = `Hết giờ! Đáp án chính xác là ${letter}.`;
    if (winner) {
      const cleanWinner = VietnameseVoiceHelper.formatNicknameForSpeech(winner, 'bạn học sinh');
      viMsg += ` Chúc mừng ${cleanWinner} đã trả lời nhanh nhất!`;
    }

    if (targetEnWord) {
      // Chain Vietnamese answer -> English word pronunciation -> Vietnamese meaning
      this.speak(viMsg, 'vi-VN', 2, undefined, undefined, () => {
        this.speak(`${targetEnWord}!`, 'en-US', 2, undefined, undefined, () => {
          if (targetViMeaning) {
            this.speak(`Nghĩa là: ${targetViMeaning}.`, 'vi-VN', 2);
          }
        });
      });
    } else if (/^[A-Za-z0-9\s.,'?!-]+$/.test(explanation)) {
      // Full English explanation (e.g. grammar)
      this.speak(viMsg, 'vi-VN', 2, undefined, undefined, () => {
        this.speak(explanation, 'en-US', 2);
      });
    } else {
      if (explanation) {
        viMsg += ` ${explanation}`;
      }
      this.speak(viMsg, 'vi-VN', 2, undefined);
    }
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn học sinh');
      this.speak(`Tuyệt vời! ${cleanNick} đang có chuỗi ${streak} câu đúng liên tiếp!`, 'vi-VN', 2, `streak_${nickname}`);
    }
  }

  public announceBossIntro(): void {
    this.speak('Đến câu đặc biệt rồi! Câu Boss xuất hiện, cả lớp cùng chung sức nhé!', 'vi-VN', 3, 'boss_intro');
  }

  public announceBossVictory(totalCorrect: number): void {
    this.speak(`Tuyệt vời! Cả lớp đã có ${totalCorrect} câu trả lời đúng và đánh bại câu Boss!`, 'vi-VN', 3, 'boss_win');
  }

  public announceGift(nickname: string, giftName: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn học sinh');
    this.speak(`Cảm ơn bạn ${cleanNick} đã gửi tặng ${giftName} cổ vũ lớp học!`, 'vi-VN', 1, `gift_${nickname}_${giftName}`);
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Xin chào cả lớp! Mình cùng luyện tiếng Anh nhé! Let us practice English together!', 'vi-VN', 3);
  }

  public stop(): void {
    this.clearWatchdog();
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    this.queue = [];
    this.isBusy = false;
    this.isSpeakingQuestionPrompt = false;
    this.currentUtterance = null;
    this.activeUtterances.clear();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

