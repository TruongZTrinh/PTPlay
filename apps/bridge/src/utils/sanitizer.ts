/**
 * Sanitizes raw TikTok / TikFinity event payloads before storing, logging, or exposing on dashboard
 * Protects viewer privacy and prevents token/credential leakage.
 */
export class DataSanitizer {
  public static maskUserId(userId: string | number): string {
    const str = String(userId);
    if (str.length <= 6) return '***';
    const start = str.slice(0, 3);
    const end = str.slice(-3);
    return `${start}****${end}`;
  }

  public static sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const result: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      const lowerKey = key.toLowerCase();

      // Mask sensitive identifiers
      if (lowerKey === 'userid' || lowerKey === 'user_id') {
        result[key] = this.maskUserId(value as string);
      } else if (
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('password')
      ) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  public static toSanitizedJson(obj: unknown, space = 2): string {
    const sanitized = this.sanitizeObject(obj);
    return JSON.stringify(sanitized, null, space);
  }
}

