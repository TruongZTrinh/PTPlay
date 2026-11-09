import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';

export class Scoreboard extends Phaser.GameObjects.Container {
  private boardBg: Phaser.GameObjects.Graphics;
  private topEntries: Phaser.GameObjects.Text[] = [];
  private chatTickerText: Phaser.GameObjects.Text;
  private chatTickerBg: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);

    this.boardBg = scene.add.graphics();
    this.add(this.boardBg);

    const title = scene.add.text(400, 395, '🏆 BẢNG XẾP HẠNG TUẦN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(title);

    this.drawBoard();

    for (let i = 0; i < 5; i++) {
      const entryText = scene.add.text(310, 415 + i * 18, `${i + 1}. ...`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: i === 0 ? '#fde047' : '#e2e8f0',
        fontStyle: i === 0 ? 'bold' : 'normal',
      });
      this.topEntries.push(entryText);
      this.add(entryText);
    }

    // Chat ticker at bottom
    this.chatTickerBg = scene.add.graphics();
    this.chatTickerBg.fillStyle(0x0f172a, 0.88);
    this.chatTickerBg.fillRoundedRect(30, 915, 480, 32, 10);
    this.chatTickerBg.lineStyle(1, 0xf59e0b, 0.6);
    this.chatTickerBg.strokeRoundedRect(30, 915, 480, 32, 10);
    this.add(this.chatTickerBg);

    this.chatTickerText = scene.add.text(270, 931, '💬 Bình luận đáp án tiếng Việt để tham gia đoán chữ!', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
    this.add(this.chatTickerText);

    scene.add.existing(this);
    this.setDepth(70);
  }

  private drawBoard(): void {
    this.boardBg.clear();
    this.boardBg.fillStyle(0x0f172a, 0.9);
    this.boardBg.fillRoundedRect(295, 382, 215, 130, 12);
    this.boardBg.lineStyle(1.5, 0xf59e0b, 0.8);
    this.boardBg.strokeRoundedRect(295, 382, 215, 130, 12);
  }

  public updateLeaderboard(players: RebusPlayerRecord[]): void {
    const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);
    for (let i = 0; i < 5; i++) {
      const p = sorted[i];
      if (p) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        this.topEntries[i].setText(`${medal} ${p.nickname} : ${p.score}đ`);
      } else {
        this.topEntries[i].setText(`${i + 1}. ---`);
      }
    }
  }

  public setChatTicker(comment: string, nickname: string): void {
    this.chatTickerText.setText(`💬 ${nickname}: ${comment}`);
  }
}

