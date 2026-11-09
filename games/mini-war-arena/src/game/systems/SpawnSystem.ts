import Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import { GAME_CONFIG, Team, UnitType } from '../config/GameConfig';
import { AudioManager } from '../audio/AudioManager';
import { EffectsManager } from '../effects/EffectsManager';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private audio: AudioManager;
  private effects: EffectsManager;
  private onUnitSpawned: (unit: Unit) => void;

  private spawnClock = 0;
  public autoSpawnEnabled = true;

  constructor(
    scene: Phaser.Scene,
    audio: AudioManager,
    effects: EffectsManager,
    onUnitSpawned: (unit: Unit) => void
  ) {
    this.scene = scene;
    this.audio = audio;
    this.effects = effects;
    this.onUnitSpawned = onUnitSpawned;
  }

  public update(
    delta: number,
    redCoreHpRatio: number,
    blueCoreHpRatio: number,
    redUnitCount: number,
    blueUnitCount: number
  ): void {
    if (!this.autoSpawnEnabled) return;

    this.spawnClock += delta;
    if (this.spawnClock >= GAME_CONFIG.AUTO_SPAWN_INTERVAL) {
      this.spawnClock = 0;

      // Normal auto waves
      const laneRed = Phaser.Math.Between(0, GAME_CONFIG.LANES.length - 1);
      const laneBlue = Phaser.Math.Between(0, GAME_CONFIG.LANES.length - 1);

      if (redUnitCount < GAME_CONFIG.MAX_UNITS_PER_TEAM) {
        this.spawnRandomUnit('red', laneRed);
      }
      if (blueUnitCount < GAME_CONFIG.MAX_UNITS_PER_TEAM) {
        this.spawnRandomUnit('blue', laneBlue);
      }

      // Anti-snowballing catchup mechanic
      if (redCoreHpRatio < GAME_CONFIG.CATCHUP.LOW_HP_THRESHOLD && redUnitCount < GAME_CONFIG.MAX_UNITS_PER_TEAM) {
        if (Math.random() < 0.45) {
          const u = this.spawnUnit('red', 'warrior', laneRed);
          u.defense += GAME_CONFIG.CATCHUP.DEFENSE_BOOST;
        }
      }
      if (blueCoreHpRatio < GAME_CONFIG.CATCHUP.LOW_HP_THRESHOLD && blueUnitCount < GAME_CONFIG.MAX_UNITS_PER_TEAM) {
        if (Math.random() < 0.45) {
          const u = this.spawnUnit('blue', 'warrior', laneBlue);
          u.defense += GAME_CONFIG.CATCHUP.DEFENSE_BOOST;
        }
      }
    }
  }

  private spawnRandomUnit(team: Team, lane: number): void {
    const roll = Math.random();
    let type: UnitType = 'warrior';
    if (roll < 0.45) type = 'warrior';
    else if (roll < 0.72) type = 'archer';
    else if (roll < 0.88) type = 'tank';
    else type = 'mage';

    this.spawnUnit(team, type, lane);
  }

  public spawnUnit(
    team: Team,
    type: UnitType,
    lane?: number,
    summonerNickname?: string
  ): Unit {
    const assignedLane = lane !== undefined ? lane : Phaser.Math.Between(0, GAME_CONFIG.LANES.length - 1);
    const baseY = GAME_CONFIG.LANES[assignedLane];
    const spawnX = team === 'red' ? GAME_CONFIG.SPAWN_X_RED + Phaser.Math.Between(-15, 15) : GAME_CONFIG.SPAWN_X_BLUE + Phaser.Math.Between(-15, 15);

    const unit = new Unit(this.scene, spawnX, baseY, assignedLane, team, type, summonerNickname);

    if (type === 'boss') {
      this.audio.summonBoss();
      const color = team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
      const bossName = team === 'red' ? GAME_CONFIG.BOSSES.red.vietnameseName : GAME_CONFIG.BOSSES.blue.vietnameseName;
      this.effects.summonPillar(spawnX, baseY, color);
      this.effects.popText(spawnX, baseY - 130, `⚡ ${bossName.toUpperCase()} ⚡`, '#ffd700', 25, true);
    } else {
      this.audio.summonUnit();
      const color = team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
      this.effects.hitSparks(spawnX, baseY - 30, color, 4);
    }

    this.onUnitSpawned(unit);
    return unit;
  }
}
