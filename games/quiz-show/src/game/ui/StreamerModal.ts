import Phaser from 'phaser';
import { QuizShowEngine } from '../systems/QuizShowEngine';
import { TTSController } from '../systems/TTSController';
import { AudioEngine } from '../audio/AudioEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { QuizShowMode } from '../types';

export class StreamerModal extends Phaser.GameObjects.Container {
  private engine: QuizShowEngine;
  private tts: TTSController;
  private audio: AudioEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private isModalVisible: boolean = false;

  constructor(
    scene: Phaser.Scene,
    engine: QuizShowEngine,
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

    // Keyboard shortcut 'D' or 'Tab'
    scene.input.keyboard?.on('keydown-D', () => this.toggle());
    scene.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      e.preventDefault();
      this.toggle();
    });

    scene.add.existing(this);
  }

  private createModalUI(): void {
    // Backdrop
    const backdrop = this.scene.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, 540, 960);
    this.add(backdrop);

    // Modal panel
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x180d2b, 0.98);
    panel.fillRoundedRect(30, 100, 480, 760, 16);
    panel.lineStyle(2, 0xa855f7, 1);
    panel.strokeRoundedRect(30, 100, 480, 760, 16);
    this.add(panel);

    // Title
    const title = this.scene.add.text(270, 130, '🛠️ BẢNG ĐIỀU KHIỂN STREAMER (Phím D)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(title);

    // Buttons
    this.createButton(140, 180, '⏩ Bỏ Qua Câu', 0x7c3aed, () => this.engine.skipQuestion());
    this.createButton(380, 180, '🔒 Khóa Đáp Án', 0xef4444, () => this.engine.lockQuestion());
    this.createButton(140, 240, '🏆 Lễ Trao Giải', 0xf59e0b, () => this.engine.triggerCeremony());
    this.createButton(380, 240, '🔄 Vòng Chơi Mới', 0x10b981, () => this.engine.startShow());

    // Modes label
    const modeLabel = this.scene.add.text(270, 310, '--- CHỌN CHẾ ĐỘ CHƠI ---', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#c084fc',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(modeLabel);

    const modes: { label: string; mode: QuizShowMode; x: number; y: number }[] = [
      { label: '⚡ Nhanh 10s', mode: 'quick', x: 140, y: 360 },
      { label: '⚖️ Đúng / Sai', mode: 'true_false', x: 380, y: 360 },
      { label: '⚡ Sấm Sét 8s', mode: 'lightning', x: 140, y: 420 },
      { label: '⚔️ Đội Đỏ / Xanh', mode: 'team', x: 380, y: 420 },
      { label: '👹 Boss Cuối', mode: 'boss', x: 140, y: 480 },
      { label: '📅 Ngày', mode: 'daily', x: 380, y: 480 },
    ];

    modes.forEach((m) => {
      this.createButton(m.x, m.y, m.label, 0x4c1d95, () => {
        this.engine.setMode(m.mode);
        this.engine.skipQuestion();
      });
    });

    // Mock Live Simulation
    const simLabel = this.scene.add.text(270, 550, '--- GIẢ LẬP TƯƠNG TÁC TIKTOK LIVE ---', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(simLabel);

    this.createButton(140, 600, '👤 Test Join Live', 0x0284c7, () => {
      const id = `test_user_${Date.now()}`;
      this.roster.registerOrGet(id, `Khán giả ${Math.floor(Math.random() * 900 + 100)}`);
    });

    this.createButton(380, 600, '📝 Trả Lời A / B', 0x0284c7, () => {
      const players = this.roster.getAllPlayers();
      const p = players[Math.floor(Math.random() * players.length)];
      if (p) {
        this.engine.submitAnswer(p.userId, Math.random() > 0.5 ? 'A' : 'B');
      }
    });

    this.createButton(140, 660, '🌹 Quà Hoa Hồng', 0xbe185d, () => {
      this.giftController.triggerGiftReaction('Rose', 'Khán giả VIP');
    });

    this.createButton(380, 660, '🦁 Quà Lion', 0xb45309, () => {
      this.giftController.triggerGiftReaction('Lion', 'Đại Gia');
    });

    this.createButton(140, 720, '🗣️ Bật/Tắt TTS', 0x059669, () => {
      this.tts.setEnabled(!this.tts.isEnabled);
    });

    this.createButton(380, 720, '🎙️ Thử Giọng MC', 0x2563eb, () => {
      this.tts.testVoice();
    });

    this.createButton(270, 765, '🌌 Quà Universe Vũ Trụ', 0x6d28d9, () => {
      this.giftController.triggerGiftReaction('Universe', 'Top 1 Fan');
    });

    // Close button
    this.createButton(270, 815, '❌ Đóng Bảng Điều Khiển', 0x334155, () => this.toggle());
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

