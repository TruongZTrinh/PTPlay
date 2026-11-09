import { AudioEngine } from '../audio/AudioEngine';

export class TTSController {
  private audioEngine: AudioEngine;
  private isEnabled: boolean = true;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private queue: string[] = [];
  private isSpeaking: boolean = false;
  private lastSpeakTime: number = 0;
  private cooldownMs: number = 1000;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI'));
      if (viVoice) {
        this.selectedVoice = viVoice;
      } else {
        const enVoice = voices.find((v) => v.lang.startsWith('en'));
        this.selectedVoice = enVoice || voices[0] || null;
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
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

  public speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (priority) {
      window.speechSynthesis.cancel();
      this.queue = [text];
      this.isSpeaking = false;
    } else {
      if (this.queue.length >= 3) {
        this.queue.shift();
      }
      this.queue.push(text);
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeaking || this.queue.length === 0) return;
    const now = Date.now();
    if (now - this.lastSpeakTime < this.cooldownMs) {
      setTimeout(() => this.processQueue(), this.cooldownMs);
      return;
    }

    const textToSpeak = this.queue.shift();
    if (!textToSpeak) return;

    this.isSpeaking = true;
    this.audioEngine.setDucking(true);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
      setTimeout(() => this.processQueue(), 300);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.lastSpeakTime = Date.now();
      this.audioEngine.setDucking(false);
      setTimeout(() => this.processQueue(), 200);
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.queue = [];
    this.isSpeaking = false;
    this.audioEngine.setDucking(false);
  }
}
