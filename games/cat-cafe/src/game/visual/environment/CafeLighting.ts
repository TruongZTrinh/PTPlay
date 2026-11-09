import Phaser from 'phaser';
import { TimeOfDay, WeatherType } from '../../config/CafeConfig';
import { CAFE_VISUAL_CONFIG } from '../CafeVisualConfig';

export class CafeLighting {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private atmosphereOverlay: Phaser.GameObjects.Graphics;
  private sunbeamOverlay: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, parentContainer?: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(800);
    if (parentContainer) {
      parentContainer.add(this.container);
    }

    this.sunbeamOverlay = scene.add.graphics();
    this.atmosphereOverlay = scene.add.graphics();
    this.container.add(this.sunbeamOverlay);
    this.container.add(this.atmosphereOverlay);

    this.createSunbeamEffect();
  }

  private createSunbeamEffect(): void {
    // Soft diagonal sunlight stream
    this.sunbeamOverlay.clear();
    this.sunbeamOverlay.fillStyle(0xFFE4A0, 0.08);
    this.sunbeamOverlay.fillPoints([
      new Phaser.Geom.Point(175, 240),
      new Phaser.Geom.Point(365, 240),
      new Phaser.Geom.Point(540, 680),
      new Phaser.Geom.Point(240, 720),
    ], true);

    // Subtle gentle pulsation of afternoon sunlight
    this.scene.tweens.add({
      targets: this.sunbeamOverlay,
      alpha: { from: 0.7, to: 1.1 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public applyAtmosphere(timeOfDay: TimeOfDay, weather: WeatherType): void {
    const { width, height } = CAFE_VISUAL_CONFIG.resolution;
    this.atmosphereOverlay.clear();

    if (timeOfDay === 'sunset') {
      // Golden Amber Sunset Glow
      this.atmosphereOverlay.fillStyle(0xEA580C, 0.16);
      this.atmosphereOverlay.fillRect(0, 0, width, height);
      this.atmosphereOverlay.fillStyle(0xF59E0B, 0.1);
      this.atmosphereOverlay.fillRect(0, 0, width, height);
      this.sunbeamOverlay.setAlpha(0.9);
    } else if (timeOfDay === 'night') {
      // Deep Indigo Night with Warm Lamp Pools
      this.atmosphereOverlay.fillStyle(0x0F172A, 0.42);
      this.atmosphereOverlay.fillRect(0, 0, width, height);
      this.sunbeamOverlay.setAlpha(0.1);

      // Warm radial pools around wall sconce & pendant lamp
      this.atmosphereOverlay.fillStyle(0xFDE68A, 0.2);
      this.atmosphereOverlay.fillCircle(110, 165, 80);
      this.atmosphereOverlay.fillCircle(497, 180, 50);
    } else {
      // Bright Pleasant Sunny Afternoon
      this.sunbeamOverlay.setAlpha(1.0);
    }

    if (weather === 'rainy') {
      // Cool Blue Rain Wash
      this.atmosphereOverlay.fillStyle(0x38BDF8, 0.12);
      this.atmosphereOverlay.fillRect(0, 0, width, height);
      this.sunbeamOverlay.setAlpha(0.3);
    }
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}

