import Phaser from 'phaser';
import { giftAssetKey, effectAssetKey } from './CafeMoeAssets';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import type { Cat } from '../entities/Cat';

export type VisualGiftType =
  | 'rose'
  | 'heart'
  | 'universe'
  | 'lion'
  | 'fireworks'
  | 'perfume'
  | 'ice_cream'
  | 'coffee'
  | 'cake'
  | 'fish_basket'
  | 'yarn_ball';

export class GiftReactionVisuals {
  private readonly scene: Phaser.Scene;
  private readonly activeSprites = new Set<Phaser.GameObjects.GameObject>();
  private readonly maxActiveSprites = 80;
  private isDisposed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * Main entry point called strictly AFTER gameplay/bridge event validation.
   */
  public play(
    gift: VisualGiftType,
    targetCat?: Cat,
    customX?: number,
    customY?: number,
    intensity = 1
  ): void {
    if (this.isDisposed) return;

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const catX = targetCat ? targetCat.x : customX ?? width / 2;
    const catY = targetCat ? targetCat.y : customY ?? height * 0.6;

    switch (gift) {
      case 'rose':
        this.playRoseSpectacle(targetCat, catX, catY, intensity);
        break;
      case 'heart':
        this.playHeartSpectacle(targetCat, catX, catY, intensity);
        break;
      case 'universe':
        this.playUniverseSpectacle(intensity);
        break;
      case 'lion':
        this.playLionRoyalSpectacle(targetCat, catX, catY);
        break;
      case 'cake':
        this.playCelebrationItem('cake', catX, catY, 'sparkle_cluster');
        if (targetCat) targetCat.eatFood();
        break;
      case 'fish_basket':
        this.playCelebrationItem('fish_basket', catX, catY, 'fish_flash');
        if (targetCat) targetCat.eatFood();
        break;
      case 'yarn_ball':
        this.playCelebrationItem('yarn_ball', catX, catY, 'magic_star');
        if (targetCat) targetCat.playWithToy();
        break;
      default:
        this.playGenericGift(gift, catX, catY);
        if (targetCat) targetCat.showLoveReaction();
        break;
    }
  }

  // =========================================================================
  // 1. 🌹 ROSE SPECTACLE: Grilled fish drops, cat runs & eats, petals float
  // =========================================================================
  private playRoseSpectacle(targetCat: Cat | undefined, x: number, y: number, _intensity: number): void {
    // 1. Spawn Delicious Crispy Grilled Fish
    const fishKey = giftAssetKey('grilled_fish_premium');
    if (!this.scene.textures.exists(fishKey)) return;

    const fish = this.scene.add.image(x, y - 80, fishKey)
      .setDepth(1500)
      .setScale(0.18)
      .setAlpha(0);
    this.track(fish);

    // Fish drops down and lands temptingly on the floor
    this.scene.tweens.add({
      targets: fish,
      y: y + 8,
      alpha: 1,
      scale: 0.65,
      duration: 550,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Subtle steam floating
        this.scene.tweens.add({
          targets: fish,
          scaleX: 0.68,
          scaleY: 0.62,
          yoyo: true,
          duration: 400,
          repeat: 6,
        });

        // 2. Target cat runs to the fish and starts eating!
        if (targetCat) {
          targetCat.walkTo(x, y + 10, () => {
            targetCat.eatFood();
            fish.setScale(0.5);
            // Emits pleasant eating sparkles
            this.emitSparkles(x, y - 10, 5);
          });
        }

        // Fade out fish after eating
        this.scene.time.delayedCall(3400, () => {
          this.scene.tweens.add({
            targets: fish,
            alpha: 0,
            scale: 0.3,
            duration: 450,
            onComplete: () => this.untrack(fish),
          });
        });
      },
    });

