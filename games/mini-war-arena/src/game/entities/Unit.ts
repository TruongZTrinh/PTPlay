import Phaser from 'phaser';
import { GAME_CONFIG, Team, UnitType, UnitStatDef } from '../config/GameConfig';

export type UnitAnimState = 'idle' | 'run' | 'attack' | 'guard' | 'cast' | 'hit' | 'death' | 'victory';

export class Unit extends Phaser.GameObjects.Container {
  public team: Team;
  public unitType: UnitType;
  public lane: number;
  public hp: number;
  public maxHp: number;
  public speed: number;
  public damage: number;
  public range: number;
  public defense: number;
  public attackCooldown: number;
  public currentCooldown: number;
  public skillCooldown = 0; // For boss AoE
  public isBoss: boolean;
  public alive = true;

  public baseY: number;
  public targetOffsetY = 0;
  public currentOffsetY = 0;
  public summonerNickname?: string;

  // Visual & State variables
  public isGuarding = false;
  public isCasting = false;
  private seed: number;
  private animState: UnitAnimState = 'run';
  private sprite: Phaser.GameObjects.Image;
  private healthBg: Phaser.GameObjects.Rectangle;
  private healthFill: Phaser.GameObjects.Rectangle;
  private nameLabel?: Phaser.GameObjects.Text;
  private shieldEffect?: Phaser.GameObjects.Image;
  private bossAura?: Phaser.GameObjects.Arc;
  private hitTimer = 0;
  private attackAnimTimer = 0;
  private guardTimer = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    baseY: number,
    lane: number,
    team: Team,
    unitType: UnitType,
    summonerNickname?: string
  ) {
    super(scene, x, baseY);
    this.team = team;
    this.unitType = unitType;
    this.lane = lane;
    this.baseY = baseY;
    this.seed = Math.random() * 20;
    this.isBoss = unitType === 'boss';

    // Sanitize and bound nickname
    if (summonerNickname) {
      this.summonerNickname = summonerNickname
        .replace(/<[^>]*>?/gm, '')
        .trim()
        .slice(0, GAME_CONFIG.VIEWER.MAX_NICKNAME_LENGTH) || GAME_CONFIG.VIEWER.DEFAULT_NICKNAME;
    }

    const stats: UnitStatDef = GAME_CONFIG.UNITS[unitType];
    this.maxHp = stats.maxHp;
    this.hp = stats.maxHp;
    this.speed = stats.speed * (0.92 + Math.random() * 0.16);
    this.damage = stats.damage;
    this.range = stats.range;
    this.defense = stats.defense;
    this.attackCooldown = stats.attackCooldown;
    this.currentCooldown = Math.random() * 0.4;
    this.skillCooldown = this.isBoss ? 4.0 : 0;

    // Depth based on lane & Y
    this.setDepth(15 + lane * 3 + (this.isBoss ? 2 : 0));

    // Shadow
    const shadowW = this.isBoss ? 80 : (unitType === 'tank' ? 62 : 48);
    const shadowH = this.isBoss ? 20 : 12;
    const shadow = scene.add.ellipse(0, 0, shadowW, shadowH, 0x051329, 0.45);
    this.add(shadow);

    // Boss Elemental Aura
    if (this.isBoss) {
      const auraColor = team === 'red' ? GAME_CONFIG.BOSSES.red.auraColor : GAME_CONFIG.BOSSES.blue.auraColor;
      this.bossAura = scene.add.circle(0, -10, 48, auraColor, 0.28);
      this.add(this.bossAura);
    }

    // Sprite
    const textureKey = `${team}-${unitType}`;
    this.sprite = scene.add.image(0, this.isBoss ? -55 : -42, textureKey);
    this.sprite.setScale(stats.scale);
    if (team === 'blue') {
      this.sprite.setFlipX(true);
    }
    this.add(this.sprite);

    // Shield Barrier Effect (for Tank or Buffs)
    this.shieldEffect = scene.add.image(0, this.isBoss ? -55 : -42, 'shield-barrier');
    this.shieldEffect.setVisible(false);
    this.shieldEffect.setScale(this.isBoss ? 1.3 : 0.85);
    this.add(this.shieldEffect);

    // Health Bar
    const barW = this.isBoss ? 76 : (unitType === 'tank' ? 56 : 44);
    const barH = this.isBoss ? 8 : 5;
    const barY = this.isBoss ? -125 : (unitType === 'tank' ? -98 : -88);

    this.healthBg = scene.add.rectangle(0, barY, barW + 2, barH + 2, 0x071529, 0.85);
    this.healthBg.setStrokeStyle(1, 0xffffff, 0.5);

    const fillColor = team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
    this.healthFill = scene.add.rectangle(-barW / 2, barY, barW, barH, fillColor).setOrigin(0, 0.5);
    this.add([this.healthBg, this.healthFill]);

    // Viewer Name Tag (if summoned by a TikTok spectator)
    if (this.summonerNickname) {
      const tagText = this.isBoss ? `👑 ${this.summonerNickname}` : this.summonerNickname;
      this.nameLabel = scene.add.text(0, barY - 14, tagText, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: this.isBoss ? '13px' : '11px',
        color: this.isBoss ? '#ffd700' : '#ffffff',
        fontStyle: 'bold',
        stroke: '#040d1c',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.add(this.nameLabel);
    }

    scene.add.existing(this);
  }

  public updateLogic(delta: number, elapsed: number): void {
    if (!this.alive) return;

    this.currentCooldown = Math.max(0, this.currentCooldown - delta);
    if (this.isBoss) {
      this.skillCooldown = Math.max(0, this.skillCooldown - delta);
      if (this.bossAura) {
        this.bossAura.scale = 1 + Math.sin(elapsed * 5) * 0.12;
      }
    }

    // Tank Guard stance cooldown
    if (this.guardTimer > 0) {
      this.guardTimer -= delta;
      if (this.guardTimer <= 0) {
        this.isGuarding = false;
        this.shieldEffect?.setVisible(false);
      }
    }

    // Smooth Y separation steering
    this.currentOffsetY = Phaser.Math.Linear(this.currentOffsetY, this.targetOffsetY, 0.1);
    const verticalBob = this.animState === 'run' ? Math.sin(elapsed * 12 + this.seed) * 2.5 : 0;
    this.y = this.baseY + this.currentOffsetY + verticalBob;

    // Hit flash timer
    if (this.hitTimer > 0) {
      this.hitTimer -= delta;
      if (this.hitTimer <= 0) {
        this.sprite.clearTint();
      }
    }

    // Attack anim timer
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= delta;
      if (this.attackAnimTimer <= 0) {
        this.sprite.x = 0;
        this.sprite.angle = 0;
        this.isCasting = false;
      }
    }

    // Running tilt
    if (this.animState === 'run' && this.attackAnimTimer <= 0) {
      this.sprite.angle = Math.sin(elapsed * 13 + this.seed) * (this.isBoss ? 3 : 5);
    }
  }

  public setAnimState(state: UnitAnimState): void {
    this.animState = state;
    if (state === 'victory') {
      this.scene.tweens.add({
        targets: this,
        y: this.baseY - 16,
        duration: 220,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeOut',
      });
    }
  }

  public playAttackAnimation(): void {
    this.attackAnimTimer = 0.18;
    const dir = this.team === 'red' ? 1 : -1;
    this.sprite.x = 12 * dir;
    this.sprite.angle = 12 * dir;
  }

  public playCastAnimation(): void {
    this.isCasting = true;
    this.attackAnimTimer = 0.25;
    const dir = this.team === 'red' ? 1 : -1;
    this.sprite.x = 8 * dir;
    this.sprite.angle = -6 * dir;
  }

  public activateGuard(durationSec = 2.0): void {
    if (this.unitType !== 'tank' || !this.alive) return;
    this.isGuarding = true;
    this.guardTimer = durationSec;
    this.shieldEffect?.setVisible(true);
  }

  public takeDamage(amount: number): boolean {
    if (!this.alive) return false;

    // Tank guard mitigates extra 40% damage
    const actualDamage = this.isGuarding ? Math.max(2, Math.round(amount * 0.6)) : amount;
    this.hp = Math.max(0, this.hp - actualDamage);

    // Update HP bar
    const barW = this.isBoss ? 76 : (this.unitType === 'tank' ? 56 : 44);
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.healthFill.setSize(Math.max(0.5, barW * ratio), this.isBoss ? 8 : 5);

    // Hit flash reaction
    this.sprite.setTintFill(0xffffff);
    this.hitTimer = 0.08;

    // Slight stagger recoil
    const dir = this.team === 'red' ? 1 : -1;
    this.x -= dir * (this.isBoss ? 1.5 : 3.0);

    // Auto-trigger guard for Tank on heavy hit
    if (this.unitType === 'tank' && !this.isGuarding && this.hp < this.maxHp * 0.75) {
      this.activateGuard(1.8);
    }

    if (this.hp <= 0) {
      this.die();
      return true; // Unit died
    }
    return false;
  }

  public heal(amount: number): void {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const barW = this.isBoss ? 76 : (this.unitType === 'tank' ? 56 : 44);
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.healthFill.setSize(Math.max(0.5, barW * ratio), this.isBoss ? 8 : 5);
  }

  public die(): void {
    if (!this.alive) return;
    this.alive = false;
    this.animState = 'death';
    this.scene.tweens.killTweensOf(this);

    const tilt = this.team === 'red' ? -40 : 40;
    this.scene.tweens.add({
      targets: this,
      scale: 0.2,
      alpha: 0,
      angle: tilt,
      y: this.y + 25,
      duration: 320,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
