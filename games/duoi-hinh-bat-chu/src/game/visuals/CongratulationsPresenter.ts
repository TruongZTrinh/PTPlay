import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';

export class CongratulationsPresenter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private activeTweens: Phaser.Tweens.Tween[] = [];
  private ceremonyOverlay: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, _avatarManager?: unknown, _audio?: unknown) {
    this.scene = scene;
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

  /**
   * Displays the grand championship ceremony podium overlay
   */
  public showCeremonyPodium(topPlayers: RebusPlayerRecord[]): void {
    if (this.ceremonyOverlay) {
      this.ceremonyOverlay.destroy();
      this.ceremonyOverlay = null;
    }

    const overlay = this.scene.add.container(270, 480);
    overlay.setDepth(195);
    overlay.setScale(0.8);
    overlay.setAlpha(0);
    this.ceremonyOverlay = overlay;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.96);
    bg.fillRoundedRect(-220, -210, 440, 420, 20);
    bg.lineStyle(3, 0xf59e0b, 1);
    bg.strokeRoundedRect(-220, -210, 440, 420, 20);
    overlay.add(bg);

    const title = this.scene.add.text(0, -170, '🏆 LỄ VINH DANH QUÁN QUÂN 🏆', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    overlay.add(title);

    const subtitle = this.scene.add.text(0, -145, 'Chúc mừng các thám tử xuất sắc nhất!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5);
    overlay.add(subtitle);

    const medals = [
      { rank: '🥇 QUÁN QUÂN', color: '#facc15', border: 0xfacc15, y: -70 },
      { rank: '🥈 Á QUÂN', color: '#e2e8f0', border: 0x94a3b8, y: 15 },
      { rank: '🥉 QUÝ QUÂN', color: '#fdba74', border: 0xd97706, y: 95 },
    ];

    medals.forEach((m, idx) => {
      const p = topPlayers[idx];
      const pName = p ? p.nickname : `Thí sinh ${idx + 1}`;
      const pScore = p ? `${p.score} điểm` : '---';

      const rowBg = this.scene.add.graphics();
      rowBg.fillStyle(0x1e293b, 0.9);
      rowBg.fillRoundedRect(-190, m.y - 25, 380, 56, 12);
      rowBg.lineStyle(1.5, m.border, 0.8);
      rowBg.strokeRoundedRect(-190, m.y - 25, 380, 56, 12);
      overlay.add(rowBg);

      const rankText = this.scene.add.text(-170, m.y - 8, m.rank, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: m.color,
        fontStyle: 'bold',
      });
      overlay.add(rankText);

      const nameText = this.scene.add.text(-170, m.y + 10, pName, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      overlay.add(nameText);

      const scoreText = this.scene.add.text(170, m.y, pScore, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: m.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      overlay.add(scoreText);
    });

    const footer = this.scene.add.text(0, 175, '🎮 Chuẩn bị bắt đầu vòng chơi mới...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#38bdf8',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    overlay.add(footer);

    this.container.add(overlay);

    // Continuous confetti shower
    const confettiTimer = this.scene.time.addEvent({
      delay: 300,
      repeat: 12,
      callback: () => {
        const rx = 100 + Math.random() * 340;
        const ry = 300 + Math.random() * 200;
        this.spawnConfetti(rx, ry, 15);
      },
    });

    // Animate overlay entrance
    this.scene.tweens.add({
      targets: overlay,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Auto dismiss after 12s before new show starts
        this.scene.time.delayedCall(12000, () => {
          confettiTimer.destroy();
          this.scene.tweens.add({
            targets: overlay,
            alpha: 0,
            scale: 0.8,
            duration: 400,
            onComplete: () => overlay.destroy(),
          });
        });
      },
    });
  }

  public hideCeremony(): void {
    if (this.ceremonyOverlay) {
      this.ceremonyOverlay.destroy();
      this.ceremonyOverlay = null;
    }
  }

  public destroy(): void {
    this.hideCeremony();
    this.activeTweens.forEach((t) => t.stop());
    this.activeTweens = [];
    this.container.destroy(true);
  }
}
