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
  private idleTween?: Phaser.Tweens.Tween;
  private waitCheerTimer?: Phaser.Time.TimerEvent;
  private isWalkingIn: boolean = false;
  private isWaitingMode: boolean = false;

  constructor(scene: Phaser.Scene, player: RebusPlayerRecord, avatarManager: AvatarManager, x: number, y: number, scale: number) {
    super(scene, x, y);
    this.player = player;
    this.avatarManager = avatarManager;
    this.setScale(scale);

    this.skinId = SKIN_KEYS[player.skinIndex % SKIN_KEYS.length];
    const baseKey = `student_${this.skinId}`;
    const textureKey = scene.textures.exists(baseKey) ? baseKey : 'props_desk';
    this.chibiSprite = scene.add.sprite(0, 12, textureKey);
    this.chibiSprite.setOrigin(0.5, 0.85);
    this.chibiSprite.setScale(0.76);
    this.add(this.chibiSprite);

    // Overlay UI sits at 1:1 world scale above the desk front layer (depth + 2) for crisp text
    this.uiOverlay = scene.add.container(x, y);

    // Desk plate
    const plate = scene.add.graphics();
    plate.fillStyle(0x0f172a, 0.9);
    plate.fillRoundedRect(-27, 2, 54, 18, 4);
    plate.lineStyle(1, player.team === 'blue' ? 0x38bdf8 : 0xf59e0b, 0.9);
    plate.strokeRoundedRect(-27, 2, 54, 18, 4);
    this.uiOverlay.add(plate);

    this.nameText = scene.add.text(0, 7.5, this.formatName(player.nickname), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '7.5px',
      color: '#ffffff',
      fontStyle: 'bold',
      resolution: 3,
    }).setOrigin(0.5);
    this.uiOverlay.add(this.nameText);

    this.scoreText = scene.add.text(0, 15.5, `${player.score}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '7px',
      color: '#facc15',
      fontStyle: 'bold',
      resolution: 3,
    }).setOrigin(0.5);
    this.uiOverlay.add(this.scoreText);

    this.avatarCircle = scene.add.graphics();
    this.avatarCircle.fillStyle(0x0f172a, 0.9);
    this.avatarCircle.fillCircle(-16, -20, 7);
    this.avatarCircle.lineStyle(1, 0xffd700, 1);
    this.avatarCircle.strokeCircle(-16, -20, 7);
    this.uiOverlay.add(this.avatarCircle);

    this.streakBadge = scene.add.container(16, -20);
    const flameBg = scene.add.graphics();
    flameBg.fillStyle(0xf97316, 0.95);
    flameBg.fillCircle(0, 0, 6);
    flameBg.lineStyle(1, 0xfef08a, 1);
    flameBg.strokeCircle(0, 0, 6);
    this.streakBadge.add(flameBg);

    this.streakText = scene.add.text(0, 0, `x${player.streak}`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '6px',
      color: '#ffffff',
      fontStyle: 'bold',
      resolution: 3,
    }).setOrigin(0.5);
    this.streakBadge.add(this.streakText);
    this.streakBadge.setVisible(player.streak >= 2);
    this.uiOverlay.add(this.streakBadge);

    this.setupAvatar();
    this.startIdleAnimation();
    scene.add.existing(this);
  }

  private formatName(name: string): string {
    const trimmed = name.trim();
    return trimmed.length > 10 ? `${trimmed.slice(0, 9)}…` : trimmed;
  }

  public override setPosition(x?: number, y?: number, z?: number, w?: number): this {
    super.setPosition(x, y, z, w);
    this.uiOverlay?.setPosition(this.x, this.y);
    return this;
  }

  public override setScale(x: number, y?: number): this {
    super.setScale(x, y);
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
          this.avatarImage = this.scene.add.image(-16, -20, texKey);
          this.avatarImage.setDisplaySize(13, 13);
          this.uiOverlay.add(this.avatarImage);
        }
      });
    }
  }

  public updatePlayer(player: RebusPlayerRecord): void {
    this.player = player;
    this.nameText.setText(this.formatName(player.nickname));
    this.scoreText.setText(`${player.score}`);

    if (player.streak >= 2) {
      this.streakBadge.setVisible(true);
      this.streakText.setText(`x${player.streak}`);
    } else {
      this.streakBadge.setVisible(false);
    }
  }

  public setWaitingMode(enabled: boolean): void {
    this.isWaitingMode = enabled;
    if (!this.isWalkingIn) {
      this.startIdleAnimation();
    }
  }

  private startIdleAnimation(): void {
    this.idleTween?.stop();
    this.waitCheerTimer?.remove(false);
    this.waitCheerTimer = undefined;
    this.chibiSprite.setAngle(0);
    this.chibiSprite.setY(12);

    if (this.isWaitingMode) {
      const delay = Math.random() * 450;
      const swayDir = Math.random() < 0.5 ? -1 : 1;
      this.idleTween = this.scene.tweens.add({
        targets: this.chibiSprite,
        y: 2,
        angle: { from: -6 * swayDir, to: 6 * swayDir },
        duration: 360 + Math.random() * 140,
        yoyo: true,
        repeat: -1,
        delay,
        ease: 'Sine.easeInOut',
      });
      this.waitCheerTimer = this.scene.time.addEvent({
        delay: 2600 + Math.random() * 2400,
        loop: true,
        callback: () => {
          if (!this.scene || !this.chibiSprite.scene || this.isWalkingIn) return;
          this.setTemporaryPose('happy', 1100);
          this.scene.tweens.add({
            targets: this,
            y: this.y - 12,
            duration: 160,
            yoyo: true,
            repeat: 1,
            ease: 'Quad.easeOut',
          });
        },
      });
      return;
    }

    const delay = Math.random() * 1000;
    this.idleTween = this.scene.tweens.add({
      targets: this.chibiSprite,
      y: 9,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      delay,
      ease: 'Sine.easeInOut',
    });
  }

  public walkInFromEntrance(delayMs: number = 0): void {
    const targetX = this.x;
    const targetY = this.y;
    const startX = targetX <= 270 ? -24 : 564;
    const walkDuration = Math.round(380 + Math.abs(targetX - startX) * 1.4);

    this.isWalkingIn = true;
    this.idleTween?.stop();
    this.setPosition(startX, targetY);
    this.setAlpha(0);
    this.uiOverlay.setAlpha(0);

    const beginWalk = () => {
      if (!this.scene || !this.chibiSprite.scene) return;
      this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 160,
        ease: 'Quad.easeOut',
      });

      const stepTween = this.scene.tweens.add({
        targets: this.chibiSprite,
        angle: { from: -5, to: 5 },
        y: 7,
        duration: 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.scene.tweens.add({
        targets: this,
        x: targetX,
        duration: walkDuration,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          stepTween.stop();
          this.isWalkingIn = false;
          if (!this.scene || !this.chibiSprite.scene) return;
          this.chibiSprite.setAngle(0);
          this.chibiSprite.setY(12);
          this.uiOverlay.setPosition(targetX, targetY);
          this.scene.tweens.add({
            targets: this.uiOverlay,
            alpha: 1,
            duration: 200,
            ease: 'Quad.easeOut',
          });
          this.startIdleAnimation();
        },
      });
    };

    if (delayMs > 0) {
      this.scene.time.delayedCall(delayMs, beginWalk);
    } else {
      beginWalk();
    }
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
    if (this.isWalkingIn) return;
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

