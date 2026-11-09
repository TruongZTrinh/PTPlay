import Phaser from "phaser";

/** Pure presentation: caller must only invoke AFTER its existing gift dedupe/streak validation. */
export type VisualGift = "rose" | "heart" | "universe" | "fireworks" | "lion" | "ice_cream" | "coffee" | "gift_box";

export class GiftReactionVisuals {
  constructor(private readonly scene: Phaser.Scene) {}

  play(gift: VisualGift, x: number, y: number): void {
    const asset = gift === "rose" ? "grilled_fish_premium" : gift;
    const key = `cafe-gift:${asset}`;
    if (!this.scene.textures.exists(key)) return;
    const sprite = this.scene.add.image(x, y - 28, key)
      .setDepth(95).setAlpha(0).setScale(.3);
    this.scene.tweens.add({
      targets:sprite, alpha:1, scale:.78, y:y-76,
      duration:420, ease:"Back.Out", yoyo:true, hold:1150,
      onComplete:()=>sprite.destroy()
    });
    // Existing game decides the gameplay effect, score, sound and spawn target.
  }
}
