import { SharedMusicManager } from '@ptplay/game-sdk';

export interface BGMTrack {
  id: string;
  title: string;
  filename: string;
  genre: string;
}

export const BGM_TRACKS: BGMTrack[] = [
  {
    id: 'funny_monkeys',
    title: 'Magic Puzzle (Đuổi Hình Bắt Chữ)',
    filename: 'magic_puzzle_1.ogg',
    genre: 'Bí ẩn & Tò mò',
  },
  {
    id: 'silly_cartoon',
    title: 'Cozy Puzzle (Suy Nghĩ & Gợi Ý)',
    filename: 'cozy_puzzle_3.ogg',
    genre: 'Tập trung & Thư giãn',
  },
  {
    id: 'sneaky_detective',
    title: 'Music Loops (Vui Vẻ Chúc Mừng)',
    filename: 'music_loops_four.mp3',
    genre: 'Chuyển vòng hào hứng',
  },
  {
    id: 'chill_carefree',
    title: 'Thảnh Thơi Yêu Đời (Carefree)',
    filename: 'magic_puzzle_1.ogg',
    genre: 'Chill & Thư giãn',
  },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundVolume: number = 0.8;
  private isDucked: boolean = false;
  private sharedMusic = SharedMusicManager.getInstance({ gameId: 'duoi-hinh-bat-chu' });

  // Background Music (BGM)
  private bgmAudio: HTMLAudioElement | null = null;
  public bgmEnabled: boolean = true;
  public bgmVolume: number = 0.35;
  private currentTrackIndex: number = 0;
  private currentCue: string = 'lobby';
  private basePath: string = '/shared-music/duoi-hinh-bat-chu';

  constructor() {}

  public ensureContext(): boolean {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
      } catch {
        return false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return !!this.ctx;
  }

  public init(): void {
    this.ensureContext();
  }

  public unlock(): void {
    this.ensureContext();
    this.sharedMusic.unlock();
    if (this.bgmEnabled) {
      this.sharedMusic.playCue(this.currentCue);
    }
  }

  public playCue(cue: string): void {
    this.currentCue = cue;
    this.sharedMusic.playCue(cue);
  }

  // --- BGM Controls ---

  public playBGM(trackId?: string): void {
    if (!this.bgmEnabled) return;
    this.sharedMusic.playCue('lobby');
  }

  public stopBGM(): void {
    this.sharedMusic.pause();
  }

  public pauseBGM(): void {
    this.sharedMusic.pause();
  }

  public resumeBGM(): void {
    if (this.bgmEnabled) {
      this.sharedMusic.resume();
    }
  }

  public toggleBGM(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    this.sharedMusic.setMute(!this.bgmEnabled);
    return this.bgmEnabled;
  }

  public nextBGMTrack(): BGMTrack {
    this.sharedMusic.nextTrack();
    this.currentTrackIndex = (this.currentTrackIndex + 1) % BGM_TRACKS.length;
    return BGM_TRACKS[this.currentTrackIndex];
  }

  public getCurrentTrack(): BGMTrack {
    return BGM_TRACKS[this.currentTrackIndex] || BGM_TRACKS[0];
  }

  public setBGMVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    this.sharedMusic.setVolume(this.bgmVolume);
  }

  public setVolume(vol: number): void {
    this.soundVolume = Math.max(0, Math.min(1, vol));
    this.sharedMusic.setVolume(this.soundVolume);
    if (this.masterGain && this.ctx) {
      const targetGain = this.isDucked ? this.soundVolume * 0.25 : this.soundVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
    if (ducked) {
      this.sharedMusic.startDucking();
    } else {
      this.sharedMusic.stopDucking();
    }
    if (this.masterGain && this.ctx) {
      const targetGain = ducked ? this.soundVolume * 0.25 : this.soundVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0, gainLevel: number = 0.2): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    } catch {
      // ignore
    }
  }

  public playRoundStart(): void {
    // Upbeat 3-note ascending game-show chime (G4 -> C5 -> E5)
    this.playTone(392.0, 'sine', 0.12, 0.0, 0.22);
    this.playTone(523.25, 'triangle', 0.14, 0.09, 0.25);
    this.playTone(659.25, 'triangle', 0.28, 0.18, 0.28);
  }

  public playRoundEnd(): void {
    // 2-tone gentle buzzer/gong (Eb4 -> Bb3) indicating round timeout or completion
    this.playTone(311.13, 'sawtooth', 0.18, 0.0, 0.15);
    this.playTone(233.08, 'triangle', 0.32, 0.12, 0.2);
  }

  public playTick(): void {
    this.playTone(784, 'sine', 0.04, 0, 0.08);
  }

  public playUrgentTick(): void {
    this.playTone(1174, 'sine', 0.06, 0, 0.15);
  }

  public playHintChime(): void {
    this.playTone(659.25, 'triangle', 0.15, 0, 0.18);
    this.playTone(830.61, 'triangle', 0.25, 0.08, 0.2);
  }

  public playCorrect(): void {
    this.playTone(523.25, 'triangle', 0.12, 0.0, 0.2);
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.22);
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.25);
    this.playTone(1046.5, 'sine', 0.35, 0.24, 0.28);
  }

  public playWrong(): void {
    this.playTone(200, 'sawtooth', 0.15, 0.0, 0.12);
  }

  public playLock(): void {
    this.playTone(440, 'triangle', 0.1, 0, 0.15);
    this.playTone(660, 'triangle', 0.15, 0.06, 0.15);
  }

  public playFanfare(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.18, idx * 0.08, 0.22);
    });
  }

  public playCeremonyCelebration(): void {
    this.playFanfare();
    this.playCue('ceremony');
  }

  public playFirework(pan = 0): void {
    this.playTone(800 + Math.random() * 400, 'triangle', 0.15, 0.0, 0.1);
  }

  public playApplause(): void {
    this.playFanfare();
  }

  public playPodiumReveal(rank: number): void {
    const freqs = [523.25, 659.25, 783.99];
    this.playTone(freqs[rank - 1] || 523.25, 'triangle', 0.25, 0.0, 0.3);
  }

  public stopCeremonySounds(): void {}

  public playGiftRose(): void {
    this.playTone(659.25, 'sine', 0.2, 0.0, 0.18);
    this.playTone(880, 'sine', 0.3, 0.1, 0.22);
  }

  public playGiftHeart(): void {
    this.playTone(523.25, 'sine', 0.15, 0.0, 0.15);
    this.playTone(783.99, 'sine', 0.25, 0.08, 0.2);
  }

  public playGiftLion(): void {
    this.playTone(140, 'sawtooth', 0.45, 0.0, 0.25);
    this.playTone(220, 'square', 0.35, 0.1, 0.2);
    this.playTone(440, 'triangle', 0.5, 0.2, 0.3);
  }

  public playGiftUniverse(): void {
    const notes = [440, 554.37, 659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.4, idx * 0.1, 0.2);
    });
  }
}

