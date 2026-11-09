import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene.js';
import { EnglishClassScene } from './game/scenes/EnglishClassScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 540,
  height: 960,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [BootScene, EnglishClassScene],
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);
  (window as any).__PTPLAY_GAME__ = game;
});
