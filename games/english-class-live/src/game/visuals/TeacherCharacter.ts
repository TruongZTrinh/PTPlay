import Phaser from 'phaser';
import { TeacherState } from '../types.js';

export class TeacherCharacter {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Image;
  private glowFx: Phaser.GameObjects.Image | null = null;
  private pointerSparkle: Phaser.GameObjects.Image | null = null;

  public currentState: TeacherState = 'idle';
  private idleTween: Phaser.Tweens.Tween | null = null;
  private talkingTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x = 96, y = 420) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setDepth(15);

    // Main teacher sprite with bottom-center anchor
    this.sprite = scene.add.image(0, 0, 'teacher_idle');
    this.sprite.setDisplaySize(185, 260);
    this.sprite.setOrigin(0.5, 1.0);

    this.container.add(this.sprite);

    this.startIdleAnimation();
  }

  public setState(state: TeacherState, autoRevertMs?: number): void {
    if (this.currentState === state) return;
    this.currentState = state;

    // Stop speaking timer if switching away from talk
    if (this.talkingTimer && state !== 'talk') {
      this.talkingTimer.remove();
      this.talkingTimer = null;
    }

    // Switch texture cleanly
    const textureKey = `teacher_${state}`;
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
    }

    // Apply pose-specific tween and motion
    switch (state) {
      case 'idle':
        this.startIdleAnimation();
        break;

      case 'point':
        this.stopIdleTween();
        // Arm extension toward chalkboard with slight scale pop
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.03,
          scaleY: 1.02,
          duration: 250,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        break;

      case 'talk':
        this.startTalkingLipFlap();
        break;

      case 'happy':
      case 'cheer':
        this.stopIdleTween();
        // Joyful energetic bounce
        this.scene.tweens.add({
          targets: this.sprite,
          y: -14,
          duration: 180,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (this.currentState === state) {
              this.startIdleAnimation();
            }
          },
        });
        break;

      case 'clap':
        this.stopIdleTween();
        // Clapping side-to-side cadence
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 0.96,
          duration: 140,
          yoyo: true,
          repeat: 5,
          ease: 'Sine.easeInOut',
        });
        break;

      case 'think':
        this.stopIdleTween();
        // Head tilt thoughtful pause
        this.scene.tweens.add({
          targets: this.sprite,
          angle: -3,
          duration: 350,
          ease: 'Quad.easeOut',
        });
        break;

      case 'surprise':
        this.stopIdleTween();
        // Eyes wide surprise jump
        this.scene.tweens.add({
          targets: this.sprite,
          y: -18,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          yoyo: true,
          ease: 'Back.easeOut',
        });
        break;

      case 'sad':
        this.stopIdleTween();
        // Subtle sympathetic droop
        this.scene.tweens.add({
          targets: this.sprite,
          y: 4,
          angle: 2,
          duration: 300,
          ease: 'Sine.easeOut',
        });
        break;

      case 'explain':
        this.stopIdleTween();
        // Gentle welcoming sway
        this.scene.tweens.add({
          targets: this.sprite,
          angle: 2,
          duration: 400,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
        break;
    }

    if (autoRevertMs && autoRevertMs > 0) {
      this.scene.time.delayedCall(autoRevertMs, () => {
        if (this.currentState === state) {
          this.setState('idle');
        }
      });
    }
  }

  private startIdleAnimation(): void {
    this.stopIdleTween();
    this.sprite.setAngle(0);
    this.sprite.setY(0);

    // Natural breathing / idle bobbing cycle
    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.025,
      y: -3,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopIdleTween(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
  }

  private startTalkingLipFlap(): void {
    this.stopIdleTween();
    let isTalkTexture = true;

    this.talkingTimer = this.scene.time.addEvent({
      delay: 180,
      repeat: 12,
      callback: () => {
        isTalkTexture = !isTalkTexture;
        this.sprite.setTexture(isTalkTexture ? 'teacher_talk' : 'teacher_idle');
        this.sprite.setY(isTalkTexture ? -2 : 0);
      },
      callbackScope: this,
    });
  }

  public celebrateVictory(): void {
    this.setState('cheer');
    // Spawn festive sparkles around teacher
    for (let i = 0; i < 6; i++) {
      const offsetX = Phaser.Math.Between(-50, 50);
      const offsetY = Phaser.Math.Between(-200, -60);
      const star = this.scene.add
        .image(this.container.x + offsetX, this.container.y + offsetY, 'fx_star')
        .setDisplaySize(20, 20)
        .setDepth(25);

      this.scene.tweens.add({
        targets: star,
        y: star.y - 40,
        alpha: 0,
        scale: 1.5,
        duration: 900 + i * 100,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  public destroy(): void {
    this.stopIdleTween();
    if (this.talkingTimer) this.talkingTimer.remove();
    this.container.destroy();
  }
}
