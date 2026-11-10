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
    'Microsoft Hoài My Online (Natural)',
    'Microsoft HoaiMy Online (Natural)',
    'Microsoft Hoài My',
    'Microsoft HoaiMy',
    'Microsoft NamMinh Online (Natural)',
    'Microsoft Nam Minh Online (Natural)',
    'Microsoft NamMinh',
    'Microsoft Nam Minh',
    'Google Tiếng Việt',
    'Linh',
    'Microsoft An',
  ];

  /**
   * Normalizes voice names by removing accents, spaces, and punctuation for robust matching.
   */
  public static normalizeVoiceKey(name: string): string {
    if (!name) return '';
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Finds a voice by exact name or normalized fuzzy search.
   */
  public static findVoiceByName(voices: SpeechSynthesisVoice[], targetName: string): SpeechSynthesisVoice | null {
    if (!voices || !Array.isArray(voices) || voices.length === 0 || !targetName) return null;
    const exact = voices.find((v) => v.name === targetName);
    if (exact) return exact;

    const normTarget = this.normalizeVoiceKey(targetName);
    if (!normTarget) return null;

    const fuzzy = voices.find((v) => {
      const normName = this.normalizeVoiceKey(v.name);
      return normName.includes(normTarget) || normTarget.includes(normName);
    });
    return fuzzy || null;
  }

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
   * Checks whether at least one Vietnamese voice is available in the provided list.
   */
  public static hasVietnameseVoice(voices: SpeechSynthesisVoice[]): boolean {
    return this.getVietnameseVoices(voices).length > 0;
  }

  /**
   * Selects the highest quality Vietnamese voice available on the host system.
   * Prioritizes Edge Online Natural voices (Hoài My), Windows Neural voices, Google Tiếng Việt, and Apple Linh.
   */
  public static selectBestVietnameseVoice(
    voices: SpeechSynthesisVoice[],
    preferredGender: 'female' | 'male' | 'any' = 'any'
  ): SpeechSynthesisVoice | null {
    const viVoices = this.getVietnameseVoices(voices);
    if (viVoices.length === 0) return null;

    // 1. Gender preference matching (accent and whitespace insensitive)
    if (preferredGender === 'female') {
      const femaleVoice = viVoices.find((v) => {
        const norm = this.normalizeVoiceKey(v.name);
        return norm.includes('hoaimy') || norm.includes('linh') || norm.includes('mai') || norm.includes('female');
      });
      if (femaleVoice) return femaleVoice;
    } else if (preferredGender === 'male') {
      const maleVoice = viVoices.find((v) => {
        const norm = this.normalizeVoiceKey(v.name);
        return norm.includes('namminh') || norm.includes('an') || norm.includes('quang') || norm.includes('male');
      });
      if (maleVoice) return maleVoice;
    }

    // 2. Priority list lookup (accent and whitespace insensitive)
    for (const priorityName of this.VIETNAMESE_PRIORITY_VOICES) {
      const normPri = this.normalizeVoiceKey(priorityName);
      const match = viVoices.find((v) => this.normalizeVoiceKey(v.name).includes(normPri));
      if (match) return match;
    }

    // 3. Fallback to any detected Vietnamese voice
    return viVoices[0] || null;
  }

  /**
   * Common English & international names transliteration table for Vietnamese TTS.
   * Prevents Vietnamese speech engines (HoaiMy, Google Tieng Viet, Linh) from spelling
   * foreign letters (J, W, Z, F) as acronyms ("Giê-a-cờ-ka", "Vê-kép-e-nờ").
   */
  public static readonly COMMON_ENGLISH_NAMES_PHONETICS: Record<string, string> = {
    jack: 'Giắc', john: 'Giôn', james: 'Gêm', jenny: 'Gen-ny', jerry: 'Gie-ri',
    jimmy: 'Gim-my', justin: 'Gia-xtin', jessica: 'Gê-xi-ca', jason: 'Gê-sơn',
    josh: 'Giót', jordan: 'Gióc-đan', joy: 'Goi', june: 'Giun', judy: 'Giu-đi',
    david: 'Đê-vít', daniel: 'Đa-ni-en', dan: 'Đan', daisy: 'Đây-di',
    peter: 'Pi-tơ', paul: 'Pôn', philip: 'Phi-líp', alex: 'A-lếch',
    alexander: 'A-lếch-xan-đơ', alice: 'A-lít', adam: 'A-đam', alan: 'A-lan',
    andrew: 'An-đru', anna: 'An-na', anne: 'An', annie: 'An-ni',
    tony: 'Tô-ni', tom: 'Tom', tommy: 'Tom-my', thomas: 'Tô-mát', tim: 'Tim',
    kevin: 'Ke-vin', ken: 'Ken', kenny: 'Ken-ni', kyle: 'Khai',
    michael: 'Mai-cơn', mike: 'Maik', mark: 'Mác', max: 'Mác',
    sarah: 'Sa-ra', sam: 'Sam', samantha: 'Sa-man-tha',
    steve: 'Xtiu', steven: 'Xti-vơn', stephen: 'Xti-vơn', susan: 'Xu-dân',
    lisa: 'Li-sa', lily: 'Li-li', lucy: 'Lu-xi', lucas: 'Lu-cát', luke: 'Lúc',
    leo: 'Lê-ô', leon: 'Lê-on', henry: 'Hen-ry', harry: 'Ha-ry', helen: 'He-len',
    brian: 'Brai-ân', ben: 'Ben', bob: 'Bốp', bill: 'Bin', billy: 'Bin-li', bella: 'Ben-la',
    eric: 'E-rích', emma: 'Em-ma', emily: 'E-mi-li', ethan: 'I-thân', eva: 'E-va',
    george: 'Gióoc', grace: 'Grây-x', rose: 'Râu-z', ruby: 'Ru-bi', ryan: 'Rai-ân',
    robert: 'Rô-bớt', richard: 'Ri-chát', wendy: 'Oen-đi', william: 'Uy-li-am',
    will: 'Uyn', wayne: 'Uên', zoe: 'Dô-i', zin: 'Din', zack: 'Dắc',
    felix: 'Phê-lích', frank: 'Ph-ranh', fiona: 'Phi-ô-na', flora: 'Ph-lô-ra',
    chris: 'Cờ-rít', christian: 'Cờ-rít-ti-an', charlie: 'Sác-li', charles: 'Sác-lơ',
    chloe: 'Cờ-lô-i', claire: 'Cờ-le', clark: 'Cờ-lác',
    victor: 'Vích-tơ', victoria: 'Vích-tô-ri-a', vincent: 'Vin-xừn',
    nick: 'Ních', noah: 'Nô-a', oliver: 'Ô-li-vơ', oscar: 'Ót-xca',
  };

  /**
   * Transforms raw TikTok / live viewer nicknames into smooth, natural, polite
   * pronunciation strings for Vietnamese Text-To-Speech:
   * 1. Eliminates SAPI / Chromium acronym letter-spelling for ALL CAPS names (MINH QUÂN -> Minh Quân)
   * 2. Strips emojis, stars, hearts, flames and decorative Unicode symbols
   * 3. Replaces delimiters (_, -, ., /) with natural word spaces (no "gạch dưới" / "chấm")
   * 4. Splits camelCase / PascalCase into distinct syllables (LanAnh -> Lan Anh)
   * 5. Separates numbers from text (Huy2005 -> Huy 2005) and converts 2kX (2k4 -> 2004)
   * 6. Replaces bot / random ID usernames (user12345678) with polite friendly fallbacks
   * 7. Phonetically adapts foreign letters (J, W, Z, F) and common English names
   */
  public static formatNicknameForSpeech(raw?: string, fallback = 'bạn khán giả'): string {
    if (!raw || typeof raw !== 'string') return fallback;
    let text = raw.trim();
    if (!text) return fallback;

    // 1. Strip emojis, decorative pictographs and symbols (keep letters, numbers, spaces, delimiters)
    text = text.replace(/[^\p{L}\p{N}\s_.\-/]/gu, ' ');

    // 2. Detect generic user / bot IDs (e.g. user1234567, tiktok_88291, 1234567)
    const isGeneric =
      /^(user|tiktok|player|khach|member|acc|id)[_\s\d.-]*$/i.test(text) ||
      /^\d+$/i.test(text);
    if (isGeneric) {
      const digits = text.replace(/\D/g, '');
      if (digits.length >= 1 && digits.length <= 3) {
        return `khán giả ${digits}`;
      }
      return fallback;
    }

    // 3. Delimiters to spaces: underscore, dot, hyphen, slash
    text = text.replace(/[_.\-/]+/g, ' ');

    // 4. Split camelCase / PascalCase: LanAnh -> Lan Anh, NgocMinh -> Ngoc Minh
    text = text.replace(/(\p{Ll})(\p{Lu})/gu, '$1 $2');

    // 5. Separate letters and numbers: Huy2005 -> Huy 2005, 99Tuan -> 99 Tuan
    text = text.replace(/(\p{L})(\p{N})/gu, '$1 $2');
    text = text.replace(/(\p{N})(\p{L})/gu, '$1 $2');

    // 6. Convert 2kX to 200X (e.g. 2k4 -> 2004, 2k -> 2000)
    text = text.replace(/\b2\s*k\s*([0-9])\b/gi, '200$1');
    text = text.replace(/\b2\s*k\b/gi, '2000');

    // 7. Strip meaningless trailing long ID numbers (>= 5 digits, e.g. TikTok auto-appended user IDs)
    text = text.replace(/\b\d{5,}\b/g, '');

    // 8. Collapse repeated character floods: Huuuuyyy -> Huy
    text = text.replace(/(\p{L})\1{2,}/gu, '$1');

    // 9. Format words
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return fallback;

    const resultWords = words.map((w) => {
      const lower = w.toLowerCase();
      if (this.COMMON_ENGLISH_NAMES_PHONETICS[lower]) {
        return this.COMMON_ENGLISH_NAMES_PHONETICS[lower];
      }
      // Foreign start letters adaptation for smooth Vietnamese phonetics
      let sub = w;
      sub = sub.replace(/^[Jj]([a-zà-ỹ])/i, 'Gi$1');
      sub = sub.replace(/^[Ww]/i, 'V');
      sub = sub.replace(/^[Zz]/i, 'D');
      sub = sub.replace(/^[Ff]/i, 'Ph');

      // Title Case word to prevent SAPI / Chromium acronym letter-by-letter spelling
      const first = sub.charAt(0).toUpperCase();
      const rest = sub.slice(1).toLowerCase();
      return first + rest;
    });

    const finalStr = resultWords.join(' ').trim().slice(0, 24);
    return finalStr || fallback;
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
    // Set balanced default volume (0.80) so voice does not drown out or clip BGM
    utterance.volume = options?.volume ?? 0.8;

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

