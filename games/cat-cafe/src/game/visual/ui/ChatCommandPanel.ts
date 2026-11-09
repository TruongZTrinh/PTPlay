import Phaser from 'phaser';
import { CAFE_VISUAL_CONFIG } from '../CafeVisualConfig';
import { PromptCallbacks } from '../../ui/ChatPrompt';

export class ChatCommandPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  private peekabooCat!: Phaser.GameObjects.Image;
  private cardBgImage!: Phaser.GameObjects.Image;
  private giftBannerImage!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, callbacks?: PromptCallbacks) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(2000);

    this.createPanel(callbacks);
  }

  private createPanel(cb?: PromptCallbacks): void {
    const { width } = CAFE_VISUAL_CONFIG.resolution;

    // 1. Peekaboo Cute Cat Head (Peeking over top rim of command card)
    this.peekabooCat = this.scene.add.image(width / 2, 764, 'peekaboo_cat_v2');
    this.peekabooCat.setOrigin(0.5, 0.5);
    this.container.add(this.peekabooCat);

    // Subtle gentle head bob on peekaboo cat
    this.scene.tweens.add({
      targets: this.peekabooCat,
      y: { from: 764, to: 761 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Ornate Parchment Scroll Command Card Background
    this.cardBgImage = this.scene.add.image(width / 2, 842, 'command_card_bg_v2');
    this.cardBgImage.setOrigin(0.5, 0.5);
    this.container.add(this.cardBgImage);

    // 3. Card Header Title
    const title = this.scene.add.text(width / 2, 788, '💬 Hướng Dẫn Bình Luận (Có Dấu Hoặc Không Dấu)', {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: '13.5px',
      fontStyle: 'bold',
      color: '#3B1D0C',
      align: 'center',
    });
    title.setOrigin(0.5, 0.5);
    this.container.add(title);

    // Subtitle Note
    const subtitle = this.scene.add.text(
      width / 2,
      805,
      '⭐ Gõ chữ hoa, thường hoặc không dấu đều nhận: mèo, meo, ăn, an, chơi, choi...',
      {
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#78350F',
        align: 'center',
      }
    );
    subtitle.setOrigin(0.5, 0.5);
    this.container.add(subtitle);

    // 4. Five Main Command Action Badges / Buttons (As in mockup!)
    const actionDefs = [
      {
        name: 'MÈO',
        icon: '🐾',
        sub: 'Nhận nuôi mèo',
        bgCol: 0x6366F1, // Indigo
        borderCol: 0x4338CA,
        fn: cb?.onJoinMock,
      },
      {
        name: 'ĂN',
        icon: '🐟',
        sub: 'Cho mèo ăn cá',
        bgCol: 0xEA580C, // Warm Orange
        borderCol: 0xC2410C,
        fn: cb?.onFeedMock,
      },
      {
        name: 'CHƠI',
        icon: '🧶',
        sub: 'Đùa nghịch',
        bgCol: 0x10B981, // Emerald Green
        borderCol: 0x047857,
        fn: cb?.onPlayMock,
      },
      {
        name: 'NGỦ',
        icon: '💤',
        sub: 'Cho mèo ngủ',
        bgCol: 0x0284C7, // Sky Blue
        borderCol: 0x0369A1,
        fn: cb?.onNapMock,
      },
      {
        name: 'YÊU',
        icon: '💖',
        sub: 'Thả tim cho mèo',
        bgCol: 0xEC4899, // Rose Pink
        borderCol: 0xBE185D,
        fn: cb?.onLoveMock,
      },
    ];

    const startX = 27;
    const btnW = 94;
    const btnH = 52;
    const spacing = 5.5;
    const btnY = 822;

    for (let i = 0; i < actionDefs.length; i++) {
      const def = actionDefs[i];
      const x = startX + i * (btnW + spacing);

      const btnContainer = this.scene.add.container(x, btnY);

      // Button Background with Rounded Frame
      const bg = this.scene.add.graphics();
      bg.fillStyle(def.bgCol, 0.95);
      bg.fillRoundedRect(0, 0, btnW, btnH, 12);
      bg.lineStyle(1.8, 0xFFFFFF, 0.9);
      bg.strokeRoundedRect(0, 0, btnW, btnH, 12);
      btnContainer.add(bg);

      // Upper Line: Icon + Command Name
      const label = this.scene.add.text(btnW / 2, 17, `${def.icon} ${def.name}`, {
        fontFamily: "'Segoe UI Emoji', 'Segoe UI', 'Baloo 2', sans-serif",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#FFFFFF',
        align: 'center',
      });
      label.setOrigin(0.5, 0.5);
      btnContainer.add(label);

      // Lower Line: Description Subtitle
      const sub = this.scene.add.text(btnW / 2, 36, def.sub, {
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: '9.5px',
        fontStyle: 'bold',
        color: '#FEF3C7',
        align: 'center',
      });
      sub.setOrigin(0.5, 0.5);
      btnContainer.add(sub);

      // Interactive Click Handling
      bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, btnW, btnH), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerdown', () => {
        btnContainer.setScale(0.94);
        if (def.fn) def.fn();
      });
      bg.on('pointerup', () => {
        btnContainer.setScale(1.0);
      });
      bg.on('pointerout', () => {
        btnContainer.setScale(1.0);
      });

      this.container.add(btnContainer);
    }

    // 5. Bottom Special Gifts Strip (y: 934)
    this.giftBannerImage = this.scene.add.image(width / 2, 934, 'gift_banner_v2');
    this.giftBannerImage.setOrigin(0.5, 0.5);
    this.container.add(this.giftBannerImage);

    // Interactive click on gifts strip to simulate Rose gift
    this.giftBannerImage.setInteractive();
    this.giftBannerImage.on('pointerdown', () => {
      if (cb?.onRoseMock) cb.onRoseMock();
    });
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
