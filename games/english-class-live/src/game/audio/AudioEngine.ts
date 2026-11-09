import { SharedMusicManager } from '@ptplay/game-sdk';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked = false;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private bgmTimer: ReturnType<typeof setInterval> | null = null;
  private isPartyBgm = false;
  private sharedMusic = SharedMusicManager.getInstance({ gameId: 'english-class' });

  public sfxVolume = 0.7;
  public bgmVolume = 0.35;
  private normalBgmGain = 0.35;
  private isDucked = false;

  constructor() {
    // Initialized lazily upon user interaction
  }

  public unlock(): boolean {
    if (this.isUnlocked) return true;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isUnlocked = true;
      this.sharedMusic.unlock();
      this.startLofiBgm();
      return true;
    } catch (e) {
      console.warn('[AudioEngine] Could not initialize Web Audio Context:', e);
      return false;
    }
  }

  public setVolumes(sfx: number, bgm: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.bgmVolume = Math.max(0, Math.min(1, bgm));
    this.normalBgmGain = this.bgmVolume;
    this.sharedMusic.setVolume(this.bgmVolume);

    if (this.ctx && this.sfxGain && this.bgmGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
      if (!this.isDucked) {
        this.bgmGain.gain.setValueAtTime(this.bgmVolume, now);
      }
    }
  }

  public duckBgm(durationMs = 2500, duckFactor = 0.38): void {
    // Duck Shared Music Manager (smooth -10 to -12 dB, keeps BGM clearly audible)
    this.sharedMusic.duck(durationMs, duckFactor);

    if (!this.ctx || !this.bgmGain || this.bgmVolume === 0) return;
    this.isDucked = true;
    const now = this.ctx.currentTime;
    const duckedGain = this.bgmVolume * duckFactor;

    this.bgmGain.gain.cancelScheduledValues(now);
    this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
    this.bgmGain.gain.linearRampToValueAtTime(duckedGain, now + 0.15);

    setTimeout(() => {
      if (this.ctx && this.bgmGain) {
        const restoreTime = this.ctx.currentTime;
        this.bgmGain.gain.cancelScheduledValues(restoreTime);
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, restoreTime);
        this.bgmGain.gain.linearRampToValueAtTime(this.normalBgmGain, restoreTime + 0.4);
        this.isDucked = false;
      }
    }, durationMs);
  }

  // --- Sound Effects Synthesizer ---

  public playBell(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Dual chime bell
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.4, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  }

  public playCorrect(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Major triad ascending: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.35, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.5);
    });
  }

  public playWrong(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Soft downward low buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playTick(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playStreak(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);

      gain.gain.setValueAtTime(0.3, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  }

  public playFanfare(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Royal brass fanfare notes: G4, C5, E5, G5 sustained
    const notes = [
      { f: 392, start: 0, dur: 0.15 },
      { f: 523.25, start: 0.18, dur: 0.15 },
      { f: 659.25, start: 0.36, dur: 0.18 },
      { f: 783.99, start: 0.56, dur: 0.9 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.start);

      gain.gain.setValueAtTime(0.3, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur);
    });
  }

  public playConfetti(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Multi-frequency twinkling pop
    [800, 1200, 1500, 2000].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);

      gain.gain.setValueAtTime(0.2, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.3);
    });
  }

  // --- Procedural BGM Generation ---

  public startLofiBgm(): void {
    this.sharedMusic.playCue('question');
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isPartyBgm = false;

    // Chords: Cmaj7 (C E G B) -> Am7 (A C E G) -> Dm7 (D F A C) -> G7 (G B D F)
    const progressions = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || !this.bgmGain || this.isPartyBgm) return;
      const now = this.ctx.currentTime;
      const chord = progressions[chordIdx % progressions.length];
      chordIdx++;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 2.8);

        osc.connect(gain);
        gain.connect(this.bgmGain!);

        osc.start(now);
        osc.stop(now + 2.9);
      });
    };

    playChord();
    this.bgmTimer = setInterval(playChord, 3000);
  }

  public setPartyBgm(active: boolean): void {
    if (active === this.isPartyBgm) return;
    this.isPartyBgm = active;

    if (active) {
      this.sharedMusic.playCue('celebration');
    } else {
      this.sharedMusic.playCue('question');
    }

    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }

    if (active) {
      // Faster energetic upbeat techno chords
      const partyNotes = [523.25, 659.25, 783.99, 987.77];
      let step = 0;
      this.bgmTimer = setInterval(() => {
        if (!this.ctx || !this.bgmGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(partyNotes[step % partyNotes.length], now);
        step++;

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 0.36);
      }, 400);
    } else {
      this.startLofiBgm();
    }
  }

  public stop(): void {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}
