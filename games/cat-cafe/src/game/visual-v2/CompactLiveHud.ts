import Phaser from 'phaser';
import { CAFE_TEXTURES } from './CafeVisualAssets';

export interface PromptCallbacks {
  onJoinMock?: () => void;
  onFeedMock?: () => void;
  onPlayMock?: () => void;
  onNapMock?: () => void;
  onLoveMock?: () => void;
  onCallMock?: () => void;
  onPhotoMock?: () => void;
  onGardenMock?: () => void;
  onRoseMock?: () => void;
  onHeartMock?: () => void;
  onUniverseMock?: () => void;
  onLionMock?: () => void;
  onResetMock?: () => void;
}

export interface CompactLiveHudOptions {
  /** Top coordinate of the one-line hint at 540x960. Default 96 to sit right below header. */
  hintY?: number;
  /** Set false to remove even the tiny gift legend for maximum gameplay room. */
  showGiftLegend?: boolean;
  /** Enable only when underlying scene has its own automatic camera scaling. */
  depth?: number;
  /** Optional click callbacks for streamer quick testing. */
  callbacks?: PromptCallbacks;
}

interface CommandDef {
  icon: string;
  word: string;
  meaning: string;
  color: string;
  fn?: () => void;
}

export class CompactLiveHud {
  private readonly scene: Phaser.Scene;
  private readonly options: Required<CompactLiveHudOptions>;
  private readonly root: Phaser.GameObjects.Container;
  private commandGroup: Phaser.GameObjects.Container;
  private giftGroup: Phaser.GameObjects.Container;
  private disposed = false;

