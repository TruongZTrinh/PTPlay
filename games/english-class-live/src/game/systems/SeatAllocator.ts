export interface SeatCoordinate {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  deskX: number;
  deskY: number;
  depth: number;
}

export class SeatAllocator {
  public static readonly TOTAL_SEATS = 25;
  public static readonly COLS = 5;
  public static readonly ROWS = 5;

  private seats: SeatCoordinate[] = [];
  private seatOccupancy: Array<string | null> = new Array(25).fill(null);

  constructor() {
    this.calculateSeatCoordinates();
  }

  /**
   * Pre-computes 25 desk and student coordinates in 5x5 grid
   * Logical 540x960 canvas:
   * Class seating area: Y from ~510 to ~880
   * X from ~54 to ~486
   */
  private calculateSeatCoordinates(): void {
    const startX = 58;
    const spacingX = 106;
    const startY = 525;
    const spacingY = 82;

    for (let r = 0; r < SeatAllocator.ROWS; r++) {
      for (let c = 0; c < SeatAllocator.COLS; c++) {
        const index = r * SeatAllocator.COLS + c;
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;
        const deskX = x;
        const deskY = y + 42;
        // Depth sorted so front rows overlap back rows properly
        const depth = 20 + r * 4;

        this.seats.push({
          index,
          row: r,
          col: c,
          x,
          y,
          deskX,
          deskY,
          depth,
        });
      }
    }
  }

  public getSeat(index: number): SeatCoordinate | undefined {
    return this.seats[index];
  }

  public getAllSeats(): SeatCoordinate[] {
    return this.seats;
  }

  public findFreeSeat(): number {
    return this.seatOccupancy.findIndex((id) => id === null);
  }

  public occupySeat(index: number, viewerId: string): boolean {
    if (index < 0 || index >= SeatAllocator.TOTAL_SEATS) return false;
    this.seatOccupancy[index] = viewerId;
    return true;
  }

  public releaseSeat(index: number): void {
    if (index >= 0 && index < SeatAllocator.TOTAL_SEATS) {
      this.seatOccupancy[index] = null;
    }
  }

  public isFull(): boolean {
    return this.seatOccupancy.every((id) => id !== null);
  }

  public getOccupiedCount(): number {
    return this.seatOccupancy.filter((id) => id !== null).length;
  }

  public getOccupant(index: number): string | null {
    return this.seatOccupancy[index] || null;
  }

  public clear(): void {
    this.seatOccupancy.fill(null);
  }
}
