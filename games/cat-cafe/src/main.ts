import Phaser from 'phaser';
import { phaserGameConfig } from './game/config';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(phaserGameConfig);
  (window as any).__PHASER_GAME__ = game;
  console.log('🐾 [PTPLAY CAT CAFÉ] Game Initialized (9:16 Portrait Mode)');
});

