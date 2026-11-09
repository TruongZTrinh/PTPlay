export interface BGMTrack {
  id: string;
  title: string;
  filename: string;
  genre: string;
}

export const BGM_TRACKS: BGMTrack[] = [
  {
    id: 'funny_monkeys',
    title: 'Khỉ Tinh Nghịch (Monkeys Spinning)',
    filename: 'bgm_funny_monkeys.mp3',
    genre: 'Hài hước / Viral TikTok',
  },
  {
    id: 'silly_cartoon',
    title: 'Hoạt Hình Nhí Nhố (Fluffing a Duck)',
    filename: 'bgm_silly_cartoon.mp3',
    genre: 'Hoạt hình vui nhộn',
  },
  {
    id: 'sneaky_detective',
    title: 'Thám Tử Lém Lỉnh (Sneaky Snitch)',
    filename: 'bgm_sneaky_detective.mp3',
    genre: 'Trinh thám dí dỏm',
  },
  {
    id: 'chill_carefree',
    title: 'Thảnh Thơi Yêu Đời (Carefree)',
    filename: 'bgm_chill_carefree.mp3',
    genre: 'Chill & Thư giãn',
  },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundVolume: number = 0.8;
  private isDucked: boolean = false;

  // Background Music (BGM)
  private bgmAudio: HTMLAudioElement | null = null;
  public bgmEnabled: boolean = true;
  public bgmVolume: number = 0.35;
  private currentTrackIndex: number = 0;
  private basePath: string = 'assets/rebus-v1/audio/bgm';

  constructor() {}

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable
    }
  }

  public unlock(): void {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    if (this.bgmEnabled) {
      this.playBGM();
    }
  }

  // --- BGM Controls ---

  public playBGM(trackId?: string): void {
    if (!this.bgmEnabled || typeof window === 'undefined' || typeof Audio === 'undefined') return;

    if (trackId) {
      const idx = BGM_TRACKS.findIndex((t) => t.id === trackId);
      if (idx !== -1) {
        this.currentTrackIndex = idx;
      }
    }

    const track = BGM_TRACKS[this.currentTrackIndex];
    if (!track) return;

    const audioSrc = `${this.basePath}/${track.filename}`;

    try {
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio(audioSrc);
      } else if (!this.bgmAudio.src.endsWith(track.filename)) {
        this.bgmAudio.src = audioSrc;
      }

      this.bgmAudio.loop = true;
      const targetVolume = this.isDucked ? this.bgmVolume * 0.2 : this.bgmVolume;
      this.bgmAudio.volume = targetVolume;

      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Awaiting user interaction
        });
      }
    } catch {
      // Audio element not supported
    }
  }

  public stopBGM(): void {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {}
    }
  }

  public pauseBGM(): void {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
      } catch {}
    }
  }

  public resumeBGM(): void {
    if (this.bgmEnabled && this.bgmAudio) {
      try {
        this.bgmAudio.play().catch(() => {});
      } catch {}
    } else if (this.bgmEnabled) {
      this.playBGM();
    }
  }

  public toggleBGM(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.playBGM();
    } else {
      this.pauseBGM();
    }
    return this.bgmEnabled;
  }

  public nextBGMTrack(): BGMTrack {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % BGM_TRACKS.length;
    if (this.bgmEnabled) {
      this.playBGM();
    }
    return BGM_TRACKS[this.currentTrackIndex];
  }

  public getCurrentTrack(): BGMTrack {
    return BGM_TRACKS[this.currentTrackIndex] || BGM_TRACKS[0];
  }

  public setBGMVolume(vol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isDucked ? this.bgmVolume * 0.2 : this.bgmVolume;
    }
  }

  public setVolume(vol: number): void {
    this.soundVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      const targetGain = this.isDucked ? this.soundVolume * 0.25 : this.soundVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
    if (this.masterGain && this.ctx) {
      const targetGain = ducked ? this.soundVolume * 0.25 : this.soundVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    if (this.bgmAudio) {
      // Duck BGM during TTS announcements so voice is 100% intelligible
      const targetVolume = ducked ? this.bgmVolume * 0.2 : this.bgmVolume;
      this.bgmAudio.volume = targetVolume;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, delay: number = 0, gainLevel: number = 0.2): void {
    if (!this.ctx || !this.masterGain) return;
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

