import Phaser from 'phaser';
import { ProceduralTextures } from '../art/ProceduralTextures';
import { CAFE_CONFIG } from '../config/CafeConfig';
import { CafeAssetLoader } from '../visual/CafeAssetLoader';
import { preloadCafeVisualAssets } from '../visual-v2';
import { preloadCafeMoeAssets } from '../cafe-moe-v3';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    const { width, height } = CAFE_CONFIG;

    // Cozy warm loading background
    const bg = this.add.graphics();
    bg.fillStyle(0x2a1409, 1);
    bg.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 40, 'CAFÉ MÒE 🐾', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = this.add.text(width / 2, height / 2, 'PTPlay Studio • Đang tải đồ hoạ cao cấp...', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#FDE68A',
    });
    subtitle.setOrigin(0.5, 0.5);

    // Progress bar
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x3d2112, 0.9);
    progressBox.fillRoundedRect(width / 2 - 120, height / 2 + 30, 240, 16, 8);

    const progressBar = this.add.graphics();
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xF59E0B, 1);
      progressBar.fillRoundedRect(width / 2 - 118, height / 2 + 32, 236 * value, 12, 6);
    });

    // Load V2 Art Assets & V3 247 Transparent PNG Assets
    CafeAssetLoader.preload(this);
    preloadCafeVisualAssets(this);
    preloadCafeMoeAssets(this);
  }

  public create(): void {
    // Generate fallback textures if any
    ProceduralTextures.generateAll(this);

    // Launch Game Scene and UI Scene in parallel
    this.time.delayedCall(200, () => {
      this.scene.start('CafeScene');
      this.scene.start('UIScene');
    });
  }
}
