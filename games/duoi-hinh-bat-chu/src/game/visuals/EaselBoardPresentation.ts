import Phaser from 'phaser';
import { RebusPuzzle } from '../types';
import { TextNormalizer } from '../utils/TextNormalizer';

export class EaselBoardPresentation extends Phaser.GameObjects.Container {
  private stageBgImage?: Phaser.GameObjects.Image;
  private logoImage?: Phaser.GameObjects.Image;
  private easelBg: Phaser.GameObjects.Graphics;
  private headerBadgesBg: Phaser.GameObjects.Graphics;
  private roundText: Phaser.GameObjects.Text;
  private categoryText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private timerBar: Phaser.GameObjects.Graphics;

  private clueCard1: Phaser.GameObjects.Container;
  private clueSprite1: Phaser.GameObjects.Image;
  private plusSign: Phaser.GameObjects.Text;
  private clueCard2: Phaser.GameObjects.Container;
  private clueSprite2: Phaser.GameObjects.Image;

  private singleImageContainer: Phaser.GameObjects.Container;
  private singleImageSprite: Phaser.GameObjects.Image;
  private singleImageFrame: Phaser.GameObjects.Graphics;

  private hintBannerText: Phaser.GameObjects.Text;
  private hintBannerBg: Phaser.GameObjects.Graphics;
  private letterBoxesContainer: Phaser.GameObjects.Container;
  private promptText: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // 1. Stage Background
    this.createStageBackground();

