import { PlayerRecord } from '../types';
import { SeatAllocator, SeatSlot } from './SeatAllocator';
import { TextSanitizer } from '../utils/TextSanitizer';

export class StudentRoster {
  private players = new Map<string, PlayerRecord>();
  private seatAllocator: SeatAllocator;

  constructor(seatAllocator: SeatAllocator) {
    this.seatAllocator = seatAllocator;
    this.seedNpcContestants();
  }

  private seedNpcContestants(): void {
    // Seed 8 friendly default chibi contestants as seen in concept art
    const npcs = [
      { name: 'Ngọc Anh', team: 'red' },
      { name: 'Minh Quân', team: 'blue' },
      { name: 'Lan Anh', team: 'red' },
      { name: 'Huy', team: 'blue' },
      { name: 'Khánh Vy', team: 'red' },
      { name: 'Bảo Nam', team: 'blue' },
      { name: 'Gia Huy', team: 'red' },
      { name: 'Tú Anh', team: 'blue' },
    ];

    npcs.forEach((npc, idx) => {
      const id = `npc_${idx + 1}`;
      const seat = this.seatAllocator.assignSeat(id);
      this.players.set(id, {
        userId: id,
        uniqueId: `@${id}`,
        nickname: npc.name,
        team: npc.team as 'red' | 'blue',
        score: Math.max(80, 200 - idx * 15),
        streak: idx < 2 ? 3 : 1,
        maxStreak: idx < 2 ? 5 : 2,
        answersCount: 10,
        correctCount: 8,
        lastActiveTime: Date.now(),
        skinIndex: idx % 8,
        seatIndex: seat.index,
      });
    });
  }

  public registerOrGet(userId: string, nickname: string, avatarUrl?: string, team?: 'red' | 'blue'): { player: PlayerRecord; isNew: boolean } {
    let player = this.players.get(userId);
    let isNew = false;

    if (!player) {
      isNew = true;
      const cleanNick = TextSanitizer.sanitizeNickname(nickname);
      const seat = this.seatAllocator.assignSeat(userId);
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
        seatIndex: seat.index,
      };
      this.players.set(userId, player);
    } else {
      player.lastActiveTime = Date.now();
      if (avatarUrl && !player.avatarUrl) {
        player.avatarUrl = avatarUrl;
      }
      if (team) {
        player.team = team;
      }
    }

    return { player, isNew };
  }

  public getPlayer(userId: string): PlayerRecord | undefined {
    return this.players.get(userId);
  }

  public getAllPlayers(): PlayerRecord[] {
    return Array.from(this.players.values());
  }

  public getTopPlayers(limit: number = 10): PlayerRecord[] {
    return this.getAllPlayers()
      .sort((a, b) => b.score - a.score || b.streak - a.streak)
      .slice(0, limit);
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
