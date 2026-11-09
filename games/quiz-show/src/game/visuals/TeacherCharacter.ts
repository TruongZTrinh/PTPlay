import Phaser from 'phaser';
import { QuizState } from '../types';

export class TeacherCharacter extends Phaser.GameObjects.Container {
  private teacherSprite: Phaser.GameObjects.Sprite;
  private currentPose: string = 'teacher_idle';
  private breathTween: Phaser.Tweens.Tween | null = null;
  private micGlow: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Subtle mic glow
    this.micGlow = scene.add.graphics();
    this.micGlow.fillStyle(0xec4899, 0.3);
    this.micGlow.fillCircle(30, 20, 15);
    this.add(this.micGlow);

    // Initial teacher sprite
    const initKey = scene.textures.exists('teacher_idle') ? 'teacher_idle' : 'props_podium';
    this.teacherSprite = scene.add.sprite(0, 0, initKey);
    this.teacherSprite.setOrigin(0.5, 0.85);
    this.teacherSprite.setScale(0.55);
    this.add(this.teacherSprite);

    this.startBreathingAnimation();
    scene.add.existing(this);
  }

  public setPose(poseKey: string): void {
    if (this.currentPose === poseKey) return;
    if (this.scene.textures.exists(poseKey)) {
      this.currentPose = poseKey;
      this.teacherSprite.setTexture(poseKey);

      // Cute pop effect on pose change
      this.scene.tweens.add({
        targets: this.teacherSprite,
        scaleX: 0.58,
        scaleY: 0.52,
        duration: 120,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    }
  }

  private startBreathingAnimation(): void {
    if (this.breathTween) this.breathTween.stop();

    this.breathTween = this.scene.tweens.add({
      targets: this.teacherSprite,
      scaleY: 0.56,
      y: -4,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public onStateChanged(state: QuizState): void {
    switch (state) {
      case 'intro':
        this.setPose('teacher_point');
        break;
      case 'asking':
        this.setPose('teacher_talk');
        break;
      case 'locked':
        this.setPose('teacher_think');
        break;
      case 'reveal':
        this.setPose('teacher_clap');
        break;
      case 'celebrate':
        this.setPose('teacher_cheer');
        break;
      case 'finished':
        this.setPose('teacher_happy');
        break;
      default:
        this.setPose('teacher_idle');
        break;
    }
  }

  public cheer(): void {
    this.setPose('teacher_cheer');
    this.scene.tweens.add({
      targets: this,
      y: this.y - 15,
      duration: 200,
      yoyo: true,
      repeat: 3,
      ease: 'Quad.easeInOut',
    });
  }
}
