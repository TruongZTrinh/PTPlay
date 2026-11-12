import { RebusPlayerRecord } from '../types';
import { SeatAllocator } from './SeatAllocator';
import { TextNormalizer } from '../utils/TextNormalizer';

const FEMALE_NAMES = new Set([
  'thi', 'ngoc', 'hong', 'lan', 'mai', 'hoa', 'cuc', 'truc', 'dao', 'vy', 'vi',
  'my', 'mi', 'nhi', 'nhu', 'thu', 'linh', 'trang', 'huong', 'thao', 'yen', 'ngan',
  'trinh', 'phuong', 'tuyet', 'diem', 'diep', 'quyen', 'quynh', 'chau', 'bich', 'ha',
  'chi', 'oanh', 'hanh', 'hien', 'hue', 'kieu', 'le', 'lien', 'loan', 'ly', 'nga',
  'nhung', 'phung', 'suong', 'thuy', 'tien', 'tuyen', 'xuan', 'nang', 'girl', 'lady',
  'queen', 'princess', 'anna', 'mary', 'lisa', 'jenny', 'amy', 'emily', 'sophia', 'chloe',
  'hana', 'bong', 'su',
]);

const MALE_NAMES = new Set([
  'duc', 'huu', 'cong', 'quoc', 'tuan', 'kiet', 'hung', 'manh', 'cuong', 'nam', 'quan',
  'huy', 'phuc', 'loc', 'tho', 'khoa', 'khang', 'khoi', 'long', 'phat', 'tai', 'dat',
  'trung', 'hieu', 'nghia', 'tri', 'tin', 'tung', 'bach', 'son', 'hai', 'phong', 'vu',
  'toan', 'thang', 'thinh', 'trong', 'truong', 'viet', 'vinh', 'vuong', 'hoang', 'binh',
  'duy', 'khai', 'nhat', 'sang', 'tan', 'thien', 'boy', 'king', 'bro', 'mr', 'david',
  'john', 'alex', 'kevin', 'peter', 'tom', 'jack', 'leo',
]);

export class StudentRoster {
  private players = new Map<string, RebusPlayerRecord>();
  private seatAllocator: SeatAllocator;
  private onScoreChanged?: (player: RebusPlayerRecord) => void;
  private onPlayerRegistered?: (player: RebusPlayerRecord) => void;

  constructor(seatAllocator: SeatAllocator) {
    this.seatAllocator = seatAllocator;
    this.seedNpcContestants();
  }

  public setOnScoreChanged(callback: (player: RebusPlayerRecord) => void): void {
    this.onScoreChanged = callback;
  }

  public setOnPlayerRegistered(callback: (player: RebusPlayerRecord) => void): void {
    this.onPlayerRegistered = callback;
  }

  private seedNpcContestants(): void {
    const npcs = [
      { name: 'Ngọc Anh', team: 'red' },
      { name: 'Minh Quân', team: 'blue' },
      { name: 'Lan Anh', team: 'red' },
      { name: 'Huy', team: 'blue' },
      { name: 'Khánh Vy', team: 'red' },
      { name: 'Bảo Nam', team: 'blue' },
      { name: 'Phương', team: 'red' },
      { name: 'Đức Anh', team: 'blue' },
    ];

    npcs.forEach((npc, idx) => {
      const id = `npc_${idx + 1}`;
      const seat = this.seatAllocator.assignSeatOrWaiting(id);
      this.players.set(id, {
        userId: id,
        uniqueId: `@${id}`,
        nickname: npc.name,
        team: npc.team as 'red' | 'blue',
        score: 0,
        streak: 0,
        maxStreak: 0,
        answersCount: 0,
        correctCount: 0,
        lastActiveTime: Date.now(),
        skinIndex: this.pickSkinIndex(npc.name, id),
        seatIndex: seat.index,
        lastGuessTime: 0,
        guessesInCurrentRound: 0,
      });
    });
  }

  public registerOrGet(
    userId: string,
    nickname: string,
    avatarUrl?: string,
    team?: 'red' | 'blue',
    mode: 'seat' | 'waiting' = 'seat'
  ): { player: RebusPlayerRecord; isNew: boolean } {
    let player = this.players.get(userId);
    let isNew = false;
    let slotChanged = false;

    if (!player) {
      isNew = true;
      const cleanNick = TextNormalizer.sanitizeNickname(nickname);
      const slot = mode === 'waiting'
        ? this.seatAllocator.assignWaiting(userId)
        : this.seatAllocator.assignSeatOrWaiting(userId);
      const skinIndex = this.pickSkinIndex(cleanNick, userId);

      player = {
        userId,
        uniqueId: `@${userId}`,
        nickname: cleanNick,
        avatarUrl,
        team: team || (Math.random() > 0.5 ? 'red' : 'blue'),
        score: 0,
        streak: 0,
        maxStreak: 0,
        answersCount: 0,
        correctCount: 0,
        lastActiveTime: Date.now(),
        skinIndex,
        seatIndex: slot.index,
        lastGuessTime: 0,
        guessesInCurrentRound: 0,
      };
      this.players.set(userId, player);
      slotChanged = true;
    } else {
      player.lastActiveTime = Date.now();
      if (avatarUrl && !player.avatarUrl) {
        player.avatarUrl = avatarUrl;
      }
      if (team) {
        player.team = team;
      }
      if (mode === 'seat' && this.seatAllocator.getAssignedWaitingSpot(userId)) {
        const promoted = this.seatAllocator.assignSeatOrWaiting(userId);
        if (!promoted.isWaiting) {
          player.seatIndex = promoted.index;
          slotChanged = true;
        }
      }
    }

    if (slotChanged) {
      this.onPlayerRegistered?.(player);
    }

    return { player, isNew };
  }

