import Phaser from 'phaser';
import { RebusPlayerRecord } from '../types';
import { AvatarManager } from '../systems/AvatarManager';

const SKIN_KEYS = [
  'boy_01',
  'girl_01',
  'boy_02',
  'girl_02',
  'boy_03',
  'girl_03',
  'boy_04',
  'girl_04',
];

export class StudentCharacter extends Phaser.GameObjects.Container {
  public player: RebusPlayerRecord;
  private avatarManager: AvatarManager;
  private skinId: string;
  private chibiSprite: Phaser.GameObjects.Sprite;
  private uiOverlay: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private avatarImage: Phaser.GameObjects.Image | null = null;
  private avatarCircle: Phaser.GameObjects.Graphics;
  private streakBadge: Phaser.GameObjects.Container;
  private streakText: Phaser.GameObjects.Text;
  private poseTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: RebusPlayerRecord, avatarManager: AvatarManager, x: number, y: number, scale: number) {
    super(scene, x, y);
    this.player = player;
    this.avatarManager = avatarManager;
    this.setScale(scale);

    this.skinId = SKIN_KEYS[player.skinIndex % SKIN_KEYS.length];
    const baseKey = `student_${this.skinId}`;
    const textureKey = scene.textures.exists(baseKey) ? baseKey : 'props_desk';
    this.chibiSprite = scene.add.sprite(0, 14, textureKey);
    this.chibiSprite.setOrigin(0.5, 0.85);
    this.chibiSprite.setScale(0.72);
    this.add(this.chibiSprite);

    // Overlay UI sits above the desk front layer (depth + 2)
    this.uiOverlay = scene.add.container(x, y);
    this.uiOverlay.setScale(scale);

    // Desk plate
    const plate = scene.add.graphics();
    plate.fillStyle(0x0f172a, 0.88);
    plate.fillRoundedRect(-52, 8, 104, 34, 8);
    plate.lineStyle(1.5, player.team === 'blue' ? 0x38bdf8 : 0xf59e0b, 0.85);
    plate.strokeRoundedRect(-52, 8, 104, 34, 8);
    this.uiOverlay.add(plate);

    this.nameText = scene.add.text(0, 17, player.nickname, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiOverlay.add(this.nameText);

    this.scoreText = scene.add.text(0, 32, `${player.score}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.uiOverlay.add(this.scoreText);

    this.avatarCircle = scene.add.graphics();
    this.avatarCircle.fillStyle(0x0f172a, 0.9);
    this.avatarCircle.fillCircle(-34, -44, 15);
    this.avatarCircle.lineStyle(2, 0xffd700, 1);
    this.avatarCircle.strokeCircle(-34, -44, 15);
    this.uiOverlay.add(this.avatarCircle);

    this.streakBadge = scene.add.container(34, -44);
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
    this.uiOverlay.add(this.streakBadge);

    this.setupAvatar();
    this.startIdleAnimation();
    scene.add.existing(this);
  }

  public override setPosition(x?: number, y?: number, z?: number, w?: number): this {
    super.setPosition(x, y, z, w);
    this.uiOverlay?.setPosition(this.x, this.y);
    return this;
  }

  public override setScale(x: number, y?: number): this {
    super.setScale(x, y);
    this.uiOverlay?.setScale(this.scaleX, this.scaleY);
    return this;
  }

  public override setDepth(value: number): this {
    super.setDepth(value);
    this.uiOverlay?.setDepth(value + 2);
    return this;
  }

  public override destroy(fromScene?: boolean): void {
    this.poseTimer?.remove(false);
    this.uiOverlay?.destroy(fromScene);
    super.destroy(fromScene);
  }

  private setupAvatar(): void {
    if (this.player.avatarUrl && this.avatarManager.isSafeUrl(this.player.avatarUrl)) {
      this.avatarManager.loadAvatar(this.player.userId, this.player.avatarUrl, () => {
        const texKey = this.avatarManager.getTextureKey(this.player.userId);
        if (this.scene.textures.exists(texKey)) {
          if (this.avatarImage) this.avatarImage.destroy();
          this.avatarImage = this.scene.add.image(-34, -44, texKey);
          this.avatarImage.setDisplaySize(28, 28);
          this.uiOverlay.add(this.avatarImage);
        }
      });
    }
  }

  public updatePlayer(player: RebusPlayerRecord): void {
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
      y: 11,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      delay,
      ease: 'Sine.easeInOut',
    });
  }

  private setTemporaryPose(suffix: 'happy' | 'sleep', durationMs: number): void {
    const poseKey = `student_${this.skinId}_${suffix}`;
    const idleKey = `student_${this.skinId}`;
    if (this.poseTimer) {
      this.poseTimer.remove(false);
      this.poseTimer = undefined;
    }
    if (this.scene.textures.exists(poseKey)) {
      this.chibiSprite.setTexture(poseKey);
      this.poseTimer = this.scene.time.delayedCall(durationMs, () => {
        if (this.chibiSprite.scene && this.scene.textures.exists(idleKey)) {
          this.chibiSprite.setTexture(idleKey);
        }
      });
    }
  }

  public reactCorrect(): void {
    this.setTemporaryPose('happy', 1400);
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
    this.setTemporaryPose('sleep', 800);
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

