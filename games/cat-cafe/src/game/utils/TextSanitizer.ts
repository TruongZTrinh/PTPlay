export class TextSanitizer {
  /**
   * Sanitizes user-provided nickname for safe rendering in canvas.
   * Strips HTML tags, trims whitespace, limits length to maxLength.
   */
  public static sanitizeNickname(nickname?: string, maxLength = 16): string {
    if (!nickname || typeof nickname !== 'string') {
      return 'Bé Mèo Khách';
    }
    // Remove HTML tags and control chars
    const cleaned = nickname
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();

    if (!cleaned) {
      return 'Bé Mèo Khách';
    }

    return Array.from(cleaned).slice(0, maxLength).join('');
  }

  /**
   * Masks sensitive User IDs (e.g. "7293849102" -> "729****102")
   */
  public static maskUserId(userId?: string): string {
    if (!userId || typeof userId !== 'string') return 'anonymous';
    if (userId.length <= 6) return '****';
    const start = userId.slice(0, 3);
    const end = userId.slice(-3);
    return `${start}****${end}`;
  }

  /**
   * Normalizes Vietnamese strings: removes diacritics, lowercase, trims.
   * Example: "MÈO ƠI" -> "MEO OI", "ĂN CƠM" -> "AN COM"
   */
  public static stripVietnameseAccents(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Generates a deterministic integer hash from a string (for consistent coat assignment)
   */
  public static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

