import { SharedMusicManager } from '@ptplay/game-sdk';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundVolume: number = 0.8;
  private isDucked: boolean = false;
  private sharedMusic = SharedMusicManager.getInstance({ gameId: 'quiz-show' });

  constructor() {
    // Initialized on first user gesture or unlock call
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext not available in some headless environments
    }
  }

  public unlock(): void {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    this.sharedMusic.unlock();
    this.sharedMusic.playCue('lobby');
  }

  public playCue(cue: string): void {
    this.sharedMusic.playCue(cue);
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
      // ignore tone errors
    }
  }

  public playTick(): void {
    this.playTone(880, 'sine', 0.04, 0, 0.08);
  }

  public playUrgentTick(): void {
    this.playTone(1320, 'sine', 0.06, 0, 0.15);
  }

  public playCorrect(): void {
    // Joyful C-E-G-C major arpeggio
    this.playTone(523.25, 'triangle', 0.12, 0.0, 0.2); // C5
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.22); // E5
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.25); // G5
    this.playTone(1046.5, 'sine', 0.35, 0.24, 0.28); // C6
  }

  public playWrong(): void {
    // Soft low buzz
    this.playTone(220, 'sawtooth', 0.15, 0.0, 0.15);
    this.playTone(196, 'sawtooth', 0.25, 0.1, 0.15);
  }

  public playLock(): void {
    this.playTone(440, 'triangle', 0.1, 0, 0.15);
    this.playTone(660, 'triangle', 0.15, 0.06, 0.15);
  }

  public playStreakFanfare(): void {
    const notes = [587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.18, idx * 0.07, 0.22);
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
    // Roar harmonic burst
    this.playTone(150, 'sawtooth', 0.4, 0.0, 0.25);
    this.playTone(220, 'square', 0.35, 0.1, 0.2);
    this.playTone(440, 'triangle', 0.5, 0.2, 0.3);
  }

  public playGiftUniverse(): void {
    // Cosmic sweep
    const notes = [440, 554.37, 659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.4, idx * 0.1, 0.2);
    });
  }
}

