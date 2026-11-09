import Phaser from 'phaser';
import { GAME_CONFIG, Team, ArenaThemeDef, QualityLevel } from '../config/GameConfig';

export interface Projectile {
  sprite: Phaser.GameObjects.Image;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  damage: number;
  team: Team;
  isAoE: boolean;
  aoeRadius?: number;
  onHit: (p: Projectile) => void;
}

export class EffectsManager {
  private scene: Phaser.Scene;
  private projectiles: Projectile[] = [];
  private activeTweens: Set<Phaser.Tweens.Tween> = new Set();
  public quality: QualityLevel = 'high';
  private ambientParticles: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public update(delta: number): void {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const distTotal = Phaser.Math.Distance.Between(p.startX, p.startY, p.targetX, p.targetY);
      const step = (p.speed * delta) / Math.max(1, distTotal);
      p.progress += step;

      if (p.progress >= 1) {
        p.sprite.setPosition(p.targetX, p.targetY);
        p.onHit(p);
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      } else {
        const curX = Phaser.Math.Linear(p.startX, p.targetX, p.progress);
        const curY = Phaser.Math.Linear(p.startY, p.targetY, p.progress);
        p.sprite.setPosition(curX, curY);

        const angle = Phaser.Math.Angle.Between(p.startX, p.startY, p.targetX, p.targetY);
        p.sprite.setRotation(angle);
      }
    }

