import Phaser from 'phaser';
import { CAFE_CONFIG, RoomId } from '../config/CafeConfig';
import { CafeHeader } from '../visual/ui/CafeHeader';
import { ProgressionManager } from '../progression/ProgressionManager';

export class Hud {
  private scene: Phaser.Scene;
  private header: CafeHeader;
  private toastContainer: Phaser.GameObjects.Container;
  private toastText: Phaser.GameObjects.Text;
  private toastTween: Phaser.Tweens.Tween | null = null;
  private safeZoneGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, onOpenSettings?: () => void) {
    this.scene = scene;
    const { width, height } = CAFE_CONFIG;

    // 1. Safe Zone Overlay (Dotted lines for Streamer preview)
    this.safeZoneGraphics = scene.add.graphics();
    this.safeZoneGraphics.setDepth(2999);
    this.safeZoneGraphics.setVisible(ProgressionManager.getInstance().data.settings.safeZoneVisible);
    this.drawSafeZones();

    // 2. High Quality Illustrated CafeHeader (Signboard, Level Bar, Cat Count, Live Status, Gear, Lofi Pill)
    this.header = new CafeHeader(scene, onOpenSettings);

    // 3. Floating Toast Notifications
    this.toastContainer = scene.add.container(width / 2, 160);
    this.toastContainer.setDepth(2500);
    this.toastContainer.setAlpha(0);

    const toastBg = scene.add.graphics();
    toastBg.fillStyle(0x2A1409, 0.94);
    toastBg.fillRoundedRect(-170, -18, 340, 36, 18);
    toastBg.lineStyle(1.8, 0xF59E0B, 0.9);
    toastBg.strokeRoundedRect(-170, -18, 340, 36, 18);
    this.toastContainer.add(toastBg);

    this.toastText = scene.add.text(0, 0, '', {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: '11.5px',
      fontStyle: 'bold',
      color: '#FEF3C7',
      align: 'center',
      wordWrap: { width: 310 },
    });
    this.toastText.setOrigin(0.5, 0.5);
    this.toastContainer.add(this.toastText);
  }

  private drawSafeZones(): void {
    const { width, height } = CAFE_CONFIG;
    this.safeZoneGraphics.clear();
    this.safeZoneGraphics.lineStyle(1.5, 0x00FF88, 0.6);
    this.safeZoneGraphics.strokeRect(20, 20, width - 40, height - 40);
    // TikTok bottom overlay indicator
    this.safeZoneGraphics.lineStyle(1.5, 0xFF3366, 0.5);
    this.safeZoneGraphics.strokeRect(20, height - 200, width - 40, 180);
  }

  public setSafeZoneVisible(visible: boolean): void {
    this.safeZoneGraphics.setVisible(visible);
  }

  public updateCatCount(total: number, max: number): void {
    this.header.updateCatCount(total, max);
  }

  public updateStatus(connected: boolean, statusText?: string): void {
    this.header.updateStatus(connected, statusText);
  }

  public updateRoom(roomId: RoomId): void {
    this.header.updateRoom(roomId);
  }

  public refreshProgressionData(): void {
    this.header.refreshProgression();
  }

  public hideAudioUnlockBanner(): void {
    // Banner integrated into Lofi Music Pill
  }

  public showToast(msg: string): void {
    if (this.toastTween) {
      this.toastTween.stop();
      this.toastTween = null;
    }

    this.toastText.setText(msg);
    this.toastContainer.setAlpha(0);
    this.toastContainer.y = 150;

    this.toastTween = this.scene.tweens.add({
      targets: this.toastContainer,
      alpha: 1,
      y: 165,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(3200, () => {
          if (this.toastContainer.active) {
            this.scene.tweens.add({
              targets: this.toastContainer,
              alpha: 0,
              y: 155,
              duration: 250,
            });
          }
        });
      },
    });
  }
}
