import Phaser from 'phaser';
import { ClassroomTheme } from '../types.js';

export class ClassroomPresentation {
  private scene: Phaser.Scene;
  private bgImage: Phaser.GameObjects.Image;
  private boardProp: Phaser.GameObjects.Image;
  private podiumProp: Phaser.GameObjects.Image;
  private ambientParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  public currentTheme: ClassroomTheme = 'day';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Static Classroom Background (540x960)
    this.bgImage = scene.add.image(270, 480, 'bg_day');
    this.bgImage.setDisplaySize(540, 960);
    this.bgImage.setDepth(0);

    // 2. Chalkboard prop on right
    this.boardProp = scene.add.image(346, 255, 'prop_board');
    this.boardProp.setDisplaySize(382, 264);
    this.boardProp.setDepth(5);

    // 3. Teacher Podium
    this.podiumProp = scene.add.image(88, 435, 'prop_podium');
    this.podiumProp.setDisplaySize(120, 150);
    this.podiumProp.setDepth(14);

    this.setupAmbientLight();
  }

  public setTheme(theme: ClassroomTheme): void {
    if (this.currentTheme === theme) return;
    this.currentTheme = theme;

    const textureKey = `bg_${theme}`;
    if (this.scene.textures.exists(textureKey)) {
      // Smooth fade transition
      this.scene.tweens.add({
        targets: this.bgImage,
        alpha: 0.2,
        duration: 300,
        onComplete: () => {
          this.bgImage.setTexture(textureKey);
          this.scene.tweens.add({
            targets: this.bgImage,
            alpha: 1,
            duration: 350,
          });
        },
      });
    }

    if (theme === 'party') {
      this.boardProp.setTint(0xffd1dc);
    } else {
      this.boardProp.clearTint();
    }
  }

  private setupAmbientLight(): void {
    // Subtle classroom sunlight motes
    if (this.scene.textures.exists('fx_sparkle')) {
      try {
        const emitter = this.scene.add.particles(270, 200, 'fx_sparkle', {
          speed: { min: 8, max: 25 },
          angle: { min: 45, max: 135 },
          scale: { start: 0.25, end: 0 },
          alpha: { start: 0.35, end: 0 },
          lifespan: 3500,
          frequency: 350,
          quantity: 1,
          blendMode: 'ADD',
        });
        emitter.setDepth(8);
      } catch {
        // Fallback gracefully if WebGL particle config differs
      }
    }
  }
}
