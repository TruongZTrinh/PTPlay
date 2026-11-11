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
  public volume: number = 0.8;
  public savedVoiceName?: string;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.cleanupVoiceLoader = VietnameseVoiceHelper.setupVoiceLoader((voices) => {
      if (this.savedVoiceName) {
        if (VietnameseVoiceHelper.isServerAudioVoice(this.savedVoiceName)) {
          this.selectedVoice = null;
          return;
        }
        const customVoice = VietnameseVoiceHelper.findVoiceByName(voices, this.savedVoiceName);
        if (customVoice) {
          this.selectedVoice = customVoice;
          return;
        }
      }
      // Default: Server-side Neural Female Voice (edge-hoaimy) via GameBridge — works on ANY machine
      this.savedVoiceName = VietnameseVoiceHelper.DEFAULT_SERVER_VOICE;
      this.selectedVoice = null;
    });

    this.loadSavedVoiceConfig();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if ((e.key === 'ptplay_tts_voice' || e.key === 'ptplay_tts_config') && e.newValue) {
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

  public setVoiceByName(voiceName: string): boolean {
    this.savedVoiceName = voiceName;
    if (VietnameseVoiceHelper.isServerAudioVoice(voiceName)) {
      this.selectedVoice = null;
      return true;
    }
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
      this.savedVoiceName = config.voiceName;
      this.setVoiceByName(config.voiceName);
      try {
        localStorage.setItem('ptplay_tts_voice', config.voiceName);
      } catch {}
    }
    if (config.pitch !== undefined && !isNaN(Number(config.pitch))) {
      this.pitch = Math.max(0.5, Math.min(2.0, Number(config.pitch)));
    }
    if (config.rate !== undefined && !isNaN(Number(config.rate))) {
      this.rate = Math.max(0.5, Math.min(2.0, Number(config.rate)));
    }
    if (config.volume !== undefined && !isNaN(Number(config.volume))) {
      this.volume = Math.max(0, Math.min(1.0, Number(config.volume)));
    }
  }

  public loadSavedVoiceConfig(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('ptplay_tts_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.voiceName) this.setVoiceByName(parsed.voiceName);
      }
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

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
      setTimeout(() => this.processQueue(), 300);
    };

    if (VietnameseVoiceHelper.isServerAudioVoice(this.savedVoiceName)) {
      this.playHttpTts(item.text, cleanup);
      return;
    }

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

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('[QuizShow TTS] Utterance error:', e);
      cleanup();
    };

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
  }

  private playHttpTts(text: string, onEnd: () => void): void {
    try {
      const url = VietnameseVoiceHelper.buildServerTtsUrl(text, {
        voiceName: this.savedVoiceName,
        lang: 'vi',
        rate: this.rate,
        pitch: this.pitch,
      });
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1.0, this.volume));
      const guard = setTimeout(onEnd, 15000);
      const done = () => {
        clearTimeout(guard);
        onEnd();
      };
      audio.onended = done;
      audio.onerror = () => {
        console.warn('[QuizShow TTS] Server HTTP audio error');
        done();
      };
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('[QuizShow TTS] Audio play blocked:', err);
          done();
        });
      }
    } catch {
      onEnd();
    }
  }

  // --- Host Gameshow Vietnamese Announcements ---

  public announceShowWelcome(): void {
    this.speak('Chào mừng quý vị khán giả đến với trường quay gameshow Đố Vui Có Thưởng!', true);
  }

  public announcePlayerJoin(nickname: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
    this.speak(`Chào mừng bạn ${cleanNick} đã vào trường quay!`, false, `join_${nickname}`);
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
      const cleanWinner = VietnameseVoiceHelper.formatNicknameForSpeech(fastestWinner, 'bạn khán giả');
      msg += ` Chúc mừng ${cleanWinner} đã trả lời nhanh nhất!`;
    }
    if (explanation) {
      msg += ` ${explanation}`;
    }
    this.speak(msg, true);
  }

  public announceStreak(nickname: string, streak: number): void {
    if (streak >= 3) {
      const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
      this.speak(`Tuyệt vời! ${cleanNick} đang có chuỗi ${streak} câu trả lời đúng liên tiếp!`, false, `streak_${nickname}`);
    }
  }

  public announceGift(nickname: string, giftName: string): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'bạn khán giả');
    this.speak(`Trân trọng cảm ơn bạn ${cleanNick} đã gửi tặng ${giftName} cổ vũ trường quay!`, false, `gift_${nickname}_${giftName}`);
  }

  public announceChampion(championName: string): void {
    const cleanChamp = VietnameseVoiceHelper.formatNicknameForSpeech(championName, 'người chơi xuất sắc');
    this.speak(`Chúc mừng ${cleanChamp} đã xuất sắc đạt ngôi vô địch vòng chơi hôm nay!`, true);
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
