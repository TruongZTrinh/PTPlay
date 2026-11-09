import Phaser from 'phaser';
import { Answer, QuizQuestion } from '../types.js';

export class QuestionBoard {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;

  private headerPillBg: Phaser.GameObjects.Graphics;
  private headerText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private promptViText: Phaser.GameObjects.Text;
  private timerBarBg: Phaser.GameObjects.Graphics;
  private timerBarFill: Phaser.GameObjects.Graphics;
  private timerNumText: Phaser.GameObjects.Text;

  private choicesGroup: Phaser.GameObjects.Container;
  private choiceBoxes: Map<
    Answer,
    {
      container: Phaser.GameObjects.Container;
      bg: Phaser.GameObjects.Graphics;
      badgeBg: Phaser.GameObjects.Graphics;
      letterBadge: Phaser.GameObjects.Text;
      answerText: Phaser.GameObjects.Text;
      highlightTween: Phaser.Tweens.Tween | null;
    }
  > = new Map();

  private explanationContainer: Phaser.GameObjects.Container;
  private explanationText: Phaser.GameObjects.Text;

  // Board dimensions precisely matched to anime wall chalkboard
  public static readonly BOARD_X = 349;
  public static readonly BOARD_Y = 326;
  public static readonly BOARD_W = 276;
  public static readonly BOARD_H = 176;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add
      .container(QuestionBoard.BOARD_X, QuestionBoard.BOARD_Y)
      .setDepth(10);

    // 1. Header Pill (Round & Mode)
    this.headerPillBg = scene.add.graphics();
    this.headerPillBg.fillStyle(0x0f172a, 0.85);
    this.headerPillBg.fillRoundedRect(-85, -78, 170, 18, 9);
    this.headerPillBg.lineStyle(1, 0xfacc15, 0.7);
    this.headerPillBg.strokeRoundedRect(-85, -78, 170, 18, 9);
    this.container.add(this.headerPillBg);

    this.headerText = scene.add
      .text(0, -69, 'LỚP HỌC VUI • QUICK QUIZ', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#fef08a',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.headerText);

    // 2. English Prompt Text (High Contrast & Clear Typography)
    this.promptText = scene.add
      .text(0, -42, 'Đang chuẩn bị câu hỏi...', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 255, useAdvancedWrap: true },
        stroke: '#0f172a',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.promptText);

    // 3. Vietnamese Subtitle / Translation
    this.promptViText = scene.add
      .text(0, -18, '', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '10px',
        color: '#93c5fd',
        align: 'center',
        wordWrap: { width: 255 },
        stroke: '#0f172a',
        strokeThickness: 1.5,
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.promptViText);

