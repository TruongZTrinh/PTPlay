import { TextSanitizer } from '../utils/TextSanitizer';

export type CatCafeAction =
  | 'cat_cafe.join'
  | 'cat_cafe.feed'
  | 'cat_cafe.play'
  | 'cat_cafe.nap'
  | 'cat_cafe.love'
  | 'cat_cafe.call'
  | 'cat_cafe.photo'
  | 'cat_cafe.garden'
  | 'cat_cafe.gift_effect'
  | 'cat_cafe.reset'
  | 'cat_cafe.demo_spawn'
  | 'cat_cafe.switch_room'
  | 'cat_cafe.switch_atmosphere'
  | 'cat_cafe.add_purrs'
  | 'cat_cafe.set_purrs'
  | 'cat_cafe.set_level'
  | 'cat_cafe.set_volume'
  | 'cat_cafe.add_cat'
  | 'cat_cafe.clear_cats';

export interface ParsedCafeCommand {
  action: CatCafeAction;
  userId: string;
  uniqueId: string;
  nickname: string;
  metadata?: Record<string, unknown>;
}

export class CafeCommandAdapter {
  public unknownCommandCount = 0;
  public parsedCommandCount = 0;

  /**
   * Parses raw chat comment into a Cat Café game command.
   * Tolerant to Vietnamese diacritics, extra spaces, casing, and common aliases.
   */
  public parseComment(
    userId: string,
    uniqueId: string,
    nickname: string,
    comment: string
  ): ParsedCafeCommand | null {
    if (!comment || typeof comment !== 'string') return null;

    const trimmed = comment.trim();
    const cleanNoAccent = TextSanitizer.stripVietnameseAccents(trimmed).toUpperCase();
    const tokens = cleanNoAccent.split(/\s+/);
    const firstWord = tokens[0] || '';

    // 1. Join / Call cat: MÈO / MEO / MEOW / CAT
    if (
      firstWord === 'MEO' ||
      firstWord === 'MEOW' ||
      firstWord === 'CAT' ||
      cleanNoAccent.includes('XIN MEO') ||
      cleanNoAccent.includes('NHAN MEO')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.join',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 2. Feed: ĂN / AN / FEED / EAT
    if (
      firstWord === 'AN' ||
      firstWord === 'FEED' ||
      firstWord === 'EAT' ||
      cleanNoAccent.includes('CHO AN')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.feed',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 3. Play: CHƠI / CHOI / PLAY
    if (
      firstWord === 'CHOI' ||
      firstWord === 'PLAY' ||
      cleanNoAccent.includes('CHOI DUA') ||
      cleanNoAccent.includes('NGHICH')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.play',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 4. Sleep: NGỦ / NGU / SLEEP / NAP
    if (
      firstWord === 'NGU' ||
      firstWord === 'SLEEP' ||
      firstWord === 'NAP' ||
      cleanNoAccent.includes('DI NGU')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.nap',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 5. Love: YÊU / YEU / LOVE / TIM
    if (
      firstWord === 'YEU' ||
      firstWord === 'LOVE' ||
      firstWord === 'TIM' ||
      cleanNoAccent.includes('THA TIM') ||
      cleanNoAccent.includes('THUONG')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.love',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 6. Call to Stage: GỌI / GOI / CALL / COME / LAI DAY
    if (
      firstWord === 'GOI' ||
      firstWord === 'CALL' ||
      firstWord === 'COME' ||
      cleanNoAccent.includes('LAI DAY') ||
      cleanNoAccent.includes('RA DAY') ||
      cleanNoAccent.includes('DUNG DAY')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.call',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 7. Photo Moment: CHỤP / CHUP / PHOTO / PIC / POSE
    if (
      firstWord === 'CHUP' ||
      firstWord === 'PHOTO' ||
      firstWord === 'PIC' ||
      firstWord === 'POSE' ||
      cleanNoAccent.includes('CHUP ANH')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.photo',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // 8. Garden Excursion: VƯỜN / VUON / GARDEN / OUT / GAC
    if (
      firstWord === 'VUON' ||
      firstWord === 'GARDEN' ||
      firstWord === 'OUT' ||
      firstWord === 'GAC' ||
      cleanNoAccent.includes('RA VUON') ||
      cleanNoAccent.includes('LEN GAC')
    ) {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.garden',
        userId,
        uniqueId,
        nickname,
        metadata: { originalComment: comment },
      };
    }

    // Reset command
    if (cleanNoAccent === 'RESET' || cleanNoAccent === 'LAM LAI') {
      this.parsedCommandCount++;
      return {
        action: 'cat_cafe.reset',
        userId,
        uniqueId,
        nickname,
      };
    }

    this.unknownCommandCount++;
    return null;
  }

  public parseGift(
    userId: string,
    uniqueId: string,
    nickname: string,
    giftName: string,
    deltaCount = 1
  ): ParsedCafeCommand {
    this.parsedCommandCount++;
    return {
      action: 'cat_cafe.gift_effect',
      userId,
      uniqueId,
      nickname,
      metadata: {
        giftName,
        count: Math.max(1, deltaCount),
      },
    };
  }
}
