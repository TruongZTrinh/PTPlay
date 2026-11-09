import Phaser from 'phaser';
import './style.css';
import { ArenaScene } from './game/ArenaScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#06132a',
  width: 720,
  height: 1280,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  render: { antialias: true, pixelArt: false },
  scene: [ArenaScene],
});
