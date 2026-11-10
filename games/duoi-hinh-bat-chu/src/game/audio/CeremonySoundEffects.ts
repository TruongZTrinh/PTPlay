interface Voice {
  source: AudioScheduledSourceNode;
  gain: GainNode;
  nodes: AudioNode[];
}

const SAMPLE_PATH = '/assets/rebus-v1/audio/ceremony/';
const FILES = ['crowd-applause.ogg', 'firework-burst.ogg', 'firework-crackle.ogg', 'winner-fanfare.ogg'] as const;

/** Award effects share the game's SFX volume and are cancelled together. */
export class CeremonySoundEffects {
  private voices = new Set<Voice>();
  private samples = new Map<string, { buffer: AudioBuffer; gain: number }>();
  private noise: AudioBuffer;
  private bus: GainNode;
  private fireworkIndex = 0;
  public readonly ready: Promise<void>;

  constructor(private ctx: BaseAudioContext, output: AudioNode) {
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    this.bus.connect(compressor);
    compressor.connect(output);
    this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 2), ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.ready = this.loadSamples();
  }

  private async loadSamples(): Promise<void> {
    await Promise.all(FILES.map(async file => {
      try {
        const response = await fetch(SAMPLE_PATH + file);
        if (!response.ok) return;
        const buffer = await this.ctx.decodeAudioData(await response.arrayBuffer());
        let peak = 0, power = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          for (const value of buffer.getChannelData(channel)) {
            peak = Math.max(peak, Math.abs(value));
            power += value * value;
          }
        }
        const rms = Math.sqrt(power / (buffer.length * buffer.numberOfChannels));
        this.samples.set(file, { buffer, gain: Math.min(3, 0.9 / Math.max(peak, 0.001), 0.17 / Math.max(rms, 0.001)) });
      } catch { /* The synthesized fallback still plays if a recording is unavailable. */ }
    }));
  }

  public playEntrance(): void {
    this.noiseBurst(0, 0.45, 0.09, 950, 'highpass', 0, 0.1);
    this.tone(150, 48, 0.35, 0, 0.15, 'sine');
    // Accelerate the snare into the champion reveal.
    for (let i = 0; i < 44; i++) {
      const progress = i / 43;
      const delay = 0.3 + 2.48 * Math.pow(progress, 0.72);
      this.noiseBurst(delay, 0.07, 0.06 + progress * 0.16, 1600 + progress * 900, 'bandpass', i % 2 ? 0.18 : -0.18);
      if (i % 4 === 0) this.tone(120, 65, 0.11, delay, 0.035 + progress * 0.05, 'sine');
    }
  }

  public playReveal(rank: number): void {
    if (rank === 1) {
      this.tone(175, 42, 0.5, 0, 0.2, 'sine');
      this.noiseBurst(0, 1.25, 0.13, 1900, 'highpass', 0, 0.004);
      if (this.recording('winner-fanfare.ogg', 0, 0.78, 0, 4.5)) return;
    }
    const notes = rank === 1 ? [1046.5, 1318.51, 1567.98, 2093] : rank === 2 ? [783.99, 1046.5] : [659.25, 783.99];
    notes.forEach((frequency, i) => this.tone(frequency, frequency, 0.3, i * 0.09, 0.07, 'triangle'));
    if (rank === 1) [523.25, 659.25, 783.99].forEach(f => this.tone(f, f, 0.65, 0.3, 0.04, 'sine'));
  }

  public playFirework(pan = 0): void {
    const file = this.fireworkIndex++ % 2 ? 'firework-crackle.ogg' : 'firework-burst.ogg';
    this.tone(500, 1800, 0.32, 0, 0.05, 'sine', pan);
    if (this.recording(file, 0.32, 0.72, pan, 2.1)) return;
    this.tone(145, 42, 0.36, 0.32, 0.14, 'sine', pan);
    this.noiseBurst(0.32, 0.16, 0.13, 950, 'lowpass', pan);
    this.noiseBurst(0.34, 0.85, 0.06, 2300, 'highpass', pan);
    for (let i = 0; i < 10; i++) {
      this.noiseBurst(0.4 + i * 0.055 + Math.random() * 0.025, 0.025 + Math.random() * 0.025,
        0.025 + Math.random() * 0.02, 1700 + Math.random() * 2200, 'highpass', pan);
    }
  }

  public playApplause(): void {
    if (this.recording('crowd-applause.ogg', 0, 0.85, 0, 3.4)) return;
    for (let i = 0; i < 24; i++) {
      const delay = i * 0.065 + Math.random() * 0.035;
      const pan = (Math.random() - 0.5) * 1.4;
      const frequency = 900 + Math.random() * 1300;
      this.noiseBurst(delay, 0.075, 0.16, frequency, 'bandpass', pan);
      this.noiseBurst(delay + 0.014, 0.05, 0.085, frequency + 500, 'bandpass', pan);
    }
    this.noiseBurst(0, 1.9, 0.065, 750, 'bandpass', 0, 0.16);
  }

  private recording(file: string, delay: number, level: number, pan: number, maxDuration: number): boolean {
    const sample = this.samples.get(file);
    if (!sample) return false;
    const source = this.ctx.createBufferSource();
    source.buffer = sample.buffer;
    this.voice(source, source, [], delay, Math.min(sample.buffer.duration, maxDuration), level * sample.gain, pan, 0.008, true);
    return true;
  }

  private tone(frequency: number, endFrequency: number, duration: number, delay: number,
    level: number, type: OscillatorType, pan = 0): void {
    const source = this.ctx.createOscillator();
    source.type = type;
    const start = this.ctx.currentTime + delay;
    source.frequency.setValueAtTime(frequency, start);
    source.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    this.voice(source, source, [], delay, duration, level, pan, 0.012);
  }

  private noiseBurst(delay: number, duration: number, level: number, frequency: number,
    type: BiquadFilterType, pan: number, attack = 0.003): void {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = type === 'bandpass' ? 0.8 : 0.5;
    source.connect(filter);
    this.voice(source, filter, [filter], delay, duration, level, pan, attack);
  }

  private voice(source: AudioScheduledSourceNode, signal: AudioNode, nodes: AudioNode[], delay: number,
    duration: number, level: number, pan: number, attack: number, natural = false): void {
    const start = this.ctx.currentTime + delay;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + attack);
    if (natural) {
      gain.gain.setValueAtTime(level, start + Math.max(attack, duration - 0.12));
      gain.gain.linearRampToValueAtTime(0, start + duration);
    } else {
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    }
    gain.gain.linearRampToValueAtTime(0, start + duration + 0.015);
    signal.connect(gain);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner);
    panner.connect(this.bus);
    const voice = { source, gain, nodes: [source, ...nodes, gain, panner] };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      voice.nodes.forEach(node => node.disconnect());
    };
    source.start(start);
    source.stop(start + duration + 0.025);
  }

  public stop(): void {
    const now = this.ctx.currentTime;
    this.voices.forEach(voice => {
      const gain = voice.gain.gain;
      if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(now);
      else {
        const current = gain.value;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(current, now);
      }
      gain.setTargetAtTime(0, now, 0.006);
      voice.source.stop(now + 0.03);
    });
    this.voices.clear();
  }
}
