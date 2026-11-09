import { StudentPlayer, StudentSkin, ViewerIdentity } from '../types.js';
import { SeatAllocator } from './SeatAllocator.js';
import { TextSanitizer } from '../utils/TextSanitizer.js';

export class StudentRoster {
  private players: Map<string, StudentPlayer> = new Map();
  public seatAllocator = new SeatAllocator();
  private readonly skins: StudentSkin[] = [
    'blue',
    'pink',
    'green',
    'purple',
    'yellow',
    'orange',
    'navy',
    'coral',
  ];

  public get totalRegistered(): number {
    return this.players.size;
  }

  public getPlayer(userId: string): StudentPlayer | undefined {
    return this.players.get(userId);
  }

  public getAllPlayers(): StudentPlayer[] {
    return Array.from(this.players.values());
  }

  public getVisiblePlayers(): StudentPlayer[] {
    return Array.from(this.players.values()).filter((p) => p.seatIndex >= 0);
  }

  public getDeterministicSkin(userId: string): StudentSkin {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % this.skins.length;
    return this.skins[idx];
  }

  public join(viewer: ViewerIdentity, now = Date.now()): { player: StudentPlayer; isNew: boolean; seated: boolean } {
    const sanitizedNick = TextSanitizer.sanitizeNickname(viewer.nickname);
    const existing = this.players.get(viewer.id);

    if (existing) {
      existing.lastSeenAt = now;
      existing.nickname = sanitizedNick;
      if (viewer.avatarUrl) existing.avatarUrl = viewer.avatarUrl;
      if (viewer.team) existing.team = viewer.team;
      return { player: existing, isNew: false, seated: existing.seatIndex >= 0 };
    }

    const skin = this.getDeterministicSkin(viewer.id);
    let seatIndex = -1;

    // Check for open desk
    const freeSeat = this.seatAllocator.findFreeSeat();
    if (freeSeat !== -1) {
      seatIndex = freeSeat;
      this.seatAllocator.occupySeat(freeSeat, viewer.id);
    }

    const newPlayer: StudentPlayer = {
      id: viewer.id,
      nickname: sanitizedNick,
      avatarUrl: viewer.avatarUrl,
      team: viewer.team,
      score: 0,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      hearts: 3,
      skin,
      seatIndex,
      joinedAt: now,
      lastSeenAt: now,
    };

    this.players.set(viewer.id, newPlayer);
    return { player: newPlayer, isNew: true, seated: seatIndex >= 0 };
  }

  /**
   * Rotates seats if more than 25 participants are active.
   * Ensures top scorers and recent answerers get seats, while rotating others fairly.
   */
  public rotateSeats(): { unseated: StudentPlayer[]; seated: StudentPlayer[] } {
    if (this.players.size <= SeatAllocator.TOTAL_SEATS) {
      return { unseated: [], seated: [] };
    }

    const all = Array.from(this.players.values());
    // Rank by priority: recent answers / highest score / recent activity
    all.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
      return b.lastSeenAt - a.lastSeenAt;
    });

    // Top 10 always keep seats; remaining 15 seats rotate among other players
    const mustKeep = all.slice(0, 10);
    const rotationPool = all.slice(10);

    const newlySeated: StudentPlayer[] = [];
    const unseated: StudentPlayer[] = [];

    // Clear and re-populate seats
    this.seatAllocator.clear();

    mustKeep.forEach((p, idx) => {
      p.seatIndex = idx;
      this.seatAllocator.occupySeat(idx, p.id);
    });

    for (let i = 10; i < SeatAllocator.TOTAL_SEATS; i++) {
      const candidate = rotationPool.shift();
      if (candidate) {
        if (candidate.seatIndex === -1) newlySeated.push(candidate);
        candidate.seatIndex = i;
        this.seatAllocator.occupySeat(i, candidate.id);
      }
    }

    rotationPool.forEach((p) => {
      if (p.seatIndex !== -1) {
        unseated.push(p);
      }
      p.seatIndex = -1;
    });

    return { unseated, seated: newlySeated };
  }

  public getTopPlayers(limit = 10): StudentPlayer[] {
    return Array.from(this.players.values())
      .sort((a, b) => b.score - a.score || b.totalCorrect - a.totalCorrect || a.joinedAt - b.joinedAt)
      .slice(0, limit);
  }

  public clear(): void {
    this.players.clear();
    this.seatAllocator.clear();
  }
}
