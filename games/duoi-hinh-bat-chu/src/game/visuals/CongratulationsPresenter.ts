import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';
import { AvatarManager } from '../systems/AvatarManager';

export class CongratulationsPresenter {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private activeTweens: Phaser.Tweens.Tween[] = [];
  private ceremonyOverlay: Phaser.GameObjects.Container | null = null;
  private avatarManager?: AvatarManager;

  constructor(scene: Phaser.Scene, avatarManager?: unknown, _audio?: unknown) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(180);
    if (avatarManager instanceof AvatarManager) {
      this.avatarManager = avatarManager;
    } else if (avatarManager && typeof (avatarManager as any).loadAvatar === 'function') {
      this.avatarManager = avatarManager as AvatarManager;
    }
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
  /**
   * Helper to create a circular masked avatar with metallic border ring
   */
  private createAvatarBadge(
    x: number,
    y: number,
    radius: number,
    player?: RebusPlayerRecord,
    ringColor: number = 0xf59e0b
  ): Phaser.GameObjects.Container {
    const avatarCont = this.scene.add.container(x, y);

    // 1. Ring and background circle
    const ring = this.scene.add.graphics();
    ring.lineStyle(3, ringColor, 1);
    ring.strokeCircle(0, 0, radius);
    ring.fillStyle(0xf1f5f9, 1);
    ring.fillCircle(0, 0, radius - 1.5);
    avatarCont.add(ring);

    // 2. Initial fallback text (letter initials or chibi)
    const initial = (player?.nickname || '?').trim().charAt(0).toUpperCase();
    const fallbackText = this.scene.add
      .text(0, 0, initial, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: `${Math.round(radius * 0.9)}px`,
        color: '#475569',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    avatarCont.add(fallbackText);

    // 3. Load Real Avatar if available
    if (player?.avatarUrl && this.avatarManager && this.avatarManager.isSafeUrl(player.avatarUrl)) {
      const uId = player.userId;
      this.avatarManager.loadAvatar(uId, player.avatarUrl, () => {
        const circleKey = this.avatarManager?.getCircleTextureKey(uId) || '';
        const baseKey = this.avatarManager?.getTextureKey(uId) || '';

        if (circleKey && this.scene.textures.exists(circleKey)) {
          fallbackText.setVisible(false);
          const img = this.scene.add.image(0, 0, circleKey);
          img.setDisplaySize((radius - 1.5) * 2, (radius - 1.5) * 2);
          avatarCont.add(img);
          avatarCont.bringToTop(ring);
        } else if (baseKey && this.scene.textures.exists(baseKey)) {
          fallbackText.setVisible(false);
          const img = this.scene.add.image(0, 0, baseKey);
          img.setDisplaySize((radius - 1.5) * 2, (radius - 1.5) * 2);
          avatarCont.add(img);
          avatarCont.bringToTop(ring);
        }
      });
    }

    return avatarCont;
  }

  /**
   * Displays the grand championship ceremony podium overlay
   * Matches the official "NGÔI SAO LỚP HỌC" podium design with real player avatars
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

    // 1. Elegant cream rounded dialog card with double border
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xfbf8ed, 0.98); // Warm cream paper background
    bg.fillRoundedRect(-225, -270, 450, 540, 24);
    bg.lineStyle(3.5, 0xc49a45, 1); // Golden bronze outline
    bg.strokeRoundedRect(-225, -270, 450, 540, 24);
    overlay.add(bg);

    // 2. Header Texts
    const topLabel = this.scene.add
      .text(0, -238, 'LỄ TRAO GIẢI', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#78716c',
        fontStyle: 'bold',
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    overlay.add(topLabel);

    const title = this.scene.add
      .text(0, -212, 'NGÔI SAO LỚP HỌC', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#064e3b', // Rich emerald
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    overlay.add(title);

    const subtitle = this.scene.add
      .text(0, -184, 'Cùng vỗ tay cho những thám tử xuất sắc nhất!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#78716c',
      })
      .setOrigin(0.5);
    overlay.add(subtitle);

    const p1 = topPlayers[0];
    const p2 = topPlayers[1];
    const p3 = topPlayers[2];

    // 3. Green Classroom Floor Platform
    const floor = this.scene.add.graphics();
    floor.fillStyle(0x064e3b, 1);
    floor.fillRoundedRect(-195, 115, 390, 14, 7);
    overlay.add(floor);

    // ==================== RANK 2: Á QUÂN (LEFT) ====================
    if (p2 || topPlayers.length >= 2) {
      const x2 = -120;
      // Silver Podium Block
      const pod2 = this.scene.add.graphics();
      pod2.fillStyle(0xe2e8f0, 1);
      pod2.fillRoundedRect(x2 - 50, 45, 100, 70, 8);
      pod2.lineStyle(2, 0x94a3b8, 1);
      pod2.strokeRoundedRect(x2 - 50, 45, 100, 70, 8);
      overlay.add(pod2);

      overlay.add(
        this.scene.add
          .text(x2, 60, 'Á QUÂN', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px',
            color: '#475569',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      overlay.add(
        this.scene.add
          .text(x2, 90, '2', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '32px',
            color: '#334155',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      // Name & Score
      overlay.add(
        this.scene.add
          .text(x2, 12, p2 ? p2.nickname : 'Á Quân', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: '#1c1917',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      overlay.add(
        this.scene.add
          .text(x2, 28, `${p2 ? p2.score : 0} điểm`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: '#475569',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      // Circular Avatar Badge
      const avatar2 = this.createAvatarBadge(x2, -28, 27, p2, 0x94a3b8);
      overlay.add(avatar2);
    }

    // ==================== RANK 3: QUÝ QUÂN (RIGHT) ====================
    if (p3 || topPlayers.length >= 3) {
      const x3 = 120;
      // Bronze Podium Block
      const pod3 = this.scene.add.graphics();
      pod3.fillStyle(0xfde68a, 0.85);
      pod3.fillRoundedRect(x3 - 50, 62, 100, 53, 8);
      pod3.lineStyle(2, 0xd97706, 1);
      pod3.strokeRoundedRect(x3 - 50, 62, 100, 53, 8);
      overlay.add(pod3);

      overlay.add(
        this.scene.add
          .text(x3, 76, 'QUÝ QUÂN', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px',
            color: '#92400e',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      overlay.add(
        this.scene.add
          .text(x3, 98, '3', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '28px',
            color: '#78350f',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      // Name & Score
      overlay.add(
        this.scene.add
          .text(x3, 30, p3 ? p3.nickname : 'Quý Quân', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            color: '#1c1917',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      overlay.add(
        this.scene.add
          .text(x3, 46, `${p3 ? p3.score : 0} điểm`, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: '#92400e',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );

      // Circular Avatar Badge
      const avatar3 = this.createAvatarBadge(x3, -10, 26, p3, 0xd97706);
      overlay.add(avatar3);
    }

    // ==================== RANK 1: QUÁN QUÂN (CENTER) ====================
    const x1 = 0;
    // Golden Podium Block
    const pod1 = this.scene.add.graphics();
    pod1.fillStyle(0xfde047, 1);
    pod1.fillRoundedRect(x1 - 58, 0, 116, 115, 10);
    pod1.lineStyle(2.5, 0xeab308, 1);
    pod1.strokeRoundedRect(x1 - 58, 0, 116, 115, 10);
    overlay.add(pod1);

    overlay.add(
      this.scene.add
        .text(x1, 18, 'QUÁN QUÂN', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#854d0e',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    overlay.add(
      this.scene.add
        .text(x1, 62, '1', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '44px',
          color: '#713f12',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    // Crown Icon
    const crown = this.scene.add.text(x1, -150, '👑', { fontSize: '28px' }).setOrigin(0.5);
    overlay.add(crown);

    // Floating animation on Crown
    this.scene.tweens.add({
      targets: crown,
      y: -155,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Circular Avatar Badge
    const avatar1 = this.createAvatarBadge(x1, -95, 38, p1, 0xeab308);
    overlay.add(avatar1);

    // Name & Score
    overlay.add(
      this.scene.add
        .text(x1, -44, p1 ? p1.nickname : 'Nhà Vô Địch', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#064e3b',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    overlay.add(
      this.scene.add
        .text(x1, -26, `${p1 ? p1.score : 0} điểm`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#854d0e',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
    );

    // 4. Bottom Cheering Banner & Countdown
    overlay.add(
      this.scene.add
        .text(0, 155, 'MỘT TRÀNG PHÁO TAY CHO CẢ LỚP!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#064e3b',
          fontStyle: 'bold',
          letterSpacing: 1,
        })
        .setOrigin(0.5)
    );

    let remainingSeconds = 15;
    const countdownText = this.scene.add
      .text(0, 185, `Vòng mới bắt đầu sau ${remainingSeconds} giây`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#78716c',
      })
      .setOrigin(0.5);
    overlay.add(countdownText);

    // Green Animated Progress Bar
    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0xe7e5e4, 1);
    barBg.fillRoundedRect(-110, 204, 220, 5, 2.5);
    overlay.add(barBg);

    const progressBar = this.scene.add.graphics();
    const updateBar = (ratio: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x059669, 1);
      const w = Math.max(0, 220 * ratio);
      progressBar.fillRoundedRect(-110, 204, w, 5, 2.5);
    };
    updateBar(1);
    overlay.add(progressBar);

    this.container.add(overlay);

    // Countdown Interval Timer
    const secondTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        remainingSeconds--;
        if (countdownText && countdownText.active) {
          countdownText.setText(`Vòng mới bắt đầu sau ${remainingSeconds} giây`);
        }
        updateBar(Math.max(0, remainingSeconds / 15));
      },
    });

    // Continuous confetti shower
    const confettiTimer = this.scene.time.addEvent({
      delay: 350,
      repeat: 12,
      callback: () => {
        const rx = 100 + Math.random() * 340;
        const ry = 280 + Math.random() * 220;
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
        // Auto dismiss after 15s before new show starts
        this.scene.time.delayedCall(15000, () => {
          secondTimer.destroy();
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
