import type Phaser from "phaser";

/** Visual assets only. No changes to the PTPlay LIVE Bridge contract. */
const BASE = "/assets/cafe-moe-v3";

export const CAT_COATS = ["orange", "white", "calico", "gray", "tuxedo"] as const;
export const CAT_ACTIONS = [
  "idle", "walk_1", "walk_2", "sleep", "eat", "love", "play", "groom",
  "jump", "call", "photo", "garden", "sunbathe", "box", "chase_fish",
  "climb", "meow", "royal", "bath", "cool", "party", "flower", "stretch", "couple"
] as const;
export type CatCoat = typeof CAT_COATS[number];
export type CatAction = typeof CAT_ACTIONS[number];
export const catAssetKey = (coat: CatCoat, action: CatAction) => `cafe-cat:${coat}:${action}`;

export const GIFT_ASSETS = [
  "rose", "grilled_fish", "heart", "perfume", "ice_cream", "coffee", "donut", "gift_box", "fireworks", "lion", "universe", "castle", "car", "microphone", "flower_bouquet", "whale", "drama_queen", "crown", "treasure", "ship", "cake", "fish_basket", "paw", "universe_premium", "grilled_fish_premium"
] as const;

export function preloadCafeMoeAssets(scene: Phaser.Scene): void {
  for (const coat of CAT_COATS) for (const action of CAT_ACTIONS)
    scene.load.image(catAssetKey(coat, action), `${BASE}/cats/${coat}/${coat}_${action}.png`);
  for (const gift of GIFT_ASSETS) scene.load.image(`cafe-gift:${gift}`, `${BASE}/gifts/${gift}.png`);
  for (const file of ["heart_burst", "sparkle_cluster", "cosmic_ring", "fireworks_burst", "zzz"])
    scene.load.image(`cafe-fx:${file}`, `${BASE}/effects/${file}.png`);
  scene.load.image("cafe-ui:compact_commands", `${BASE}/ui/compact_command_strip.png`);
}
