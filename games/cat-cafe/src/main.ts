import Phaser from 'phaser';
import { phaserGameConfig } from './game/config';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(phaserGameConfig);
  (window as any).__PHASER_GAME__ = game;

  // Prevent Phaser from ever pausing in background or blurred tabs
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

  console.log('🐾 [PTPLAY CAT CAFÉ] Game Initialized (9:16 Portrait Mode) - Background Loop Active');
});

