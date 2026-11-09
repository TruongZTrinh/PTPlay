import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { RebusScene } from './game/scenes/RebusScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 540,
  height: 960,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#0d131f',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, RebusScene],
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});

