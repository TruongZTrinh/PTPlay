import { AudioManager } from '../audio/AudioManager';
import { VietnameseVoiceHelper } from '@ptplay/game-sdk';

export interface TTSMessageItem {
  text: string;
  priority: boolean;
  createdAt: number;
}

export class TTSController {
  private audio: AudioManager;
  public enabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: TTSMessageItem[] = [];
  private isSpeaking: boolean = false;
  private lastSpeakTime: number = 0;
  private cooldownMs: number = 1000;
  private cleanupVoiceLoader?: () => void;
  private recentKeys = new Map<string, number>();

  public rate: number = 1.05;
  public pitch: number = 1.08; // Energetic battle shoutcaster tone
  public volume: number = 0.8;
  public savedVoiceName?: string;

  constructor(audio: AudioManager) {
    this.audio = audio;
    this.initVoices();
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
      // Prioritize natural Vietnamese voice (Hoài My, Google Tiếng Việt, Apple Linh, An)
      const bestVoice = VietnameseVoiceHelper.selectBestVietnameseVoice(voices, 'female') ||
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

    // Also fetch current global config from Bridge REST API
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
    this.enabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.queue = [];
      this.isSpeaking = false;
      this.audio.setDucking(false);
    }
  }

  public speak(text: string, priority: boolean = false, dedupeKey?: string): void {
    if (!this.enabled || !text || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (dedupeKey) {
      const last = this.recentKeys.get(dedupeKey) || 0;
      if (now - last < 8000) return;
      this.recentKeys.set(dedupeKey, now);
    }

    const cleanText = VietnameseVoiceHelper.sanitizeTTSText(text, 180);
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
    this.audio.setDucking(true);

    const utterance = VietnameseVoiceHelper.createVietnameseUtterance(item.text, {
      voice: this.selectedVoice,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
    });

    if (!utterance) {
      this.isSpeaking = false;
      this.audio.setDucking(false);
      return;
    }

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audio.setDucking(false);
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

  // --- Battle Shoutcaster Vietnamese Lines ---

  public announceMatchStart(roundNumber: number): void {
    const lines = [
      `Vòng ${roundNumber} bắt đầu! Phe Đỏ và Phe Xanh xung phong!`,
      `Trận chiến vòng ${roundNumber} chính thức bùng nổ! Hai phe sẵn sàng!`,
    ];
    this.speak(lines[Math.floor(Math.random() * lines.length)], true);
  }

  public announceTeamJoin(nickname: string, team: 'red' | 'blue'): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'chiến binh');
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`Chào mừng chiến binh ${cleanNick} gia nhập ${teamName}!`, false, `join_${nickname}`);
  }

  public announceSummon(team: 'red' | 'blue', unitName: string, count: number, nickname?: string): void {
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    const cleanNick = nickname ? VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'chiến binh') : undefined;
    const summonMsg = cleanNick
      ? `${cleanNick} gọi ${count} ${unitName} chi viện cho ${teamName}!`
      : `${teamName} tăng cường ${count} ${unitName}!`;
    this.speak(summonMsg, false, `summon_${team}_${unitName}`);
  }

  public announceBossSpawn(team: 'red' | 'blue', bossName: string, nickname?: string): void {
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    const cleanNick = nickname ? VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'chiến binh') : undefined;
    const bossMsg = cleanNick
      ? `Báo động chiến trường! ${cleanNick} vừa triệu hồi Đại Tướng ${bossName} cho ${teamName}!`
      : `Báo động chiến trường! Đại Tướng ${bossName} xuất trận cho ${teamName}!`;
    this.speak(bossMsg, true);
  }

  public announceBossDefeated(bossName: string, killerTeam: 'red' | 'blue'): void {
    const killerName = killerTeam === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`Đại Tướng ${bossName} đã bị tiêu diệt! ${killerName} nhận thưởng lớn!`, true);
  }

  public announceCoreBreach(targetTeam: 'red' | 'blue'): void {
    const defName = targetTeam === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`Nguy cấp! Căn cứ ${defName} đang bị công phá dữ dội!`, false, `breach_${targetTeam}`);
  }

  public announceHeal(nickname: string, team: 'red' | 'blue', amount: number): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'chiến binh');
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`${cleanNick} vừa hồi ${amount} máu cho căn cứ ${teamName}!`, false, `heal_${team}`);
  }

  public announceBoost(nickname: string, team: 'red' | 'blue'): void {
    const cleanNick = VietnameseVoiceHelper.formatNicknameForSpeech(nickname, 'chiến binh');
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`${cleanNick} kích hoạt tăng tốc toàn diện cho ${teamName}!`, false, `boost_${team}`);
  }

  public announceVictory(winner: 'red' | 'blue' | 'draw'): void {
    if (winner === 'draw') {
      this.speak('Hết giờ! Trận đấu hòa nhau nghẹt thở giữa Đỏ và Xanh!', true);
    } else {
      const winnerName = winner === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
      this.speak(`Chiến thắng vẻ vang vòng đấu này thuộc về ${winnerName}!`, true);
    }
  }

  public announceGift(nickname: string, giftName: string, team: 'red' | 'blue'): void {
    const teamName = team === 'red' ? 'Phe Đỏ' : 'Phe Xanh';
    this.speak(`${nickname} gửi tặng ${giftName} tiếp sức mạnh cho ${teamName}!`, false, `gift_${nickname}_${giftName}`);
  }

  public testVoice(): void {
    this.unlock();
    this.speak('Đấu Trường Chiến Binh xin chào! Giọng bình luận viên tiếng Việt đã sẵn sàng!', true);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
    this.audio.setDucking(false);
  }

  public destroy(): void {
    this.cancel();
    if (this.cleanupVoiceLoader) {
      this.cleanupVoiceLoader();
    }
  }
}

