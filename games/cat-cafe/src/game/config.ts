import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CafeScene } from './scenes/CafeScene';
import { UIScene } from './scenes/UIScene';
import { CAFE_CONFIG } from './config/CafeConfig';

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: CAFE_CONFIG.width,
  height: CAFE_CONFIG.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#111827',
  render: {
    pixelArt: false,
    antialias: true,
  },
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: true,
  },
  autoFocus: true,
  scene: [BootScene, CafeScene, UIScene],
};

