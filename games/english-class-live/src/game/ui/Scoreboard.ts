import Phaser from 'phaser';
import { LeaderboardEntry, QuizMode, Team } from '../types.js';

export class Scoreboard {
  private scene: Phaser.Scene;
  public topContainer: Phaser.GameObjects.Container;
  public bottomContainer: Phaser.GameObjects.Container;
  public teamContainer: Phaser.GameObjects.Container;

  // Top HUD elements
  private liveStatusDot: Phaser.GameObjects.Graphics;
  private liveStatusText: Phaser.GameObjects.Text;
  private classScoreText: Phaser.GameObjects.Text;
  private studentCountText: Phaser.GameObjects.Text;

  // Top 3 Leaderboard elements
  private podiumText: Phaser.GameObjects.Text;

  // Team battle bar elements
  private redScoreText: Phaser.GameObjects.Text;
  private blueScoreText: Phaser.GameObjects.Text;
  private teamFillBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Top HUD Container (at y = 22)
    this.topContainer = scene.add.container(270, 24).setDepth(30);

    const hudBg = scene.add.graphics();
    hudBg.fillStyle(0x0f172a, 0.88);
    hudBg.fillRoundedRect(-260, -18, 520, 36, 8);
    hudBg.lineStyle(1.5, 0x334155, 0.8);
    hudBg.strokeRoundedRect(-260, -18, 520, 36, 8);
    this.topContainer.add(hudBg);

    // Title / Brand
    const brand = scene.add.text(-248, 0, '🎓 LỚP HỌC VUI', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#facc15',
    }).setOrigin(0, 0.5);
    this.topContainer.add(brand);

    // Live status indicator pill
    this.liveStatusDot = scene.add.graphics();
    this.liveStatusDot.fillStyle(0x22c55e, 1);
    this.liveStatusDot.fillCircle(-110, 0, 4);

    this.liveStatusText = scene.add.text(-102, 0, 'LIVE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#4ade80',
    }).setOrigin(0, 0.5);
    this.topContainer.add([this.liveStatusDot, this.liveStatusText]);

    // Class total score
    this.classScoreText = scene.add.text(20, 0, '⭐ ĐIỂM: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
    this.topContainer.add(this.classScoreText);

    // Student count badge
    this.studentCountText = scene.add.text(245, 0, '👥 0 Học sinh', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8',
    }).setOrigin(1, 0.5);
    this.topContainer.add(this.studentCountText);

    // 2. Top 3 Podium Pill (at y = 56)
    const podiumBg = scene.add.graphics();
    podiumBg.fillStyle(0x1e293b, 0.85);
    podiumBg.fillRoundedRect(-200, -11, 400, 22, 6);
    podiumBg.lineStyle(1, 0x475569, 0.6);
    podiumBg.strokeRoundedRect(-200, -11, 400, 22, 6);

    this.podiumText = scene.add.text(0, 0, '🥇 Đang đợi thí sinh tranh tài...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#fef08a',
    }).setOrigin(0.5, 0.5);

    const podiumContainer = scene.add.container(270, 56).setDepth(30);
    podiumContainer.add([podiumBg, this.podiumText]);

    // 3. Team Battle Bar Container (hidden unless team mode active)
    this.teamContainer = scene.add.container(270, 80).setDepth(30);
    const teamBg = scene.add.graphics();
    teamBg.fillStyle(0x0f172a, 0.9);
    teamBg.fillRoundedRect(-180, -10, 360, 20, 4);
    teamBg.lineStyle(1, 0x475569, 0.7);
    teamBg.strokeRoundedRect(-180, -10, 360, 20, 4);

    this.teamFillBar = scene.add.graphics();

    this.redScoreText = scene.add.text(-170, 0, 'ĐỎ: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#f87171',
    }).setOrigin(0, 0.5);

    this.blueScoreText = scene.add.text(170, 0, '0 :XANH', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#60a5fa',
    }).setOrigin(1, 0.5);

    this.teamContainer.add([teamBg, this.teamFillBar, this.redScoreText, this.blueScoreText]);
    this.teamContainer.setVisible(false);

    // 4. Bottom Command Strip (at y = 942)
    this.bottomContainer = scene.add.container(270, 940).setDepth(30);
    const botBg = scene.add.graphics();
    botBg.fillStyle(0x0f172a, 0.92);
    botBg.fillRoundedRect(-260, -16, 520, 32, 6);
    botBg.lineStyle(1.5, 0x334155, 0.8);
    botBg.strokeRoundedRect(-260, -16, 520, 32, 6);

    const tip = scene.add.text(0, 0, '💬 Gõ JOIN hoặc VÀO để vào lớp  •  Gõ A, B, C, D để trả lời', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f1f5f9',
    }).setOrigin(0.5, 0.5);

    this.bottomContainer.add([botBg, tip]);
  }

  public updateStats(classScore: number, studentCount: number): void {
    this.classScoreText.setText(`⭐ ĐIỂM: ${classScore}`);
    this.studentCountText.setText(`👥 ${studentCount} Học sinh`);
  }

  public updateConnectionStatus(connected: boolean, text = 'LIVE'): void {
    this.liveStatusDot.clear();
    this.liveStatusDot.fillStyle(connected ? 0x22c55e : 0x94a3b8, 1);
    this.liveStatusDot.fillCircle(-110, 0, 4);

    this.liveStatusText.setText(connected ? text : 'OFFLINE');
    this.liveStatusText.setColor(connected ? '#4ade80' : '#94a3b8');
  }

  public updateTop3(top: LeaderboardEntry[]): void {
    if (top.length === 0) {
      this.podiumText.setText('🥇 Hãy gõ JOIN hoặc A/B/C/D để bắt đầu!');
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const parts = top.slice(0, 3).map((p, i) => `${medals[i]} ${p.nickname} (${p.score}đ)`);
    this.podiumText.setText(parts.join('  '));
  }

  public updateTeamMode(active: boolean, redScore = 0, blueScore = 0): void {
    this.teamContainer.setVisible(active);
    if (!active) return;

    this.redScoreText.setText(`ĐỎ: ${redScore}`);
    this.blueScoreText.setText(`${blueScore} :XANH`);

    const total = Math.max(1, redScore + blueScore);
    const redRatio = redScore === 0 && blueScore === 0 ? 0.5 : redScore / total;

    this.teamFillBar.clear();
    const barW = 160;
    const barH = 8;
    const x = -80;
    const y = -4;

    // Red fill
    this.teamFillBar.fillStyle(0xef4444, 1);
    this.teamFillBar.fillRoundedRect(x, y, barW * redRatio, barH, 2);

    // Blue fill
    this.teamFillBar.fillStyle(0x3b82f6, 1);
    this.teamFillBar.fillRoundedRect(x + barW * redRatio, y, barW * (1 - redRatio), barH, 2);
  }
}