  public getPlayer(userId: string): RebusPlayerRecord | undefined {
    return this.players.get(userId);
  }

  public getAllPlayers(): RebusPlayerRecord[] {
    return Array.from(this.players.values());
  }

  public getTopPlayers(limit: number = 10): RebusPlayerRecord[] {
    return this.getAllPlayers()
      .sort((a, b) => b.score - a.score || b.streak - a.streak)
      .slice(0, limit);
  }

  public checkCanGuess(userId: string, maxGuesses: number, cooldownMs: number): { allowed: boolean; reason?: string } {
    const player = this.players.get(userId);
    if (!player) return { allowed: true };

    const now = Date.now();
    if (now - player.lastGuessTime < cooldownMs) {
      return { allowed: false, reason: 'cooldown' };
    }

    if (player.guessesInCurrentRound >= maxGuesses) {
      return { allowed: false, reason: 'limit_reached' };
    }

    return { allowed: true };
  }

  public recordGuessAttempt(userId: string): void {
    const player = this.players.get(userId);
    if (player) {
      player.lastGuessTime = Date.now();
      player.guessesInCurrentRound++;
      player.roundsWithoutAnswer = 0;
    }
  }

  public advanceInactiveCounters(): void {
    this.players.forEach((p) => {
      if (this.seatAllocator.getAssignedSeat(p.userId)) {
        p.roundsWithoutAnswer = p.guessesInCurrentRound === 0 ? (p.roundsWithoutAnswer || 0) + 1 : 0;
      }
    });
  }

  public resetRoundAttempts(): void {
    this.players.forEach((p) => {
      p.guessesInCurrentRound = 0;
    });
  }

  public addGiftPoints(userId: string, points: number): void {
    const player = this.players.get(userId);
    if (!player) return;
    player.score += points;
    player.roundsWithoutAnswer = 0;
    player.lastActiveTime = Date.now();
    this.onScoreChanged?.(player);
  }

  public grantExtraGuesses(userId: string, count: number = 3): void {
    const player = this.players.get(userId);
    if (!player) return;
    player.guessesInCurrentRound = Math.max(0, player.guessesInCurrentRound - count);
  }

  public addScore(userId: string, points: number, isCorrect: boolean): void {
    const player = this.players.get(userId);
    if (!player) return;

    player.answersCount++;
    player.lastActiveTime = Date.now();

    if (isCorrect) {
      player.correctCount++;
      player.score += points;
      player.streak++;
      if (player.streak > player.maxStreak) {
        player.maxStreak = player.streak;
      }
    } else {
      player.streak = 0;
    }

    this.onScoreChanged?.(player);
  }

  private detectGenderFromName(nickname: string): 'boy' | 'girl' | null {
    const rawLower = (nickname || '').toLowerCase();
    // Accented disambiguation for classic Vietnamese pairs
    if (/\b(vân|dung|thúy|thủy|thư|nữ|gái|cô)\b/.test(rawLower)) return 'girl';
    if (/\b(văn|dũng|nam|anh trai|chàng)\b/.test(rawLower)) return 'boy';

    const clean = TextNormalizer.stripVietnameseAccents(rawLower)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return null;

    if (/\b(lan anh|ngoc anh|van anh|kim anh|phuong anh|quynh anh|minh anh|ha my|thao nhi|khanh vy)\b/.test(clean)) {
      return 'girl';
    }
    if (/\b(duc anh|tuan anh|hoang anh|viet anh|quoc anh|the anh|minh quan|bao nam|tuan kiet|gia hung)\b/.test(clean)) {
      return 'boy';
    }

    const tokens = clean.split(' ').filter(Boolean);
    let boyScore = 0;
    let girlScore = 0;

    tokens.forEach((tok, idx) => {
      const weight = idx === tokens.length - 1 ? 2 : 1;
      if (FEMALE_NAMES.has(tok)) girlScore += weight;
      if (MALE_NAMES.has(tok)) boyScore += weight;
    });

    // Also handle concatenated handles like "thaonhi99" or "tuankiet_vn"
    if (boyScore === 0 && girlScore === 0) {
      const compact = clean.replace(/\s+/g, '');
      for (const name of FEMALE_NAMES) {
        if (name.length >= 3 && compact.includes(name)) {
          girlScore += 1;
          break;
        }
      }
      for (const name of MALE_NAMES) {
        if (name.length >= 3 && compact.includes(name)) {
          boyScore += 1;
          break;
        }
      }
    }

    if (girlScore > boyScore) return 'girl';
    if (boyScore > girlScore) return 'boy';
    return null;
  }

  private pickSkinIndex(nickname: string, seed: string): number {
    const hash = Math.abs(this.hashCode(seed));
    const gender = this.detectGenderFromName(nickname);
    if (gender === 'boy') return (hash % 4) * 2;       // 0, 2, 4, 6 -> boy_01..04
    if (gender === 'girl') return (hash % 4) * 2 + 1;  // 1, 3, 5, 7 -> girl_01..04
    return hash % 8;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

