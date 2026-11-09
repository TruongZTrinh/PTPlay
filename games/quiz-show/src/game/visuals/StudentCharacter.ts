import Phaser from 'phaser';
import { PlayerRecord } from '../types';
import { AvatarManager } from '../systems/AvatarManager';

const SKIN_KEYS = [
  'student_blue',
  'student_red',
  'student_purple',
  'student_pink',
  'student_yellow',
  'student_green',
  'student_teal',
  'student_orange',
];

export class StudentCharacter extends Phaser.GameObjects.Container {
  public player: PlayerRecord;
  private avatarManager: AvatarManager;
  private chibiSprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private avatarImage: Phaser.GameObjects.Image | null = null;
  private avatarCircle: Phaser.GameObjects.Graphics;
  private streakBadge: Phaser.GameObjects.Container;
  private streakText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: PlayerRecord, avatarManager: AvatarManager, x: number, y: number, scale: number) {
    super(scene, x, y);
    this.player = player;
    this.avatarManager = avatarManager;
    this.setScale(scale);

    // Chibi Sprite
    const skinKey = SKIN_KEYS[player.skinIndex % SKIN_KEYS.length];
    const textureKey = scene.textures.exists(skinKey) ? skinKey : 'props_desk';
    this.chibiSprite = scene.add.sprite(0, 0, textureKey);
    this.chibiSprite.setOrigin(0.5, 0.85);
    this.chibiSprite.setScale(0.5);
    this.add(this.chibiSprite);

    // Desk plate
    const plate = scene.add.graphics();
    plate.fillStyle(0x1e1b4b, 0.85);
    plate.fillRoundedRect(-50, 5, 100, 36, 8);
    plate.lineStyle(1.5, player.team === 'blue' ? 0x38bdf8 : 0xf43f5e, 0.8);
    plate.strokeRoundedRect(-50, 5, 100, 36, 8);
    this.add(plate);

    // Name Text
    this.nameText = scene.add.text(0, 14, player.nickname, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.nameText);

    // Score Text
    this.scoreText = scene.add.text(0, 29, `${player.score}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(this.scoreText);

    // Avatar Circle Frame
    this.avatarCircle = scene.add.graphics();
    this.avatarCircle.fillStyle(0x0f172a, 0.9);
    this.avatarCircle.fillCircle(-32, -45, 16);
    this.avatarCircle.lineStyle(2, 0xffd700, 1);
    this.avatarCircle.strokeCircle(-32, -45, 16);
    this.add(this.avatarCircle);

    // Streak Flame Badge
    this.streakBadge = scene.add.container(32, -45);
    const flameBg = scene.add.graphics();
    flameBg.fillStyle(0xf97316, 0.95);
    flameBg.fillCircle(0, 0, 13);
    flameBg.lineStyle(1.5, 0xfef08a, 1);
    flameBg.strokeCircle(0, 0, 13);
    this.streakBadge.add(flameBg);

    this.streakText = scene.add.text(0, 0, `x${player.streak}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.streakBadge.add(this.streakText);
    this.streakBadge.setVisible(player.streak >= 2);
    this.add(this.streakBadge);

    this.setupAvatar();
    this.startIdleAnimation();
    scene.add.existing(this);
  }

  private setupAvatar(): void {
    if (this.player.avatarUrl && this.avatarManager.isSafeUrl(this.player.avatarUrl)) {
      this.avatarManager.loadAvatar(this.player.userId, this.player.avatarUrl, () => {
        const texKey = this.avatarManager.getTextureKey(this.player.userId);
        if (this.scene.textures.exists(texKey)) {
          if (this.avatarImage) this.avatarImage.destroy();
          this.avatarImage = this.scene.add.image(-32, -45, texKey);
          this.avatarImage.setDisplaySize(30, 30);
          this.add(this.avatarImage);
        }
      });
    }
  }

  public updatePlayer(player: PlayerRecord): void {
    this.player = player;
    this.nameText.setText(player.nickname);
    this.scoreText.setText(`${player.score}`);

    if (player.streak >= 2) {
      this.streakBadge.setVisible(true);
      this.streakText.setText(`x${player.streak}`);
    } else {
      this.streakBadge.setVisible(false);
    }
  }

  private startIdleAnimation(): void {
    const delay = Math.random() * 1000;
    this.scene.tweens.add({
      targets: this.chibiSprite,
      y: -3,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      delay,
      ease: 'Sine.easeInOut',
    });
  }

  public reactCorrect(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 18,
      duration: 180,
      yoyo: true,
      repeat: 2,
      ease: 'Quad.easeOut',
    });
  }

  public reactWrong(): void {
    this.scene.tweens.add({
      targets: this.chibiSprite,
      angle: -10,
      duration: 120,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeInOut',
    });
  }
}

