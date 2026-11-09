import { Unit } from '../entities/Unit';
import { AudioManager } from '../audio/AudioManager';
import { EffectsManager } from '../effects/EffectsManager';
import { UnitAI } from './UnitAI';
import { GAME_CONFIG } from '../config/GameConfig';

export class CombatSystem {
  private audio: AudioManager;
  private effects: EffectsManager;
  private onKillCallback: (killerTeam: 'red' | 'blue', victim: Unit) => void;
  private onCoreHitCallback: (breachingTeam: 'red' | 'blue', damage: number) => void;

  constructor(
    audio: AudioManager,
    effects: EffectsManager,
    onKill: (killerTeam: 'red' | 'blue', victim: Unit) => void,
    onCoreHit: (breachingTeam: 'red' | 'blue', damage: number) => void
  ) {
    this.audio = audio;
    this.effects = effects;
    this.onKillCallback = onKill;
    this.onCoreHitCallback = onCoreHit;
  }

  public executeAttack(attacker: Unit, target: Unit, allUnits: Unit[]): void {
    if (!attacker.alive || !target.alive) return;

    attacker.currentCooldown = attacker.attackCooldown * (0.92 + Math.random() * 0.16);

    if (attacker.unitType === 'archer') {
      attacker.playAttackAnimation();
      // Archer shoots arrow projectile
      this.audio.arrowShoot();
      this.effects.spawnArrow(
        attacker.x,
        attacker.y - 40,
        target.x,
        target.y - 40,
        GAME_CONFIG.UNITS.archer.projectileSpeed || 380,
        attacker.damage,
        attacker.team,
        () => {
          if (target.alive) {
            this.applyDamage(attacker, target, attacker.damage);
          }
        }
      );
    } else if (attacker.unitType === 'mage') {
      attacker.playCastAnimation();
      // Mage casts magic orb projectile with AoE splash
      this.audio.magicCast();
      const aoeRadius = GAME_CONFIG.UNITS.mage.aoeRadius || 48;
      this.effects.spawnMagicOrb(
        attacker.x,
        attacker.y - 45,
        target.x,
        target.y - 45,
        GAME_CONFIG.UNITS.mage.projectileSpeed || 290,
        attacker.damage,
        attacker.team,
        aoeRadius,
        (p) => {
          this.audio.magicImpact();
          const color = attacker.team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
          this.effects.magicExplosion(p.targetX, p.targetY, color, aoeRadius);

          // Splash damage to all nearby enemies in radius
          const splashTargets = UnitAI.findEnemiesInRadius(p.targetX, p.targetY, aoeRadius, attacker.team, allUnits);
          for (const splTarget of splashTargets) {
            this.applyDamage(attacker, splTarget, attacker.damage);
          }
        }
      );
    } else if (attacker.isBoss) {
      attacker.playAttackAnimation();
      // Boss heavy attack
      this.audio.bossAttack();
      this.applyDamage(attacker, target, attacker.damage, true);
    } else {
      attacker.playAttackAnimation();
      // Melee strike (Warrior / Tank)
      this.audio.hit();
      const midX = (attacker.x + target.x) / 2;
      const color = attacker.team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
      this.effects.hitSparks(midX, target.y - 40, color, 5);
      this.applyDamage(attacker, target, attacker.damage);
    }
  }

  public executeBossAoESkill(boss: Unit, allUnits: Unit[]): void {
    if (!boss.alive || !boss.isBoss) return;
    const isRed = boss.team === 'red';
    const bossDef = isRed ? GAME_CONFIG.BOSSES.red : GAME_CONFIG.BOSSES.blue;

    boss.skillCooldown = bossDef.skillCooldown;
    boss.currentCooldown = 1.3;
    boss.playAttackAnimation();

    const aoeRadius = bossDef.skillAoe;
    const color = isRed ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;

    // Show warning telegraph circle before slam impact
    this.effects.showTelegraphCircle(boss.x, boss.y - 20, aoeRadius, color, 450, () => {
      if (!boss.alive) return;

      this.audio.bossSkill();

      if (isRed) {
        this.effects.bossInfernalSlam(boss.x, boss.y - 20, aoeRadius);
      } else {
        this.effects.bossCrystalShatter(boss.x, boss.y - 20, aoeRadius);
      }

      const hitEnemies = UnitAI.findEnemiesInRadius(boss.x, boss.y, aoeRadius, boss.team, allUnits);
      const slamDamage = Math.round(GAME_CONFIG.UNITS.boss.damage * bossDef.skillMultiplier);

      for (const enemy of hitEnemies) {
        this.applyDamage(boss, enemy, slamDamage, true);
      }
    });
  }

  public applyDamage(attacker: Unit, target: Unit, rawDamage: number, forceCrit = false): void {
    if (!target.alive) return;

    // Defense reduction: actual = max(3, raw - targetDefense)
    const def = target.defense || 0;
    let actualDamage = Math.max(3, rawDamage - def);

    // Critical hit chance (12%)
    const isCrit = forceCrit || Math.random() < 0.12;
    if (isCrit) {
      actualDamage = Math.round(actualDamage * 1.6);
    }

    const died = target.takeDamage(actualDamage);

    // Floating damage text
    const color = isCrit ? '#ffec3d' : '#ffffff';
    this.effects.popText(target.x, target.y - 70, `-${actualDamage}`, color, isCrit ? 24 : 19, isCrit);

    if (died) {
      this.onKillCallback(attacker.team, target);
    }
  }

  public handleBreach(unit: Unit): void {
    if (!unit.alive) return;
    unit.alive = false;

    const damage = unit.isBoss ? GAME_CONFIG.CORE_BREACH_DAMAGE * 3 : GAME_CONFIG.CORE_BREACH_DAMAGE;
    this.audio.heavyHit();

    const color = unit.team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
    this.effects.hitSparks(unit.x, unit.y - 35, color, 14);
    this.effects.popText(unit.x, unit.y - 85, `-${damage} HP`, '#ffd700', 26, true);

    this.onCoreHitCallback(unit.team, damage);
    unit.die();
  }
}
