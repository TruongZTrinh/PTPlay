import Phaser from 'phaser';
import { Answer, QuizQuestion } from '../types.js';

export class QuestionBoard {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;

  private boardBg: Phaser.GameObjects.Graphics;
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

  private promptTipText: Phaser.GameObjects.Text;
  private explanationContainer: Phaser.GameObjects.Container;
  private explanationText: Phaser.GameObjects.Text;

  // Modern spacious smartboard dimensions — fits long multi-line questions, translations, choices and explanation
  public static readonly BOARD_X = 350;
  public static readonly BOARD_Y = 288;
  public static readonly BOARD_W = 352;
  public static readonly BOARD_H = 286;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add
      .container(QuestionBoard.BOARD_X, QuestionBoard.BOARD_Y)
      .setDepth(10);

    // 0. Dedicated Modern Classroom Chalkboard / Smartboard Panel
    this.boardBg = scene.add.graphics();
    this.drawBoardBackground();
    this.container.add(this.boardBg);

    // 1. Header Pill (Round & Mode)
    this.headerPillBg = scene.add.graphics();
    this.headerPillBg.fillStyle(0x0f172a, 0.92);
    this.headerPillBg.fillRoundedRect(-100, -133, 200, 22, 11);
    this.headerPillBg.lineStyle(1.5, 0xfacc15, 0.85);
    this.headerPillBg.strokeRoundedRect(-100, -133, 200, 22, 11);
    this.container.add(this.headerPillBg);

    this.headerText = scene.add
      .text(0, -122, 'LỚP HỌC VUI • QUICK QUIZ', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fef08a',
        align: 'center',
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.headerText);

    // 2. English Prompt Text (High Contrast & Clear Typography)
    this.promptText = scene.add
      .text(0, -90, 'Đang chuẩn bị câu hỏi...', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '14.5px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 326, useAdvancedWrap: true },
        stroke: '#09141f',
        strokeThickness: 2.5,
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.promptText);

    // 3. Vietnamese Subtitle / Translation
    this.promptViText = scene.add
      .text(0, -56, '', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#93c5fd',
        align: 'center',
        wordWrap: { width: 326, useAdvancedWrap: true },
        stroke: '#09141f',
        strokeThickness: 1.5,
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.promptViText);

