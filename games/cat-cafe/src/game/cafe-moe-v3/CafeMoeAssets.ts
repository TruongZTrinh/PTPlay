import type Phaser from 'phaser';

/** Visual assets for Café Mòe V3 (247 transparent PNG assets). */
export const CAFE_V3_BASE = '/assets/cafe-moe-v3';

export const CAT_COATS = ['orange', 'white', 'calico', 'gray', 'tuxedo'] as const;
export type CatCoat = typeof CAT_COATS[number];

export const CAT_ACTIONS = [
  'idle', 'idle_2', 'walk_1', 'walk_1_2', 'walk_2', 'sleep', 'sleep_2',
  'eat', 'love', 'love_2', 'play', 'play_2', 'groom', 'jump', 'call',
  'photo', 'garden', 'sunbathe', 'box', 'chase_fish', 'climb', 'meow',
  'royal', 'bath', 'cool', 'party', 'flower', 'stretch', 'couple'
] as const;
export type CatAction = typeof CAT_ACTIONS[number];

export const catAssetKey = (coat: CatCoat, action: CatAction): string => `cafe-cat:${coat}:${action}`;

export const GIFT_ASSETS = [
  'rose', 'rose_premium', 'grilled_fish', 'grilled_fish_premium',
  'heart', 'heart_premium', 'perfume', 'ice_cream', 'coffee', 'donut',
  'gift_box', 'gift_box_premium', 'fireworks', 'lion', 'universe',
  'universe_premium', 'castle', 'car', 'microphone', 'flower_bouquet',
  'whale', 'drama_queen', 'crown', 'treasure', 'ship', 'cake',
  'fish_basket', 'paw', 'sparkle', 'star', 'cookie', 'fish_toy', 'yarn_ball'
] as const;
export type GiftAsset = typeof GIFT_ASSETS[number];
export const giftAssetKey = (gift: GiftAsset): string => `cafe-gift:${gift}`;

export const EFFECT_ASSETS = [
  'heart_burst', 'heart_bubbles', 'heart_large', 'sparkle_cluster',
  'magic_star', 'cosmic_ring', 'fireworks_burst', 'crown_glow',
  'love_glow', 'fish_flash', 'level_up', 'music_notes', 'paw_trail',
  'soap_bubbles', 'sunbeam', 'zzz', 'butterfly', 'confetti'
] as const;
export type EffectAsset = typeof EFFECT_ASSETS[number];
export const effectAssetKey = (fx: EffectAsset): string => `cafe-fx:${fx}`;

export const PROP_ASSETS = [
  'blue_cat_bed', 'pink_cat_bed', 'cat_tree', 'scratching_post',
  'coffee_table', 'counter', 'round_rug', 'window', 'bookshelf',
  'food_bowl', 'water_bowl', 'hanging_plant', 'hanging_lamp',
  'paw_cushion', 'toy_fish', 'yarn_ball', 'curtain', 'cabinet',
  'cactus', 'cardboard_box', 'chalkboard', 'feather_wand', 'fish_bed',
  'flower_vase', 'paw_wall_sign', 'stool', 'wall_art'
] as const;
export type PropAsset = typeof PROP_ASSETS[number];
export const propAssetKey = (prop: PropAsset): string => `cafe-prop:${prop}`;

/** Preloads all 247 V3 transparent PNG assets in Phaser. */
export function preloadCafeMoeAssets(scene: Phaser.Scene): void {
  // 1. Cats: 5 coats × 29 action poses = 145 PNGs
  for (const coat of CAT_COATS) {
    for (const action of CAT_ACTIONS) {
      const key = catAssetKey(coat, action);
      if (!scene.textures.exists(key)) {
        scene.load.image(key, `${CAFE_V3_BASE}/cats/${coat}/${coat}_${action}.png`);
      }
    }
  }

  // 2. Gifts: 33 PNGs
  for (const gift of GIFT_ASSETS) {
    const key = giftAssetKey(gift);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${CAFE_V3_BASE}/gifts/${gift}.png`);
    }
  }

  // 3. Effects: 18 PNGs
  for (const fx of EFFECT_ASSETS) {
    const key = effectAssetKey(fx);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${CAFE_V3_BASE}/effects/${fx}.png`);
    }
  }

  // 4. Props: 27 PNGs
  for (const prop of PROP_ASSETS) {
    const key = propAssetKey(prop);
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${CAFE_V3_BASE}/props/${prop}.png`);
    }
  }

  // 5. UI: compact command strip
  if (!scene.textures.exists('cafe-ui:compact_commands')) {
    scene.load.image('cafe-ui:compact_commands', `${CAFE_V3_BASE}/ui/compact_command_strip.png`);
  }
}

/** Maps a numerical coat variant (0-7) to one of the 5 V3 cat coats. */
export function getCatCoatName(coatVariant: number): CatCoat {
  switch (coatVariant % 8) {
    case 0:
    case 6:
      return 'orange'; // Ginger Tabby & Honey Cream
    case 1:
      return 'white';  // Pure White Cloud
    case 2:
      return 'gray';   // Smoky Slate Gray
    case 3:
    case 5:
      return 'tuxedo'; // Tuxedo Gentleman & Midnight Black
    case 4:
    case 7:
    default:
      return 'calico'; // Calico Lucky Charm & Royal Siamese
  }
}

