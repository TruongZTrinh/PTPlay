import Phaser from 'phaser';
import { Random } from '../../utils/Random';

export class CafeParticles {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private motes: Phaser.GameObjects.Arc[] = [];
  private petals: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, parentContainer?: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(820);
    if (parentContainer) {
      parentContainer.add(this.container);
    }

    this.spawnDustMotes();
    this.spawnSakuraPetals();
  }

  private spawnDustMotes(): void {
    // 18 gentle golden dust motes floating along sunlight
    for (let i = 0; i < 18; i++) {
      const x = Random.range(180, 480);
      const y = Random.range(280, 700);
      const radius = Random.range(1, 2.5);
      const mote = this.scene.add.circle(x, y, radius, 0xFFFBEB, Random.range(0.3, 0.75));
      this.container.add(mote);
      this.motes.push(mote);

      // Subtle drifting tween
      this.scene.tweens.add({
        targets: mote,
        x: `+=${Random.range(-20, 20)}`,
        y: `+=${Random.range(-25, 25)}`,
        alpha: { from: 0.2, to: 0.8 },
        duration: Random.range(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private spawnSakuraPetals(): void {
    // 8 soft pink cherry blossom petals drifting near the window
    for (let i = 0; i < 8; i++) {
      const x = Random.range(200, 360);
      const y = Random.range(150, 320);
      const petal = this.scene.add.circle(x, y, 2.5, 0xFFAEC9, 0.7);
      this.container.add(petal);
      this.petals.push(petal);

      this.scene.tweens.add({
        targets: petal,
        x: '+=35',
        y: '+=45',
        alpha: { from: 0.8, to: 0.2 },
        duration: Random.range(4000, 7000),
        repeat: -1,
        onRepeat: () => {
          petal.x = Random.range(180, 300);
          petal.y = Random.range(140, 200);
          petal.alpha = 0.8;
        },
        ease: 'Sine.easeInOut',
      });
    }
  }

  public destroy(): void {
    for (const m of this.motes) m.destroy();
    for (const p of this.petals) p.destroy();
    this.container.destroy();
  }
}