    // 2. Game Show Top Logo
    if (scene.textures.exists('rebus_logo')) {
      this.logoImage = scene.add.image(270, 42, 'rebus_logo');
      this.logoImage.setDisplaySize(250, 65);
      this.add(this.logoImage);

      scene.tweens.add({
        targets: this.logoImage,
        y: 45,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 3. Easel Board & Header Graphics
    this.easelBg = scene.add.graphics();
    this.add(this.easelBg);

    this.headerBadgesBg = scene.add.graphics();
    this.add(this.headerBadgesBg);

    // Header info (3D Badges)
    this.roundText = scene.add.text(84, 96, '🎮 CÂU 1/10', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.roundText);

    this.categoryText = scene.add.text(270, 96, '💡 GHÉP TỪ TIẾNG VIỆT', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.categoryText);

    this.timerText = scene.add.text(456, 96, '⏱ 20s', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#fef08a',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.timerText);

    // Arcade Energy Timer Bar
    this.timerBar = scene.add.graphics();
    this.add(this.timerBar);

    // Two Clue Cards (Fallback mode)
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

    // Single Picture Puzzle Card (3D Golden Picture Frame)
    this.singleImageContainer = scene.add.container(270, 200);

    this.singleImageFrame = scene.add.graphics();
    // Drop shadow
    this.singleImageFrame.fillStyle(0x000000, 0.5);
    this.singleImageFrame.fillRoundedRect(-148, -77, 296, 154, 14);
    // Gold metallic frame
    this.singleImageFrame.fillStyle(0xd97706, 1);
    this.singleImageFrame.fillRoundedRect(-145, -74, 290, 148, 12);
    this.singleImageFrame.lineStyle(2.5, 0xfde047, 1);
    this.singleImageFrame.strokeRoundedRect(-145, -74, 290, 148, 12);
    // Inner bevel
    this.singleImageFrame.fillStyle(0x020617, 1);
    this.singleImageFrame.fillRect(-140, -69, 280, 138);
    this.singleImageContainer.add(this.singleImageFrame);

    this.singleImageSprite = scene.add.image(0, 0, 'props_board');
    this.singleImageSprite.setDisplaySize(276, 136);
    this.singleImageContainer.add(this.singleImageSprite);
    this.singleImageContainer.setVisible(false);
    this.add(this.singleImageContainer);

    // Letter Boxes Container (3D Tactile Game Tiles)
    this.letterBoxesContainer = scene.add.container(270, 295);
    this.add(this.letterBoxesContainer);

    // Hint banner container
    this.hintBannerBg = scene.add.graphics();
    this.add(this.hintBannerBg);

    this.hintBannerText = scene.add.text(270, 332, '🔍 Gợi ý: Quan sát hình ảnh để bắt chữ...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#fde047',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.hintBannerText);

    // Prompt banner (Interaction CTA)
    this.promptBg = scene.add.graphics();
    this.add(this.promptBg);

    this.promptText = scene.add.text(270, 356, '💬 Nhập bình luận đáp án của bạn (VD: CẨU THẢ)', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#93c5fd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.promptText);

    this.drawEaselBackground();

    scene.add.existing(this);
    this.setDepth(60);
  }

  private createStageBackground(): void {
    const bgKey = this.scene.textures.exists('bg_classroom_day')
      ? 'bg_classroom_day'
      : this.scene.textures.exists('bg_resort')
      ? 'bg_resort'
      : null;

    if (bgKey) {
      this.stageBgImage = this.scene.add.image(270, 480, bgKey);
      this.stageBgImage.setDisplaySize(540, 960);
      this.add(this.stageBgImage);
    } else {
      const bg = this.scene.add.graphics();
      bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x064e3b, 0x064e3b, 1);
      bg.fillRect(0, 0, 540, 960);
      this.add(bg);
    }

    // Gentle dark vignette to emphasize chalkboard
    const vignette = this.scene.add.graphics();
    vignette.fillStyle(0x000000, 0.25);
    vignette.fillRect(0, 0, 540, 960);
    this.add(vignette);
  }

  private drawEaselBackground(): void {
    this.easelBg.clear();
    this.headerBadgesBg.clear();
    this.hintBannerBg.clear();
    this.promptBg.clear();

    // 1. Deep 3D Drop Shadow
    this.easelBg.fillStyle(0x000000, 0.45);
    this.easelBg.fillRoundedRect(28, 80, 484, 298, 22);

    // 2. Outer Golden Beveled Frame
    this.easelBg.fillStyle(0xd97706, 1);
    this.easelBg.fillRoundedRect(25, 76, 490, 300, 20);

    // 3. Highlight Rim
    this.easelBg.lineStyle(2.5, 0xfde047, 1);
    this.easelBg.strokeRoundedRect(25, 76, 490, 300, 20);

    // 4. Blackboard Velvet Plate
    this.easelBg.fillStyle(0x0f172a, 0.96);
    this.easelBg.fillRoundedRect(29, 80, 482, 292, 16);

    // 5. Header Separator Line
    this.easelBg.lineStyle(1.5, 0x1e293b, 0.9);
    this.easelBg.lineBetween(35, 110, 505, 110);

    // 6. Corner Golden Screws / Rivets
    const rivets = [
      { x: 37, y: 88 },
      { x: 503, y: 88 },
      { x: 37, y: 362 },
      { x: 503, y: 362 },
    ];
    rivets.forEach((r) => {
      this.easelBg.fillStyle(0xb45309, 1);
      this.easelBg.fillCircle(r.x, r.y, 4);
      this.easelBg.fillStyle(0xfde047, 1);
      this.easelBg.fillCircle(r.x - 1, r.y - 1, 2);
    });

    // 7. Header Badges
    // Round Badge (Red/Gold Game Pill)
    this.headerBadgesBg.fillStyle(0xb91c1c, 1);
    this.headerBadgesBg.fillRoundedRect(36, 84, 96, 24, 12);
    this.headerBadgesBg.lineStyle(1.5, 0xfacc15, 1);
    this.headerBadgesBg.strokeRoundedRect(36, 84, 96, 24, 12);

    // Category Badge (Ocean Cyan Pill)
    this.headerBadgesBg.fillStyle(0x0369a1, 1);
    this.headerBadgesBg.fillRoundedRect(178, 84, 184, 24, 12);
    this.headerBadgesBg.lineStyle(1.5, 0x38bdf8, 1);
    this.headerBadgesBg.strokeRoundedRect(178, 84, 184, 24, 12);

    // Timer Badge (Amber Fire Pill)
    this.headerBadgesBg.fillStyle(0x78350f, 1);
    this.headerBadgesBg.fillRoundedRect(408, 84, 96, 24, 12);
    this.headerBadgesBg.lineStyle(1.5, 0xf59e0b, 1);
    this.headerBadgesBg.strokeRoundedRect(408, 84, 96, 24, 12);

    // 8. Hint Banner Pill
    this.hintBannerBg.fillStyle(0x1e1b4b, 0.95);
    this.hintBannerBg.fillRoundedRect(50, 319, 440, 24, 12);
    this.hintBannerBg.lineStyle(1.5, 0xfacc15, 0.9);
    this.hintBannerBg.strokeRoundedRect(50, 319, 440, 24, 12);

    // 9. Prompt CTA Pill
    this.promptBg.fillStyle(0x030712, 0.9);
    this.promptBg.fillRoundedRect(50, 345, 440, 22, 11);
    this.promptBg.lineStyle(1, 0x0284c7, 0.8);
    this.promptBg.strokeRoundedRect(50, 345, 440, 22, 11);
  }

  public setPuzzle(puzzle: RebusPuzzle, round: number, totalRounds: number): void {
    this.currentPuzzleAnswer = puzzle.answer;
    this.roundText.setText(`Câu ${round}/${totalRounds}`);
    this.categoryText.setText(`💡 ${puzzle.category}`);
    this.timerText.setText(`⏱ ${puzzle.durationSec || 20}s`);

    if (puzzle.image) {
      const pKey = `puzzle_${puzzle.id}`;
      if (this.scene.textures.exists(pKey)) {
        this.singleImageSprite.setTexture(pKey);
        try {
          const tex = this.scene.textures.get(pKey).getSourceImage() as HTMLImageElement;
          const w = tex.width || 400;
          const h = tex.height || 300;
          const maxW = 276;
          const maxH = 144;
          const scale = Math.min(maxW / w, maxH / h);
          this.singleImageSprite.setDisplaySize(w * scale, h * scale);
        } catch {
          this.singleImageSprite.setDisplaySize(276, 144);
        }
      }
      this.singleImageContainer.setVisible(true);
      this.clueCard1.setVisible(false);
      this.plusSign.setVisible(false);
      this.clueCard2.setVisible(false);
      this.hintBannerText.setText(puzzle.hint1 || '🔍 Gợi ý: Quan sát hình ảnh để bắt chữ...');
    } else {
      this.singleImageContainer.setVisible(false);
      this.clueCard1.setVisible(true);
      this.plusSign.setVisible(true);
      this.clueCard2.setVisible(true);
      this.hintBannerText.setText('🔍 Gợi ý: Quan sát 2 hình ảnh để tìm từ ghép...');

      // Clue 1 icon
      const icon1Key = `clue_${puzzle.clues?.[0] || 'fish'}`;
      if (this.scene.textures.exists(icon1Key)) {
        this.clueSprite1.setTexture(icon1Key);
      }

      // Clue 2 icon
      const icon2Key = `clue_${puzzle.clues?.[1] || 'gold'}`;
      if (this.scene.textures.exists(icon2Key)) {
        this.clueSprite2.setTexture(icon2Key);
      }
    }

    // Render initial empty letter boxes
    this.renderLetterBoxes(puzzle.answer, false);
    this.updateTimer(puzzle.durationSec || 20, puzzle.durationSec || 20);
  }

  public renderLetterBoxes(answer: string, revealAll: boolean, revealedFirstChar?: string): void {
    this.letterBoxesContainer.removeAll(true);

    const cleanAnswer = answer.trim();
    const words = cleanAnswer.split(/\s+/);
    const boxW = 32;
    const boxH = 34;
    const gap = 5;

    let totalWidth = 0;
    words.forEach((w) => {
      totalWidth += w.length * (boxW + gap) + 12;
    });

    let startX = -totalWidth / 2;

    let charIndex = 0;
    words.forEach((word) => {
      for (let i = 0; i < word.length; i++) {
        const char = word.charAt(i).toUpperCase();
        const boxX = startX + boxW / 2;

        let displayChar = '';
        if (revealAll) {
          displayChar = char;
        } else if (charIndex === 0 && revealedFirstChar) {
          displayChar = revealedFirstChar;
        }

        const isRevealed = Boolean(displayChar);

        // Tactile 3D Box Graphics
        const box = this.scene.add.graphics();
        if (isRevealed) {
          // Golden 3D Arcade Tile
          // Bottom 3D shadow
          box.fillStyle(0xb45309, 1);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2 + 3, boxW, boxH, 7);
          // Golden face
          box.fillStyle(0xf59e0b, 1);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 7);
          // Highlight rim
          box.lineStyle(1.5, 0xfef08a, 1);
          box.strokeRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 7);
        } else {
          // Inset Empty 3D Tile
          // Bottom shadow
          box.fillStyle(0x0284c7, 0.9);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2 + 3, boxW, boxH, 7);
          // Dark Navy Face
          box.fillStyle(0x0f172a, 0.98);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 7);
          // Cyan rim
          box.lineStyle(1.5, 0x38bdf8, 0.9);
          box.strokeRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 7);
          // Subtle dash inside
          box.lineStyle(2, 0x0284c7, 0.6);
          box.lineBetween(boxX - 6, 2, boxX + 6, 2);
        }
        this.letterBoxesContainer.add(box);

        if (displayChar) {
          const charText = this.scene.add.text(boxX, -1, displayChar, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#78350f',
            strokeThickness: 3,
          }).setOrigin(0.5);
          this.letterBoxesContainer.add(charText);

          if (revealAll) {
            this.scene.tweens.add({
              targets: [box, charText],
              scale: { from: 0.5, to: 1 },
              duration: 250,
              delay: charIndex * 40,
              ease: 'Back.easeOut',
            });
          }
        }

