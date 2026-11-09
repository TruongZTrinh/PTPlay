import Phaser from 'phaser';
import { CAFE_VISUAL_CONFIG } from '../CafeVisualConfig';

export class CafeBackground {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgImage!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, parentContainer?: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    if (parentContainer) {
      parentContainer.add(this.container);
    }
    this.create();
  }

  public create(): void {
    const { width, height } = CAFE_VISUAL_CONFIG.resolution;

    // High quality illustrated café room background
    if (this.scene.textures.exists('cafe_room_v2')) {
      this.bgImage = this.scene.add.image(width / 2, height / 2, 'cafe_room_v2');
      this.bgImage.setOrigin(0.5, 0.5);
      this.container.add(this.bgImage);
    } else {
      // Fallback
      const g = this.scene.add.graphics();
      g.fillStyle(0xFDF6E2, 1);
      g.fillRect(0, 0, width, height);
      this.container.add(g);
    }
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}

