export class TextSanitizer {
  public static stripVietnameseAccents(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  public static sanitizeNickname(raw: string, maxLen = 16): string {
    if (!raw || typeof raw !== 'string') return 'Viewer';
    const cleaned = raw.replace(/[<>&"'/]/g, '').trim();
    if (!cleaned) return 'Viewer';
    return Array.from(cleaned).slice(0, maxLen).join('');
  }
}

export class DataSanitizer {
  public static maskUserId(id: string): string {
    if (!id || typeof id !== 'string') return '****';
    if (id.length <= 6) return '****';
    return `${id.slice(0, 3)}****${id.slice(-3)}`;
  }

  public static sanitizeObject(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (lower.includes('token') || lower.includes('secret') || lower.includes('pass')) {
        result[key] = '[REDACTED]';
      } else if (lower.includes('userid') || lower === 'id' && typeof val === 'string' && val.length > 10) {
        result[key] = typeof val === 'string' ? this.maskUserId(val) : val;
      } else if (typeof val === 'object' && val !== null) {
        result[key] = this.sanitizeObject(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  }
}
