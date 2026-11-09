/** Original procedural audio: no external music/audio files and no copyright-dependent samples. */
export class SynthAudio {
  private context?: AudioContext;
  public enabled = true;
  private beat = 0;

  unlock(): void {
    if (!this.context) {
      try { this.context = new AudioContext(); } catch { return; }
    }
    void this.context.resume();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();
    return this.enabled;
  }

  private tone(freq: number, duration: number, kind: OscillatorType = 'sine', gain = 0.04, bend = 1): void {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = kind;
    osc.frequency.setValueAtTime(freq, now);
    if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * bend), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + Math.min(0.02, duration / 4));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now); osc.stop(now + duration + 0.015);
  }

  private noise(duration: number, gain = 0.014): void {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running') return;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource(); const amp = ctx.createGain();
    amp.gain.value = gain;
    source.buffer = buffer; source.connect(amp).connect(ctx.destination); source.start();
  }

  hit(): void { this.tone(570 + Math.random() * 270, 0.07, 'triangle', 0.018, 0.67); }
  heavyHit(): void { this.tone(135, 0.23, 'sawtooth', 0.08, 0.4); this.noise(0.11, 0.025); }
  spawn(): void { this.tone(660, 0.13, 'sine', 0.045, 1.6); this.tone(920, 0.14, 'triangle', 0.025, 1.2); }
  win(): void { [523, 659, 784, 1047].forEach((freq, index) => setTimeout(() => this.tone(freq, 0.33, 'triangle', 0.065), index * 140)); }
  click(): void { this.tone(490, 0.075, 'sine', 0.03, 1.2); }
  tickMusic(): void {
    if (!this.enabled) return;
    const notes = [196, 294, 392, 294, 220, 330, 440, 330, 196, 294, 392, 523, 220, 330, 440, 587];
    if (this.beat % 4 === 0) this.tone(85, 0.13, 'sine', 0.065, 0.43);
    if (this.beat % 4 === 2) this.noise(0.07, 0.012);
    this.tone(notes[this.beat % notes.length], 0.13, 'triangle', 0.015, 0.98);
    this.beat++;
  }
}
