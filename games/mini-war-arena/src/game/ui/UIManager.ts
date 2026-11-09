import Phaser from 'phaser';
import { GAME_CONFIG, Team, ArenaThemeDef, MatchRecord } from '../config/GameConfig';
import { Unit } from '../entities/Unit';

export class UIManager {
  private scene: Phaser.Scene;

  // Background & Environment graphics
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private fieldGraphics!: Phaser.GameObjects.Graphics;
  private fieldTitleText!: Phaser.GameObjects.Text;
  private redBannerImg?: Phaser.GameObjects.Image;
  private blueBannerImg?: Phaser.GameObjects.Image;

  // Header Elements
  private redHpLabel!: Phaser.GameObjects.Text;
  private blueHpLabel!: Phaser.GameObjects.Text;
  private redBar!: Phaser.GameObjects.Rectangle;
  private blueBar!: Phaser.GameObjects.Rectangle;
  private bridgeStatusBadge!: Phaser.GameObjects.Text;
  private bridgeStatusDot!: Phaser.GameObjects.Arc;
  private seriesScoreText!: Phaser.GameObjects.Text;
  private arenaThemeBadge!: Phaser.GameObjects.Text;

  // Time & Score
  private timeLabel!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private unitCountLabel!: Phaser.GameObjects.Text;
  private announceLabel!: Phaser.GameObjects.Text;
  private viewerTicker!: Phaser.GameObjects.Text;

  // Boss HP Bar container
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossBarLabel!: Phaser.GameObjects.Text;

  // Overlays
  private attractContainer?: Phaser.GameObjects.Container;
  private introContainer?: Phaser.GameObjects.Container;
  private resultContainer?: Phaser.GameObjects.Container;
  private intermissionContainer?: Phaser.GameObjects.Container;
  private pauseContainer?: Phaser.GameObjects.Container;

  // Controls & Clean Capture
  public isCleanCapture = false;
  private hudElements: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createUI(theme: ArenaThemeDef, onStart: () => void): void {
    this.drawBackground(theme);
    this.drawHeader(theme);
    this.drawBattlefield(theme);
    this.createBossBar();
    this.showAttractLobby(onStart);
  }

  public drawBackground(theme: ArenaThemeDef): void {
    if (!this.bgGraphics) {
      this.bgGraphics = this.scene.add.graphics().setDepth(-50);
    }
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(theme.bgColor);
    this.bgGraphics.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Diagonal battlefield grid lines
    this.bgGraphics.lineStyle(2, theme.laneLineColor, 0.28);
    for (let i = -700; i < 1400; i += 64) {
      this.bgGraphics.lineBetween(i, 0, i + 800, GAME_CONFIG.HEIGHT);
    }
  }

  private drawHeader(theme: ArenaThemeDef): void {
    const g = this.scene.add.graphics().setDepth(30);

    // Header Panel with rounded corners
    g.fillStyle(0x061126, 0.96);
    g.fillRoundedRect(20, 16, 680, 260, 20);
    g.lineStyle(2, 0x244a7d, 0.85);
    g.strokeRoundedRect(20, 16, 680, 260, 20);

    // Accent lines
    g.fillStyle(GAME_CONFIG.COLORS.GOLD);
    g.fillRoundedRect(32, 24, 120, 5, 3);
    g.fillStyle(GAME_CONFIG.COLORS.BLUE_PRIMARY);
    g.fillRoundedRect(162, 24, 490, 5, 3);

    // Brand logo
    this.scene.add.image(80, 84, 'ptplay-logo').setDisplaySize(96, 96).setDepth(32);

    const brand = this.scene.add.text(146, 36, 'PTPLAY', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f6f9ff',
    }).setDepth(33);
    brand.setStroke('#0066ff', 2);

