import { ProgressionManager } from '../progression/ProgressionManager';
import { RoomId, WeatherType, TimeOfDay } from '../config/CafeConfig';

export class CafeAudioEngine {
  private static instance: CafeAudioEngine;
  private ctx: AudioContext | null = null;
  public isUnlocked = false;
  public onUnlocked?: () => void;

  // Master Gain Nodes
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Real Cat & SFX Audio Sample Buffers (Loaded from public/audio/)
  private realMeowBuffers: AudioBuffer[] = [];
  private realPurrBuffer: AudioBuffer | null = null;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private audioFilesLoaded = false;

  // Active Loops / Timers
  private bgmTimer: number | null = null;
  private ambienceSource: AudioNode | null = null;
  private currentTrack: 'day' | 'rainy' | 'night' = 'day';
  private currentWeather: WeatherType = 'sunny';

  private constructor() {
    this.setupAutoUnlock();
  }

  public static getInstance(): CafeAudioEngine {
    if (!CafeAudioEngine.instance) {
      CafeAudioEngine.instance = new CafeAudioEngine();
    }
    return CafeAudioEngine.instance;
  }

  /**
   * Sets up automatic listeners for user interactions (click, tap, keypress)
   * so audio unlocks effortlessly on ANY screen interaction.
   */
  private setupAutoUnlock(): void {
    if (typeof window === 'undefined') return;

    const autoUnlock = () => {
      this.unlock();
      if (this.isUnlocked && this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', autoUnlock);
        window.removeEventListener('keydown', autoUnlock);
        window.removeEventListener('click', autoUnlock);
        window.removeEventListener('touchstart', autoUnlock);
      }
    };

    window.addEventListener('pointerdown', autoUnlock, { passive: true });
    window.addEventListener('keydown', autoUnlock, { passive: true });
    window.addEventListener('click', autoUnlock, { passive: true });
    window.addEventListener('touchstart', autoUnlock, { passive: true });
  }

  public unlock(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();

        // Master Limiter to prevent harsh clipping
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -6;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressor.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(compressor);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);

        this.ambienceGain = this.ctx.createGain();
        this.ambienceGain.connect(this.masterGain);