    // 3. Floating Rose Petals & Sparkles
    const roseKey = giftAssetKey('rose');
    for (let i = 0; i < 7; i++) {
      const offsetX = Phaser.Math.Between(-70, 70);
      const delay = i * 90;
      this.scene.time.delayedCall(delay, () => {
        const petal = this.scene.add.image(x + offsetX, y - 60, roseKey)
          .setDepth(1520)
          .setScale(0.15)
          .setAlpha(0);
        this.track(petal);

        this.scene.tweens.add({
          targets: petal,
          y: y + Phaser.Math.Between(-20, 40),
          x: x + offsetX + Phaser.Math.Between(-30, 30),
          alpha: { from: 0, to: 0.95 },
          scale: Phaser.Math.FloatBetween(0.28, 0.42),
          angle: Phaser.Math.Between(-45, 45),
          duration: 900,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: petal,
              alpha: 0,
              y: '+=25',
              duration: 450,
              onComplete: () => this.untrack(petal),
            });
          },
        });
      });
    }

    CafeAudioEngine.getInstance().playSparkleShower();
  }

  // =========================================================================
  // 2. 💖 HEART SPECTACLE: Giant glowing heart, love pose on cat, heart shower
  // =========================================================================
  private playHeartSpectacle(targetCat: Cat | undefined, x: number, y: number, _intensity: number): void {
    // 1. Soft glowing aura behind heart
    const glow = this.scene.add.circle(x, y - 68, 70, 0xF43F5E, 0.25)
      .setDepth(1490)
      .setScale(0.2)
      .setAlpha(0);
    this.track(glow);

    this.scene.tweens.add({
      targets: glow,
      scale: 1.25,
      alpha: 0.75,
      duration: 350,
      yoyo: true,
      hold: 1100,
      onComplete: () => this.untrack(glow),
    });

    // 2. Giant Elastic Bouncing Heart
    const heartKey = giftAssetKey('heart_premium');
    const heart = this.scene.add.image(x, y - 30, heartKey)
      .setDepth(1500)
      .setScale(0.15)
      .setAlpha(0);
    this.track(heart);

    this.scene.tweens.add({
      targets: heart,
      y: y - 68,
      scale: 0.82,
      alpha: 1,
      duration: 450,
      ease: 'Back.easeOut',
      hold: 1100,
      onComplete: () => {
        this.scene.tweens.add({
          targets: heart,
          scale: 0.3,
          y: y - 110,
          alpha: 0,
          duration: 400,
          onComplete: () => this.untrack(heart),
        });
      },
    });

    // 3. Cat Enters Joyous Love Pose with Heart Eyes!
    if (targetCat) {
      targetCat.showLoveReaction();
    }

    // 4. Cascade of Floating Crystal Hearts
    const heartBubbleKey = giftAssetKey('heart');
    for (let i = 0; i < 6; i++) {
      const bx = x + Phaser.Math.Between(-60, 60);
      const by = y - 20;
      const b = this.scene.add.image(bx, by, heartBubbleKey)
        .setDepth(1510)
        .setScale(0.12)
        .setAlpha(0);
      this.track(b);

      this.scene.tweens.add({
        targets: b,
        y: by - Phaser.Math.Between(50, 110),
        x: bx + (i % 2 === 0 ? 18 : -18),
        scale: Phaser.Math.FloatBetween(0.24, 0.38),
        alpha: { from: 0.3, to: 1 },
        duration: Phaser.Math.Between(700, 1100),
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: b,
            alpha: 0,
            scale: 0.15,
            duration: 300,
            onComplete: () => this.untrack(b),
          });
        },
      });
    }

    CafeAudioEngine.getInstance().playHeartPop();
    CafeAudioEngine.getInstance().playSparkleShower();
  }

  // =========================================================================
  // 3. 🌌 UNIVERSE SPECTACLE: Cosmic pulse, planet, fireworks burst & party
  // =========================================================================
  private playUniverseSpectacle(_intensity: number): void {
    const cx = this.scene.scale.width / 2;
    const cy = 440;

    // 1. Soft Cosmic Radial Aura
    const aura = this.scene.add.circle(cx, cy, 140, 0x8B5CF6, 0.3)
      .setDepth(1480)
      .setScale(0.2)
      .setAlpha(0);
    this.track(aura);

    this.scene.tweens.add({
      targets: aura,
      scale: 1.35,
      alpha: 0.7,
      duration: 1800,
      yoyo: true,
      onComplete: () => this.untrack(aura),
    });

    // 2. Cosmic Planet Majestic Float
    const planetKey = giftAssetKey('universe_premium');
    const planet = this.scene.add.image(cx, cy - 30, planetKey)
      .setDepth(1500)
      .setScale(0.18)
      .setAlpha(0)
      .setAngle(-25);
    this.track(planet);

    this.scene.tweens.add({
      targets: planet,
      y: cy,
      scale: 0.9,
      alpha: 1,
      angle: 15,
      duration: 650,
      ease: 'Back.easeOut',
      hold: 1600,
      onComplete: () => {
        this.scene.tweens.add({
          targets: planet,
          y: cy - 90,
          scale: 0.4,
          alpha: 0,
          duration: 450,
          onComplete: () => this.untrack(planet),
        });
      },
    });

    // 3. Star Clusters & Fireworks (Verified Clean Illustrations)
    const fwKey = giftAssetKey('fireworks');
    const starKey = giftAssetKey('sparkle');
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const dist = Phaser.Math.Between(80, 150);
      const fx = cx + Math.cos(angle) * dist;
      const fy = cy + Math.sin(angle) * dist;

      this.scene.time.delayedCall(i * 100, () => {
        const star = this.scene.add.image(fx, fy, i % 2 === 0 ? fwKey : starKey)
          .setDepth(1510)
          .setScale(0.1)
          .setAlpha(0);
        this.track(star);

        this.scene.tweens.add({
          targets: star,
          scale: Phaser.Math.FloatBetween(0.35, 0.55),
          alpha: { from: 0.4, to: 1 },
          duration: 450,
          yoyo: true,
          onComplete: () => this.untrack(star),
        });
      });
    }

    // 4. Trigger Party Pose on All Cats in the Scene!
    this.scene.game.events.emit('cafe_party_all_cats');
    CafeAudioEngine.getInstance().playLevelUp();
    CafeAudioEngine.getInstance().playSparkleShower();
  }

  // =========================================================================
  // 4. 🦁 LION ROYAL CORONATION: Majestic Lion, crown descends, Royal King Cat
  // =========================================================================
  private playLionRoyalSpectacle(targetCat: Cat | undefined, x: number, y: number): void {
    const width = this.scene.scale.width;
    const cx = width / 2;

    // 1. Radiant Golden Crown Aura
    const glow = this.scene.add.circle(x, y - 55, 80, 0xF59E0B, 0.3)
      .setDepth(1470)
      .setScale(0.2)
      .setAlpha(0);
    this.track(glow);

    this.scene.tweens.add({
      targets: glow,
      scale: 1.35,
      alpha: 0.85,
      duration: 500,
      hold: 2400,
      onComplete: () => {
        this.scene.tweens.add({
          targets: glow,
          alpha: 0,
          scale: 1.6,
          duration: 500,
          onComplete: () => this.untrack(glow),
        });
      },
    });

    // 2. Majestic Lion Emblem floats at upper center
    const lionKey = giftAssetKey('lion');
    const lion = this.scene.add.image(cx, 330, lionKey)
      .setDepth(1520)
      .setScale(0.2)
      .setAlpha(0);
    this.track(lion);

    this.scene.tweens.add({
      targets: lion,
      y: 355,
      scale: 0.95,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
      hold: 1800,
      onComplete: () => {
        this.scene.tweens.add({
          targets: lion,
          y: 310,
          scale: 0.4,
          alpha: 0,
          duration: 450,
          onComplete: () => this.untrack(lion),
        });
      },
    });

    // 3. Golden Crown Descends onto Cat's Head!
    const crownKey = giftAssetKey('crown');
    const crown = this.scene.add.image(x, y - 130, crownKey)
      .setDepth(1530)
      .setScale(0.2)
      .setAlpha(0);
    this.track(crown);

    this.scene.tweens.add({
      targets: crown,
      y: y - 55,
      scale: 0.65,
      alpha: 1,
      duration: 800,
      ease: 'Bounce.easeOut',
      hold: 2200,
      onComplete: () => {
        this.scene.tweens.add({
          targets: crown,
          alpha: 0,
          scale: 0.3,
          duration: 400,
          onComplete: () => this.untrack(crown),
        });
      },
    });

    // 4. Target Cat Becomes Royal King!
    if (targetCat) {
      targetCat.becomeRoyal(8500);
    }

    // 5. Surrounding Cats Bow / Party in Honor of the King
    this.scene.game.events.emit('cafe_hail_royal_cat', targetCat);

    // 6. Magic Golden Stars & Sparkles Burst
    const starKey = giftAssetKey('sparkle');
    const goldStarKey = giftAssetKey('star');
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const sx = x + Math.cos(angle) * Phaser.Math.Between(40, 95);
      const sy = y - 40 + Math.sin(angle) * Phaser.Math.Between(30, 80);

      const star = this.scene.add.image(x, y - 40, i % 2 === 0 ? starKey : goldStarKey)
        .setDepth(1540)
        .setScale(0.12)
        .setAlpha(0);
      this.track(star);

      this.scene.tweens.add({
        targets: star,
        x: sx,
        y: sy,
        scale: Phaser.Math.FloatBetween(0.24, 0.4),
        alpha: { from: 0.3, to: 1 },
        duration: 650,
        yoyo: true,
        onComplete: () => this.untrack(star),
      });
    }

    CafeAudioEngine.getInstance().playLevelUp();
    CafeAudioEngine.getInstance().playSparkleShower();
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  private playCelebrationItem(gift: VisualGiftType, x: number, y: number, _fxKey: string): void {
    const key = giftAssetKey(gift as any);
    if (!this.scene.textures.exists(key)) return;

    const img = this.scene.add.image(x, y - 40, key)
      .setDepth(1500)
      .setScale(0.2)
      .setAlpha(0);
    this.track(img);

    this.scene.tweens.add({
      targets: img,
      y: y - 65,
      scale: 0.72,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      hold: 1200,
      onComplete: () => {
        this.scene.tweens.add({
          targets: img,
          y: y - 90,
          scale: 0.3,
          alpha: 0,
          duration: 350,
          onComplete: () => this.untrack(img),
        });
      },
    });

    this.emitSparkles(x, y - 65, 5);
    CafeAudioEngine.getInstance().playSparkleShower();
  }

  private playGenericGift(gift: string, x: number, y: number): void {
    const key = giftAssetKey(gift as any);
    if (!this.scene.textures.exists(key)) return;

    const img = this.scene.add.image(x, y - 35, key)
      .setDepth(1500)
      .setScale(0.2)
      .setAlpha(0);
    this.track(img);

    this.scene.tweens.add({
      targets: img,
      y: y - 65,
      scale: 0.7,
      alpha: 1,
      duration: 450,
      ease: 'Back.easeOut',
      hold: 1100,
      onComplete: () => {
        this.scene.tweens.add({
          targets: img,
          alpha: 0,
          scale: 0.3,
          duration: 350,
          onComplete: () => this.untrack(img),
        });
      },
    });

    this.emitSparkles(x, y - 65, 4);
    CafeAudioEngine.getInstance().playSparkleShower();
  }

  private emitSparkles(x: number, y: number, count = 4): void {
    const key = giftAssetKey('sparkle');
    if (!this.scene.textures.exists(key)) return;

    for (let i = 0; i < count; i++) {
      const offsetX = Phaser.Math.Between(-40, 40);
      const offsetY = Phaser.Math.Between(-40, 40);
      const s = this.scene.add.image(x + offsetX, y + offsetY, key)
        .setDepth(1510)
        .setScale(0.12)
        .setAlpha(0);
      this.track(s);

      this.scene.tweens.add({
        targets: s,
        y: s.y - 25,
        scale: Phaser.Math.FloatBetween(0.2, 0.36),
        alpha: { from: 0.4, to: 1 },
        duration: 500,
        yoyo: true,
        onComplete: () => this.untrack(s),
      });
    }
  }

  private track(obj: Phaser.GameObjects.GameObject): void {
    if (this.activeSprites.size >= this.maxActiveSprites) {
      const oldest = this.activeSprites.values().next().value;
      if (oldest) {
        this.activeSprites.delete(oldest);
        oldest.destroy();
      }
    }
    this.activeSprites.add(obj);
  }

  private untrack(obj: Phaser.GameObjects.GameObject): void {
    this.activeSprites.delete(obj);
    if (obj.active) obj.destroy();
  }

  public destroy(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    for (const obj of this.activeSprites) {
      if (obj.active) obj.destroy();
    }
    this.activeSprites.clear();
  }
}
