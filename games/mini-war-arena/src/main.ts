import Phaser from 'phaser';
import './style.css';
import { ArenaScene } from './game/ArenaScene';

const game = new Phaser.Game({
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
  fps: {
    target: 60,
    min: 30,
    forceSetTimeOut: true,
  },
  render: { antialias: true, pixelArt: false },
  scene: [ArenaScene],
});

game.events.off(Phaser.Core.Events.HIDDEN, (game as any).onHidden, game);
game.events.off(Phaser.Core.Events.BLUR, (game as any).onBlur, game);
game.events.on(Phaser.Core.Events.HIDDEN, () => {
  game.isPaused = false;
  if (game.loop) {
    game.loop.resume();
  }
});
game.events.on(Phaser.Core.Events.BLUR, () => {
  game.isPaused = false;
  if (game.loop) {
    game.loop.focus();
  }
});