    this.scene.add.text(148, 78, 'MINI WAR ARENA · FULL V1.0', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setDepth(33);

    // Arena Theme Tag
    this.arenaThemeBadge = this.scene.add.text(148, 104, `📍 ${theme.vietnameseName.toUpperCase()}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#a5d6ff',
    }).setDepth(33);

    // Cumulative Series Score
    this.seriesScoreText = this.scene.add.text(360, 134, 'TỶ SỐ TRẬN: ĐỎ 0 - 0 XANH', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#051124',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(33);

    // Live Bridge status pill
    g.fillStyle(0x0d203d, 0.95);
    g.fillRoundedRect(495, 50, 185, 34, 17);
    g.lineStyle(1, 0x2e578c);
    g.strokeRoundedRect(495, 50, 185, 34, 17);

    this.bridgeStatusDot = this.scene.add.circle(515, 67, 5, 0x64748b).setDepth(34);
    this.bridgeStatusBadge = this.scene.add.text(530, 67, 'LIVE BRIDGE: OFF', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#94a3b8',
    }).setOrigin(0, 0.5).setDepth(34);

    // Teams HP Card
    g.fillStyle(0x09172f, 0.98);
    g.fillRoundedRect(34, 156, 652, 108, 16);

    this.scene.add.text(60, 168, '🔴 RED LEGION', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff667e',
    }).setDepth(33);

    this.scene.add.text(660, 168, 'BLUE GUARD 🔵', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#5eaeff',
    }).setOrigin(1, 0).setDepth(33);

    this.redHpLabel = this.scene.add.text(60, 194, '1500 / 1500', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setDepth(33);

    this.blueHpLabel = this.scene.add.text(660, 194, '1500 / 1500', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(33);

    // HP Bar troughs
    g.fillStyle(0x040d1c);
    g.fillRoundedRect(56, 226, 276, 16, 7);
    g.fillRoundedRect(388, 226, 276, 16, 7);

    this.redBar = this.scene.add.rectangle(58, 228, 272, 12, GAME_CONFIG.COLORS.RED_PRIMARY).setOrigin(0, 0).setDepth(33);
    this.blueBar = this.scene.add.rectangle(390, 228, 272, 12, GAME_CONFIG.COLORS.BLUE_PRIMARY).setOrigin(0, 0).setDepth(33);

    // VS Badge
    g.fillStyle(0x040e21);
    g.fillRoundedRect(324, 170, 72, 48, 14);
    g.lineStyle(2, GAME_CONFIG.COLORS.GOLD, 0.6);
    g.strokeRoundedRect(324, 170, 72, 48, 14);

    this.scene.add.text(360, 194, 'VS', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(33);
  }

  public drawBattlefield(theme: ArenaThemeDef): void {
    if (!this.fieldGraphics) {
      this.fieldGraphics = this.scene.add.graphics().setDepth(-4);
    }
    this.fieldGraphics.clear();

    // Main Arena Card
    this.fieldGraphics.fillStyle(0x08172c, 0.94);
    this.fieldGraphics.fillRoundedRect(20, 290, 680, 695, 20);
    this.fieldGraphics.lineStyle(2, 0x1d4a7c);
    this.fieldGraphics.strokeRoundedRect(20, 290, 680, 695, 20);

    // Themed Ground Field
    this.fieldGraphics.fillStyle(theme.groundColor);
    this.fieldGraphics.fillRoundedRect(28, 298, 664, 678, 18);

    // 3 Themed Combat Lanes
    for (const cy of GAME_CONFIG.LANES) {
      this.fieldGraphics.fillStyle(0x000000, 0.25);
      this.fieldGraphics.fillRoundedRect(54, cy - 56, 612, 112, 22);

      this.fieldGraphics.fillStyle(theme.pathColor);
      this.fieldGraphics.fillRoundedRect(60, cy - 50, 600, 100, 20);

      this.fieldGraphics.fillStyle(theme.pathColor, 0.85);
      this.fieldGraphics.fillRoundedRect(66, cy - 42, 588, 84, 15);

      // Cobblestone / Basalt / Crystal Pavers
      for (let c = 0; c < 10; c++) {
        const bx = 76 + c * 58;
        this.fieldGraphics.fillStyle(theme.laneLineColor, 0.7);
        this.fieldGraphics.fillRoundedRect(bx, cy - 32, 50, 34, 4);
        this.fieldGraphics.fillRoundedRect(bx + 12, cy + 6, 44, 30, 4);
      }

      this.fieldGraphics.lineStyle(2, theme.accentColor, 0.35);
      this.fieldGraphics.lineBetween(76, cy + 3, 644, cy + 3);
    }

    // Fortress Towers with Banners
    this.drawTower(this.fieldGraphics, 75, 630, 'red');
    this.drawTower(this.fieldGraphics, 645, 630, 'blue');

    if (!this.redBannerImg) {
      this.redBannerImg = this.scene.add.image(75, 520, 'banner-red').setDepth(15).setScale(0.9);
      this.blueBannerImg = this.scene.add.image(645, 520, 'banner-blue').setDepth(15).setScale(0.9);
    }

    // Battlefield Center Header
    if (!this.fieldTitleText) {
      const badge = this.scene.add.graphics().setDepth(6);
      badge.fillStyle(0x061426, 0.92);
      badge.fillRoundedRect(180, 304, 360, 50, 16);
      badge.lineStyle(2, GAME_CONFIG.COLORS.GOLD, 0.75);
      badge.strokeRoundedRect(180, 304, 360, 50, 16);

      this.fieldTitleText = this.scene.add.text(360, 320, '⚔  CHIẾN TRƯỜNG TỰ ĐỘNG  ⚔', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe082',
      }).setOrigin(0.5, 0).setDepth(7);

      this.announceLabel = this.scene.add.text(360, 378, 'SẴN SÀNG CHIẾN ĐẤU!', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#051124',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(24);

      this.viewerTicker = this.scene.add.text(360, 412, '💡 Bình luận ĐỎ hoặc XANH để tham gia chia phe!', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#a8c7ed',
        stroke: '#051124',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(24);

      this.timeLabel = this.scene.add.text(360, 946, '01:30', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffd700',
      }).setOrigin(0.5).setDepth(22);

      this.scoreLabel = this.scene.add.text(360, 894, 'HẠ GỤC   0   :   0', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(22);

      this.unitCountLabel = this.scene.add.text(360, 920, 'QUÂN ĐANG ĐÁNH   0   :   0', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#8cb8ec',
      }).setOrigin(0.5).setDepth(22);
    }

    if (this.arenaThemeBadge) {
      this.arenaThemeBadge.setText(`📍 ${theme.vietnameseName.toUpperCase()}`);
    }
  }

  private drawTower(g: Phaser.GameObjects.Graphics, x: number, y: number, team: Team): void {
    const col = team === 'red' ? 0x9c2445 : 0x145ba8;
    const trim = team === 'red' ? 0xff5474 : 0x47b2ff;

    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(x, y + 54, 110, 28);

    // Tower base stones
    g.fillStyle(0x48566b);
    g.fillRoundedRect(x - 36, y - 65, 72, 108, 10);
    g.fillStyle(0x99a8b8);
    g.fillRoundedRect(x - 32, y - 64, 64, 104, 8);

    // Team colored parapet
    g.fillStyle(col);
    g.fillRoundedRect(x - 45, y - 84, 90, 24, 4);
    g.fillStyle(trim);
    for (let dx = -39; dx <= 29; dx += 23) {
      g.fillRoundedRect(x + dx, y - 95, 16, 17, 3);
    }
  }

  private createBossBar(): void {
    const bg = this.scene.add.rectangle(360, 268, 520, 28, 0x051022, 0.95).setStrokeStyle(2, GAME_CONFIG.COLORS.GOLD);
    this.bossBarFill = this.scene.add.rectangle(102, 268, 516, 24, GAME_CONFIG.COLORS.GOLD).setOrigin(0, 0.5);
    this.bossBarLabel = this.scene.add.text(360, 268, '👑 BOSS ĐANG XUẤT HIỆN!', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#051226',
    }).setOrigin(0.5);

    this.bossBarContainer = this.scene.add.container(0, 0, [bg, this.bossBarFill, this.bossBarLabel]).setDepth(45).setVisible(false);
  }

  public updateBossBar(boss: Unit | null): void {
    if (!boss || !boss.alive) {
      this.bossBarContainer.setVisible(false);
      return;
    }

    this.bossBarContainer.setVisible(true);
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    this.bossBarFill.setSize(Math.max(1, 516 * ratio), 24);
    const fillColor = boss.team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY;
    this.bossBarFill.setFillStyle(fillColor);
    const bossTitle = boss.team === 'red' ? GAME_CONFIG.BOSSES.red.vietnameseName : GAME_CONFIG.BOSSES.blue.vietnameseName;
    this.bossBarLabel.setText(`👑 ${boss.summonerNickname ? `[${boss.summonerNickname}] ` : ''}${bossTitle.toUpperCase()} (${boss.hp} / ${boss.maxHp})`);
  }

  public setBridgeStatus(connected: boolean): void {
    if (connected) {
      this.bridgeStatusDot.setFillStyle(0x10b981);
      this.bridgeStatusBadge.setText('LIVE BRIDGE: ONLINE').setColor('#10b981');
    } else {
      this.bridgeStatusDot.setFillStyle(0x64748b);
      this.bridgeStatusBadge.setText('LIVE BRIDGE: OFFLINE').setColor('#94a3b8');
    }
  }

  public updateHud(
    redHp: number,
    blueHp: number,
    remainingSec: number,
    redKills: number,
    blueKills: number,
    redUnits: number,
    blueUnits: number,
    redTotalWins = 0,
    blueTotalWins = 0
  ): void {
    this.redHpLabel.setText(`${redHp} / ${GAME_CONFIG.MAX_CORE_HP}`);
    this.blueHpLabel.setText(`${blueHp} / ${GAME_CONFIG.MAX_CORE_HP}`);

    const redRatio = Math.max(0, redHp / GAME_CONFIG.MAX_CORE_HP);
    const blueRatio = Math.max(0, blueHp / GAME_CONFIG.MAX_CORE_HP);
    this.redBar.setSize(Math.max(1, 272 * redRatio), 12);
    this.blueBar.setSize(Math.max(1, 272 * blueRatio), 12);

    const m = String(Math.floor(remainingSec / 60)).padStart(2, '0');
    const s = String(remainingSec % 60).padStart(2, '0');
    this.timeLabel.setText(`${m}:${s}`);

    // Emergency timer pulse when under 15 seconds
    if (remainingSec <= 15) {
      this.timeLabel.setColor('#ff3355');
    } else {
      this.timeLabel.setColor('#ffd700');
    }

    this.scoreLabel.setText(`HẠ GỤC   ${redKills}   :   ${blueKills}`);
    this.unitCountLabel.setText(`QUÂN ĐANG ĐÁNH   ${redUnits}   :   ${blueUnits}`);
    this.seriesScoreText.setText(`TỶ SỐ TRẬN: ĐỎ ${redTotalWins} - ${blueTotalWins} XANH`);
  }

  public showAnnouncement(msg: string, color = GAME_CONFIG.COLORS.GOLD): void {
    this.announceLabel.setText(msg).setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
    this.announceLabel.setScale(0.9);
    this.announceLabel.setAlpha(1);

    this.scene.tweens.killTweensOf(this.announceLabel);
    this.scene.tweens.add({
      targets: this.announceLabel,
      scale: 1.08,
      duration: 180,
      yoyo: true,
    });
  }

  public showViewerTicker(msg: string): void {
    this.viewerTicker.setText(msg).setAlpha(1);
    this.scene.tweens.killTweensOf(this.viewerTicker);
    this.scene.tweens.add({
      targets: this.viewerTicker,
      alpha: { from: 1, to: 0.75 },
      duration: 2500,
      ease: 'Sine.easeOut',
    });
  }

  // --- STATE 1: ATTRACT / LOBBY ---
  public showAttractLobby(onStart: () => void): void {
    this.clearAllOverlays();

    const bg = this.scene.add.rectangle(360, 638, 660, 560, 0x051126, 0.97).setStrokeStyle(3, GAME_CONFIG.COLORS.GOLD);

    const title1 = this.scene.add.text(360, 390, '★ PTPLAY ARENA SERIES ★', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    const title2 = this.scene.add.text(360, 445, 'MINI WAR', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '62px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#0066ff',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const title3 = this.scene.add.text(360, 515, 'ARENA V1.0', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#a87500',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Spectator Instructions Card
    const guideBox = this.scene.add.rectangle(360, 635, 590, 140, 0x091c38, 0.92).setStrokeStyle(1.5, 0x1d4a7c);
    const guideTitle = this.scene.add.text(360, 580, '📢 HƯỚNG DẪN KHÁN GIẢ LIVESTREAM TIKTOK', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    const guideRed = this.scene.add.text(360, 615, '💬 Bình luận "ĐỎ" hoặc "RED"  ➜  Gia nhập Đội ĐỎ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ff667e',
    }).setOrigin(0.5);

    const guideBlue = this.scene.add.text(360, 645, '💬 Bình luận "XANH" hoặc "BLUE" ➜ Gia nhập Đội XANH', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#60a5fa',
    }).setOrigin(0.5);

    const guideCheer = this.scene.add.text(360, 678, '💬 Gõ "CHIẾN" để cổ vũ · Gõ "BOSS" để tích nộ triệu hồi Đại Tướng', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '12px',
      color: '#e2e8f0',
    }).setOrigin(0.5);

    const playBtnBg = this.scene.add.rectangle(360, 780, 360, 72, GAME_CONFIG.COLORS.GOLD).setStrokeStyle(3, 0xfff3a8).setInteractive({ useHandCursor: true });
    const playBtnText = this.scene.add.text(360, 780, '⚔  BẮT ĐẦU TRẬN ĐẤU  ⚔', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#08142d',
    }).setOrigin(0.5);

    playBtnBg.on('pointerdown', () => {
      this.clearAllOverlays();
      onStart();
    });

    this.attractContainer = this.scene.add.container(0, 0, [
      bg, title1, title2, title3, guideBox, guideTitle, guideRed, guideBlue, guideCheer, playBtnBg, playBtnText
    ]).setDepth(80);
  }

  // --- STATE 2: ROUND INTRO ---
  public showRoundIntro(round: number, themeName: string): void {
    this.clearAllOverlays();

    const banner = this.scene.add.rectangle(360, 638, 620, 180, 0x051329, 0.95).setStrokeStyle(3, GAME_CONFIG.COLORS.GOLD);
    const roundTxt = this.scene.add.text(360, 590, `VÒNG ${round}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#030d1a',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const arenaTxt = this.scene.add.text(360, 645, `CHIẾN TRƯỜNG: ${themeName.toUpperCase()}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const cueTxt = this.scene.add.text(360, 680, '3... 2... 1... XUẤT QUÂN!', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ff667e',
    }).setOrigin(0.5);

