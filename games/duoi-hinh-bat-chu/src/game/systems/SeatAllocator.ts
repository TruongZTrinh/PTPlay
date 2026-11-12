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
      { count: 6, y: 668, scale: 0.44, depth: 30 },
      { count: 6, y: 740, scale: 0.44, depth: 35 },
      { count: 6, y: 812, scale: 0.44, depth: 40 },
      { count: 6, y: 884, scale: 0.44, depth: 45 },
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
    const coords = [
      { x: 458, y: 668, depth: 31 },
      { x: 488, y: 706, depth: 33 },
      { x: 456, y: 748, depth: 36 },
      { x: 488, y: 790, depth: 38 },
      { x: 458, y: 834, depth: 41 },
      { x: 486, y: 876, depth: 44 },
    ];
    this.waitingSpots = coords.map((c, index) => ({
      index,
      x: c.x,
      y: c.y,
      scale: 0.44,
      depth: c.depth,
      assignedUserId: null,
    }));
  }

  public getAssignedSeat(userId: string): SeatSlot | null {
    return this.seats.find((s) => s.assignedUserId === userId) || null;
  }

  public getAssignedWaitingSpot(userId: string): WaitingSpot | null {
    return this.waitingSpots.find((w) => w.assignedUserId === userId) || null;
  }

  public assignSeatOrWaiting(userId: string): { x: number; y: number; scale: number; depth: number; isWaiting: boolean } {
    const existingSeat = this.getAssignedSeat(userId);
    if (existingSeat) {
      return { ...existingSeat, isWaiting: false };
    }
    const existingWait = this.getAssignedWaitingSpot(userId);
    if (existingWait) {
      return { ...existingWait, isWaiting: true };
    }

    const emptySeat = this.seats.find((s) => s.assignedUserId === null);
    if (emptySeat) {
      emptySeat.assignedUserId = userId;
      return { ...emptySeat, isWaiting: false };
    }

    const emptyWait = this.waitingSpots.find((w) => w.assignedUserId === null);
    if (emptyWait) {
      emptyWait.assignedUserId = userId;
      return { ...emptyWait, isWaiting: true };
    }

    const fallbackWait = this.waitingSpots[Math.floor(Math.random() * this.waitingSpots.length)];
    return { ...fallbackWait, isWaiting: true };
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

