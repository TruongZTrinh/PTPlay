import Phaser from 'phaser';
import logoUrl from '../assets/ptplay-avatar.png';
import { TextureGenerator } from './textures/TextureGenerator';
import { BattleManager } from './systems/BattleManager';

export class ArenaScene extends Phaser.Scene {
  private battleManager!: BattleManager;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  preload(): void {
    this.load.image('ptplay-logo', logoUrl);
  }

  create(): void {
    // 1. Generate 2D cartoon textures & environment decorations
    TextureGenerator.generateAll(this);

    // 2. Initialize Battle Manager & subsystems
    this.battleManager = new BattleManager(this);
    this.battleManager.init();

    // 3. Register keyboard shortcuts
    this.registerHotkeys();

    // 4. Clean shutdown handler
    this.events.on('shutdown', () => {
      this.battleManager.destroy();
    });
  }

  private registerHotkeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    // Direct summon shortcuts
    kb.on('keydown-R', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_unit',
        team: 'red',
        unitType: 'warrior',
        count: 2,
        timestamp: Date.now(),
      });
    });

    kb.on('keydown-B', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_unit',
        team: 'blue',
        unitType: 'warrior',
        count: 2,
        timestamp: Date.now(),
      });
    });

    kb.on('keydown-A', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_unit',
        team: 'red',
        unitType: 'archer',
        count: 2,
        timestamp: Date.now(),
      });
    });

    kb.on('keydown-S', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_unit',
        team: 'blue',
        unitType: 'archer',
        count: 2,
        timestamp: Date.now(),
      });
    });

    kb.on('keydown-Z', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_boss',
        team: 'red',
        timestamp: Date.now(),
      });
    });

    kb.on('keydown-X', () => {
      this.battleManager.handleIncomingCommand({
        id: `kb_${Date.now()}`,
        action: 'spawn_boss',
        team: 'blue',
        timestamp: Date.now(),
      });
    });

    // Control shortcuts
    kb.on('keydown-P', () => this.battleManager.togglePause());

    kb.on('keydown-SPACE', () => {
      if (this.battleManager.roundManager.phase === 'ATTRACT') {
        this.battleManager.audio.unlock();
        this.battleManager.ui.clearAllOverlays();
        this.battleManager.startRound(false);
      } else {
        this.battleManager.togglePause();
      }
    });

    kb.on('keydown-N', () => this.battleManager.startRound(true));

    kb.on('keydown-M', () => {
      const active = this.battleManager.audio.toggle();
      this.battleManager.ui.showAnnouncement(active ? '♫ ÂM THANH: BẬT' : '♪ ÂM THANH: TẮT');
    });

    // Cycle Arena Environment
    kb.on('keydown-T', () => {
      const nextTheme = this.battleManager.roundManager.rotateTheme();
      this.battleManager.ui.drawBackground(nextTheme);
      this.battleManager.ui.drawBattlefield(nextTheme);
      this.battleManager.effects.setupAmbientParticles(nextTheme);
      this.battleManager.ui.showAnnouncement(`ĐỔI SÂN: ${nextTheme.vietnameseName.toUpperCase()}`);
    });

    // Quality FX preset toggle
    kb.on('keydown-Q', () => {
      const eff = this.battleManager.effects;
      eff.quality = eff.quality === 'high' ? 'low' : 'high';
      eff.setupAmbientParticles(this.battleManager.roundManager.getThemeDef());
      this.battleManager.ui.showAnnouncement(`HIỆU ỨNG: ${eff.quality.toUpperCase()}`);
    });
  }

  update(time: number, delta: number): void {
    this.battleManager.update(time, delta);
  }
}
