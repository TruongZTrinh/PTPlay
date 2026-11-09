import Phaser from 'phaser';
import { CAFE_CONFIG } from '../config/CafeConfig';
import { Random } from '../utils/Random';

export class EffectManager {
  private scene: Phaser.Scene;
  private activeHearts: Phaser.GameObjects.Image[] = [];
  private activeSparkles: Phaser.GameObjects.Image[] = [];
  private readonly maxParticles = 60;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnHeartShower(centerX: number, centerY: number, count = 8): void {
    const burstCount = Math.min(count, 16);
    for (let i = 0; i < burstCount; i++) {
      if (this.activeHearts.length >= this.maxParticles) {
        const oldest = this.activeHearts.shift();
        oldest?.destroy();
      }

      const heart = this.scene.add.image(
        centerX + Random.range(-24, 24),
        centerY + Random.range(-10, 10),
        'particle_heart'
      );
      heart.setDepth(999);
      heart.setScale(Random.range(0.8, 1.4));
      this.activeHearts.push(heart);

      const targetX = heart.x + Random.range(-60, 60);
      const targetY = heart.y - Random.range(50, 120);

      this.scene.tweens.add({
        targets: heart,
        x: targetX,
        y: targetY,
        alpha: { from: 1, to: 0 },
        scale: { from: heart.scaleX, to: heart.scaleX * 1.5 },
        duration: Random.range(1000, 1600),
        ease: 'Quad.easeOut',
        onComplete: () => {
          const idx = this.activeHearts.indexOf(heart);
          if (idx !== -1) this.activeHearts.splice(idx, 1);
          heart.destroy();
        },
      });
    }
  }

  public spawnSparkles(centerX: number, centerY: number, count = 6): void {
    const burstCount = Math.min(count, 12);
    for (let i = 0; i < burstCount; i++) {
      if (this.activeSparkles.length >= this.maxParticles) {
        const oldest = this.activeSparkles.shift();
        oldest?.destroy();
      }

      const star = this.scene.add.image(
        centerX + Random.range(-20, 20),
        centerY + Random.range(-20, 20),
        'particle_star'
      );
      star.setDepth(998);
      star.setScale(Random.range(0.6, 1.2));
      this.activeSparkles.push(star);

      this.scene.tweens.add({
        targets: star,
        scale: 0,
        y: '-=30',
        alpha: 0,
        angle: Random.range(-90, 90),
        duration: Random.range(600, 1000),
        ease: 'Sine.easeOut',
        onComplete: () => {
          const idx = this.activeSparkles.indexOf(star);
          if (idx !== -1) this.activeSparkles.splice(idx, 1);
          star.destroy();
        },
      });
    }
  }

  public triggerCafeCelebration(titleVi = '🎉 TIỆC MÈO VUI VẺ! 🎉'): void {
    const { width, height } = CAFE_CONFIG;

    // Toast banner
    const banner = this.scene.add.container(width / 2, -50);
    banner.setDepth(1000);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0066FF, 0.92);
    bg.fillRoundedRect(-180, -22, 360, 44, 12);
    bg.lineStyle(2, 0xFFD700, 1);
    bg.strokeRoundedRect(-180, -22, 360, 44, 12);
    banner.add(bg);

    const txt = this.scene.add.text(0, 0, titleVi, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    txt.setOrigin(0.5, 0.5);
    banner.add(txt);

    // Drop down and bounce
    this.scene.tweens.add({
      targets: banner,
      y: 220,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Confetti burst from top
        for (let i = 0; i < 20; i++) {
          this.spawnSparkles(Random.range(60, width - 60), 180, 2);
          this.spawnHeartShower(Random.range(60, width - 60), 200, 1);
        }

        this.scene.time.delayedCall(3000, () => {
          this.scene.tweens.add({
            targets: banner,
            y: -50,
            alpha: 0,
            duration: 400,
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  public clearAll(): void {
    for (const h of this.activeHearts) h.destroy();
    this.activeHearts = [];
    for (const s of this.activeSparkles) s.destroy();
    this.activeSparkles = [];
  }
}

