import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { QuizShowScene } from './game/scenes/QuizShowScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 540,
  height: 960,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#090314',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, QuizShowScene],
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
