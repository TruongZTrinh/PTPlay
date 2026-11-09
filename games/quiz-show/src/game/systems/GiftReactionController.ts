import Phaser from 'phaser';
import { AudioEngine } from '../audio/AudioEngine';

export class GiftReactionController {
  private scene: Phaser.Scene;
  private audioEngine: AudioEngine;

  constructor(scene: Phaser.Scene, audioEngine: AudioEngine) {
    this.scene = scene;
    this.audioEngine = audioEngine;
  }

  public triggerGiftReaction(giftName: string, donorNick: string, donorAvatarUrl?: string): void {
    const cleanGift = (giftName || '').toLowerCase();

    if (cleanGift.includes('rose') || cleanGift.includes('hoa')) {
      this.playRoseReaction();
    } else if (cleanGift.includes('heart') || cleanGift.includes('tim')) {
      this.playHeartReaction();
    } else if (cleanGift.includes('donut') || cleanGift.includes('cake') || cleanGift.includes('banh')) {
      this.playDonutReaction();
    } else if (cleanGift.includes('lion') || cleanGift.includes('su tu') || cleanGift.includes('crown') || cleanGift.includes('vuong mien')) {
      this.playLionReaction(donorNick);
    } else if (cleanGift.includes('universe') || cleanGift.includes('vu tru') || cleanGift.includes('galaxy') || cleanGift.includes('firework') || cleanGift.includes('phao')) {
      this.playUniverseReaction();
    } else {
      // Default sparkle burst
      this.playDefaultSparkle(donorNick);
    }
  }

  private playRoseReaction(): void {
    this.audioEngine.playGiftRose();
    const count = 12;
    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * 440;
      const y = 900;
      const key = this.scene.textures.exists('gift_rose') ? 'gift_rose' : 'effect_heart';
      const sprite = this.scene.add.image(x, y, key).setScale(0.5).setAlpha(0).setDepth(150);

      this.scene.tweens.add({
        targets: sprite,
        alpha: { from: 0, to: 1 },
        y: y - 400 - Math.random() * 200,
        x: x + (Math.random() - 0.5) * 120,
        angle: (Math.random() - 0.5) * 60,
        duration: 1800 + Math.random() * 600,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            scale: 0.2,
            duration: 400,
            onComplete: () => sprite.destroy(),
          });
        },
      });
    }
  }

  private playHeartReaction(): void {
    this.audioEngine.playGiftHeart();
    const count = 15;
    for (let i = 0; i < count; i++) {
      const x = 100 + Math.random() * 340;
      const y = 750 + Math.random() * 100;
      const key = this.scene.textures.exists('effect_heart') ? 'effect_heart' : 'gift_heart';
      const sprite = this.scene.add.image(x, y, key).setScale(0.4).setAlpha(0).setDepth(150);

      this.scene.tweens.add({
        targets: sprite,
        alpha: 1,
        y: y - 300 - Math.random() * 150,
        scale: { from: 0.3, to: 0.6 },
        duration: 1500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          sprite.destroy();
        },
      });
    }
  }

  private playDonutReaction(): void {
    this.audioEngine.playGiftRose();
    const count = 6;
    for (let i = 0; i < count; i++) {
      const x = 80 + i * 70;
      const y = -50;
      const key = this.scene.textures.exists('gift_donut') ? 'gift_donut' : 'effect_star';
      const donut = this.scene.add.image(x, y, key).setScale(0.55).setDepth(160);

      this.scene.tweens.add({
        targets: donut,
        y: 600 + (i % 2) * 50,
        angle: 360,
        duration: 1200 + i * 150,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: donut,
            alpha: 0,
            duration: 600,
            delay: 800,
            onComplete: () => donut.destroy(),
          });
        },
      });
    }
  }

  private playLionReaction(nick: string): void {
    this.audioEngine.playGiftLion();
    // Spotlight beam on stage
    const beam = this.scene.add.graphics().setDepth(140);
    beam.fillStyle(0xffd700, 0.25);
    beam.fillTriangle(270, 0, 70, 960, 470, 960);

    const banner = this.scene.add.text(270, 480, `🦁 ${nick} QUÀ LION HOÀNG GIA!`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(170).setScale(0);

    this.scene.tweens.add({
      targets: banner,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [beam, banner],
          alpha: 0,
          duration: 800,
          delay: 2500,
          onComplete: () => {
            beam.destroy();
            banner.destroy();
          },
        });
      },
    });
  }

  private playUniverseReaction(): void {
    this.audioEngine.playGiftUniverse();
    // Cosmic color flash
    const flash = this.scene.add.rectangle(270, 480, 540, 960, 0x3b0764, 0.6).setDepth(130);

    const banner = this.scene.add.text(270, 400, '🌌 ĐẠI TIỆC VŨ TRỤ UNIVERSE! 🌌', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#c084fc',
      fontStyle: 'bold',
      stroke: '#1e1b4b',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(170).setScale(0);

    this.scene.tweens.add({
      targets: banner,
      scale: 1.1,
      y: 380,
      duration: 600,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.scene.tweens.add({
          targets: [flash, banner],
          alpha: 0,
          duration: 1000,
          onComplete: () => {
            flash.destroy();
            banner.destroy();
          },
        });
      },
    });
  }

  private playDefaultSparkle(nick: string): void {
    this.audioEngine.playGiftHeart();
  }
}

