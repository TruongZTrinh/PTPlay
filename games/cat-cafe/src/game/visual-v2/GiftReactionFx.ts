import Phaser from 'phaser';
import { CAFE_TEXTURES } from './CafeVisualAssets';

/** UI-only actions. Score, cat ownership, reward delivery, de-duplication and gift streak
 * accounting remain in existing gameplay/Bridge systems. */
export type CafeGiftVisual = 'rose' | 'heart' | 'universe' | 'fishBasket' | 'yarn' | 'cake';

const GIFT_SPRITES: Record<CafeGiftVisual, string> = {
  rose: CAFE_TEXTURES.grilledFish,
  heart: CAFE_TEXTURES.heart,
  universe: CAFE_TEXTURES.universe,
  fishBasket: CAFE_TEXTURES.fishBasket,
  yarn: CAFE_TEXTURES.yarn,
  cake: CAFE_TEXTURES.cake,
};

/**
 * Call fx.play(...) AFTER the existing normalized event is accepted by the game.
 * Never feed raw TikFinity repeatCount into this class as a new game reward.
 */
export class GiftReactionFx {
  private readonly scene: Phaser.Scene;
  private readonly active = new Set<Phaser.GameObjects.Image>();
  private readonly maxActiveSprites = 60;
  private disposed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Display a reaction at an existing cat's position, or a central fallback. */
  play(type: CafeGiftVisual, x?: number, y?: number, intensity = 1): void {
    if (this.disposed || this.active.size >= this.maxActiveSprites) return;
    const viewWidth = this.scene.scale.width;
    const viewHeight = this.scene.scale.height;
    const px = Phaser.Math.Clamp(x ?? viewWidth / 2, 50, viewWidth - 50);
    const py = Phaser.Math.Clamp(y ?? viewHeight * 0.62, 190, viewHeight - 100);
    const texture = GIFT_SPRITES[type];
    const image = this.addImage(px, py - 100, texture, 0.2);
    if (!image) return;

    const maxSize = type === 'universe' ? 160 : type === 'rose' ? 116 : 90;
    const unitSize = maxSize * Math.min(1.5, viewWidth / 540);
    const baseScale = unitSize / Math.max(1, image.width);
    image.setScale(baseScale * 0.15).setAlpha(0).setAngle(type === 'universe' ? -25 : 0);
    this.scene.tweens.add({
      targets: image, x: px, y: py - 25, alpha: 1,
      scale: baseScale * (type === 'universe' ? 0.85 : 1),
      angle: type === 'universe' ? 345 : 0,
      duration: 700, ease: 'Back.Out',
      hold: type === 'universe' ? 1350 : 900,
      onComplete: () => this.scene.tweens.add({
        targets: image, y: py - 95, alpha: 0, scale: baseScale * 0.7,
        duration: 450, ease: 'Quad.In', onComplete: () => this.release(image),
      }),
    });

    // Cap bursts to protect long LIVE sessions and high-volume gift streaks.
    const count = Math.min(12, 4 + Math.max(0, Math.floor(intensity)) * 2);
    const particleKey = type === 'heart' ? CAFE_TEXTURES.heart : CAFE_TEXTURES.sparkle;
    for (let i = 0; i < count && this.active.size < this.maxActiveSprites; i++) {
      this.floatParticle(px, py - 20, particleKey, i, count);
    }
    if (type === 'rose') this.floatParticle(px + 65, py, CAFE_TEXTURES.rose, 1, 4);
    if (type === 'fishBasket') this.floatParticle(px - 55, py, CAFE_TEXTURES.fishToy, 1, 4);
    if (type === 'cake') this.floatParticle(px + 60, py, CAFE_TEXTURES.star, 1, 4);
  }

  /** Treat LIVE likes as already-aggregated notifications. No score calculation here. */
  playLikesAt(x: number, y: number, totalLikesInBatch = 1): void {
    const n = Math.min(8, Math.max(1, Math.ceil(totalLikesInBatch / 10)));
    for (let i = 0; i < n && this.active.size < this.maxActiveSprites; i++) {
      this.floatParticle(x, y, CAFE_TEXTURES.heart, i, n);
    }
  }

  private addImage(x: number, y: number, texture: string, initialScale: number): Phaser.GameObjects.Image | undefined {
    if (this.active.size >= this.maxActiveSprites) return;
    if (!this.scene.textures.exists(texture)) return;
    const image = this.scene.add.image(x, y, texture)
      .setDepth(820)
      .setScrollFactor(0)
      .setScale(initialScale);
    this.active.add(image);
    return image;
  }

  private floatParticle(x: number, y: number, texture: string, index: number, count: number): void {
    const image = this.addImage(x, y, texture, 0.10);
    if (!image) return;
    const angle = (Math.PI * 2 * index) / Math.max(1, count);
    const horizontal = Math.cos(angle) * Phaser.Math.Between(35, 85);
    const vertical = Math.sin(angle) * 30 - Phaser.Math.Between(40, 95);
    this.scene.tweens.add({
      targets: image, x: x + horizontal, y: y + vertical,
      alpha: 0, scale: Phaser.Math.FloatBetween(0.18, 0.32),
      duration: Phaser.Math.Between(700, 1300), ease: 'Sine.Out',
      onComplete: () => this.release(image),
    });
  }

  private release(image: Phaser.GameObjects.Image): void {
    this.active.delete(image);
    if (image.active) image.destroy();
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    for (const image of this.active) {
      this.scene.tweens.killTweensOf(image);
      if (image.active) image.destroy();
    }
    this.active.clear();
  }
}
