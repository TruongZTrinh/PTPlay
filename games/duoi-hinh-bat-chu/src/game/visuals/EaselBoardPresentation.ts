import Phaser from 'phaser';
import { RebusPuzzle } from '../types';

export class EaselBoardPresentation extends Phaser.GameObjects.Container {
  private stageBgImage?: Phaser.GameObjects.Image;
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
  private activePuzzleKey: string | null = null;
  private loadingPuzzleKey: string | null = null;

  private hintBannerText: Phaser.GameObjects.Text;
  private hintBannerBg: Phaser.GameObjects.Graphics;
  private letterBoxesContainer: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // 1. Stage Background
    this.createStageBackground();

    // 3. Easel Board & Header Graphics
    this.easelBg = scene.add.graphics();
    this.add(this.easelBg);

    this.headerBadgesBg = scene.add.graphics();
    this.add(this.headerBadgesBg);

    // Header info (3D Badges)
    this.roundText = scene.add.text(80, 34, 'CÂU 1', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#71421d',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.roundText);

    this.categoryText = scene.add.text(270, 34, 'MỨC ĐỘ: DỄ', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#e3f6d6',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.categoryText);

    this.timerText = scene.add.text(460, 34, '20 GIÂY', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.timerText);

    // Arcade Energy Timer Bar
    this.timerBar = scene.add.graphics();
    this.add(this.timerBar);

    // Two Clue Cards (Fallback mode)
    this.clueCard1 = scene.add.container(175, 173);
    const cardBg1 = scene.add.graphics();
    cardBg1.fillStyle(0xfff9df, 1);
    cardBg1.fillRoundedRect(-60, -60, 120, 120, 16);
    cardBg1.lineStyle(3, 0xb66b27, 1);
    cardBg1.strokeRoundedRect(-60, -60, 120, 120, 16);
    this.clueCard1.add(cardBg1);

    this.clueSprite1 = scene.add.image(0, 0, 'clue_fish');
    this.clueSprite1.setDisplaySize(96, 96);
    this.clueCard1.add(this.clueSprite1);
    this.add(this.clueCard1);

    // Plus Sign
    this.plusSign = scene.add.text(270, 173, '+', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '36px',
      color: '#f59e0b',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.plusSign);

    this.clueCard2 = scene.add.container(365, 173);
    const cardBg2 = scene.add.graphics();
    cardBg2.fillStyle(0xfff9df, 1);
    cardBg2.fillRoundedRect(-60, -60, 120, 120, 16);
    cardBg2.lineStyle(3, 0xb66b27, 1);
    cardBg2.strokeRoundedRect(-60, -60, 120, 120, 16);
    this.clueCard2.add(cardBg2);

    this.clueSprite2 = scene.add.image(0, 0, 'clue_gold');
    this.clueSprite2.setDisplaySize(96, 96);
    this.clueCard2.add(this.clueSprite2);
    this.add(this.clueCard2);

    // Single Picture Puzzle Card (directly fills the inset board without an outer frame)
    this.singleImageContainer = scene.add.container(270, 177);

    this.singleImageSprite = scene.add.image(0, 0, 'props_board');
    this.singleImageSprite.setDisplaySize(480, 212);
    this.singleImageContainer.add(this.singleImageSprite);

    this.singleImageContainer.setVisible(false);
    this.add(this.singleImageContainer);

    // Letter Boxes Container (3D Tactile Game Tiles)
    this.letterBoxesContainer = scene.add.container(270, 306);
    this.add(this.letterBoxesContainer);

    // Hint banner container
    this.hintBannerBg = scene.add.graphics();
    this.add(this.hintBannerBg);

    this.hintBannerText = scene.add.text(270, 337, '🌹 Hoa Hồng: mở chữ đầu +10 giây  •  Follow: gợi ý 1', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#fff7d6',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.hintBannerText);

    this.drawEaselBackground();

    scene.add.existing(this);
    this.setDepth(60);
  }

  private createStageBackground(): void {
    const bgKey = this.scene.textures.exists('bg_classroom_ai')
      ? 'bg_classroom_ai'
      : this.scene.textures.exists('bg_classroom_day')
      ? 'bg_classroom_day'
      : this.scene.textures.exists('bg_resort')
      ? 'bg_resort'
      : null;

    if (bgKey) {
      this.stageBgImage = this.scene.add.image(270, 480, bgKey);
      this.stageBgImage.setDisplaySize(540, 960);
      this.stageBgImage.setDepth(-100);
    } else {
      const bg = this.scene.add.graphics();
      bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x064e3b, 0x064e3b, 1);
      bg.fillRect(0, 0, 540, 960);
      bg.setDepth(-100);
    }

    // Studio Lighting Spotlight Cones from ceiling truss onto board
    const spotlights = this.scene.add.graphics();
    const lightX = [95, 195, 345, 445];
    lightX.forEach((lx) => {
      spotlights.fillStyle(0xfef08a, 0.05);
      spotlights.fillTriangle(lx, 20, lx - 75, 420, lx + 75, 420);
    });
    spotlights.setDepth(-99);

    // Gentle dark vignette to emphasize broadcast easel
    const vignette = this.scene.add.graphics();
    vignette.fillStyle(0x000000, 0.22);
    vignette.fillRect(0, 0, 540, 960);
    vignette.setDepth(-98);
  }

  private drawEaselBackground(): void {
    this.easelBg.clear();
    this.headerBadgesBg.clear();
    this.hintBannerBg.clear();

    // 1. Studio Lighting Ambient Aura behind Easel Board
    this.easelBg.fillStyle(0xf59e0b, 0.08);
    this.easelBg.fillRoundedRect(8, 8, 524, 354, 28);

    // 2. Deep Multilayer Drop Shadow
    this.easelBg.fillStyle(0x000000, 0.35);
    this.easelBg.fillRoundedRect(13, 14, 514, 344, 24);
    this.easelBg.fillStyle(0x000000, 0.55);
    this.easelBg.fillRoundedRect(15, 17, 510, 338, 20);

    // 3. Triple-Layer Gilded Broadcast Frame
    // Base Gold Bevel
    this.easelBg.fillStyle(0xb45309, 1);
    this.easelBg.fillRoundedRect(12, 12, 516, 342, 20);

    // Lustrous Gold Body
    this.easelBg.fillStyle(0xf59e0b, 1);
    this.easelBg.fillRoundedRect(14, 14, 512, 338, 18);

    // Outer Specular Rim
    this.easelBg.lineStyle(2, 0xfde047, 1);
    this.easelBg.strokeRoundedRect(14, 14, 512, 338, 18);

    // Dark Inner Bevel Shadow
    this.easelBg.lineStyle(1.5, 0x78350f, 1);
    this.easelBg.strokeRoundedRect(16, 16, 508, 334, 16);

    // 4. Velvet Obsidian Blackboard Plate
    this.easelBg.fillStyle(0x064e3b, 0.98);
    this.easelBg.fillRoundedRect(18, 18, 504, 330, 15);

    // Inset teaching surface around the puzzle and answer, like a classroom board.
    this.easelBg.fillStyle(0x0b6149, 0.85);
    this.easelBg.fillRoundedRect(24, 66, 492, 222, 12);
    this.easelBg.lineStyle(1.5, 0x9bd6aa, 0.5);
    this.easelBg.strokeRoundedRect(24, 66, 492, 222, 12);
    this.easelBg.fillStyle(0xffe6a3, 0.75);
    for (const x of [35, 505]) {
      this.easelBg.fillCircle(x, 79, 2);
      this.easelBg.fillCircle(x, 275, 2);
    }

    // 5. Ornate Golden Art-Deco Corner Caps
    const corners = [
      { x: 16, y: 16, dx: 1, dy: 1 },
      { x: 524, y: 16, dx: -1, dy: 1 },
      { x: 16, y: 350, dx: 1, dy: -1 },
      { x: 524, y: 350, dx: -1, dy: -1 },
    ];
    corners.forEach((c) => {
      this.easelBg.fillStyle(0xfde047, 1);
      this.easelBg.fillTriangle(c.x, c.y, c.x + c.dx * 18, c.y, c.x, c.y + c.dy * 18);
      this.easelBg.fillStyle(0xb45309, 1);
      this.easelBg.fillTriangle(c.x + c.dx * 3, c.y + c.dy * 3, c.x + c.dx * 15, c.y + c.dy * 3, c.x + c.dx * 3, c.y + c.dy * 15);
      this.easelBg.fillStyle(0xfef08a, 1);
      this.easelBg.fillCircle(c.x + c.dx * 6, c.y + c.dy * 6, 2.5);
    });

    // One information rail: question, difficulty, and a prominent countdown.
    const header = this.headerBadgesBg;
    header.fillStyle(0x033d2e, 1);
    header.fillRoundedRect(26, 20, 488, 28, 8);
    header.fillStyle(0xffedbc, 1);
    header.fillRoundedRect(30, 22, 102, 24, 6);
    header.fillStyle(0xb34e32, 1);
    header.fillRoundedRect(408, 22, 102, 24, 6);
    header.lineStyle(1, 0x8bbf9a, 0.5);
    header.lineBetween(150, 26, 150, 42);
    header.lineBetween(390, 26, 390, 42);

    // 7. Interactive TikTok Callout Pill (Row 1)
    this.hintBannerBg.fillStyle(0x78350f, 0.96);
    this.hintBannerBg.fillRoundedRect(32, 325, 476, 25, 12);
    this.hintBannerBg.lineStyle(1.5, 0xfacc15, 0.95);
    this.hintBannerBg.strokeRoundedRect(32, 325, 476, 25, 12);
    this.hintBannerBg.fillStyle(0x4338ca, 0.35);
    this.hintBannerBg.fillRoundedRect(34, 326, 472, 12, 6);
  }

  public updateDifficultyBadge(difficulty: number = 1): void {
    let text = 'MỨC ĐỘ: DỄ';
    let textColor = '#d7f5c0';

    if (difficulty >= 4) {
      text = 'MỨC ĐỘ: SIÊU KHÓ';
      textColor = '#fde047';
    } else if (difficulty === 3) {
      text = 'MỨC ĐỘ: KHÓ';
      textColor = '#ffbca6';
    } else if (difficulty === 2) {
      text = 'MỨC ĐỘ: VỪA';
      textColor = '#fef08a';
    }

    this.categoryText.setText(text);
    this.categoryText.setColor(textColor);
  }

  public setPuzzle(puzzle: RebusPuzzle, round: number, totalRounds?: number): void {
    this.currentPuzzleAnswer = puzzle.answer;
    this.roundText.setText(`CÂU ${round}`);
    this.timerText.setText(`${puzzle.durationSec || 20} GIÂY`);

    const diff = puzzle.difficulty || 1;
    this.updateDifficultyBadge(diff);

    const isHard = diff >= 3;
    const ctaText = isHard
      ? '🔥 CÂU SIÊU KHÓ!  🌹 Hoa Hồng: mở chữ đầu +10 giây'
      : '🌹 Hoa Hồng: mở chữ đầu +10 giây  •  Follow: gợi ý 1';

    if (puzzle.image) {
      const pKey = `puzzle_${puzzle.id}`;
      if (this.scene.textures.exists(pKey)) {
        this.loadingPuzzleKey = null;
        this.applySingleImageTexture(pKey);
        this.releaseUnusedPuzzleTexture(pKey);
        this.activePuzzleKey = pKey;
      } else {
        this.loadingPuzzleKey = pKey;
        this.singleImageSprite.setVisible(false);
        const url = `assets/rebus-v1/puzzles/${puzzle.image}`;
        this.scene.load.once(`filecomplete-image-${pKey}`, () => {
          if (this.loadingPuzzleKey !== pKey || !this.scene.textures.exists(pKey)) return;
          this.applySingleImageTexture(pKey);
          this.releaseUnusedPuzzleTexture(pKey);
          this.activePuzzleKey = pKey;
          this.loadingPuzzleKey = null;
        });
        this.scene.load.image(pKey, url);
        if (!this.scene.load.isLoading()) {
          this.scene.load.start();
        }
      }
      this.singleImageContainer.setVisible(true);
      this.clueCard1.setVisible(false);
      this.plusSign.setVisible(false);
      this.clueCard2.setVisible(false);
      this.hintBannerText.setText(ctaText);
      this.hintBannerText.setColor(isHard ? '#fde047' : '#fff7d6');
    } else {
      this.loadingPuzzleKey = null;
      this.releaseUnusedPuzzleTexture(null);
      this.singleImageContainer.setVisible(false);
      this.clueCard1.setVisible(true);
      this.plusSign.setVisible(true);
      this.clueCard2.setVisible(true);
      this.hintBannerText.setText(ctaText);
      this.hintBannerText.setColor(isHard ? '#fde047' : '#fff7d6');

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

  private applySingleImageTexture(pKey: string): void {
    this.singleImageSprite.setTexture(pKey);
    this.singleImageSprite.setVisible(true);
    try {
      const tex = this.scene.textures.get(pKey).getSourceImage() as HTMLImageElement;
      const w = tex.width || 400;
      const h = tex.height || 300;
      const maxW = 480;
      const maxH = 212;
      const scale = Math.min(maxW / w, maxH / h);
      const dispW = w * scale;
      const dispH = h * scale;
      this.singleImageSprite.setDisplaySize(dispW, dispH);
    } catch {
      this.singleImageSprite.setDisplaySize(480, 212);
    }
  }

  private releaseUnusedPuzzleTexture(keepKey: string | null): void {
    const prevKey = this.activePuzzleKey;
    if (keepKey === null) {
      if (this.scene.textures.exists('props_board')) {
        this.singleImageSprite.setTexture('props_board');
      }
      this.activePuzzleKey = null;
    }
    if (prevKey && prevKey !== keepKey && this.scene.textures.exists(prevKey)) {
      this.scene.textures.remove(prevKey);
    }
  }

  public renderLetterBoxes(answer: string, revealAll: boolean, revealedFirstChar?: string): void {
    this.letterBoxesContainer.removeAll(true);

    const cleanAnswer = answer.trim();
    const words = cleanAnswer.split(/\s+/);
    const gap = 4;
    const wordGap = 10;
    const charCount = words.join('').length;
    const boxW = Math.min(34, Math.floor((440 - wordGap * (words.length - 1) + gap) / charCount) - gap);
    const boxH = 30;
    const totalWidth = charCount * (boxW + gap) - gap + (words.length - 1) * wordGap;
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
          // 3D Revealed Golden Tile
          box.fillStyle(0x78350f, 1);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2 + 3, boxW, boxH, 8);
          box.fillStyle(0xf59e0b, 1);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 8);
          box.fillStyle(0xfde047, 1);
          box.fillRoundedRect(boxX - boxW / 2 + 2, -boxH / 2 + 2, boxW - 4, (boxH - 2) / 2, 6);
          box.lineStyle(1.8, 0xfef08a, 1);
          box.strokeRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 8);
        } else {
          box.fillStyle(0x52331d, 0.8);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2 + 3, boxW, boxH, 6);
          box.fillStyle(0xfff8df, 1);
          box.fillRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 6);
          box.lineStyle(1.5, 0xe6b357, 1);
          box.strokeRoundedRect(boxX - boxW / 2, -boxH / 2, boxW, boxH - 2, 6);
          box.fillStyle(0x97734d, 0.9);
          box.fillRoundedRect(boxX - Math.min(6, boxW / 4), 4, Math.min(12, boxW / 2), 2, 1);
        }
        this.letterBoxesContainer.add(box);

        if (displayChar) {
          const charText = this.scene.add.text(boxX, -1, displayChar, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: `${Math.min(19, boxW - 3)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#451a03',
            strokeThickness: 3.5,
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
      startX += wordGap - gap;
    });
  }

  public updateTimer(remainingSec: number, totalSec: number): void {
    this.timerText.setText(`${remainingSec} GIÂY`);
    const ratio = Math.max(0, Math.min(1, remainingSec / totalSec));

    this.timerBar.clear();
    // Inset track groove
    this.timerBar.fillStyle(0x020617, 0.95);
    this.timerBar.fillRoundedRect(34, 52, 472, 9, 4.5);
    this.timerBar.lineStyle(1, 0x1e293b, 0.9);
    this.timerBar.strokeRoundedRect(34, 52, 472, 9, 4.5);

    // Dynamic energy gradient
    const isUrgent = remainingSec <= 5;
    const barColor = isUrgent ? 0xef4444 : ratio > 0.4 ? 0x10b981 : 0xf59e0b;
    const fillWidth = Math.max(8, 468 * ratio);

    this.timerBar.fillStyle(barColor, 1);
    this.timerBar.fillRoundedRect(36, 53, fillWidth, 7, 3.5);

    // Glowing highlight line on top
    this.timerBar.fillStyle(0xffffff, 0.55);
    this.timerBar.fillRect(38, 53, Math.max(4, fillWidth - 4), 2);

    // Spark on leading edge
    if (fillWidth > 12) {
      this.timerBar.fillStyle(0xffffff, 0.9);
      this.timerBar.fillCircle(36 + fillWidth - 2, 56.5, 3);
    }

    if (isUrgent) {
      this.timerText.setColor('#fff1a8');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  public showTimeAdded(seconds: number, sponsorName?: string): void {
    let text = `⏱ Cả lớp được cộng thêm +${seconds}s thời gian suy nghĩ!`;
    if (sponsorName) {
      if (sponsorName.toLowerCase().includes('tim')) {
        text = `❤️ ${sponsorName}: +${seconds}s thời gian suy nghĩ!`;
      } else {
        text = `🌹 ${sponsorName} tặng Hoa Hồng: +${seconds}s thời gian suy nghĩ!`;
      }
    }
    this.hintBannerText.setText(text);
    this.hintBannerText.setColor('#34d399');
    this.scene.tweens.add({
      targets: this.hintBannerText,
      scale: 1.1,
      duration: 250,
      yoyo: true,
      repeat: 1,
    });
  }

  public showHint1(hint1: string, sponsorName?: string): void {
    const text = sponsorName
      ? `➕ ${sponsorName} đã Follow: Gợi ý là "${hint1}"`
      : `💡 Gợi ý: ${hint1}`;
    this.hintBannerText.setText(text);
    this.hintBannerText.setColor('#38bdf8');
    this.scene.tweens.add({
      targets: this.hintBannerText,
      scale: 1.08,
      duration: 220,
      yoyo: true,
      repeat: 1,
    });
  }

  public showHint2(hint2: string, firstChar: string, sponsorName?: string): void {
    const text = sponsorName
      ? `🌹 ${sponsorName} tặng Hoa Hồng: Chữ cái đầu là "${firstChar}" (+10s)!`
      : `💡 Chữ cái đầu tiên là "${firstChar}"!`;
    this.hintBannerText.setText(text);
    this.hintBannerText.setColor('#fde047');
    if (this.currentPuzzleAnswer) {
      this.renderLetterBoxes(this.currentPuzzleAnswer, false, firstChar);
    }
    this.scene.tweens.add({
      targets: this.hintBannerText,
      scale: 1.1,
      duration: 250,
      yoyo: true,
      repeat: 1,
    });
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

