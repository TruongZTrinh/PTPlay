import { RebusPlayerRecord } from '../types';
import { SeatAllocator } from './SeatAllocator';
import { TextNormalizer } from '../utils/TextNormalizer';

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
        skinIndex: idx % 8,
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
      const skinIndex = Math.abs(this.hashCode(userId)) % 8;

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
    }
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

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

