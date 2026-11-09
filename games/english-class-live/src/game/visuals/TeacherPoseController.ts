/**
 * PTPlay Teacher Still-Pose Controller for Phaser 3
 * Reference implementation based on PTPlay_Premium_Teacher_6_Poses_PNG_Pack
 *
 * Enforces:
 * - 6 genuine still poses: idle, point, talk, happy, sad, cheer
 * - Bottom-center origin (0.5, 1.0) anchoring feet consistently to the classroom floor
 * - Uniform aspect-ratio scaling (no independent X/Y stretching)
 * - Master 512x768 texture alignment with sub-pixel foot baseline
 */
import type Phaser from 'phaser';

export type TeacherPose = 'idle' | 'point' | 'talk' | 'happy' | 'sad' | 'cheer';

export const TEACHER_POSES: readonly TeacherPose[] = [
  'idle',
  'point',
  'talk',
  'happy',
  'sad',
  'cheer',
] as const;

/**
 * Maps any TeacherState (canonical or legacy) to one of the 6 canonical poses.
 */
export function mapTeacherStateToPose(state: string): TeacherPose {
  switch (state) {
    case 'idle':
      return 'idle';
    case 'point':
    case 'think':
      return 'point';
    case 'talk':
    case 'explain':
      return 'talk';
    case 'happy':
    case 'surprise':
      return 'happy';
    case 'sad':
      return 'sad';
    case 'cheer':
    case 'clap':
      return 'cheer';
    default:
      return 'idle';
  }
}

export function preloadTeacher(scene: Phaser.Scene, basePath = '/assets/english-class-v1/teacher/'): void {
  TEACHER_POSES.forEach((p) => {
    scene.load.image(`teacher_${p}`, `${basePath}teacher_${p}.png`);
  });
}

export class TeacherPoseController {
  public readonly sprite: Phaser.GameObjects.Image;
  private _currentPose: TeacherPose = 'idle';
  private _baseScale = 1;

  constructor(
    private scene: Phaser.Scene,
    public x: number,
    public bottomY: number,
    public maxHeight = 295,
    public maxWidth = 200
  ) {
    this.sprite = scene.add.image(x, bottomY, 'teacher_idle');
    this.sprite.setOrigin(0.5, 1.0);
    this.fit();
  }

  public get currentPose(): TeacherPose {
    return this._currentPose;
  }

  public get baseScale(): number {
    return this._baseScale;
  }

  /**
   * Sets teacher pose with smooth texture replacement while preserving
   * the exact bottom-center anchor and uniform scale factor.
   */
  public setPose(pose: TeacherPose): void {
    const textureKey = `teacher_${pose}`;
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
      this._currentPose = pose;
      this.fit();
    } else {
      console.warn(`[TeacherPoseController] Texture not found: ${textureKey}, fallback to idle`);
      this.sprite.setTexture('teacher_idle');
      this._currentPose = 'idle';
      this.fit();
    }
  }

  /**
   * Calculates uniform aspect-ratio scale so character stays strictly bounded
   * without stretching X and Y independently.
   */
  public fit(): void {
    const img = this.sprite;
    if (!img.width || !img.height) return;
    this._baseScale = Math.min(this.maxHeight / img.height, this.maxWidth / img.width);
    img.setScale(this._baseScale);
  }

  public move(x: number, bottomY: number): void {
    this.x = x;
    this.bottomY = bottomY;
    this.sprite.setPosition(x, bottomY);
  }

  public setDepth(depth: number): this {
    this.sprite.setDepth(depth);
    return this;
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