  constructor(scene: Phaser.Scene, options: CompactLiveHudOptions = {}) {
    this.scene = scene;
    this.options = {
      hintY: options.hintY ?? 96,
      showGiftLegend: options.showGiftLegend ?? true,
      depth: options.depth ?? 9000,
      callbacks: options.callbacks ?? {},
    };
    this.root = scene.add.container(0, 0)
      .setDepth(this.options.depth)
      .setScrollFactor(0);
    this.commandGroup = scene.add.container(0, 0);
    this.giftGroup = scene.add.container(0, 0);
    this.root.add([this.commandGroup, this.giftGroup]);
    this.layout();
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  public getRoot(): Phaser.GameObjects.Container {
    return this.root;
  }

  private layout(): void {
    if (this.disposed) return;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.commandGroup.removeAll(true);
    this.giftGroup.removeAll(true);

    const ui = Math.max(0.68, Math.min(1.4, width / 540));
    const margin = 8 * ui;
    const inner = width - margin * 2;
    const y = this.options.hintY * (height / 960);
    const barHeight = 28 * ui;

    // 1. Slim Top Command Strip Background (Dark wood with gold trim)
    const background = this.scene.add.graphics();
    background.fillStyle(0x2A1409, 0.92);
    background.fillRoundedRect(margin, y, inner, barHeight, 10 * ui);
    background.lineStyle(Math.max(1, ui * 1.4), 0xD97706, 0.9);
    background.strokeRoundedRect(margin, y, inner, barHeight, 10 * ui);
    this.commandGroup.add(background);

    // 5 Commands with icons matching the revised mockup
    const commands: CommandDef[] = [
      { icon: '💬', word: 'MÈO', meaning: 'Nhận mèo', color: '#C7D2FE', fn: this.options.callbacks.onJoinMock },
      { icon: '🐟', word: 'ĂN', meaning: 'Cho ăn', color: '#FED7AA', fn: this.options.callbacks.onFeedMock },
      { icon: '🧶', word: 'CHƠI', meaning: 'Đùa', color: '#A7F3D0', fn: this.options.callbacks.onPlayMock },
      { icon: '💤', word: 'NGỦ', meaning: 'Nghỉ ngơi', color: '#BAE6FD', fn: this.options.callbacks.onNapMock },
      { icon: '💖', word: 'YÊU', meaning: 'Thả tim', color: '#FBCFE8', fn: this.options.callbacks.onLoveMock },
    ];

    const cellWidth = inner / commands.length;
    commands.forEach((cmd, index) => {
      const cx = margin + (index + 0.5) * cellWidth;
      const cy = y + barHeight / 2;

      const cellContainer = this.scene.add.container(cx, cy);

      // Icon + Word + Meaning (e.g. "💬 MÈO Nhận mèo")
      const text = this.scene.add.text(0, 0,
        `${cmd.icon} ${cmd.word} ${cmd.meaning}`,
        {
          fontFamily: "'Segoe UI Emoji', 'Segoe UI', 'Baloo 2', sans-serif",
          fontSize: `${Math.round(10.5 * ui)}px`,
          color: cmd.color,
          fontStyle: 'bold',
          align: 'center',
        }
      ).setOrigin(0.5);
      cellContainer.add(text);

      // Interactive hit area for quick testing
      const hitArea = this.scene.add.rectangle(0, 0, cellWidth - 4, barHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        cellContainer.setScale(0.92);
        if (cmd.fn) cmd.fn();
      });
      hitArea.on('pointerup', () => cellContainer.setScale(1.0));
      hitArea.on('pointerout', () => cellContainer.setScale(1.0));
      cellContainer.add(hitArea);

      this.commandGroup.add(cellContainer);

      // Subtle vertical divider between commands
      if (index < commands.length - 1) {
        const divX = margin + (index + 1) * cellWidth;
        const divLine = this.scene.add.line(divX, cy, 0, -8 * ui, 0, 8 * ui, 0x78350F, 0.6);
        this.commandGroup.add(divLine);
      }
    });

    if (!this.options.showGiftLegend) return;

    // 2. Sleek Bottom Gift Rail (Matching revised 1080x1920 mockup)
    const railHeight = 32 * ui;
    const railY = height - railHeight - 6 * ui;

    const rail = this.scene.add.graphics();
    rail.fillStyle(0x2A1409, 0.90);
    rail.fillRoundedRect(margin, railY, inner, railHeight, 10 * ui);
    rail.lineStyle(Math.max(1, ui * 1.2), 0xD97706, 0.88);
    rail.strokeRoundedRect(margin, railY, inner, railHeight, 10 * ui);
    this.giftGroup.add(rail);

    // Left Gift Title
    const titleX = margin + 12 * ui;
    const titleY = railY + railHeight / 2;
    const title = this.scene.add.text(titleX, titleY, '🎁 Quà tặng\n    đặc biệt:', {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: `${Math.round(8.5 * ui)}px`,
      color: '#FEF3C7',
      fontStyle: 'bold',
      lineSpacing: -2,
    }).setOrigin(0, 0.5);
    this.giftGroup.add(title);

    // Circular Illustrated Gift Badges: Rose, Cá nướng, Heart, Universe, Lion, Cake
    const giftItems: ReadonlyArray<{ key: string; label: string; fn?: () => void }> = [
      { key: CAFE_TEXTURES.rose, label: 'Rose', fn: this.options.callbacks.onRoseMock },
      { key: CAFE_TEXTURES.grilledFish, label: 'Cá nướng', fn: this.options.callbacks.onRoseMock },
      { key: CAFE_TEXTURES.heart, label: 'Heart', fn: this.options.callbacks.onHeartMock || this.options.callbacks.onLoveMock },
      { key: CAFE_TEXTURES.universe, label: 'Universe', fn: this.options.callbacks.onUniverseMock },
      { key: 'cafe-gift:lion', label: 'Lion', fn: this.options.callbacks.onLionMock },
      { key: CAFE_TEXTURES.cake, label: 'Cake', fn: this.options.callbacks.onFeedMock },
    ];

    const badgesStartX = titleX + 72 * ui;
    const availableW = inner - (badgesStartX - margin);
    const badgeStep = availableW / giftItems.length;

    giftItems.forEach((gift, idx) => {
      const bx = badgesStartX + (idx + 0.5) * badgeStep;
      const by = railY + railHeight / 2 - (gift.label ? 4 * ui : 0);

      // Gold badge circular rim
      const ring = this.scene.add.circle(bx, by, 11 * ui, 0x451A03, 0.9);
      ring.setStrokeStyle(1.2 * ui, 0xF59E0B, 0.9);
      this.giftGroup.add(ring);

      // Transparent PNG Gift Icon
      if (this.scene.textures.exists(gift.key)) {
        const icon = this.scene.add.image(bx, by, gift.key);
        icon.setDisplaySize(18 * ui, 18 * ui);
        this.giftGroup.add(icon);

        if (gift.fn) {
          icon.setInteractive({ useHandCursor: true });
          icon.on('pointerdown', () => {
            if (gift.fn) gift.fn();
          });
        }
      }

      // Label under badge
      if (gift.label) {
        const lbl = this.scene.add.text(bx, by + 13 * ui, gift.label, {
          fontFamily: "'Segoe UI', sans-serif",
          fontSize: `${Math.round(8 * ui)}px`,
          color: '#FDE68A',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0.5);
        this.giftGroup.add(lbl);
      }
    });
  }

  public destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.root.destroy(true);
  }
}
