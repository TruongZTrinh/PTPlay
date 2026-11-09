import Phaser from 'phaser';
import { CompactLiveHud, PromptCallbacks } from '../visual-v2';

export type { PromptCallbacks };

export class ChatPrompt {
  private hud: CompactLiveHud;

  constructor(scene: Phaser.Scene, callbacks?: PromptCallbacks) {
    // Replaces the large bottom parchment card with the slim top command strip and sleek bottom gift rail
    this.hud = new CompactLiveHud(scene, {
      hintY: 96,
      showGiftLegend: true,
      callbacks,
    });
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.hud.getRoot();
  }

  public destroy(): void {
    this.hud.destroy();
  }
}
