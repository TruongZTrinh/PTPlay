export interface SeatSlot {
  index: number;
  row: number; // 0: front, 1: middle, 2: back
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
    // 20 seats arranged in 3 tiered rows in lower half of 540x960 stage
    // Row 0 (Front): 6 seats, y = 780, scale = 0.55
    // Row 1 (Middle): 7 seats, y = 700, scale = 0.48
    // Row 2 (Back): 7 seats, y = 630, scale = 0.42

    const rowsConfig = [
      { count: 7, y: 640, scale: 0.42, depth: 30 },
      { count: 7, y: 710, scale: 0.48, depth: 40 },
      { count: 6, y: 790, scale: 0.55, depth: 50 },
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
    // If already assigned, return existing
    const existing = this.getAssignedSeat(userId);
    if (existing) return existing;

    // Find first empty seat
    const emptySeat = this.seats.find((s) => s.assignedUserId === null);
    if (emptySeat) {
      emptySeat.assignedUserId = userId;
      return emptySeat;
    }

    // If all occupied, pick random seat to rotate
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

