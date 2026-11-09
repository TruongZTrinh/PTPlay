export class TextNormalizer {
  public static stripVietnameseAccents(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  public static normalizeExactAnswer(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    const noAccent = this.stripVietnameseAccents(raw).toLowerCase();
    // Keep only alphanumeric characters (a-z, 0-9)
    return noAccent.replace(/[^a-z0-9]/g, '');
  }

  public static matchesAnswer(userComment: string, answer: string, aliases: string[] = []): boolean {
    const normComment = this.normalizeExactAnswer(userComment);
    const normAnswer = this.normalizeExactAnswer(answer);

    if (!normComment || !normAnswer) return false;

    // Exact match
    if (normComment === normAnswer) return true;

    // Check aliases
    for (const alias of aliases) {
      if (this.normalizeExactAnswer(alias) === normComment) {
        return true;
      }
    }

    // Comment containing exact answer (e.g. "cá vàng nha", "đáp án là cá vàng")
    // Only if answer length is >= 4 chars to avoid false positives on short words
    if (normAnswer.length >= 4 && normComment.includes(normAnswer)) {
      return true;
    }

    return false;
  }

  public static sanitizeNickname(raw: string): string {
    if (!raw || typeof raw !== 'string') return 'Thám Tử';
    let clean = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    clean = clean.replace(/<[^>]*>?/gm, '');
    if (clean.length > 20) {
      clean = clean.substring(0, 19) + '…';
    }
    return clean || 'Thám Tử';
  }

  public static getCharacterCount(answer: string): number {
    const clean = answer.replace(/\s+/g, '');
    return clean.length;
  }
}

