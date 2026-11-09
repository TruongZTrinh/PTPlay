import { Answer, Team } from '../types.js';

export class TextSanitizer {
  public static stripVietnameseAccents(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  public static sanitizeNickname(nickname: string, maxLength = 14): string {
    if (!nickname || typeof nickname !== 'string') return 'Học Sinh';
    // Remove tags, control characters and extra spaces
    const clean = nickname
      .replace(/<[^>]*>/g, '')
      .replace(/[<>\u0000-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return 'Học Sinh';
    return clean.slice(0, maxLength);
  }

  public static parseAnswer(text: string): Answer | null {
    if (!text || typeof text !== 'string') return null;
    const clean = this.stripVietnameseAccents(text.trim()).toUpperCase();
    const match = clean.match(/^(?:DAP AN|ANSWER|CHON|CAU)?\s*[:.\-]?\s*([ABCD])(?:[.)!])?$/);
    if (match) {
      return match[1] as Answer;
    }
    return null;
  }

  public static isJoinCommand(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const clean = this.stripVietnameseAccents(text.trim()).toUpperCase();
    return /^(JOIN|VAO|THAM GIA|PLAY|CHOI|DI HOC)$/.test(clean) || clean.includes('XIN VAO') || clean.includes('VAO LOP');
  }

  public static parseTeam(text: string): Team | null {
    if (!text || typeof text !== 'string') return null;
    const clean = this.stripVietnameseAccents(text.trim()).toUpperCase();
    if (/^(RED|DO|TEAM RED|TEAM DO)$/.test(clean)) return 'red';
    if (/^(BLUE|XANH|TEAM BLUE|TEAM XANH)$/.test(clean)) return 'blue';
    return null;
  }
}
