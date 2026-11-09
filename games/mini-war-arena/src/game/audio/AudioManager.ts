/**
 * PTPlay Mini War Arena - Procedural Web Audio Engine
 * Pure synthesized audio (zero external asset dependencies, zero copyright risks)
 * Features multi-channel mixing (Master, Music, SFX), limiter, dynamic compressor
 */
export class AudioManager {
  private ctx?: AudioContext;
  private masterGain?: GainNode;
  private musicGain?: GainNode;
  private sfxGain?: GainNode;
  private compressor?: DynamicsCompressorNode;

  public enabled = true;
  private masterVolume = 0.8;
  private musicVolume = 0.4;
  private sfxVolume = 0.7;

  private beat = 0;
  private lastSoundTimes: Map<string, number> = new Map();

  constructor() {
    // Lazy init on first user interaction
  }

  public unlock(): void {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();

        // Dynamics Compressor to prevent distortion/clipping during massive battles
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.applyVolumes();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Web Audio API not supported', e);
        return;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.unlock();
    }
    this.applyVolumes();
    return this.enabled;
  }

  public setVolumes(master?: number, music?: number, sfx?: number): void {
    if (master !== undefined) this.masterVolume = Math.max(0, Math.min(1, master));
    if (music !== undefined) this.musicVolume = Math.max(0, Math.min(1, music));
    if (sfx !== undefined) this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.applyVolumes();
  }

  public getVolumes() {
    return {
      master: this.masterVolume,
      music: this.musicVolume,
      sfx: this.sfxVolume,
      enabled: this.enabled,
    };
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const effMaster = this.enabled ? this.masterVolume : 0;
    this.masterGain.gain.setValueAtTime(effMaster, now);
    const musicEff = this.isDucked ? this.musicVolume * 0.15 : this.musicVolume * 0.35;
    this.musicGain.gain.setValueAtTime(musicEff, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
  }

  private isDucked = false;

  /** Duck battle background music volume during Vietnamese shoutcaster announcements */
  public setDucking(isDucking: boolean): void {
    this.isDucked = isDucking;
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const target = isDucking ? this.musicVolume * 0.12 : this.musicVolume * 0.35;
    try {
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.linearRampToValueAtTime(target, now + 0.12);
    } catch {
      this.musicGain.gain.value = target;
    }
  }

  /** Rate limiter to avoid playing identical SFX dozens of times in the same frame */
  private canPlay(key: string, cooldownSec: number): boolean {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    const last = this.lastSoundTimes.get(key) || 0;
    if (now - last < cooldownSec) return false;
    this.lastSoundTimes.set(key, now);
    return true;
  }

  private tone(
    freq: number,
    duration: number,
    kind: OscillatorType = 'sine',
    gain = 0.05,
    bend = 1,
    destGain: 'sfx' | 'music' = 'sfx'
  ): void {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const target = destGain === 'music' ? this.musicGain : this.sfxGain;
    if (!target) return;

    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = kind;
    osc.frequency.setValueAtTime(freq, now);
    if (bend !== 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * bend), now + duration);
    }

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.02, duration * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(amp).connect(target);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private noise(duration: number, gain = 0.02, isPink = false): void {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running' || !this.sfxGain) return;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * duration), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (isPink) {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11 * (1 - i / data.length);
      } else {
        data[i] = white * (1 - i / data.length);
      }
    }

    const source = this.ctx.createBufferSource();
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    source.buffer = buffer;
    source.connect(amp).connect(this.sfxGain);
    source.start();
  }

  // --- Sound Effects API ---

  public hit(): void {
    if (!this.canPlay('hit', 0.04)) return;
    this.tone(520 + Math.random() * 220, 0.06, 'triangle', 0.025, 0.7);
  }

  public heavyHit(): void {
    if (!this.canPlay('heavyHit', 0.08)) return;
    this.tone(110, 0.22, 'sawtooth', 0.09, 0.45);
    this.noise(0.12, 0.035, true);
  }

  public arrowShoot(): void {
    if (!this.canPlay('arrow', 0.06)) return;
    this.tone(850, 0.09, 'sine', 0.03, 0.35);
    this.noise(0.04, 0.015);
  }

  public magicCast(): void {
    if (!this.canPlay('magic', 0.07)) return;
    this.tone(680, 0.12, 'sine', 0.04, 1.4);
    this.tone(960, 0.14, 'triangle', 0.025, 0.8);
  }

  public magicImpact(): void {
    if (!this.canPlay('magicHit', 0.06)) return;
    this.tone(420, 0.16, 'triangle', 0.045, 0.5);
    this.noise(0.08, 0.02);
  }

  public summonUnit(): void {
    if (!this.canPlay('summon', 0.08)) return;
    this.tone(660, 0.12, 'sine', 0.05, 1.6);
    this.tone(980, 0.14, 'triangle', 0.035, 1.25);
  }

  public summonBoss(): void {
    this.unlock();
    // Epic war horn + sub bass
    this.tone(140, 0.7, 'sawtooth', 0.12, 0.85);
    this.tone(210, 0.65, 'triangle', 0.11, 1.1);
    this.noise(0.4, 0.05, true);
    setTimeout(() => {
      this.tone(280, 0.8, 'sawtooth', 0.14, 1.2);
    }, 240);
  }

  public bossAttack(): void {
    if (!this.canPlay('bossAttack', 0.12)) return;
    this.tone(95, 0.3, 'sawtooth', 0.12, 0.4);
    this.noise(0.2, 0.06, true);
  }

  public bossSkill(): void {
    this.tone(75, 0.5, 'triangle', 0.14, 0.3);
    this.tone(190, 0.4, 'sawtooth', 0.1, 1.5);
    this.noise(0.35, 0.08, true);
  }

  public win(): void {
    this.unlock();
    const melody = [523, 659, 784, 1047, 1318];
    melody.forEach((freq, index) => {
      setTimeout(() => {
        this.tone(freq, 0.38, 'triangle', 0.07);
        this.tone(freq / 2, 0.38, 'sine', 0.04);
      }, index * 125);
    });
  }

  public click(): void {
    this.tone(520, 0.06, 'sine', 0.04, 1.2);
  }

  public boost(): void {
    this.tone(440, 0.18, 'sine', 0.06, 1.8);
    this.tone(660, 0.22, 'triangle', 0.04, 1.5);
  }

  public heal(): void {
    this.tone(550, 0.25, 'sine', 0.05, 1.3);
    this.tone(880, 0.3, 'triangle', 0.03, 1.1);
  }

  public cheer(): void {
    if (!this.canPlay('cheer', 0.15)) return;
    this.tone(523, 0.18, 'triangle', 0.05, 1.25);
    this.tone(659, 0.22, 'sine', 0.04, 1.3);
    this.noise(0.12, 0.018);
  }

  /** Background battle music tick */
  public tickMusic(): void {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    // Energetic cartoon battle loop in A minor / D minor
    const bassline = [110, 110, 130, 146, 110, 110, 98, 87];
    const melody = [220, 261, 329, 392, 329, 293, 261, 247, 220, 293, 349, 440, 392, 329, 293, 220];

    // Kick / Bass beat
    if (this.beat % 4 === 0) {
      this.tone(bassline[Math.floor(this.beat / 2) % bassline.length], 0.15, 'sine', 0.07, 0.45, 'music');
    }

    // Snare / Shaker noise
    if (this.beat % 4 === 2) {
      this.noise(0.06, 0.015, false);
    } else if (this.beat % 2 === 1) {
      this.noise(0.025, 0.007, false);
    }

    // Melodic Arpeggio
    const note = melody[this.beat % melody.length];
    this.tone(note, 0.12, 'triangle', 0.022, 0.98, 'music');

    // Chords on strong bars
    if (this.beat % 8 === 0) {
      this.tone(note * 0.75, 0.28, 'sine', 0.018, 1, 'music');
    }

    this.beat++;
  }
}

