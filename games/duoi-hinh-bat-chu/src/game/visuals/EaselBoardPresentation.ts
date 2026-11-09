import Phaser from 'phaser';
import { RebusPuzzle } from '../types';
import { TextNormalizer } from '../utils/TextNormalizer';

export class EaselBoardPresentation extends Phaser.GameObjects.Container {
  private easelBg: Phaser.GameObjects.Graphics;
  private roundText: Phaser.GameObjects.Text;
  private categoryText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private timerBar: Phaser.GameObjects.Graphics;

  private clueCard1: Phaser.GameObjects.Container;
  private clueSprite1: Phaser.GameObjects.Image;
  private plusSign: Phaser.GameObjects.Text;
  private clueCard2: Phaser.GameObjects.Container;
  private clueSprite2: Phaser.GameObjects.Image;

  private hintBannerText: Phaser.GameObjects.Text;
  private letterBoxesContainer: Phaser.GameObjects.Container;
  private promptText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // Background gradient
    this.createStageBackground();

    this.easelBg = scene.add.graphics();
    this.add(this.easelBg);

    // Header info
    this.roundText = scene.add.text(80, 95, 'Câu 1/10', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.roundText);

    this.categoryText = scene.add.text(270, 95, '💡 Ghép Từ', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.categoryText);

    this.timerText = scene.add.text(460, 95, '⏱ 20s', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#f59e0b',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.timerText);

    // Timer bar
    this.timerBar = scene.add.graphics();
    this.add(this.timerBar);

    // Two Clue Cards
    this.clueCard1 = scene.add.container(175, 205);
    const cardBg1 = scene.add.graphics();
    cardBg1.fillStyle(0x0f172a, 0.95);
    cardBg1.fillRoundedRect(-60, -60, 120, 120, 16);
    cardBg1.lineStyle(2, 0x38bdf8, 1);
    cardBg1.strokeRoundedRect(-60, -60, 120, 120, 16);
    this.clueCard1.add(cardBg1);

    this.clueSprite1 = scene.add.image(0, 0, 'clue_fish');
    this.clueSprite1.setDisplaySize(96, 96);
    this.clueCard1.add(this.clueSprite1);
    this.add(this.clueCard1);

    // Plus Sign
    this.plusSign = scene.add.text(270, 205, '+', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px',
      color: '#f59e0b',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.plusSign);

    this.clueCard2 = scene.add.container(365, 205);
    const cardBg2 = scene.add.graphics();
    cardBg2.fillStyle(0x0f172a, 0.95);
    cardBg2.fillRoundedRect(-60, -60, 120, 120, 16);
    cardBg2.lineStyle(2, 0xf59e0b, 1);
    cardBg2.strokeRoundedRect(-60, -60, 120, 120, 16);
    this.clueCard2.add(cardBg2);

    this.clueSprite2 = scene.add.image(0, 0, 'clue_gold');
    this.clueSprite2.setDisplaySize(96, 96);
    this.clueCard2.add(this.clueSprite2);
    this.add(this.clueCard2);

    // Letter Boxes Container
    this.letterBoxesContainer = scene.add.container(270, 300);
    this.add(this.letterBoxesContainer);

    // Hint banner text
    this.hintBannerText = scene.add.text(270, 335, '🔍 Gợi ý: Quan sát 2 hình ảnh...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#fde047',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.hintBannerText);

    // Prompt banner
    this.promptText = scene.add.text(270, 360, '💬 Bình luận đáp án của bạn! Ví dụ: CÁ VÀNG', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#e2e8f0',
      backgroundColor: '#1e293b',
      padding: { left: 12, right: 12, top: 4, bottom: 4 },
    }).setOrigin(0.5);
    this.add(this.promptText);

    this.drawEaselBackground();