    // 4. Countdown Timer Bar
    this.timerBarBg = scene.add.graphics();
    this.timerBarFill = scene.add.graphics();
    this.timerNumText = scene.add
      .text(145, -35, '22s', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#facc15',
        stroke: '#09141f',
        strokeThickness: 2,
      })
      .setOrigin(1, 0.5);

    this.container.add([this.timerBarBg, this.timerBarFill, this.timerNumText]);
    this.drawTimerBar(1.0, 22);

    // 5. Container for 4 Choice Buttons (Spacious 2x2 Grid)
    this.choicesGroup = scene.add.container(0, 0);
    this.container.add(this.choicesGroup);

    const choicePositions: Record<
      Answer,
      { x: number; y: number; colorHex: number; label: string }
    > = {
      A: { x: -80, y: -6, colorHex: 0xef4444, label: 'A' },
      B: { x: 80, y: -6, colorHex: 0x0284c7, label: 'B' },
      C: { x: -80, y: 34, colorHex: 0xd97706, label: 'C' },
      D: { x: 80, y: 34, colorHex: 0x7c3aed, label: 'D' },
    };

    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const pos = choicePositions[letter];
      const boxContainer = scene.add.container(pos.x, pos.y);

      // Button background card (154x34)
      const bg = scene.add.graphics();
      bg.fillStyle(0x0f172a, 0.92);
      bg.fillRoundedRect(-77, -17, 154, 34, 7);
      bg.lineStyle(1.5, pos.colorHex, 0.95);
      bg.strokeRoundedRect(-77, -17, 154, 34, 7);

      // Colored letter badge pill (20x20)
      const badgeBg = scene.add.graphics();
      badgeBg.fillStyle(pos.colorHex, 1);
      badgeBg.fillRoundedRect(-67, -10, 20, 20, 4);

      // White bold letter
      const letterBadge = scene.add
        .text(-57, 0, pos.label, {
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          fontSize: '11.5px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0.5);

      // Answer text (spacious 116px width with auto-wrap)
      const answerText = scene.add
        .text(-44, 0, '', {
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#f8fafc',
          wordWrap: { width: 116, useAdvancedWrap: true },
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

    // 6. Helpful live chat tip (shown during question countdown)
    this.promptTipText = scene.add
      .text(0, 88, '💬 Gõ A, B, C hoặc D để trả lời câu hỏi', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11px',
        color: '#6ee7b7',
        align: 'center',
        stroke: '#064e3b',
        strokeThickness: 1,
      })
      .setOrigin(0.5, 0.5);
    this.container.add(this.promptTipText);

    // 7. Explanation Banner (reveals smoothly during answer reveal phase at bottom of board, 330x52)
    this.explanationContainer = scene.add.container(0, 88);
    const explBg = scene.add.graphics();
    explBg.fillStyle(0x022c22, 0.98);
    explBg.fillRoundedRect(-165, -26, 330, 52, 8);
    explBg.lineStyle(2, 0x10b981, 1);
    explBg.strokeRoundedRect(-165, -26, 330, 52, 8);

    this.explanationText = scene.add
      .text(0, 0, '', {
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        fontSize: '11.5px',
        fontStyle: 'bold',
        color: '#ecfdf5',
        align: 'center',
        wordWrap: { width: 316, useAdvancedWrap: true },
        lineSpacing: 2,
      })
      .setOrigin(0.5, 0.5);

    this.explanationContainer.add([explBg, this.explanationText]);
    this.explanationContainer.setVisible(false);
    this.container.add(this.explanationContainer);
  }

  private drawBoardBackground(): void {
    const hw = QuestionBoard.BOARD_W / 2;
    const hh = QuestionBoard.BOARD_H / 2;

    this.boardBg.clear();

    // 1. Soft drop shadow behind board
    this.boardBg.fillStyle(0x000000, 0.38);
    this.boardBg.fillRoundedRect(-hw - 3, -hh - 3, QuestionBoard.BOARD_W + 6, QuestionBoard.BOARD_H + 8, 14);

    // 2. Outer Smartboard frame
    this.boardBg.fillStyle(0x0f172a, 0.96);
    this.boardBg.fillRoundedRect(-hw, -hh, QuestionBoard.BOARD_W, QuestionBoard.BOARD_H, 12);
    this.boardBg.lineStyle(2, 0x0284c7, 0.75);
    this.boardBg.strokeRoundedRect(-hw, -hh, QuestionBoard.BOARD_W, QuestionBoard.BOARD_H, 12);

    // 3. Inner chalkboard surface (dark emerald slate)
    this.boardBg.fillStyle(0x061e18, 0.95);
    this.boardBg.fillRoundedRect(-hw + 6, -hh + 6, QuestionBoard.BOARD_W - 12, QuestionBoard.BOARD_H - 12, 8);

    // 4. Subtle chalk rail at bottom
    this.boardBg.fillStyle(0x334155, 0.9);
    this.boardBg.fillRoundedRect(-hw + 14, hh - 6, QuestionBoard.BOARD_W - 28, 4, 2);
  }

  public showQuestion(q: QuizQuestion, roundNum = 1): void {
    // Hide explanation and show choices & tip
    this.explanationContainer.setVisible(false);
    this.promptTipText.setVisible(true);
    this.choicesGroup.setVisible(true);

    const modeSuffix = q.mode ? ` • ${q.mode.toUpperCase()} QUIZ` : '';
    this.headerText.setText(`CÂU ${roundNum}${modeSuffix}`);

    // Dynamic prompt font scaling for questions of any length
    if (q.prompt.length > 70) {
      this.promptText.setFontSize('12.5px');
    } else if (q.prompt.length > 45) {
      this.promptText.setFontSize('13.5px');
    } else {
      this.promptText.setFontSize('15px');
    }
    this.promptText.setText(q.prompt);

    const viText = q.promptVi || '';
    if (viText.length > 65) {
      this.promptViText.setFontSize('10.5px');
    } else {
      this.promptViText.setFontSize('11.5px');
    }
    this.promptViText.setText(viText);

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

        const choiceStr = q.choices[letter] || '';
        if (choiceStr.length > 22) {
          box.answerText.setFontSize('10px');
        } else if (choiceStr.length > 15) {
          box.answerText.setFontSize('11px');
        } else {
          box.answerText.setFontSize('12px');
        }
        box.answerText.setText(choiceStr);

        if (box.highlightTween) {
          box.highlightTween.stop();
          box.highlightTween = null;
        }

        // Redraw crisp standard card
        box.bg.clear();
        box.bg.fillStyle(0x0f172a, 0.92);
        box.bg.fillRoundedRect(-77, -17, 154, 34, 7);
        box.bg.lineStyle(1.5, colors[letter], 0.95);
        box.bg.strokeRoundedRect(-77, -17, 154, 34, 7);
      }
    });
  }

  public drawTimerBar(progress: number, secondsRemaining: number): void {
    const barW = 290;
    const barH = 4.5;
    const x = -145;
    const y = -35;

    this.timerBarBg.clear();
    this.timerBarBg.fillStyle(0x1e293b, 0.85);
    this.timerBarBg.fillRoundedRect(x, y, barW, barH, 2.5);

    this.timerBarFill.clear();
    // Smooth transition from emerald green -> yellow -> crimson
    const color = progress > 0.5 ? 0x10b981 : progress > 0.25 ? 0xfacc15 : 0xef4444;
    this.timerBarFill.fillStyle(color, 1);
    this.timerBarFill.fillRoundedRect(x, y, Math.max(0, barW * progress), barH, 2.5);

    this.timerNumText.setText(`${secondsRemaining}s`);
    this.timerNumText.setColor(progress > 0.25 ? '#facc15' : '#ef4444');
  }

  public revealCorrectAnswer(correct: Answer, explanation: string, fastestNickname?: string): void {
    // 1. Hide the question prompt tip
    this.promptTipText.setVisible(false);

    // 2. Highlight correct choice and dim incorrect ones
    (['A', 'B', 'C', 'D'] as Answer[]).forEach((letter) => {
      const box = this.choiceBoxes.get(letter);
      if (!box) return;

      if (letter === correct) {
        box.container.setAlpha(1);
        box.bg.clear();
        box.bg.fillStyle(0x065f46, 0.98);
        box.bg.fillRoundedRect(-77, -17, 154, 34, 7);
        box.bg.lineStyle(2.5, 0x34d399, 1);
        box.bg.strokeRoundedRect(-77, -17, 154, 34, 7);

        box.highlightTween = this.scene.tweens.add({
          targets: box.container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 250,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
        });
      } else {
        // Dim wrong choices subtly so correct answer pops immediately
        this.scene.tweens.add({
          targets: box.container,
          alpha: 0.35,
          duration: 250,
        });
      }
    });

    // 3. Show clear explanation banner at the bottom of the board
    let text = `✓ ĐÁP ÁN: ${correct} — ${explanation}`;
    if (fastestNickname) {
      text += `\n⚡ Nhanh nhất: ${fastestNickname}`;
    }

    if (text.length > 90) {
      this.explanationText.setFontSize('10.5px');
    } else {
      this.explanationText.setFontSize('11.5px');
    }
    this.explanationText.setText(text);

    this.explanationContainer.setVisible(true);
    this.explanationContainer.setScale(1);
    this.explanationContainer.setAlpha(1);
  }
}
