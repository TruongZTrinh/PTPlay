import Phaser from 'phaser';

/** Artwork is located in /assets at workspace root. */
export const CAFE_ASSET_BASE = '/assets';

export const CAFE_TEXTURES = {
  rose: 'cafev2-rose',
  grilledFish: 'cafev2-grilled-fish',
  heart: 'cafev2-heart',
  cake: 'cafev2-cake',
  universe: 'cafev2-universe',
  fishBasket: 'cafev2-fish-basket',
  yarn: 'cafev2-yarn',
  giftBox: 'cafev2-gift-box',
  fishToy: 'cafev2-fish-toy',
  sparkle: 'cafev2-sparkle',
  star: 'cafev2-star',
} as const;

const ART_FILES: ReadonlyArray<readonly [string, string]> = [
  [CAFE_TEXTURES.rose, 'rose_illustrated.png'],
  [CAFE_TEXTURES.grilledFish, 'grilled_fish_illustrated.png'],
  [CAFE_TEXTURES.heart, 'heart_illustrated.png'],
  [CAFE_TEXTURES.cake, 'cake_illustrated.png'],
  [CAFE_TEXTURES.universe, 'universe.png'],
  [CAFE_TEXTURES.fishBasket, 'fish_basket.png'],
  [CAFE_TEXTURES.yarn, 'yarn_ball.png'],
  [CAFE_TEXTURES.giftBox, 'gift_box.png'],
  [CAFE_TEXTURES.fishToy, 'fish_toy.png'],
  [CAFE_TEXTURES.sparkle, 'sparkle.png'],
  [CAFE_TEXTURES.star, 'star.png'],
];

/** Invoke from the existing Scene.preload(); never load these in update(). */
export function preloadCafeVisualAssets(scene: Phaser.Scene): void {
  for (const [key, relativePath] of ART_FILES) {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${CAFE_ASSET_BASE}/${relativePath}`);
    }
  }
}