    this.introContainer = this.scene.add.container(0, 0, [banner, roundTxt, arenaTxt, cueTxt]).setDepth(75);

    this.scene.tweens.add({
      targets: this.introContainer,
      scale: { from: 0.85, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  // --- STATE 3: ROUND RESULT ---
  public showVictory(record: MatchRecord, onNextRound: () => void): void {
    this.clearAllOverlays();

    const isDraw = record.winner === 'draw';
    const isRed = record.winner === 'red';
    const winColor = isDraw ? GAME_CONFIG.COLORS.GOLD : (isRed ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY);

    const panel = this.scene.add.rectangle(360, 638, 620, 480, 0x051329, 0.98).setStrokeStyle(4, winColor);

    const titleText = isDraw ? '🤝 TRẬN ĐẤU BẤT PHÂN THẮNG BẠI!' : (isRed ? '🏆 ĐỘI ĐỎ TOÀN THẮNG! 🔴' : '🏆 ĐỘI XANH TOÀN THẮNG! 🔵');
    const title = this.scene.add.text(360, 450, titleText, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: isDraw ? '#ffd700' : (isRed ? '#ff667e' : '#5eaeff'),
      stroke: '#030c18',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const roundStats = this.scene.add.text(360, 505, `VÒNG ${record.roundNumber}  ·  THỜI GIAN: ${record.durationSeconds}s`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '15px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    // Score comparison table
    const statBox = this.scene.add.rectangle(360, 600, 540, 130, 0x091830, 0.95).setStrokeStyle(1.5, 0x1e3a5f);
    const redCol = this.scene.add.text(230, 560, '🔴 ĐỘI ĐỎ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff667e',
    }).setOrigin(0.5);

    const blueCol = this.scene.add.text(490, 560, '🔵 ĐỘI XANH', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#5eaeff',
    }).setOrigin(0.5);

    const statScores = this.scene.add.text(360, 600, `Điểm Trận:   ${record.redScore}   vs   ${record.blueScore}\nHạ Gục:       ${record.redKills}   vs   ${record.blueKills}\nMáu Thành:   ${record.redCoreHp}   vs   ${record.blueCoreHp}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Supporter MVP
    const topFan = record.topSupporters[record.topSupporters.length - 1];
    const mvpText = this.scene.add.text(360, 695, topFan ? `⭐ CHIẾN TƯỚNG MVP: [${topFan.nickname}] (${topFan.team.toUpperCase()})` : '⭐ TOÀN BỘ QUÂN BINH ĐÃ CHIẾN ĐẤU KIÊN CƯỜNG!', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.rectangle(360, 775, 340, 64, GAME_CONFIG.COLORS.GOLD).setStrokeStyle(3, 0xfff5b8).setInteractive({ useHandCursor: true });
    const restartText = this.scene.add.text(360, 775, '▶  TIẾP TỤC VÒNG KẾ', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#08142d',
    }).setOrigin(0.5);

    restartBtn.on('pointerdown', () => {
      this.clearAllOverlays();
      onNextRound();
    });

    this.resultContainer = this.scene.add.container(0, 0, [
      panel, title, roundStats, statBox, redCol, blueCol, statScores, mvpText, restartBtn, restartText
    ]).setDepth(70);

    this.scene.tweens.add({
      targets: this.resultContainer,
      alpha: { from: 0, to: 1 },
      duration: 280,
    });
  }

  // --- STATE 4: INTERMISSION ---
  public showIntermission(nextTheme: ArenaThemeDef, countdown: number): void {
    this.clearAllOverlays();

    const panel = this.scene.add.rectangle(360, 638, 580, 260, 0x051329, 0.96).setStrokeStyle(3, 0x10b981);
    const title = this.scene.add.text(360, 560, '⏳ NGHỈ GIỮA TRẬN', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    const nextTxt = this.scene.add.text(360, 615, `CHIẾN TRƯỜNG KẾ TIẾP: ${nextTheme.vietnameseName.toUpperCase()}`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#38bdf8',
    }).setOrigin(0.5);

    const descTxt = this.scene.add.text(360, 650, nextTheme.description, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      align: 'center',
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    const timerTxt = this.scene.add.text(360, 715, `Bắt đầu sau: ${countdown}s`, {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#10b981',
    }).setOrigin(0.5);

    this.intermissionContainer = this.scene.add.container(0, 0, [panel, title, nextTxt, descTxt, timerTxt]).setDepth(70);
  }

  public clearAllOverlays(): void {
    if (this.attractContainer) {
      this.attractContainer.destroy(true);
      this.attractContainer = undefined;
    }
    if (this.introContainer) {
      this.introContainer.destroy(true);
      this.introContainer = undefined;
    }
    if (this.resultContainer) {
      this.resultContainer.destroy(true);
      this.resultContainer = undefined;
    }
    if (this.intermissionContainer) {
      this.intermissionContainer.destroy(true);
      this.intermissionContainer = undefined;
    }
    if (this.pauseContainer) {
      this.pauseContainer.destroy(true);
      this.pauseContainer = undefined;
    }
  }

  public clearIntro(): void {
    this.clearAllOverlays();
  }

  public clearVictory(): void {
    this.clearAllOverlays();
  }
}
