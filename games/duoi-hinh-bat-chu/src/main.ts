import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { RebusScene } from './game/scenes/RebusScene';

const origFactoryText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  this: Phaser.GameObjects.GameObjectFactory,
  x: number,
  y: number,
  text: string | string[],
  style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const mergedStyle = style?.resolution ? style : { ...style, resolution: 2 };
  return origFactoryText.call(this, x, y, text, mergedStyle);
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1080,
  height: 1920,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#0d131f',
  render: {
    antialias: true,
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  },
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

