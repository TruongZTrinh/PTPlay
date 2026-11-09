import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';

export class Scoreboard extends Phaser.GameObjects.Container {
  private boardBg: Phaser.GameObjects.Graphics;
  private topEntries: Phaser.GameObjects.Text[] = [];
  private entryBgs: Phaser.GameObjects.Graphics;
  private chatTickerText: Phaser.GameObjects.Text;
  private chatTickerBg: Phaser.GameObjects.Graphics;
  private liveBadgeBg: Phaser.GameObjects.Graphics;
  private liveBadgeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    // 1. Leaderboard graphics & frame
    this.boardBg = scene.add.graphics();
    this.add(this.boardBg);

    this.entryBgs = scene.add.graphics();
    this.add(this.entryBgs);

    const title = scene.add.text(402, 396, '🏆 BẢNG VÀNG LIVE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#fef08a',
      fontStyle: 'bold',
      stroke: '#78350f',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.add(title);

    this.drawBoard();

    // 5 Leaderboard slots
    for (let i = 0; i < 5; i++) {
      const entryText = scene.add.text(304, 417 + i * 20, `${i + 1}. ...`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: i === 0 ? '#fde047' : i === 1 ? '#e2e8f0' : i === 2 ? '#fdba74' : '#cbd5e1',
        fontStyle: i < 3 ? 'bold' : 'normal',
      });
      this.topEntries.push(entryText);
      this.add(entryText);
    }

    // 2. Chat Ticker at bottom (Interactive Live Stream Style)
    this.chatTickerBg = scene.add.graphics();
    this.add(this.chatTickerBg);

    // Live Badge
    this.liveBadgeBg = scene.add.graphics();
    this.add(this.liveBadgeBg);

    this.liveBadgeText = scene.add.text(58, 931, '🔴 LIVE', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.liveBadgeText);

    // Subtle pulsing animation on LIVE badge
    scene.tweens.add({
      targets: this.liveBadgeText,
      alpha: { from: 1, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.chatTickerText = scene.add.text(94, 931, '💬 Bình luận đáp án tiếng Việt để tham gia đoán chữ!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#e2e8f0',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add(this.chatTickerText);

    this.drawChatTicker();

    scene.add.existing(this);
    this.setDepth(70);
  }

  private drawBoard(): void {
    this.boardBg.clear();
    // Drop shadow
    this.boardBg.fillStyle(0x000000, 0.45);
    this.boardBg.fillRoundedRect(292, 382, 222, 134, 14);

    // Outer 3D Gold Frame
    this.boardBg.fillStyle(0xd97706, 1);
    this.boardBg.fillRoundedRect(290, 380, 224, 134, 12);
    this.boardBg.lineStyle(2, 0xfde047, 1);
    this.boardBg.strokeRoundedRect(290, 380, 224, 134, 12);

    // Inner Velvet Plate
    this.boardBg.fillStyle(0x0f172a, 0.96);
    this.boardBg.fillRoundedRect(293, 383, 218, 128, 10);

    // Header Badge Pill
    this.boardBg.fillStyle(0x78350f, 1);
    this.boardBg.fillRoundedRect(310, 386, 184, 20, 10);
    this.boardBg.lineStyle(1.5, 0xfacc15, 1);
    this.boardBg.strokeRoundedRect(310, 386, 184, 20, 10);
  }

  private drawChatTicker(): void {
    this.chatTickerBg.clear();
    this.liveBadgeBg.clear();

    // Ticker Background
    this.chatTickerBg.fillStyle(0x000000, 0.4);
    this.chatTickerBg.fillRoundedRect(26, 916, 488, 32, 12);

    this.chatTickerBg.fillStyle(0x090d16, 0.95);
    this.chatTickerBg.fillRoundedRect(25, 914, 490, 34, 12);
    this.chatTickerBg.lineStyle(1.5, 0xf59e0b, 0.9);
    this.chatTickerBg.strokeRoundedRect(25, 914, 490, 34, 12);

    // Live Badge Pill
    this.liveBadgeBg.fillStyle(0xb91c1c, 1);
    this.liveBadgeBg.fillRoundedRect(32, 920, 52, 22, 11);
    this.liveBadgeBg.lineStyle(1, 0xf87171, 0.9);
    this.liveBadgeBg.strokeRoundedRect(32, 920, 52, 22, 11);
  }

  public updateLeaderboard(players: RebusPlayerRecord[]): void {
    // Only players who actually earned points belong on the live ranking board!
    const scored = [...players]
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);

    this.entryBgs.clear();

    const placeholders = [
      '🥇 Chờ người dẫn đầu...',
      '🥈 Vị trí Á quân...',
      '🥉 Vị trí Quý quân...',
      '4. Đoán đúng lên Top!',
      '5. Bình luận ngay để ghi điểm',
    ];

    for (let i = 0; i < 5; i++) {
      const p = scored[i];
      const y = 415 + i * 20;

      if (p) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const displayName = p.nickname.length > 10 ? p.nickname.slice(0, 9) + '…' : p.nickname;
        this.topEntries[i].setText(`${medal} ${displayName} : ${p.score}đ`);
        this.topEntries[i].setColor(i === 0 ? '#fde047' : i === 1 ? '#e2e8f0' : i === 2 ? '#fdba74' : '#cbd5e1');
        this.topEntries[i].setFontStyle(i < 3 ? 'bold' : 'normal');

        // Row highlighting for Top 1, 2, 3
        if (i === 0) {
          this.entryBgs.fillStyle(0x78350f, 0.75);
          this.entryBgs.fillRoundedRect(298, y - 2, 208, 18, 6);
          this.entryBgs.lineStyle(1.2, 0xfde047, 0.9);
          this.entryBgs.strokeRoundedRect(298, y - 2, 208, 18, 6);
        } else if (i === 1) {
          this.entryBgs.fillStyle(0x1e293b, 0.75);
          this.entryBgs.fillRoundedRect(298, y - 2, 208, 18, 6);
          this.entryBgs.lineStyle(1, 0x94a3b8, 0.6);
          this.entryBgs.strokeRoundedRect(298, y - 2, 208, 18, 6);
        } else if (i === 2) {
          this.entryBgs.fillStyle(0x1e293b, 0.6);
          this.entryBgs.fillRoundedRect(298, y - 2, 208, 18, 6);
          this.entryBgs.lineStyle(1, 0xd97706, 0.5);
          this.entryBgs.strokeRoundedRect(298, y - 2, 208, 18, 6);
        }
      } else {
        this.topEntries[i].setText(placeholders[i]);
        this.topEntries[i].setColor(i === 0 ? '#94a3b8' : '#64748b');
        this.topEntries[i].setFontStyle('normal');
      }
    }

    if (scored.length > 0) {
      this.scene.tweens.add({
        targets: this.topEntries.slice(0, Math.min(3, scored.length)),
        scale: { from: 1.05, to: 1 },
        duration: 180,
        ease: 'Quad.easeOut',
      });
    }
  }

  public setChatTicker(comment: string, nickname: string): void {
    this.chatTickerText.setText(`💬 ${nickname}: ${comment}`);
    this.scene.tweens.add({
      targets: this.chatTickerText,
      scale: { from: 1.05, to: 1 },
      duration: 150,
      ease: 'Quad.easeOut',
    });
  }
}

