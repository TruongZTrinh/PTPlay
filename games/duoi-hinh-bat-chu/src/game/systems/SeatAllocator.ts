export interface SeatSlot {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  scale: number;
  depth: number;
  isTop5: boolean;
  assignedUserId: string | null;
}

export interface WaitingSpot {
  index: number;
  x: number;
  y: number;
  scale: number;
  depth: number;
  assignedUserId: string | null;
}

export interface SeatMove {
  userId: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  isWaiting: boolean;
  kind: 'promote_top5' | 'bumped_down' | 'shift';
}

export interface RebalanceResult {
  moves: SeatMove[];
  top5Takeovers: { challengerId: string; displacedId?: string; rank: number }[];
}

export class SeatAllocator {
  public seats: SeatSlot[] = [];
  public waitingSpots: WaitingSpot[] = [];
  public readonly totalSeats: number = 29;

  constructor() {
    this.initSeats();
    this.initWaitingSpots();
  }

  private initSeats(): void {
    // Row 0: 5 large VIP desks corresponding to the Top 5 Leaderboard (BẢNG VINH DANH).
    const top5StartX = 64;
    const top5StepX = 81;
    for (let c = 0; c < 5; c++) {
      this.seats.push({
        index: c,
        row: 0,
        col: c,
        x: Math.round(top5StartX + top5StepX * c),
        y: 668,
        scale: 0.5,
        depth: 30,
        isTop5: true,
        assignedUserId: null,
      });
    }

    // Rows 1..3: 3 rows x 8 smaller desks = 24 regular desks so more players fit.
    const lowerRows = [
      { y: 742, depth: 35 },
      { y: 808, depth: 40 },
      { y: 874, depth: 45 },
    ];
    let index = 5;
    lowerRows.forEach((cfg, idx) => {
      const startX = 52;
      const stepX = 50;
      for (let c = 0; c < 8; c++) {
        this.seats.push({
          index,
          row: idx + 1,
          col: c,
          x: Math.round(startX + stepX * c),
          y: cfg.y,
          scale: 0.34,
          depth: cfg.depth,
          isTop5: false,
          assignedUserId: null,
        });
        index++;
      }
    });
  }

  private initWaitingSpots(): void {
    // 6 rows x 2 staggered columns = 12 waiting spots with room for each viewer's name tag.
    const rowYs = [638, 686, 734, 782, 830, 876];
    const colXs = [450, 493];
    this.waitingSpots = [];
    let index = 0;
    rowYs.forEach((baseY, r) => {
      colXs.forEach((x, c) => {
        const yOffset = c === 1 ? -4 : 3;
        this.waitingSpots.push({
          index,
          x,
          y: baseY + yOffset,
          scale: 0.36,
          depth: 31 + r * 2 + c,
          assignedUserId: null,
        });
        index++;
      });
    });
  }

  public getAssignedSeat(userId: string): SeatSlot | null {
    return this.seats.find((s) => s.assignedUserId === userId) || null;
  }

  public getAssignedWaitingSpot(userId: string): WaitingSpot | null {
    return this.waitingSpots.find((w) => w.assignedUserId === userId) || null;
  }

  public getSlotForUser(userId: string): { index: number; x: number; y: number; scale: number; depth: number; isWaiting: boolean } | null {
    const seat = this.getAssignedSeat(userId);
    if (seat) return { ...seat, isWaiting: false };
    const wait = this.getAssignedWaitingSpot(userId);
    if (wait) return { ...wait, isWaiting: true };
    return null;
  }

  public assignWaiting(userId: string): { index: number; x: number; y: number; scale: number; depth: number; isWaiting: boolean } {
    const existingSeat = this.getAssignedSeat(userId);
    if (existingSeat) {
      return { ...existingSeat, isWaiting: false };
    }
    const existingWait = this.getAssignedWaitingSpot(userId);
    if (existingWait) {
      return { ...existingWait, isWaiting: true };
    }

    const emptyWait = this.waitingSpots.find((w) => w.assignedUserId === null);
    if (emptyWait) {
      emptyWait.assignedUserId = userId;
      return { ...emptyWait, isWaiting: true };
    }

    const rotateIndex = Math.floor(Math.random() * this.waitingSpots.length);
    const spot = this.waitingSpots[rotateIndex];
    spot.assignedUserId = userId;
    return { ...spot, isWaiting: true };
  }

