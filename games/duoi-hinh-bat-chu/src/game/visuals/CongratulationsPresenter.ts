import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';
import { CeremonyPodium } from './CeremonyPodium';
import type { AvatarManager } from '../systems/AvatarManager';
import type { AudioEngine } from '../audio/AudioEngine';

export class CongratulationsPresenter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private activeTweens: Phaser.Tweens.Tween[] = [];
  private ceremony: CeremonyPodium;

  constructor(scene: Phaser.Scene, avatarManager?: AvatarManager, audio?: AudioEngine) {
    this.scene = scene;
    this.ceremony = new CeremonyPodium(scene, avatarManager, audio);
    this.container = scene.add.container(0, 0);
    this.container.setDepth(180);
  }

  /**
   * Spawns a burst of vibrant confetti stars and sparkles
   */
  public spawnConfetti(originX: number = 270, originY: number = 400, count: number = 25): void {
    const starColors = [0xfbbf24, 0xf43f5e, 0x10b981, 0x38bdf8, 0xa855f7, 0xffffff];

    for (let i = 0; i < count; i++) {
      const x = originX + (Math.random() - 0.5) * 60;
      const y = originY + (Math.random() - 0.5) * 40;
      const color = starColors[i % starColors.length];
      const size = 6 + Math.random() * 8;

      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      if (Math.random() > 0.5) {
        particle.fillCircle(0, 0, size / 2);
      } else {
        particle.fillRect(-size / 2, -size / 2, size, size);
      }
      particle.setPosition(x, y);
      particle.setDepth(185);

      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 240;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed - 60;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY + 120, // gravity fall
        angle: (Math.random() - 0.5) * 360,
        alpha: { from: 1, to: 0 },
        scale: { from: 1.2, to: 0.3 },
        duration: 900 + Math.random() * 600,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Displays a vibrant congratulatory banner when a player solves a round puzzle
   */
  public showRoundWinner(winnerName: string, answer: string, points: number): void {
    // 1. Confetti burst across chalkboard
    this.spawnConfetti(270, 240, 30);
    this.spawnConfetti(120, 350, 15);
    this.spawnConfetti(420, 350, 15);

    // 2. Congratulatory floating popup banner
    const bannerContainer = this.scene.add.container(270, 470);
    bannerContainer.setDepth(190);
    bannerContainer.setScale(0.2);
    bannerContainer.setAlpha(0);

    const bannerBg = this.scene.add.graphics();
    bannerBg.fillStyle(0x0f172a, 0.95);
    bannerBg.fillRoundedRect(-190, -32, 380, 64, 16);
    bannerBg.lineStyle(2.5, 0xfacc15, 1);
    bannerBg.strokeRoundedRect(-190, -32, 380, 64, 16);
    bannerContainer.add(bannerBg);

    const crownIcon = this.scene.add.text(-160, 0, '👑', { fontSize: '24px' }).setOrigin(0.5);
    bannerContainer.add(crownIcon);

    const line1 = this.scene.add.text(0, -10, `🎉 CHÚC MỪNG ${winnerName.toUpperCase()}!`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    bannerContainer.add(line1);

    const line2 = this.scene.add.text(0, 12, `⚡ Giải đúng "${answer}" nhanh nhất (+${points}đ)!`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#4ade80',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    bannerContainer.add(line2);

    this.container.add(bannerContainer);

    // Entrance animation
    this.scene.tweens.add({
      targets: bannerContainer,
      scale: 1,
      alpha: 1,
      y: 450,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 1800ms, then exit smoothly
        this.scene.time.delayedCall(1800, () => {
          this.scene.tweens.add({
            targets: bannerContainer,
            scale: 0.8,
            alpha: 0,
            y: 430,
            duration: 300,
            ease: 'Quad.easeIn',
            onComplete: () => bannerContainer.destroy(),
          });
        });
      },
    });
  }

  public showCeremonyPodium(topPlayers: RebusPlayerRecord[]): void {
    this.ceremony.show(topPlayers);
  }

  public hideCeremony(): void {
    this.ceremony.hide();
  }

  public destroy(): void {
    this.ceremony.destroy();
    this.activeTweens.forEach((t) => t.stop());
    this.activeTweens = [];
    this.container.destroy(true);
  }
}
