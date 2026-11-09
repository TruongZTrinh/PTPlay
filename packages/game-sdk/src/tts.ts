/**
 * PTPlay Platform - Shared Vietnamese TTS Utilities
 * Ensures optimal voice discovery, natural pronunciation, and fallback handling
 * across Windows SAPI/Neural, Chromium Google voices, Apple Safari, and Mobile devices.
 */

export interface TTSUtteranceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

export class EnglishVoiceHelper {
  public static readonly ENGLISH_PRIORITY_VOICES = [
    'Microsoft Jenny Online (Natural)',
    'Microsoft Aria Online (Natural)',
    'Microsoft Guy Online (Natural)',
    'Google US English',
    'Google UK English Female',
    'Microsoft Zira Desktop',
    'Microsoft Hazel Desktop',
    'Samantha',
  ];

  public static isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
    if (!voice || !voice.lang) return false;
    const lang = voice.lang.toLowerCase();
    return (
      lang.startsWith('en') ||
      lang.includes('en-us') ||
      lang.includes('en-gb') ||
      lang.includes('en_us') ||
      lang.includes('en_gb')
    );
  }

  public static getEnglishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    if (!voices || !Array.isArray(voices)) return [];
    return voices.filter((v) => this.isEnglishVoice(v));
  }

  public static selectBestEnglishVoice(
    voices: SpeechSynthesisVoice[],
    preferredGender: 'female' | 'male' | 'any' = 'female'
  ): SpeechSynthesisVoice | null {
    const enVoices = this.getEnglishVoices(voices);
    if (enVoices.length === 0) return null;

    // 1. High priority list check
    for (const priorityName of this.ENGLISH_PRIORITY_VOICES) {
      const match = enVoices.find((v) => v.name.includes(priorityName));
      if (match) return match;
    }

    // 2. Female / Natural preference
    if (preferredGender === 'female') {
      const female = enVoices.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('female') ||
          n.includes('zira') ||
          n.includes('hazel') ||
          n.includes('jenny') ||
          n.includes('aria') ||
          n.includes('samantha')
        );
      });
      if (female) return female;
    }

    // 3. Any Natural or Google voice
    const natural = enVoices.find((v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'));
    if (natural) return natural;

    // 4. en-US fallback, then any English voice
    const us = enVoices.find((v) => v.lang.toLowerCase().startsWith('en-us'));
    return us || enVoices[0] || null;
  }
}

export class VietnameseVoiceHelper {
  // Voice name prioritization list (from most natural/expressive to basic fallback)
  public static readonly VIETNAMESE_PRIORITY_VOICES = [
    'Microsoft HoaiMy Online (Natural)',
    'Microsoft NamMinh Online (Natural)',
    'Microsoft HoaiMy',
    'Microsoft NamMinh',
    'Google Tiếng Việt',
    'Microsoft An',
    'Linh',
  ];

  /**
   * Checks whether a voice supports Vietnamese.
   */
  public static isVietnameseVoice(voice: SpeechSynthesisVoice): boolean {
    if (!voice || !voice.lang) return false;
    const lang = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();
    return (
      lang.startsWith('vi') ||
      lang.includes('vi-vn') ||
      lang.includes('vi_vn') ||
      lang.includes('vie') ||
      name.includes('vietnam') ||
      name.includes('tiếng việt')
    );
  }

  /**
   * Filter and return all available Vietnamese voices from a list.
   */
  public static getVietnameseVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    if (!voices || !Array.isArray(voices)) return [];
    return voices.filter((v) => this.isVietnameseVoice(v));
  }

  /**
   * Selects the highest quality Vietnamese voice available on the host system.
   * Prioritizes Edge Online Natural voices, Windows Neural voices, Google Tiếng Việt, and Apple Linh.
   */
  public static selectBestVietnameseVoice(
    voices: SpeechSynthesisVoice[],
    preferredGender: 'female' | 'male' | 'any' = 'any'
  ): SpeechSynthesisVoice | null {
    const viVoices = this.getVietnameseVoices(voices);
    if (viVoices.length === 0) return null;

    // 1. Gender preference matching
    if (preferredGender === 'female') {
      const femaleVoice = viVoices.find((v) => {
        const n = v.name.toLowerCase();
        return n.includes('hoaimy') || n.includes('linh') || n.includes('female');
      });
      if (femaleVoice) return femaleVoice;
    } else if (preferredGender === 'male') {
      const maleVoice = viVoices.find((v) => {
        const n = v.name.toLowerCase();
        return n.includes('namminh') || n.includes('an') || n.includes('male');
      });
      if (maleVoice) return maleVoice;
    }

    // 2. Priority list lookup
    for (const priorityName of this.VIETNAMESE_PRIORITY_VOICES) {
      const match = viVoices.find((v) => v.name.includes(priorityName));
      if (match) return match;
    }

    // 3. Fallback to any detected Vietnamese voice
    return viVoices[0] || null;
  }

  /**
   * Sanitizes speech text to remove markdown, HTML tags, special symbols,
   * multiple whitespace, and limit length to avoid synthesis stall.
   */
  public static sanitizeTTSText(text: string, maxLen = 250): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .replace(/[*_#`~[\]()]/g, ' ') // Strip Markdown formatters
      .replace(/[\r\n\t]+/g, ' ') // Normalize newlines
      .replace(/\s{2,}/g, ' ') // Single space
      .trim()
      .slice(0, maxLen);
  }

  /**
   * Builds a SpeechSynthesisUtterance with explicit 'vi-VN' language.
   * If no voice is passed, voice property is left unset so the browser uses its native 'vi-VN' engine
   * rather than erroneously speaking Vietnamese with an English voice!
   */
  public static createVietnameseUtterance(
    text: string,
    options?: TTSUtteranceOptions
  ): SpeechSynthesisUtterance | null {
    if (typeof window === 'undefined' || !('SpeechSynthesisUtterance' in window)) {
      return null;
    }

    const cleanedText = this.sanitizeTTSText(text);
    if (!cleanedText) return null;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'vi-VN';
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.05;
    utterance.volume = options?.volume ?? 1.0;

    if (options?.voice && this.isVietnameseVoice(options.voice)) {
      utterance.voice = options.voice;
    }

    return utterance;
  }

  /**
   * Registers voice loader callback on window.speechSynthesis, handling both
   * synchronous ready state and asynchronous 'voiceschanged' event.
   * Returns a cleanup function.
   */
  public static setupVoiceLoader(onVoicesLoaded: (voices: SpeechSynthesisVoice[]) => void): () => void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return () => {};
    }

    const checkAndNotify = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        onVoicesLoaded(voices);
      }
    };

    // Immediate check
    checkAndNotify();

    // Event listener
    const handler = () => checkAndNotify();
    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Polling retry for browsers where voices load asynchronously without immediate event
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        onVoicesLoaded(voices);
        clearInterval(interval);
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 250);

    return () => {
      clearInterval(interval);
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
  }

  /**
   * Sends a silent primer utterance to unlock speech synthesis on Chromium/Safari
   * when streamer interacts with the page.
   */
  public static unlockAudioContext(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    try {
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0.01;
      primer.rate = 2.0;
      primer.lang = 'vi-VN';
      window.speechSynthesis.speak(primer);
      return true;
    } catch {
      return false;
    }
  }
}