    scene.add.existing(this);
    this.setDepth(60);
  }

  private createStageBackground(): void {
    if (this.scene.textures.exists('bg_resort')) {
      const bg = this.scene.add.image(270, 480, 'bg_resort');
      bg.setDisplaySize(540, 960);
      this.add(bg);
    } else {
      const bg = this.scene.add.graphics();
      bg.fillGradientStyle(0x1a2e05, 0x1a2e05, 0x064e3b, 0x064e3b, 1);
      bg.fillRect(0, 0, 540, 960);
      this.add(bg);
    }
  }

  private drawEaselBackground(): void {
    this.easelBg.clear();
    // Easel board frame
    this.easelBg.fillStyle(0x1e293b, 0.94);
    this.easelBg.fillRoundedRect(30, 80, 480, 295, 20);
    this.easelBg.lineStyle(3, 0xf59e0b, 1);
    this.easelBg.strokeRoundedRect(30, 80, 480, 295, 20);
  }

  public setPuzzle(puzzle: RebusPuzzle, round: number, totalRounds: number): void {
    this.roundText.setText(`Câu ${round}/${totalRounds}`);
    this.categoryText.setText(`💡 ${puzzle.category}`);
    this.timerText.setText(`⏱ ${puzzle.durationSec || 20}s`);
    this.hintBannerText.setText('🔍 Gợi ý: Quan sát 2 hình ảnh để tìm từ ghép...');

    // Clue 1 icon
    const icon1Key = `clue_${puzzle.clues[0] || 'fish'}`;
    if (this.scene.textures.exists(icon1Key)) {
      this.clueSprite1.setTexture(icon1Key);
    }

    // Clue 2 icon
    const icon2Key = `clue_${puzzle.clues[1] || 'gold'}`;
    if (this.scene.textures.exists(icon2Key)) {
      this.clueSprite2.setTexture(icon2Key);
    }

    // Render initial empty letter boxes
    this.renderLetterBoxes(puzzle.answer, false);
    this.updateTimer(puzzle.durationSec || 20, puzzle.durationSec || 20);
  }

  public renderLetterBoxes(answer: string, revealAll: boolean, revealedFirstChar?: string): void {
    this.letterBoxesContainer.removeAll(true);

    const cleanAnswer = answer.trim();
    // Words in phrase
    const words = cleanAnswer.split(/\s+/);
    const boxSize = 28;
    const gap = 5;

    let totalWidth = 0;
    words.forEach((w) => {
      totalWidth += w.length * (boxSize + gap) + 12;
    });

    let startX = -totalWidth / 2;

    let charIndex = 0;
    words.forEach((word) => {
      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i).toUpperCase();
        const boxX = startX + boxSize / 2;

        const box = this.scene.add.graphics();
        box.fillStyle(0x0f172a, 0.9);
        box.fillRoundedRect(boxX - boxSize / 2, -boxSize / 2, boxSize, boxSize, 6);
        box.lineStyle(1.5, 0x38bdf8, 1);
        box.strokeRoundedRect(boxX - boxSize / 2, -boxSize / 2, boxSize, boxSize, 6);
        this.letterBoxesContainer.add(box);

        let displayChar = '';
        if (revealAll) {
          displayChar = char;
        } else if (charIndex === 0 && revealedFirstChar) {
          displayChar = revealedFirstChar;
        }

        if (displayChar) {
          const charText = this.scene.add.text(boxX, 0, displayChar, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '15px',
            color: '#facc15',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          this.letterBoxesContainer.add(charText);
        }

        startX += boxSize + gap;
        charIndex++;
      }
      startX += 12; // Gap between words
    });
  }

  public updateTimer(remainingSec: number, totalSec: number): void {
    this.timerText.setText(`⏱ ${remainingSec}s`);
    const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));

    this.timerBar.clear();
    this.timerBar.fillStyle(0x334155, 0.7);
    this.timerBar.fillRoundedRect(50, 115, 440, 6, 3);

    const barColor = ratio > 0.3 ? 0x10b981 : 0xef4444;
    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRoundedRect(50, 115, 440 * ratio, 6, 3);
  }

  public showHint1(hint1: string): void {
    this.hintBannerText.setText(`💡 Gợi ý 1: ${hint1}`);
    this.scene.tweens.add({
      targets: this.hintBannerText,
      scale: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 1,
    });
  }

  public showHint2(hint2: string, firstChar: string): void {
    this.hintBannerText.setText(`💡 Gợi ý 2: Chữ cái đầu là "${firstChar}"`);
    if (this.currentPuzzleAnswer) {
      this.renderLetterBoxes(this.currentPuzzleAnswer, false, firstChar);
    }
  }

  private currentPuzzleAnswer: string = '';

  public revealAnswer(answer: string, solved: boolean): void {
    this.renderLetterBoxes(answer, true);
    this.hintBannerText.setText(solved ? `🎉 CHÍNH XÁC: ${answer.toUpperCase()}!` : `⌛ HẾT GIỜ: ${answer.toUpperCase()}!`);
    this.hintBannerText.setColor(solved ? '#10b981' : '#f87171');
  }
}