    // 2. Drift ambient particles
    if (this.quality !== 'low') {
      for (const p of this.ambientParticles) {
        p.y += 0.45;
        p.x += Math.sin(p.y * 0.05) * 0.3;
        if (p.y > GAME_CONFIG.HEIGHT) {
          p.y = 280;
          p.x = Phaser.Math.Between(40, GAME_CONFIG.WIDTH - 40);
        }
      }
    }
  }

  public spawnArrow(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    team: Team,
    onHit: (p: Projectile) => void
  ): void {
    const sprite = this.scene.add.image(startX, startY, 'arrow-proj').setDepth(20);
    this.projectiles.push({
      sprite,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      speed,
      damage,
      team,
      isAoE: false,
      onHit,
    });
  }

  public spawnMagicOrb(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    speed: number,
    damage: number,
    team: Team,
    aoeRadius: number,
    onHit: (p: Projectile) => void
  ): void {
    const key = team === 'red' ? 'magic-orb-red' : 'magic-orb-blue';
    const sprite = this.scene.add.image(startX, startY, key).setDepth(21);
    this.projectiles.push({
      sprite,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      speed,
      damage,
      team,
      isAoE: true,
      aoeRadius,
      onHit,
    });
  }

  public popText(x: number, y: number, text: string, color: string, size = 20, isCrit = false): void {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: `${size}px`,
      color,
      fontStyle: 'bold',
      stroke: '#040d1c',
      strokeThickness: isCrit ? 6 : 4,
    }).setOrigin(0.5).setDepth(35);

    if (isCrit) {
      label.setScale(1.3);
    }

    const tween = this.scene.tweens.add({
      targets: label,
      y: y - (isCrit ? 48 : 34),
      alpha: 0,
      scale: isCrit ? 1.6 : 1.0,
      duration: isCrit ? 850 : 650,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.activeTweens.delete(tween);
        label.destroy();
      },
    });
    this.activeTweens.add(tween);
  }

  public hitSparks(x: number, y: number, color: number, count = 6): void {
    if (this.quality === 'low') count = Math.min(3, count);

    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(
        x + Phaser.Math.Between(-8, 8),
        y + Phaser.Math.Between(-14, 12),
        Phaser.Math.Between(2, 5),
        i % 2 === 0 ? GAME_CONFIG.COLORS.GOLD : color,
        0.95
      ).setDepth(30);

      const tween = this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-35, 35),
        y: p.y + Phaser.Math.Between(-35, 25),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(260, 480),
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.activeTweens.delete(tween);
          p.destroy();
        },
      });
      this.activeTweens.add(tween);
    }
  }

  public magicExplosion(x: number, y: number, color: number, radius = 35): void {
    const circle = this.scene.add.circle(x, y, 6, color, 0.7).setDepth(29);
    const tween = this.scene.tweens.add({
      targets: circle,
      radius,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.activeTweens.delete(tween);
        circle.destroy();
      },
    });
    this.activeTweens.add(tween);
    this.hitSparks(x, y, color, 8);
  }

  public showTelegraphCircle(x: number, y: number, radius: number, color: number, durationMs = 600, onComplete?: () => void): void {
    const ring = this.scene.add.circle(x, y, radius, color, 0.18).setDepth(14);
    ring.setStrokeStyle(3, color, 0.85);

    const inner = this.scene.add.circle(x, y, 4, color, 0.35).setDepth(14);

    const tween = this.scene.tweens.add({
      targets: inner,
      radius,
      duration: durationMs,
      ease: 'Linear',
      onComplete: () => {
        this.activeTweens.delete(tween);
        ring.destroy();
        inner.destroy();
        onComplete?.();
      },
    });
    this.activeTweens.add(tween);
  }

  public bossInfernalSlam(x: number, y: number, radius = 165): void {
    // Scorch decal on ground
    const scorch = this.scene.add.image(x, y, 'ground-scorch').setDepth(12).setAlpha(0.85);
    this.scene.tweens.add({
      targets: scorch,
      alpha: 0,
      duration: 5000,
      onComplete: () => scorch.destroy(),
    });

    // Fire Shockwave ring
    const ring = this.scene.add.image(x, y, 'boss-ring-fire').setDepth(25).setScale(0.2).setAlpha(1);
    const tween = this.scene.tweens.add({
      targets: ring,
      scale: (radius * 2) / 128,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.activeTweens.delete(tween);
        ring.destroy();
      },
    });
    this.activeTweens.add(tween);

    this.hitSparks(x, y, 0xf97316, 14);

    if (this.quality !== 'low') {
      this.scene.cameras.main.shake(250, 0.009);
    }
  }

  public bossCrystalShatter(x: number, y: number, radius = 165): void {
    // Frost Shockwave ring
    const ring = this.scene.add.image(x, y, 'boss-ring-crystal').setDepth(25).setScale(0.2).setAlpha(1);
    const tween = this.scene.tweens.add({
      targets: ring,
      scale: (radius * 2) / 128,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.activeTweens.delete(tween);
        ring.destroy();
      },
    });
    this.activeTweens.add(tween);

    // Erupt crystal shards outward
    const shardCount = this.quality === 'low' ? 4 : 8;
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2;
      const shard = this.scene.add.image(x, y, 'crystal-shard').setDepth(26).setRotation(angle + Math.PI / 2);
      const targetX = x + Math.cos(angle) * (radius * 0.9);
      const targetY = y + Math.sin(angle) * (radius * 0.9);

      const sTween = this.scene.tweens.add({
        targets: shard,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.3,
        duration: 480,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.activeTweens.delete(sTween);
          shard.destroy();
        },
      });
      this.activeTweens.add(sTween);
    }

    this.hitSparks(x, y, 0x00d4ff, 14);

    if (this.quality !== 'low') {
      this.scene.cameras.main.shake(250, 0.009);
    }
  }

  public summonPillar(x: number, y: number, color: number): void {
    const pillar = this.scene.add.rectangle(x, y - 50, 52, 160, color, 0.65).setDepth(24);
    const tween = this.scene.tweens.add({
      targets: pillar,
      scaleX: 2.2,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.activeTweens.delete(tween);
        pillar.destroy();
      },
    });
    this.activeTweens.add(tween);
    this.hitSparks(x, y, color, 12);
  }

  public setupAmbientParticles(theme: ArenaThemeDef): void {
    // Clear old ambient particles
    for (const p of this.ambientParticles) {
      p.destroy();
    }
    this.ambientParticles = [];

    if (this.quality === 'low') return;

    let particleKey = 'particle-sparkle';
    if (theme.particleType === 'leaves') particleKey = 'particle-leaf';
    else if (theme.particleType === 'snow') particleKey = 'particle-snow';
    else if (theme.particleType === 'embers') particleKey = 'particle-ember';

    const count = this.quality === 'medium' ? 10 : 20;
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.image(
        Phaser.Math.Between(40, GAME_CONFIG.WIDTH - 40),
        Phaser.Math.Between(300, GAME_CONFIG.HEIGHT - 50),
        particleKey
      ).setDepth(13).setAlpha(Phaser.Math.FloatBetween(0.35, 0.75));
      p.setScale(Phaser.Math.FloatBetween(0.6, 1.1));
      this.ambientParticles.push(p);
    }
  }

  public clear(): void {
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];

    for (const t of this.activeTweens) {
      t.stop();
    }
    this.activeTweens.clear();

    for (const p of this.ambientParticles) {
      p.destroy();
    }
    this.ambientParticles = [];
  }
}
