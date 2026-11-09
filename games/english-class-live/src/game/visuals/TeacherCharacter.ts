import Phaser from 'phaser';
import { TeacherState } from '../types.js';
import { TeacherPose, TeacherPoseController, mapTeacherStateToPose } from './TeacherPoseController.js';

export class TeacherCharacter {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public poseController: TeacherPoseController;
  public sprite: Phaser.GameObjects.Image;

  public currentState: TeacherState = 'idle';
  private currentTween: Phaser.Tweens.Tween | null = null;
  private autoRevertTimer: Phaser.Time.TimerEvent | null = null;

  public readonly x: number;
  public readonly bottomY: number;
  public readonly maxHeight: number;
  public readonly maxWidth: number;
  public shadow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x = 98, bottomY = 450, maxHeight = 295, maxWidth = 200) {
    this.scene = scene;
    this.x = x;
    this.bottomY = bottomY;
    this.maxHeight = maxHeight;
    this.maxWidth = maxWidth;

    // Soft grounded contact shadow on classroom parquet floor
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x0e0906, 0.44);
    this.shadow.fillEllipse(this.x, this.bottomY - 4, 115, 20);
    this.shadow.setDepth(21);

    // Outer container for positioning & depth management (in front of back-row desks, depth sorted)
    this.container = scene.add.container(0, 0).setDepth(22);

    // Underlying TeacherPoseController manages still textures & uniform fitting
    this.poseController = new TeacherPoseController(scene, x, bottomY, maxHeight, maxWidth);
    this.sprite = this.poseController.sprite;
    this.container.add(this.sprite);

    // Initial state
    this.setState('idle');
  }

  /**
   * Maps any requested teacher state to one of the 6 canonical poses:
   * idle, point, talk, happy, sad, cheer
   */
  public mapStateToPose(state: TeacherState): TeacherPose {
    return mapTeacherStateToPose(state);
  }

  public setState(state: TeacherState, autoRevertMs?: number): void {
    if (this.currentState === state && this.currentTween?.isPlaying()) {
      return;
    }

    this.currentState = state;
    const pose = this.mapStateToPose(state);

    // Clear any pending revert timer
    if (this.autoRevertTimer) {
      this.autoRevertTimer.remove();
      this.autoRevertTimer = null;
    }

    // Stop existing procedural tween and restore exact baseline geometry
    this.stopCurrentTween();

    // Set texture & uniform fit
    this.poseController.setPose(pose);
    const baseScale = this.poseController.baseScale;

    // Apply procedural motion according to pose
    switch (pose) {
      case 'idle':
        this.startIdleAnimation();
        break;

      case 'point':
        // Assertive arm extension toward chalkboard with subtle scale punch
        this.currentTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: baseScale * 1.025,
          scaleY: baseScale * 1.02,
          duration: 220,
          yoyo: true,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.resetSpriteTransform();
          },
        });
        break;

      case 'talk':
        // Rhythmic speaking cadence (gentle head/posture bobbing)
        this.currentTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.bottomY - 3,
          scaleY: baseScale * 1.015,
          duration: 240,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        break;

      case 'happy':
        // Joyful energetic bounce
        this.currentTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.bottomY - 10,
          scaleY: baseScale * 1.02,
          duration: 200,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.resetSpriteTransform();
            if (this.currentState === 'happy') {
              this.startIdleAnimation();
            }
          },
        });
        break;

      case 'sad':
        // Sympathetic posture shift
        this.currentTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.bottomY + 2,
          angle: 1.5,
          duration: 350,
          ease: 'Sine.easeOut',
        });
        break;

      case 'cheer':
        // High celebratory jump
        this.currentTween = this.scene.tweens.add({
          targets: this.sprite,
          y: this.bottomY - 14,
          scaleX: baseScale * 1.03,
          scaleY: baseScale * 1.03,
          duration: 220,
          yoyo: true,
          repeat: 3,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.resetSpriteTransform();
            if (this.currentState === 'cheer') {
              this.startIdleAnimation();
            }
          },
        });
        break;
    }

    // Schedule auto-revert to idle if duration is specified
    if (autoRevertMs && autoRevertMs > 0) {
      this.autoRevertTimer = this.scene.time.delayedCall(autoRevertMs, () => {
        if (this.currentState === state) {
          this.setState('idle');
        }
      });
    }
  }

  private startIdleAnimation(): void {
    this.stopCurrentTween();
    this.resetSpriteTransform();

    const baseScale = this.poseController.baseScale;
    // Gentle natural breathing cycle (subtle scaleY & upward offset, anchored at foot baseline)
    this.currentTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: baseScale * 1.015,
      y: this.bottomY - 2,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopCurrentTween(): void {
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }
    this.resetSpriteTransform();
  }

  private resetSpriteTransform(): void {
    this.sprite.setScale(this.poseController.baseScale);
    this.sprite.setPosition(this.x, this.bottomY);
    this.sprite.setAngle(0);
  }

  public celebrateVictory(): void {
    this.setState('cheer');

    // Spawn festive sparkles around teacher
    for (let i = 0; i < 6; i++) {
      const offsetX = Phaser.Math.Between(-40, 40);
      const offsetY = Phaser.Math.Between(-220, -70);
      const star = this.scene.add
        .image(this.x + offsetX, this.bottomY + offsetY, 'fx_star')
        .setDisplaySize(20, 20)
        .setDepth(25);

      this.scene.tweens.add({
        targets: star,
        y: star.y - 45,
        alpha: 0,
        scale: 1.5,
        duration: 800 + i * 120,
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  public destroy(): void {
    if (this.autoRevertTimer) {
      this.autoRevertTimer.remove();
      this.autoRevertTimer = null;
    }
    this.stopCurrentTween();
    this.shadow.destroy();
    this.poseController.destroy();
    this.container.destroy();
  }
}
