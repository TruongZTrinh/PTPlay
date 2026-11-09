export class TextSanitizer {
  public static sanitizeNickname(raw: string): string {
    if (!raw || typeof raw !== 'string') return 'Khách';
    // Remove control characters & excessive whitespace
    let clean = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    // Strip HTML tags
    clean = clean.replace(/<[^>]*>?/gm, '');
    // Limit length to 20 chars
    if (clean.length > 20) {
      clean = clean.substring(0, 19) + '…';
    }
    return clean || 'Khách';
  }

  public static sanitizeComment(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    let clean = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    clean = clean.replace(/<[^>]*>?/gm, '');
    return clean.slice(0, 100);
  }

  public static stripVietnameseAccents(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}

