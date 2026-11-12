import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';

export class Scoreboard extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private rankRows: Phaser.GameObjects.Text[] = [];
  private rankScores: Phaser.GameObjects.Text[] = [];
  private classCount: Phaser.GameObjects.Text;
  private activeCount: Phaser.GameObjects.Text;
  private ticker: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawPanels();

    this.add(scene.add.text(119, 368, 'HOẠT ĐỘNG LỚP', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#07533e', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.add(scene.add.text(423, 368, 'BẢNG VINH DANH', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#07533e', fontStyle: 'bold',
    }).setOrigin(0.5));

    this.classCount = scene.add.text(73, 410, '0', {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', color: '#07533e', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.classCount);
    this.add(scene.add.text(73, 432, 'TRONG LỚP', {
      fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#376b54', fontStyle: 'bold',
    }).setOrigin(0.5));

    this.activeCount = scene.add.text(165, 410, '0', {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', color: '#98602c', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.activeCount);
    this.add(scene.add.text(165, 432, 'ĐÃ GHI ĐIỂM', {
      fontFamily: 'system-ui, sans-serif', fontSize: '9px', color: '#98602c', fontStyle: 'bold',
    }).setOrigin(0.5));
    const interactionRules = [
      { y: 459, label: '🎁 Quà 1 Xu+: +20đ, Mở 1 chữ/quà', color: '#fff0bf' },
      { y: 474, label: '➕ Follow: Mở gợi ý 1', color: '#e0efdc' },
      { y: 489, label: '❤️ 20 Tim: Cộng +5 giây', color: '#ffd6e0' },
      { y: 504, label: '💥 Quà 1 Xu+: Đá người ngủ vào bàn', color: '#fde68a' },
    ];
    for (const rule of interactionRules) {
      this.add(scene.add.text(36, rule.y, rule.label, {
        fontFamily: 'system-ui, sans-serif', fontSize: '9.5px', color: rule.color, fontStyle: 'bold',
      }).setOrigin(0, 0.5));
    }

    for (let i = 0; i < 5; i++) {
      const y = 395 + i * 25;
      this.add(scene.add.text(346, y, String(i + 1), {
        fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: i < 3 ? '#ffffff' : '#87633d', fontStyle: 'bold',
      }).setOrigin(0.5));
      const row = scene.add.text(363, y, '', {
        fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#064e3b', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.rankRows.push(row);
      this.add(row);
      const score = scene.add.text(510, y, '—', {
        fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#8b6030', fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      this.rankScores.push(score);
      this.add(score);
    }

    this.add(scene.add.text(63, 929, 'LIVE', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.ticker = scene.add.text(100, 929, '💬 Bình luận đáp án để tham gia lớp học!', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      fixedWidth: 398,
    }).setOrigin(0, 0.5);
    this.add(this.ticker);

    scene.add.existing(this);
    this.setDepth(70);
  }

  private drawPanels(): void {
    const g = this.graphics;
    for (const x of [18, 322]) {
      g.fillStyle(0x382416, 0.6);
      g.fillRoundedRect(x + 2, 354, 202, 173, 12);
      g.fillStyle(0x925328, 1);
      g.fillRoundedRect(x, 350, 202, 173, 12);
      g.fillStyle(0xffe7a6, 1);
      g.fillRoundedRect(x + 3, 353, 196, 167, 10);
      g.fillStyle(0xfff9df, 1);
      g.fillRoundedRect(x + 6, 356, 190, 161, 8);
      g.lineStyle(1, 0xe7bd73, 1);
      g.lineBetween(x + 13, 380, x + 189, 380);
    }
    // Two equally sized counters read at a glance on a phone screen.
    g.fillStyle(0xe5efdc, 1);
    g.fillRoundedRect(30, 389, 86, 55, 8);
    g.fillStyle(0xffedc6, 1);
    g.fillRoundedRect(122, 389, 86, 55, 8);
    g.fillStyle(0x07533e, 1);
    g.fillRoundedRect(30, 449, 178, 64, 8);

    const rankColors = [0xc7952b, 0x8d9c9b, 0xb87c4b, 0xf0e4c8, 0xf0e4c8];
    for (let i = 0; i < 5; i++) {
      const y = 395 + i * 25;
      g.fillStyle(i === 0 ? 0xffecc1 : i % 2 === 0 ? 0xfff3d8 : 0xfffcf1, 1);
      g.fillRoundedRect(332, y - 11, 182, 23, 6);
      g.fillStyle(rankColors[i], 1);
      g.fillCircle(346, y, 9);
    }

    g.fillStyle(0x071c19, 0.96);
    g.fillRoundedRect(25, 912, 490, 35, 12);
    g.lineStyle(2, 0xfacc15, 1);
    g.strokeRoundedRect(25, 912, 490, 35, 12);
    g.fillStyle(0xe11d48, 1);
    g.fillRoundedRect(36, 918, 54, 22, 10);
  }

  public updateLeaderboard(players: RebusPlayerRecord[]): void {
    const scored = [...players].filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount);
    this.classCount.setText(String(players.length));
    this.activeCount.setText(String(scored.length));
    this.rankRows.forEach((row, i) => {
      const p = scored[i];
      const score = this.rankScores[i];
      score.setText(p ? `${p.score.toLocaleString('vi-VN')}đ` : '—');
      score.setFontSize(11);
      if (score.width > 48) score.setFontSize(9);
      row.setText(p ? p.nickname : 'Chờ bạn ghi điểm');
      row.setColor(p ? '#164e39' : '#95856b');
      row.setFontStyle(p ? 'bold' : 'normal');
      const availableWidth = score.x - score.width - row.x - 7;
      const chars = Array.from(row.text);
      while (row.width > availableWidth && chars.length > 1) {
        chars.pop();
        row.setText(`${chars.join('')}…`);
      }
    });
  }

  public setChatTicker(comment: string, nickname: string): void {
    this.ticker.setText(`💬 ${nickname}: ${comment}`);
    this.scene.tweens.add({
      targets: this.ticker, scale: { from: 1.04, to: 1 }, duration: 180, ease: 'Quad.easeOut',
    });
  }
}
