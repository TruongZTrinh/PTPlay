import Phaser from 'phaser';
import { ChoiceLetter, QuestionData } from '../types';

export class QuestionBoard extends Phaser.GameObjects.Container {
  private cardBg: Phaser.GameObjects.Graphics;
  private roundText: Phaser.GameObjects.Text;
  private categoryText: Phaser.GameObjects.Text;
  private timerBar: Phaser.GameObjects.Graphics;
  private timerText: Phaser.GameObjects.Text;
  private questionText: Phaser.GameObjects.Text;

  private optionCards: Map<ChoiceLetter, {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    letterText: Phaser.GameObjects.Text;
    label: Phaser.GameObjects.Text;
  }> = new Map();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.cardBg = scene.add.graphics();
    this.add(this.cardBg);

    // Round badge
    this.roundText = scene.add.text(80, 95, 'Câu 1/10', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.roundText);

    // Category badge
    this.categoryText = scene.add.text(270, 95, '🌟 Thiên Nhiên', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#a78bfa',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.categoryText);

    // Timer text
    this.timerText = scene.add.text(460, 95, '⏱ 12s', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.timerText);

    // Timer Progress bar
    this.timerBar = scene.add.graphics();
    this.add(this.timerBar);

    // Question Text
    this.questionText = scene.add.text(270, 160, 'Đang chuẩn bị câu hỏi...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 440, useAdvancedWrap: true },
    }).setOrigin(0.5);
    this.add(this.questionText);

    this.createOptionCards();
    this.drawBoardBackground();

    scene.add.existing(this);
    this.setDepth(60);
  }

  private drawBoardBackground(): void {
    this.cardBg.clear();
    // Card main body
    this.cardBg.fillStyle(0x130b24, 0.92);
    this.cardBg.fillRoundedRect(30, 80, 480, 290, 20);
    this.cardBg.lineStyle(2, 0x8b5cf6, 0.9);
    this.cardBg.strokeRoundedRect(30, 80, 480, 290, 20);
  }

  private createOptionCards(): void {
    const letters: ChoiceLetter[] = ['A', 'B', 'C', 'D'];
    const positions = [
      { x: 145, y: 245 }, // A (Top Left)
      { x: 395, y: 245 }, // B (Top Right)
      { x: 145, y: 320 }, // C (Bottom Left)
      { x: 395, y: 320 }, // D (Bottom Right)
    ];

    letters.forEach((letter, idx) => {
      const pos = positions[idx];
      const container = this.scene.add.container(pos.x, pos.y);

      const bg = this.scene.add.graphics();
      container.add(bg);

      // Letter circle
      const letterBg = this.scene.add.graphics();
      letterBg.fillStyle(0x7c3aed, 1);
      letterBg.fillCircle(-85, 0, 15);
      container.add(letterBg);

      const letterText = this.scene.add.text(-85, 0, letter, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(letterText);

      // Answer label text
      const label = this.scene.add.text(-60, 0, 'Đáp án...', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#f1f5f9',
        fontStyle: 'bold',
        wordWrap: { width: 160 },
      }).setOrigin(0, 0.5);
      container.add(label);

      this.optionCards.set(letter, { container, bg, letterText, label });
      this.drawOptionCard(letter, 'normal');
      this.add(container);
    });
  }

  private drawOptionCard(letter: ChoiceLetter, state: 'normal' | 'locked' | 'correct' | 'wrong'): void {
    const card = this.optionCards.get(letter);
    if (!card) return;

    card.bg.clear();
    let fillColor = 0x241442;
    let strokeColor = 0x6d28d9;
    let strokeWidth = 1.5;

    if (state === 'locked') {
      fillColor = 0x3b1d6e;
      strokeColor = 0xfacc15;
      strokeWidth = 2;
    } else if (state === 'correct') {
      fillColor = 0x064e3b;
      strokeColor = 0x10b981;
      strokeWidth = 2.5;
    } else if (state === 'wrong') {
      fillColor = 0x221326;
      strokeColor = 0x475569;
      strokeWidth = 1;
    }

    card.bg.fillStyle(fillColor, 0.95);
    card.bg.fillRoundedRect(-110, -26, 220, 52, 14);
    card.bg.lineStyle(strokeWidth, strokeColor, 1);
    card.bg.strokeRoundedRect(-110, -26, 220, 52, 14);
  }

  public setQuestion(q: QuestionData, round: number, totalRounds: number): void {
    this.roundText.setText(`Câu ${round}/${totalRounds}`);
    this.categoryText.setText(`🌟 ${q.category}`);
    this.questionText.setText(q.question);
    this.timerText.setText(`⏱ ${q.durationSec || 12}s`);

    const letters: ChoiceLetter[] = ['A', 'B', 'C', 'D'];
    letters.forEach((l) => {
      const card = this.optionCards.get(l);
      if (card) {
        card.label.setText(q.options[l] || '');
        this.drawOptionCard(l, 'normal');
      }
    });

    this.updateTimer(q.durationSec || 12, q.durationSec || 12);
  }

  public updateTimer(remainingSec: number, totalSec: number): void {
    this.timerText.setText(`⏱ ${remainingSec}s`);
    const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));

    this.timerBar.clear();
    this.timerBar.fillStyle(0x331b57, 0.7);
    this.timerBar.fillRoundedRect(50, 115, 440, 6, 3);

    const barColor = ratio > 0.3 ? 0x38bdf8 : 0xef4444;
    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRoundedRect(50, 115, 440 * ratio, 6, 3);
  }

  public lockQuestion(): void {
    this.timerText.setText('🔒 ĐÃ KHÓA');
  }

  public revealCorrectAnswer(correctLetter: ChoiceLetter): void {
    const letters: ChoiceLetter[] = ['A', 'B', 'C', 'D'];
    letters.forEach((l) => {
      if (l === correctLetter) {
        this.drawOptionCard(l, 'correct');
        const card = this.optionCards.get(l);
        if (card) {
          this.scene.tweens.add({
            targets: card.container,
            scale: 1.05,
            duration: 200,
            yoyo: true,
            repeat: 2,
          });
        }
      } else {
        this.drawOptionCard(l, 'wrong');
      }
    });
  }
}