        startX += boxW + gap;
        charIndex++;
      }
      startX += 12; // Gap between words
    });
  }

  public updateTimer(remainingSec: number, totalSec: number): void {
    this.timerText.setText(`⏱ ${remainingSec}s`);
    const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));

    this.timerBar.clear();
    // Inset track groove
    this.timerBar.fillStyle(0x020617, 0.85);
    this.timerBar.fillRoundedRect(48, 114, 444, 8, 4);
    this.timerBar.lineStyle(1, 0x1e293b, 0.8);
    this.timerBar.strokeRoundedRect(48, 114, 444, 8, 4);

    // Dynamic energy gradient
    const isUrgent = remainingSec <= 5;
    const barColor = isUrgent ? 0xef4444 : ratio > 0.4 ? 0x10b981 : 0xf59e0b;
    const fillWidth = Math.max(8, 440 * ratio);

    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRoundedRect(50, 115, fillWidth, 6, 3);

    // Glowing highlight line on top
    this.timerBar.fillStyle(0xffffff, 0.5);
    this.timerBar.fillRect(52, 115, Math.max(4, fillWidth - 4), 2);

    if (isUrgent) {
      this.timerText.setColor('#f87171');
    } else {
      this.timerText.setColor('#fef08a');
    }
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

  public revealAnswer(answer: string, solved: boolean, winnerName?: string): void {
    this.renderLetterBoxes(answer, true);
    if (solved) {
      const banner = winnerName ? `⚡ ${winnerName} NHANH NHẤT: ${answer.toUpperCase()}!` : `🎉 CHÍNH XÁC: ${answer.toUpperCase()}!`;
      this.hintBannerText.setText(banner);
      this.hintBannerText.setColor('#10b981');
    } else {
      this.hintBannerText.setText(`⌛ HẾT GIỜ: ${answer.toUpperCase()}!`);
      this.hintBannerText.setColor('#f87171');
    }
  }
}