        this.applySettings();
      }

      const finishUnlock = () => {
        this.isUnlocked = true;
        this.applySettings();
        if (!this.bgmTimer) {
          this.startBgm(this.currentTrack);
        }
        this.startAmbience(this.currentWeather);
        void this.loadRealCatSounds();
        this.onUnlocked?.();
        console.log('🎵 [CafeAudioEngine] Web Audio Synthesizer Engine Unlocked & Running');
      };

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          finishUnlock();
        }).catch(() => {
          finishUnlock();
        });
      } else {
        finishUnlock();
      }
    } catch (e) {
      console.warn('[CafeAudioEngine] Could not initialize Web Audio', e);
    }
  }

  /**
   * Preloads real recorded cat meow, purr & full SFX audio clips into memory.
   */
  public async loadRealCatSounds(): Promise<void> {
    if (this.audioFilesLoaded || !this.ctx || typeof window === 'undefined') return;
    this.audioFilesLoaded = true;

    const meowUrls = [
      'audio/meow_classic.wav',
      'audio/meow_baby.wav',
      'audio/meow_real_1.wav',
      'audio/meow_real_2.wav',
      'audio/meow_real_3.wav',
      'audio/meow_real_4.wav',
      'audio/meow_real_5.wav',
      'audio/meow_real_6.wav',
      'audio/meow_real_7.wav',
      'audio/meow_real_8.wav',
    ];

    for (const relUrl of meowUrls) {
      try {
        const res = await fetch(relUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buf = await this.ctx.decodeAudioData(ab);
          this.realMeowBuffers.push(buf);
        }
      } catch {
        // Fallback silently if assets not served
      }
    }

    try {
      const purrRes = await fetch('audio/purr_real.wav');
      if (purrRes.ok) {
        const ab = await purrRes.arrayBuffer();
        this.realPurrBuffer = await this.ctx.decodeAudioData(ab);
      }
    } catch {}

    const extraSfx: Array<[string, string]> = [
      ['munch', 'audio/munch_real.wav'],
      ['bowl_clink', 'audio/bowl_clink.wav'],
      ['yarn_jingle', 'audio/yarn_jingle.wav'],
      ['scratch', 'audio/scratch_real.wav'],
      ['paw_tap', 'audio/paw_tap.wav'],
      ['yawn', 'audio/yawn_real.wav'],
      ['heart_pop', 'audio/heart_pop.wav'],
      ['sparkle', 'audio/sparkle_real.wav'],
      ['coin_chime', 'audio/coin_chime.wav'],
      ['button_click', 'audio/button_click.wav'],
      ['camera_shutter', 'audio/camera_shutter.wav'],
      ['doorbell', 'audio/doorbell_real.wav'],
      ['level_up', 'audio/level_up.wav'],
    ];

    for (const [key, relUrl] of extraSfx) {
      try {
        const res = await fetch(relUrl);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const buf = await this.ctx.decodeAudioData(ab);
          this.sfxBuffers.set(key, buf);
        }
      } catch {}
    }

    if (this.realMeowBuffers.length > 0 || this.sfxBuffers.size > 0) {
      console.log(`🐾 [CafeAudioEngine] Successfully loaded ${this.realMeowBuffers.length} real cat sounds & ${this.sfxBuffers.size} authentic SFX audio clips!`);
    }
  }

  /**
   * Helper to play preloaded audio buffer with volume and pitch control.
   * Returns true if audio played successfully, false if procedural fallback should be used.
   */
  private playBuffer(key: string, volume = 0.6, playbackRate = 1.0): boolean {
    if (!this.ctx || !this.sfxGain) return false;
    const buf = this.sfxBuffers.get(key);
    if (!buf) return false;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = playbackRate;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    return true;
  }

  public applySettings(): void {
    if (!this.masterGain || !this.bgmGain || !this.sfxGain || !this.ambienceGain) return;
    const s = ProgressionManager.getInstance().data.settings;

    this.masterGain.gain.value = s.muted ? 0 : 1.0;
    this.bgmGain.gain.value = Math.max(0, Math.min(1, s.bgmVolume));
    this.sfxGain.gain.value = Math.max(0, Math.min(1, s.sfxVolume));
    this.ambienceGain.gain.value = Math.max(0, Math.min(1, s.ambienceVolume));
  }

  private ensureRunning(): boolean {
    if (!this.ctx) {
      this.unlock();
    }
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  // --- COZY PROCEDURAL LOFI CHORD ENGINE ---
  public startBgm(theme: 'day' | 'rainy' | 'night'): void {
    this.currentTrack = theme;
    if (this.bgmTimer) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (!this.ensureRunning() || !this.bgmGain) return;

    // Chords (frequencies in Hz)
    const dayChords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    const rainyChords = [
      [220.0, 261.63, 311.13, 392.0],  // Am7(b5)
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0],  // G
      [164.81, 196.0, 246.94, 293.66], // Em7
    ];

    const nightChords = [
      [196.0, 261.63, 329.63, 392.0],  // C/G warm pad
      [174.61, 220.0, 293.66, 349.23], // Fadd9
      [146.83, 220.0, 261.63, 329.63], // Dm7 low
      [196.0, 246.94, 293.66, 329.63], // G6
    ];

    const chords = theme === 'rainy' ? rainyChords : theme === 'night' ? nightChords : dayChords;
    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.ctx || !this.bgmGain) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // Warm electric piano / Rhodes tone
        osc.type = theme === 'night' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(theme === 'night' ? 1400 : 2200, now);

        gain.gain.setValueAtTime(0, now);
        // Rich audible volume (0.18 per note in polyphony)
        gain.gain.linearRampToValueAtTime(0.18, now + 0.12 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain!);

        osc.start(now + i * 0.08);
        osc.stop(now + 3.9);
      });
    };

    playNextChord();
    this.bgmTimer = window.setInterval(playNextChord, 4000);
  }

  // --- AMBIENCE LAYERS (RAIN, PINK NOISE) ---
  public startAmbience(weather: WeatherType): void {
    this.currentWeather = weather;
    if (!this.ensureRunning() || !this.ambienceGain) return;

    if (weather === 'rainy') {
      if (this.ambienceSource) {
        try { (this.ambienceSource as any).stop(); } catch {}
        this.ambienceSource = null;
      }

      // Pink noise rain generator
      const bufferSize = this.ctx!.sampleRate * 2;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.15;
      }
      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      noise.connect(filter);
      filter.connect(this.ambienceGain);
      noise.start();
      this.ambienceSource = noise;
    } else {
      if (this.ambienceSource) {
        try { (this.ambienceSource as any).stop(); } catch {}
        this.ambienceSource = null;
      }
    }
  }

  // --- CAT SOUND EFFECTS & VOCALIZATIONS ---

  /**
   * Real domestic cat meow. Plays authentic recorded cat audio sample when loaded,
   * with seamless fallback to warm acoustic synthesis.
   */
  public playMeow(pitchMultiplier = 1.0): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Play authentic recorded real cat audio clip
    if (this.realMeowBuffers.length > 0) {
      const buf = this.realMeowBuffers[Math.floor(Math.random() * this.realMeowBuffers.length)];
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = pitchMultiplier * (0.95 + Math.random() * 0.1);

      const gain = this.ctx.createGain();
      gain.gain.value = 0.65;

      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      return;
    }

    // 2. Procedural synthesis fallback
    this.playSynthMeow(pitchMultiplier);
  }

  private playSynthMeow(pitchMultiplier = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const base = 520 * pitchMultiplier;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.55, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(base * 1.15, now + 0.38);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Deep vibrating cat purr. Uses real cat purr recording when loaded.
   */
  public playPurr(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Play real recorded purr audio clip
    if (this.realPurrBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.realPurrBuffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.65;

      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      return;
    }

    // 2. Procedural purr fallback (110 Hz base + 24 Hz LFO vibration)
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 110;

    lfo.type = 'sine';
    lfo.frequency.value = 24;
    lfoGain.gain.value = 35;

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.18, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 1.85);
    osc.stop(now + 1.85);
  }

  /** Happy rolling cat trill / chirp greeting ("Brrr-mew!") */
  public playHappyTrill(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    const now = this.ctx.currentTime;

    // If baby kitten sample is available, play with gentle trill
    if (this.realMeowBuffers.length > 3) {
      const babyBuf = this.realMeowBuffers[1] || this.realMeowBuffers[3];
      const src = this.ctx.createBufferSource();
      src.buffer = babyBuf;
      src.playbackRate.value = 1.15; // sweet chirp pitch
      const gain = this.ctx.createGain();
      gain.gain.value = 0.55;
      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
      return;
    }

    // Procedural trill fallback
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);

    lfo.type = 'sine';
    lfo.frequency.value = 18;
    lfoGain.gain.setValueAtTime(40, now);
    lfoGain.gain.exponentialRampToValueAtTime(5, now + 0.3);

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.26, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.4);
    osc.stop(now + 0.4);
  }

  /** Sleepy cat cozy purr-snore & resting breath (100% feline, no human voice) */
  public playCuteYawn(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('yawn', 0.85, 0.98 + Math.random() * 0.05)) return;

    // Feline procedural soft purr-snore fallback (gentle rhythmic cat sleep purr)
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(110, now + 1.2);

    lfo.type = 'sine';
    lfo.frequency.value = 16;
    lfoGain.gain.value = 25;
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 1.45);
    osc.stop(now + 1.45);
  }

  // --- PLAY & ACTIVITY SOUNDS ---

  /** Tinkling toy ball with tiny bell inside */
  public playYarnJingle(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('yarn_jingle', 0.60, 0.95 + Math.random() * 0.1)) return;

    const now = this.ctx.currentTime;
    const freqs = [2093, 2793, 3520];
    for (let bounce = 0; bounce < 2; bounce++) {
      const bTime = now + bounce * 0.09;
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * (1 + idx * 0.02);

        gain.gain.setValueAtTime(0.14, bTime);
        gain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(bTime);
        osc.stop(bTime + 0.24);
      });
    }
  }

  /** Sisal rope scratching post sound */
  public playScratch(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('scratch', 0.60, 0.95 + Math.random() * 0.1)) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 2.0;

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  /** Soft paw steps walking on wooden floor */
  public playPawTap(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('paw_tap', 0.45, 0.9 + Math.random() * 0.2)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // --- FOOD & CAFÉ SOUNDS ---

  /** Porcelain/ceramic food bowl ting when served */
  public playBowlClink(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('bowl_clink', 0.65, 0.98 + Math.random() * 0.05)) return;

    const now = this.ctx.currentTime;
    [1760, 2640].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  /** Crunchy cat eating food munch */
  public playMunch(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('munch', 0.70, 0.95 + Math.random() * 0.15)) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420 + Math.random() * 80, now + i * 0.11);

      gain.gain.setValueAtTime(0.20, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.08);
    }
  }

  // --- REWARDS, GIFTS & UI SOUNDS ---

  /** Sweet bubble pop sound for heart emotes */
  public playHeartPop(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('heart_pop', 0.70, 0.95 + Math.random() * 0.15)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.04);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Shimmering wind-chime / sparkle shower for TikTok gifts */
  public playSparkleShower(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('sparkle', 0.75)) return;

    const now = this.ctx.currentTime;
    const notes = [1318.5, 1567.98, 1975.53, 2349.32, 2637.02, 3135.96];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = now + idx * 0.055;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /** Animal Crossing / Stardew Valley style Purr Points chime */
  public playCoinChime(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('coin_chime', 0.70)) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = now + idx * 0.09;
      gain.gain.setValueAtTime(0.20, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /** Tactile cozy wooden button click for UI buttons */
  public playButtonClick(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('button_click', 0.55, 0.98 + Math.random() * 0.04)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /** Crystal two-tone doorbell (E5 -> C5) */
  public playDoorbell(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('doorbell', 0.65)) return;

    const now = this.ctx.currentTime;
    [659.25, 523.25].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = now + i * 0.24;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  /** Camera shutter snap & click */
  public playCameraShutter(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('camera_shutter', 0.70)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Ascending fanfare for level-up celebration */
  public playLevelUp(): void {
    if (!this.ensureRunning() || !this.sfxGain || !this.ctx) return;
    if (this.playBuffer('level_up', 0.80)) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}
