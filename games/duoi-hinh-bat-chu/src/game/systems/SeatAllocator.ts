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

export class SeatAllocator {
  public seats: SeatSlot[] = [];
  public readonly totalSeats: number = 20;

  constructor() {
    this.initSeats();
  }

  private initSeats(): void {
    // A compact classroom grid keeps every participant visible in portrait video.
    const rowsConfig = [
      { count: 5, y: 667, scale: 0.42, depth: 30 },
      { count: 5, y: 737, scale: 0.42, depth: 35 },
      { count: 5, y: 807, scale: 0.42, depth: 40 },
      { count: 5, y: 877, scale: 0.42, depth: 45 },
    ];

    let index = 0;
    rowsConfig.forEach((cfg, rowIdx) => {
      const stepX = 540 / (cfg.count + 1);
      for (let c = 0; c < cfg.count; c++) {
        this.seats.push({
          index,
          row: rowIdx,
          col: c,
          x: Math.round(stepX * (c + 1)),
          y: cfg.y,
          scale: cfg.scale,
          depth: cfg.depth,
          assignedUserId: null,
        });
        index++;
      }
    });
  }

  public getAssignedSeat(userId: string): SeatSlot | null {
    return this.seats.find((s) => s.assignedUserId === userId) || null;
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
  }

  public clear(): void {
    this.seats.forEach((s) => (s.assignedUserId = null));
  }
}