  public assignSeatOrWaiting(userId: string): { index: number; x: number; y: number; scale: number; depth: number; isWaiting: boolean } {
    const existingSeat = this.getAssignedSeat(userId);
    if (existingSeat) {
      return { ...existingSeat, isWaiting: false };
    }

    // Reserve Row 0 (indices 0..4) for Top-5 ranked players; new/0-point players sit in rows 1..3 first.
    const emptyLowerSeat = this.seats.find((s) => !s.isTop5 && s.assignedUserId === null);
    if (emptyLowerSeat) {
      const existingWait = this.getAssignedWaitingSpot(userId);
      if (existingWait) {
        existingWait.assignedUserId = null;
      }
      emptyLowerSeat.assignedUserId = userId;
      return { ...emptyLowerSeat, isWaiting: false };
    }

    return this.assignWaiting(userId);
  }

  /**
   * Re-assigns Top-5 VIP desks (seats[0..4]) to the top 5 scored players,
   * moving displaced players down to regular desks (seats[5..28]).
   */
  public rebalanceByRank(rankedUserIds: string[]): RebalanceResult {
    const top5Ids = rankedUserIds.slice(0, 5);
    const prevTop5BySlot = new Map<number, string | null>();
    for (let i = 0; i < 5; i++) {
      prevTop5BySlot.set(i, this.seats[i].assignedUserId);
    }

    const moves: SeatMove[] = [];
    const top5Takeovers: { challengerId: string; displacedId?: string; rank: number }[] = [];

    // 1. Identify any players currently in Top-5 seats who are no longer in top5Ids
    const displacedIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const occupant = this.seats[i].assignedUserId;
      if (occupant && !top5Ids.includes(occupant)) {
        displacedIds.push(occupant);
        this.seats[i].assignedUserId = null;
      }
    }

    // 2. Clear waiting or lower seats for new Top-5 entrants and place them into seats[0..4]
    top5Ids.forEach((uid, rankIdx) => {
      const targetSeat = this.seats[rankIdx];
      const currentSeat = this.getAssignedSeat(uid);
      if (currentSeat && currentSeat.index === rankIdx) {
        return;
      }

      const wasTop5 = currentSeat?.isTop5 ?? false;
      if (currentSeat) {
        currentSeat.assignedUserId = null;
      }
      const wait = this.getAssignedWaitingSpot(uid);
      if (wait) {
        wait.assignedUserId = null;
      }

      const prevOccupant = prevTop5BySlot.get(rankIdx) || undefined;
      targetSeat.assignedUserId = uid;

      if (!wasTop5) {
        const displacedId = displacedIds.length > 0 ? displacedIds[0] : (prevOccupant && prevOccupant !== uid ? prevOccupant : undefined);
        top5Takeovers.push({ challengerId: uid, displacedId, rank: rankIdx + 1 });
        moves.push({
          userId: uid,
          x: targetSeat.x,
          y: targetSeat.y,
          scale: targetSeat.scale,
          depth: targetSeat.depth,
          isWaiting: false,
          kind: 'promote_top5',
        });
      } else {
        moves.push({
          userId: uid,
          x: targetSeat.x,
          y: targetSeat.y,
          scale: targetSeat.scale,
          depth: targetSeat.depth,
          isWaiting: false,
          kind: 'shift',
        });
      }
    });

    // 3. Re-seat displaced former Top-5 players into open lower desks (or waiting if full)
    displacedIds.forEach((uid) => {
      const openLower = this.seats.find((s) => !s.isTop5 && s.assignedUserId === null);
      if (openLower) {
        openLower.assignedUserId = uid;
        moves.push({
          userId: uid,
          x: openLower.x,
          y: openLower.y,
          scale: openLower.scale,
          depth: openLower.depth,
          isWaiting: false,
          kind: 'bumped_down',
        });
      } else {
        const waitSlot = this.assignWaiting(uid);
        moves.push({
          userId: uid,
          x: waitSlot.x,
          y: waitSlot.y,
          scale: waitSlot.scale,
          depth: waitSlot.depth,
          isWaiting: true,
          kind: 'bumped_down',
        });
      }
    });

    return { moves, top5Takeovers };
  }

  public assignSeat(userId: string): SeatSlot {
    const existing = this.getAssignedSeat(userId);
    if (existing) return existing;

    const emptySeat = this.seats.find((s) => s.assignedUserId === null);
    if (emptySeat) {
      emptySeat.assignedUserId = userId;
      return emptySeat;
    }

    const rotateIndex = Math.floor(Math.random() * this.seats.length);
    const seat = this.seats[rotateIndex];
    seat.assignedUserId = userId;
    return seat;
  }

  public releaseSeat(userId: string): void {
    const seat = this.getAssignedSeat(userId);
    if (seat) {
      seat.assignedUserId = null;
    }
    const wait = this.getAssignedWaitingSpot(userId);
    if (wait) {
      wait.assignedUserId = null;
    }
  }

  public clear(): void {
    this.seats.forEach((s) => (s.assignedUserId = null));
    this.waitingSpots.forEach((w) => (w.assignedUserId = null));
  }
}

