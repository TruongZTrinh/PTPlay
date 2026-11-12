export interface SeatSlot {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  scale: number;
  depth: number;
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

export class SeatAllocator {
  public seats: SeatSlot[] = [];
  public waitingSpots: WaitingSpot[] = [];
  public readonly totalSeats: number = 24;

  constructor() {
    this.initSeats();
    this.initWaitingSpots();
  }

  private initSeats(): void {
    // 4 rows x 6 cols = 24 desks on the left/center, leaving the right side for waiting players.
    const rowsConfig = [
      { count: 6, y: 664, scale: 0.44, depth: 30 },
      { count: 6, y: 734, scale: 0.44, depth: 35 },
      { count: 6, y: 804, scale: 0.44, depth: 40 },
      { count: 6, y: 874, scale: 0.44, depth: 45 },
    ];

    let index = 0;
    rowsConfig.forEach((cfg, rowIdx) => {
      const startX = 60;
      const stepX = 66;
      for (let c = 0; c < cfg.count; c++) {
        this.seats.push({
          index,
          row: rowIdx,
          col: c,
          x: Math.round(startX + stepX * c),
          y: cfg.y,
          scale: cfg.scale,
          depth: cfg.depth,
          assignedUserId: null,
        });
        index++;
      }
    });
  }

  private initWaitingSpots(): void {
    // 5 rows x 3 staggered columns = 15 waiting spots for live viewers on the right.
    const rowYs = [648, 704, 760, 816, 872];
    const colXs = [446, 474, 501];
    this.waitingSpots = [];
    let index = 0;
    rowYs.forEach((baseY, r) => {
      colXs.forEach((x, c) => {
        const yOffset = (c % 2 === 1 ? -4 : 3) + (r % 2 === 0 ? 0 : 2);
        this.waitingSpots.push({
          index,
          x,
          y: baseY + yOffset,
          scale: 0.35,
          depth: 31 + r * 3 + c,
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

    const emptySeat = this.seats.find((s) => s.assignedUserId === null);
    if (emptySeat) {
      const existingWait = this.getAssignedWaitingSpot(userId);
      if (existingWait) {
        existingWait.assignedUserId = null;
      }
      emptySeat.assignedUserId = userId;
      return { ...emptySeat, isWaiting: false };
    }

    return this.assignWaiting(userId);
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

