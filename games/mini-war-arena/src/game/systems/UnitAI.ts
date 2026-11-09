import Phaser from 'phaser';
import { Unit } from '../entities/Unit';

export class UnitAI {
  /**
   * Finds the best target for this unit.
   * Prioritizes living enemies in the same lane.
   * If lane is clear, targets closest enemy in adjacent lanes.
   */
  public static findTarget(unit: Unit, allUnits: Unit[]): Unit | undefined {
    let bestTarget: Unit | undefined;
    let closestDist = Infinity;

    // 1. First priority: Enemies in the same lane
    for (const other of allUnits) {
      if (!other.alive || other.team === unit.team || other.lane !== unit.lane) continue;

      const dist = Math.abs(other.x - unit.x);
      if (dist < closestDist) {
        closestDist = dist;
        bestTarget = other;
      }
    }

    if (bestTarget) return bestTarget;

    // 2. Second priority: If no enemies in current lane, look for nearby enemies in adjacent lanes within range
    closestDist = Infinity;
    for (const other of allUnits) {
      if (!other.alive || other.team === unit.team) continue;
      const laneDiff = Math.abs(other.lane - unit.lane);
      if (laneDiff === 1) {
        const dist = Phaser.Math.Distance.Between(unit.x, unit.y, other.x, other.y);
        if (dist <= unit.range * 1.2 && dist < closestDist) {
          closestDist = dist;
          bestTarget = other;
        }
      }
    }

    return bestTarget;
  }

  /**
   * Applies separation force so units in the same lane don't bunch into a single pixel.
   */
  public static updateSeparation(units: Unit[]): void {
    const laneGroups: Map<number, Unit[]> = new Map();

    for (const u of units) {
      if (!u.alive) continue;
      const list = laneGroups.get(u.lane) || [];
      list.push(u);
      laneGroups.set(u.lane, list);
    }

    for (const group of laneGroups.values()) {
      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        let repulseY = 0;

        for (let j = 0; j < group.length; j++) {
          if (i === j) continue;
          const b = group[j];
          const dx = Math.abs(a.x - b.x);

          if (dx < 42) {
            // Units are very close horizontally: apply vertical separation
            if (a.y <= b.y) {
              repulseY -= 10;
            } else {
              repulseY += 10;
            }
          }
        }

        // Clamp separation offset within lane boundary
        a.targetOffsetY = Phaser.Math.Clamp(repulseY, -28, 28);
      }
    }
  }

  /**
   * Finds all living enemies within an AoE radius around a center point.
   */
  public static findEnemiesInRadius(
    centerX: number,
    centerY: number,
    radius: number,
    team: 'red' | 'blue',
    allUnits: Unit[]
  ): Unit[] {
    const results: Unit[] = [];
    const rSq = radius * radius;

    for (const u of allUnits) {
      if (!u.alive || u.team === team) continue;
      const dx = u.x - centerX;
      const dy = u.y - centerY;
      if (dx * dx + dy * dy <= rSq) {
        results.push(u);
      }
    }

    return results;
  }
}
