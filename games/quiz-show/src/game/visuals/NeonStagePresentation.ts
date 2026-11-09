import Phaser from 'phaser';
import { StageTheme } from '../types';

export class NeonStagePresentation extends Phaser.GameObjects.Container {
  private bgSprite: Phaser.GameObjects.Image | null = null;
  private spotlights: Phaser.GameObjects.Graphics[] = [];
  private theme: StageTheme;

  constructor(scene: Phaser.Scene, theme: StageTheme = 'studio_purple') {
    super(scene, 0, 0);
    this.theme = theme;

    this.createBackground();
    this.createStageLights();
    this.createHeaderBanner();

    scene.add.existing(this);
    this.setDepth(10);
  }

  private createBackground(): void {
    // Stage background image if available, else rich gradient
    if (this.scene.textures.exists('bg_studio')) {
      this.bgSprite = this.scene.add.image(270, 480, 'bg_studio');
      this.bgSprite.setDisplaySize(540, 960);
      this.add(this.bgSprite);
    } else {
      const bg = this.scene.add.graphics();
      bg.fillGradientStyle(0x18072b, 0x18072b, 0x090214, 0x090214, 1);
      bg.fillRect(0, 0, 540, 960);
      this.add(bg);
    }
  }

  private createStageLights(): void {
    const lightColors = [0xa855f7, 0xec4899, 0x3b82f6];

    for (let i = 0; i < 3; i++) {
      const g = this.scene.add.graphics();
      g.fillStyle(lightColors[i], 0.12);
      g.fillTriangle(0, 0, -80, 700, 80, 700);
      g.setPosition(135 + i * 135, 0);
      this.add(g);
      this.spotlights.push(g);

      // Sway tween
      this.scene.tweens.add({
        targets: g,
        angle: (i % 2 === 0 ? 1 : -1) * 15,
        duration: 3000 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createHeaderBanner(): void {
    const bannerBg = this.scene.add.graphics();
    bannerBg.fillStyle(0x1e1035, 0.85);
    bannerBg.fillRoundedRect(30, 20, 480, 50, 16);
    bannerBg.lineStyle(2, 0xa855f7, 0.8);
    bannerBg.strokeRoundedRect(30, 20, 480, 50, 16);
    this.add(bannerBg);

    // LIVE pill
    const livePill = this.scene.add.graphics();
    livePill.fillStyle(0xef4444, 1);
    livePill.fillRoundedRect(45, 32, 60, 26, 8);
    this.add(livePill);

    const liveText = this.scene.add.text(75, 45, '● LIVE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(liveText);

    // Show title
    const title = this.scene.add.text(285, 45, '🏆 ĐỐ VUI CÓ THƯỞNG — QUIZ SHOW', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(title);
  }

  public setTheme(theme: StageTheme): void {
    this.theme = theme;
  }
}

