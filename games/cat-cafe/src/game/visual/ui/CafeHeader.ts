import Phaser from 'phaser';
import { CAFE_VISUAL_CONFIG } from '../CafeVisualConfig';
import { ProgressionManager } from '../../progression/ProgressionManager';
import { RoomId } from '../../config/CafeConfig';

export class CafeHeader {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // Elements
  private signboardImage!: Phaser.GameObjects.Image;
  private levelText!: Phaser.GameObjects.Text;
  private purrProgressBg!: Phaser.GameObjects.Graphics;
  private purrProgressBar!: Phaser.GameObjects.Graphics;
  private purrText!: Phaser.GameObjects.Text;
  private starIcon!: Phaser.GameObjects.Text;

  private catCountContainer!: Phaser.GameObjects.Container;
  private catCountText!: Phaser.GameObjects.Text;

  private liveStatusContainer!: Phaser.GameObjects.Container;
  private liveStatusText!: Phaser.GameObjects.Text;
  private liveStatusDot!: Phaser.GameObjects.Arc;

  private settingsButton!: Phaser.GameObjects.Container;
  private lofiBannerImage!: Phaser.GameObjects.Image;
  private eqBars: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, onOpenSettings?: () => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(2000);

    this.createHeader(onOpenSettings);
    this.createLofiBanner();
    this.refreshProgression();
  }

  private createHeader(onOpenSettings?: () => void): void {
    const { width } = CAFE_VISUAL_CONFIG.resolution;

    // 1. Left Carved Wooden Signboard ("PTPlay Café Mòe 📍 Quán Chính")
    this.signboardImage = this.scene.add.image(95, 48, 'signboard_v2');
    this.signboardImage.setOrigin(0.5, 0.5);
    this.container.add(this.signboardImage);

    // 2. Center: Level & Purr Points Progress
    const centerX = 275;
    this.levelText = this.scene.add.text(centerX, 25, 'Cấp 1', {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#38BDF8',
      stroke: '#1E293B',
      strokeThickness: 2,
      align: 'center',
    });
    this.levelText.setOrigin(0.5, 0.5);
    this.container.add(this.levelText);

    // Progress Bar Background
    this.purrProgressBg = this.scene.add.graphics();
    this.purrProgressBg.fillStyle(0x3B1D0C, 0.9);
    this.purrProgressBg.fillRoundedRect(centerX - 55, 38, 110, 14, 7);
    this.purrProgressBg.lineStyle(1.6, 0xF59E0B, 0.95);
    this.purrProgressBg.strokeRoundedRect(centerX - 55, 38, 110, 14, 7);
    this.container.add(this.purrProgressBg);

    // Progress Bar Fill
    this.purrProgressBar = this.scene.add.graphics();
    this.container.add(this.purrProgressBar);

    // Gold Star Jewel on Left Edge of Bar
    this.starIcon = this.scene.add.text(centerX - 62, 45, '⭐', {
      fontSize: '13px',
    });
    this.starIcon.setOrigin(0.5, 0.5);
    this.container.add(this.starIcon);

    // Purrs Text Under Bar with dark stroke for perfect legibility
    this.purrText = this.scene.add.text(centerX, 61, '0 / 100 Purrs', {
      fontFamily: "'Segoe UI', sans-serif",
      fontSize: '9.5px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#2A1409',
      strokeThickness: 2.5,
      align: 'center',
    });
    this.purrText.setOrigin(0.5, 0.5);
    this.container.add(this.purrText);

    // 3. Right: Cat Count Badge & LIVE Online Indicator & Settings Button
    // A. Cat Count Pill
    this.catCountContainer = this.scene.add.container(width - 110, 32);
    const countBg = this.scene.add.graphics();
    countBg.fillStyle(0x3D2112, 0.92);
    countBg.fillRoundedRect(-46, -12, 92, 24, 12);
    countBg.lineStyle(1.5, 0xF59E0B, 0.9);
    countBg.strokeRoundedRect(-46, -12, 92, 24, 12);
    this.catCountContainer.add(countBg);

    this.catCountText = this.scene.add.text(0, 0, '🐱 4/20 Mèo', {
      fontFamily: "'Segoe UI', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFF8E7',
      align: 'center',
    });
    this.catCountText.setOrigin(0.5, 0.5);
    this.catCountContainer.add(this.catCountText);
    this.container.add(this.catCountContainer);

    // B. LIVE Status Pill
    this.liveStatusContainer = this.scene.add.container(width - 110, 62);
    const liveBg = this.scene.add.graphics();
    liveBg.fillStyle(0x14532D, 0.92);
    liveBg.fillRoundedRect(-46, -11, 92, 22, 11);
    liveBg.lineStyle(1.5, 0x22C55E, 0.9);
    liveBg.strokeRoundedRect(-46, -11, 92, 22, 11);
    this.liveStatusContainer.add(liveBg);

    this.liveStatusDot = this.scene.add.circle(-34, 0, 4, 0x22C55E);
    this.liveStatusContainer.add(this.liveStatusDot);

    // Pulsing green glow on live dot
    this.scene.tweens.add({
      targets: this.liveStatusDot,
      scale: { from: 0.8, to: 1.3 },
      alpha: { from: 0.7, to: 1.0 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.liveStatusText = this.scene.add.text(6, 0, 'LIVE Online', {
      fontFamily: "'Segoe UI', sans-serif",
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#F0FDF4',
      align: 'center',
    });
    this.liveStatusText.setOrigin(0.5, 0.5);
    this.liveStatusContainer.add(this.liveStatusText);
    this.container.add(this.liveStatusContainer);

    // C. Wooden Settings Gear Button
    this.settingsButton = this.scene.add.container(width - 38, 47);
    const gearBg = this.scene.add.graphics();
    gearBg.fillStyle(0x3D2112, 0.95);
    gearBg.fillRoundedRect(-18, -26, 36, 52, 10);
    gearBg.lineStyle(1.8, 0xD97706, 0.9);
    gearBg.strokeRoundedRect(-18, -26, 36, 52, 10);
    this.settingsButton.add(gearBg);

    const gearIcon = this.scene.add.text(0, 0, '⚙️', {
      fontSize: '16px',
    });
    gearIcon.setOrigin(0.5, 0.5);
    this.settingsButton.add(gearIcon);

    gearBg.setInteractive(new Phaser.Geom.Rectangle(-18, -26, 36, 52), Phaser.Geom.Rectangle.Contains);
    gearBg.on('pointerdown', () => {
      if (onOpenSettings) onOpenSettings();
    });
    gearBg.on('pointerover', () => {
      this.settingsButton.setScale(1.06);
    });
    gearBg.on('pointerout', () => {
      this.settingsButton.setScale(1.0);
    });

    this.container.add(this.settingsButton);
  }

  private createLofiBanner(): void {
    const { width } = CAFE_VISUAL_CONFIG.resolution;

    // Sage Green Lofi Audio Pill (placed cleanly at y: 135 below slim command strip)
    const bannerY = 135;
    this.lofiBannerImage = this.scene.add.image(width / 2, bannerY, 'lofi_banner_v2');
    this.lofiBannerImage.setOrigin(0.5, 0.5);
    this.container.add(this.lofiBannerImage);

    // Animated Equalizer Wave Bars
    const eqX = width / 2 + 134;
    const eqY = bannerY;
    for (let i = 0; i < 4; i++) {
      const bar = this.scene.add.rectangle(eqX + i * 4, eqY, 2.5, 8 + (i % 2) * 4, 0xBEF264);
      this.container.add(bar);
      this.eqBars.push(bar);

      this.scene.tweens.add({
        targets: bar,
        scaleY: { from: 0.4, to: 1.4 },
        duration: 350 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.lofiBannerImage.setInteractive();
    this.lofiBannerImage.on('pointerdown', () => {
      this.scene.game.events.emit('toggle_bgm');
    });
  }

  public refreshProgression(): void {
    const pm = ProgressionManager.getInstance();
    const currLevel = pm.data.level;
    const currPurrs = pm.data.purrPoints;
    const nextMilestone = pm.getNextMilestone();
    const prevMilestone = pm.getCurrentMilestone();

    this.levelText.setText(`Cấp ${currLevel}`);

    const basePurrs = prevMilestone ? prevMilestone.requiredPurrs : 0;
    const targetPurrs = nextMilestone ? nextMilestone.requiredPurrs : basePurrs + 500;
    const range = Math.max(1, targetPurrs - basePurrs);
    const progress = Math.min(1, Math.max(0, (currPurrs - basePurrs) / range));

    const centerX = 275;
    this.purrProgressBar.clear();
    this.purrProgressBar.fillStyle(0xF59E0B, 1);
    this.purrProgressBar.fillRoundedRect(centerX - 53, 40, Math.max(8, 106 * progress), 10, 5);

    this.purrText.setText(`${currPurrs} / ${targetPurrs} Purrs`);
  }

  public updateCatCount(total: number, max: number): void {
    this.catCountText.setText(`🐱 ${total}/${max} Mèo`);
  }

  public updateStatus(connected: boolean, statusText?: string): void {
    if (connected) {
      this.liveStatusDot.setFillStyle(0x22C55E);
      this.liveStatusText.setText(statusText && statusText.length <= 12 ? statusText : 'LIVE Online');
    } else {
      // In standalone broadcast preview, show clear status without clipping
      this.liveStatusDot.setFillStyle(0x22C55E);
      this.liveStatusText.setText('LIVE Online');
    }
  }

  public updateRoom(_roomId: RoomId): void {
    // Keep signature
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