    // 4. Countdown Timer Bar
    this.timerBarBg = scene.add.graphics();
    this.timerBarFill = scene.add.graphics();
    this.timerNumText = scene.add
      .text(128, -2, '12s', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#facc15',
        stroke: '#0f172a',
        strokeThickness: 1.5,
      })
      .setOrigin(1, 0.5);

    this.container.add([this.timerBarBg, this.timerBarFill, this.timerNumText]);
    this.drawTimerBar(1.0, 12);

    // 5. Container for 4 Choice Buttons
    this.choicesGroup = scene.add.container(0, 0);
    this.container.add(this.choicesGroup);

    const choicePositions: Record<
      Answer,
      { x: number; y: number; colorHex: number; label: string }
    > = {
      A: { x: -64, y: 24, colorHex: 0xef4444, label: 'A' },
      B: { x: 64, y: 24, colorHex: 0x0284c7, label: 'B' },
      C: { x: -64, y: 58, colorHex: 0xd97706, label: 'C' },
      D: { x: 64, y: 58, colorHex: 0x7c3aed, label: 'D' },
    };

    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const pos = choicePositions[letter];
      const boxContainer = scene.add.container(pos.x, pos.y);

      // Button background card
      const bg = scene.add.graphics();
      bg.fillStyle(0x0f172a, 0.88);
      bg.fillRoundedRect(-60, -14, 120, 28, 6);
      bg.lineStyle(1.5, pos.colorHex, 0.9);
      bg.strokeRoundedRect(-60, -14, 120, 28, 6);

      // Colored letter badge pill
      const badgeBg = scene.add.graphics();
      badgeBg.fillStyle(pos.colorHex, 1);
      badgeBg.fillRoundedRect(-54, -10, 20, 20, 4);

      // White bold letter
      const letterBadge = scene.add
        .text(-44, 0, pos.label, {
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0.5);

      // Answer text
      const answerText = scene.add
        .text(-28, 0, '', {
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#f8fafc',
          wordWrap: { width: 84 },
        })
        .setOrigin(0, 0.5);

      boxContainer.add([bg, badgeBg, letterBadge, answerText]);
      this.choicesGroup.add(boxContainer);

      this.choiceBoxes.set(letter, {
        container: boxContainer,
        bg,
        badgeBg,
        letterBadge,
        answerText,
        highlightTween: null,
      });
    });

    // 6. Explanation Banner (reveals smoothly during answer reveal phase)
    this.explanationContainer = scene.add.container(0, 41);
    const explBg = scene.add.graphics();
    explBg.fillStyle(0x022c22, 0.96);
    explBg.fillRoundedRect(-130, -32, 260, 64, 8);
    explBg.lineStyle(2, 0x10b981, 1);
    explBg.strokeRoundedRect(-130, -32, 260, 64, 8);

    this.explanationText = scene.add
      .text(0, 0, '', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ecfdf5',
        align: 'center',
        wordWrap: { width: 245 },
      })
      .setOrigin(0.5, 0.5);

    this.explanationContainer.add([explBg, this.explanationText]);
    this.explanationContainer.setVisible(false);
    this.container.add(this.explanationContainer);
  }

  public showQuestion(q: QuizQuestion, roundNum = 1): void {
    // Hide explanation and restore choices
    this.explanationContainer.setVisible(false);
    this.choicesGroup.setVisible(true);

    this.headerText.setText(`CÂU ${roundNum}/10 • ${q.mode.toUpperCase()} QUIZ`);
    this.promptText.setText(q.prompt);
    this.promptViText.setText(q.promptVi || '');

    // Reset choices visual state
    const colors: Record<Answer, number> = {
      A: 0xef4444,
      B: 0x0284c7,
      C: 0xd97706,
      D: 0x7c3aed,
    };

    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const box = this.choiceBoxes.get(letter);
      if (box) {
        box.container.setVisible(true);
        box.container.setAlpha(1);
        box.container.setScale(1);
        box.answerText.setText(q.choices[letter] || '');
        if (box.highlightTween) {
          box.highlightTween.stop();
          box.highlightTween = null;
        }

        // Redraw crisp standard card
        box.bg.clear();
        box.bg.fillStyle(0x0f172a, 0.88);
        box.bg.fillRoundedRect(-60, -14, 120, 28, 6);
        box.bg.lineStyle(1.5, colors[letter], 0.9);
        box.bg.strokeRoundedRect(-60, -14, 120, 28, 6);
      }
    });
  }

  public drawTimerBar(progress: number, secondsRemaining: number): void {
    const barW = 250;
    const barH = 4;
    const x = -125;
    const y = -4;

    this.timerBarBg.clear();
    this.timerBarBg.fillStyle(0x1e293b, 0.8);
    this.timerBarBg.fillRoundedRect(x, y, barW, barH, 2);

    this.timerBarFill.clear();
    // Smooth transition from emerald green -> yellow -> crimson
    const color = progress > 0.5 ? 0x10b981 : progress > 0.25 ? 0xfacc15 : 0xef4444;
    this.timerBarFill.fillStyle(color, 1);
    this.timerBarFill.fillRoundedRect(x, y, Math.max(0, barW * progress), barH, 2);

    this.timerNumText.setText(`${secondsRemaining}s`);
    this.timerNumText.setColor(progress > 0.25 ? '#facc15' : '#ef4444');
  }

  public revealCorrectAnswer(correct: Answer, explanation: string, fastestNickname?: string): void {
    // 1. Highlight correct choice and dim incorrect ones
    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const box = this.choiceBoxes.get(letter);
      if (!box) return;

      if (letter === correct) {
        box.bg.clear();
        box.bg.fillStyle(0x065f46, 0.95);
        box.bg.fillRoundedRect(-60, -14, 120, 28, 6);
        box.bg.lineStyle(2.5, 0x34d399, 1);
        box.bg.strokeRoundedRect(-60, -14, 120, 28, 6);

        box.highlightTween = this.scene.tweens.add({
          targets: box.container,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 250,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
        });
      } else {
        // Dim wrong choices subtly
        this.scene.tweens.add({
          targets: box.container,
          alpha: 0.25,
          duration: 250,
        });
      }
    });

    // 2. Smoothly show explanation banner
    let text = `✓ ĐÁP ÁN: ${correct} — ${explanation}`;
    if (fastestNickname) {
      text += `\n⚡ Nhanh nhất: ${fastestNickname}`;
    }
    this.explanationText.setText(text);
    this.explanationContainer.setVisible(true);
    this.explanationContainer.setScale(0.85);
    this.explanationContainer.setAlpha(0);

    this.scene.tweens.add({
      targets: this.explanationContainer,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
    });
  }
}
