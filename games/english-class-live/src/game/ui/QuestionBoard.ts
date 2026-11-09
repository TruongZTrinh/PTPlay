import Phaser from 'phaser';
import { Answer, QuizQuestion } from '../types.js';

export class QuestionBoard {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;

  private headerText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private promptViText: Phaser.GameObjects.Text;
  private timerBarBg: Phaser.GameObjects.Graphics;
  private timerBarFill: Phaser.GameObjects.Graphics;
  private timerNumText: Phaser.GameObjects.Text;

  private choiceBoxes: Map<Answer, {
    container: Phaser.GameObjects.Container;
    bg: Phaser.GameObjects.Graphics;
    letterBadge: Phaser.GameObjects.Text;
    answerText: Phaser.GameObjects.Text;
    highlightTween: Phaser.Tweens.Tween | null;
  }> = new Map();

  private explanationContainer: Phaser.GameObjects.Container;
  private explanationText: Phaser.GameObjects.Text;

  // Board dimensions inside chalkboard prop
  public static readonly BOARD_X = 350;
  public static readonly BOARD_Y = 175;
  public static readonly BOARD_W = 320;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(QuestionBoard.BOARD_X, QuestionBoard.BOARD_Y).setDepth(10);

    // 1. Header (Round & Mode)
    this.headerText = scene.add.text(0, -32, 'LỚP HỌC VUI • QUICK QUIZ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fef08a',
      align: 'center',
    }).setOrigin(0.5, 0.5);
    this.container.add(this.headerText);

    // 2. English Prompt
    this.promptText = scene.add.text(0, 4, 'Đang chuẩn bị câu hỏi...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 300, useAdvancedWrap: true },
    }).setOrigin(0.5, 0.5);
    this.container.add(this.promptText);

    // 3. Vietnamese Subtitle / Translation
    this.promptViText = scene.add.text(0, 32, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#cbd5e1',
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5, 0.5);
    this.container.add(this.promptViText);

    // 4. Countdown Timer Bar
    this.timerBarBg = scene.add.graphics();
    this.timerBarFill = scene.add.graphics();
    this.timerNumText = scene.add.text(145, 48, '12s', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#facc15',
    }).setOrigin(1, 0.5);

    this.container.add([this.timerBarBg, this.timerBarFill, this.timerNumText]);
    this.drawTimerBar(1.0, 12);

    // 5. Four Choices (2x2 grid on lower chalkboard)
    const choicePositions: Record<Answer, { x: number; y: number; color: number; label: string }> = {
      A: { x: -75, y: 84, color: 0xef4444, label: 'A' },
      B: { x: 75, y: 84, color: 0x38bdf8, label: 'B' },
      C: { x: -75, y: 132, color: 0xf59e0b, label: 'C' },
      D: { x: 75, y: 132, color: 0xa855f7, label: 'D' },
    };

    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const pos = choicePositions[letter];
      const boxContainer = scene.add.container(pos.x, pos.y);
      const bg = scene.add.graphics();

      // Rounded button panel
      bg.fillStyle(0x1e293b, 0.85);
      bg.fillRoundedRect(-70, -18, 140, 36, 6);
      bg.lineStyle(1.5, pos.color, 0.85);
      bg.strokeRoundedRect(-70, -18, 140, 36, 6);

      // Letter indicator pill
      const letterBadge = scene.add.text(-54, 0, pos.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5, 0.5);

      // Text answer
      const answerText = scene.add.text(-38, 0, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#f8fafc',
        wordWrap: { width: 100 },
      }).setOrigin(0, 0.5);

      boxContainer.add([bg, letterBadge, answerText]);
      this.container.add(boxContainer);

      this.choiceBoxes.set(letter, {
        container: boxContainer,
        bg,
        letterBadge,
        answerText,
        highlightTween: null,
      });
    });

    // 6. Explanation Banner (hidden during question, shown on reveal)
    this.explanationContainer = scene.add.container(0, 108);
    const explBg = scene.add.graphics();
    explBg.fillStyle(0x064e3b, 0.95);
    explBg.fillRoundedRect(-145, -26, 290, 52, 6);
    explBg.lineStyle(2, 0x34d399, 1);
    explBg.strokeRoundedRect(-145, -26, 290, 52, 6);

    this.explanationText = scene.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ecfdf5',
      align: 'center',
      wordWrap: { width: 275 },
    }).setOrigin(0.5, 0.5);

    this.explanationContainer.add([explBg, this.explanationText]);
    this.explanationContainer.setVisible(false);
    this.container.add(this.explanationContainer);
  }

  public showQuestion(q: QuizQuestion, roundNum = 1): void {
    this.explanationContainer.setVisible(false);
    this.headerText.setText(`CÂU ${roundNum}/10 • ${q.mode.toUpperCase()} QUIZ`);
    this.promptText.setText(q.prompt);
    this.promptViText.setText(q.promptVi || '');

    // Reset choices visual state
    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const box = this.choiceBoxes.get(letter);
      if (box) {
        box.container.setVisible(true);
        box.container.setScale(1);
        box.answerText.setText(q.choices[letter] || '');
        if (box.highlightTween) {
          box.highlightTween.stop();
          box.highlightTween = null;
        }

        // Redraw standard border
        const colors = { A: 0xef4444, B: 0x38bdf8, C: 0xf59e0b, D: 0xa855f7 };
        box.bg.clear();
        box.bg.fillStyle(0x1e293b, 0.85);
        box.bg.fillRoundedRect(-70, -18, 140, 36, 6);
        box.bg.lineStyle(1.5, colors[letter], 0.85);
        box.bg.strokeRoundedRect(-70, -18, 140, 36, 6);
      }
    });
  }

  public drawTimerBar(progress: number, secondsRemaining: number): void {
    const barW = 280;
    const barH = 5;
    const x = -140;
    const y = 46;

    this.timerBarBg.clear();
    this.timerBarBg.fillStyle(0x334155, 0.7);
    this.timerBarBg.fillRoundedRect(x, y, barW, barH, 2.5);

    this.timerBarFill.clear();
    // Green -> Yellow -> Red as timer depletes
    const color = progress > 0.5 ? 0x22c55e : progress > 0.25 ? 0xfacc15 : 0xef4444;
    this.timerBarFill.fillStyle(color, 1);
    this.timerBarFill.fillRoundedRect(x, y, Math.max(0, barW * progress), barH, 2.5);

    this.timerNumText.setText(`${secondsRemaining}s`);
    this.timerNumText.setColor(progress > 0.25 ? '#facc15' : '#ef4444');
  }

  public revealCorrectAnswer(correct: Answer, explanation: string, fastestNickname?: string): void {
    // Highlight correct box with glowing emerald outline & pop
    const box = this.choiceBoxes.get(correct);
    if (box) {
      box.bg.clear();
      box.bg.fillStyle(0x065f46, 0.95);
      box.bg.fillRoundedRect(-70, -18, 140, 36, 6);
      box.bg.lineStyle(2.5, 0x34d399, 1);
      box.bg.strokeRoundedRect(-70, -18, 140, 36, 6);

      box.highlightTween = this.scene.tweens.add({
        targets: box.container,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 250,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
      });
    }

    // Show explanation panel
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
      duration: 250,
      ease: 'Back.easeOut',
    });
  }
}
