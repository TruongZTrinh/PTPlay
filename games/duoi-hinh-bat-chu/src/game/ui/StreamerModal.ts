import Phaser from 'phaser';
import { RebusEngine } from '../systems/RebusEngine';
import { TTSController } from '../systems/TTSController';
import { AudioEngine } from '../audio/AudioEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { RebusMode } from '../types';

export class StreamerModal extends Phaser.GameObjects.Container {
  private engine: RebusEngine;
  private tts: TTSController;
  private audio: AudioEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private isModalVisible: boolean = false;

  constructor(
    scene: Phaser.Scene,
    engine: RebusEngine,
    tts: TTSController,
    audio: AudioEngine,
    roster: StudentRoster,
    giftController: GiftReactionController
  ) {
    super(scene, 0, 0);
    this.engine = engine;
    this.tts = tts;
    this.audio = audio;
    this.roster = roster;
    this.giftController = giftController;

    this.createModalUI();
    this.setVisible(false);
    this.setDepth(200);

    scene.input.keyboard?.on('keydown-D', () => this.toggle());
    scene.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.toggle();
    });

    scene.add.existing(this);
  }

  private createModalUI(): void {
    const backdrop = this.scene.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, 540, 960);
    this.add(backdrop);

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0f172a, 0.98);
    panel.fillRoundedRect(30, 100, 480, 760, 16);
    panel.lineStyle(2, 0xf59e0b, 1);
    panel.strokeRoundedRect(30, 100, 480, 760, 16);
    this.add(panel);

    const title = this.scene.add.text(270, 130, '🛠️ ĐUỔI HÌNH BẮT CHỮ — ĐIỀU KHIỂN (Phím D)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(title);

    // Buttons
    this.createButton(140, 180, '⏩ Đổi Câu Đố', 0x0284c7, () => this.engine.skipPuzzle());
    this.createButton(380, 180, '💡 Mở Gợi Ý 1', 0xf59e0b, () => this.engine.triggerHint1());
    this.createButton(140, 240, '🔤 Mở Chữ Đầu (H2)', 0x10b981, () => this.engine.triggerHint2());
    this.createButton(380, 240, '🏆 Lễ Trao Giải', 0x8b5cf6, () => this.engine.triggerCeremony());

    // Modes label
    const modeLabel = this.scene.add.text(270, 310, '--- CHỌN CHẾ ĐỘ CHƠI ---', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(modeLabel);

    const modes: { label: string; mode: RebusMode; x: number; y: number }[] = [
      { label: '🧩 Ghép Từ', mode: 'word', x: 140, y: 360 },
      { label: '📜 Thành Ngữ', mode: 'idiom', x: 380, y: 360 },
      { label: '⚡ Đoán Nhanh 8s', mode: 'speed8', x: 140, y: 420 },
      { label: '⚔️ Đua Điểm Đội', mode: 'team_race', x: 380, y: 420 },
      { label: '👹 Boss Puzzle', mode: 'boss', x: 140, y: 480 },
      { label: '🔗 Chuỗi 5 Câu', mode: 'chain', x: 380, y: 480 },
    ];

    modes.forEach((m) => {
      this.createButton(m.x, m.y, m.label, 0x1e293b, () => {
        this.engine.setMode(m.mode);
        this.engine.skipPuzzle();
      });
    });

    // Mock Live Simulation
    const simLabel = this.scene.add.text(270, 550, '--- GIẢ LẬP TƯƠNG TÁC TIKTOK LIVE ---', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#f59e0b',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(simLabel);

    this.createButton(140, 600, '👤 Test Join Live', 0x0284c7, () => {
      const id = `test_user_${Date.now()}`;
      this.roster.registerOrGet(id, `Thám tử ${Math.floor(Math.random() * 900 + 100)}`);
    });

    this.createButton(380, 600, '🎯 Đoán Đúng Đáp Án', 0x10b981, () => {
      if (this.engine.currentPuzzle) {
        const players = this.roster.getAllPlayers();
        const p = players[Math.floor(Math.random() * players.length)];
        if (p) {
          this.engine.submitGuess(p.userId, this.engine.currentPuzzle.answer);
        }
      }
    });

    this.createButton(140, 660, '🌹 Quà Hoa Hồng', 0xbe185d, () => {
      this.giftController.triggerGiftReaction('Rose', 'Khán giả VIP');
    });

    this.createButton(380, 660, '🦁 Quà Lion', 0xb45309, () => {
      this.giftController.triggerGiftReaction('Lion', 'Đại Gia');
    });

    this.createButton(270, 720, '🌌 Quà Universe Vũ Trụ', 0x6d28d9, () => {
      this.giftController.triggerGiftReaction('Universe', 'Top 1 Fan');
    });

    this.createButton(270, 800, '❌ Đóng Bảng Điều Khiển', 0x334155, () => this.toggle());
  }

  private createButton(x: number, y: number, text: string, color: number, onClick: () => void): void {
    const btnContainer = this.scene.add.container(x, y);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(-100, -22, 200, 44, 10);
    btnContainer.add(btnBg);

    const btnText = this.scene.add.text(0, 0, text, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btnContainer.add(btnText);

    btnContainer.setSize(200, 44);
    btnContainer.setInteractive({ useHandCursor: true });
    btnContainer.on('pointerdown', onClick);

    this.add(btnContainer);
  }

  public toggle(): void {
    this.isModalVisible = !this.isModalVisible;
    this.setVisible(this.isModalVisible);
  }
}
