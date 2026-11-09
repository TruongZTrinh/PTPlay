export class Random {
  public static range(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public static rangeInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static choice<T>(items: readonly T[]): T {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
  }
}

