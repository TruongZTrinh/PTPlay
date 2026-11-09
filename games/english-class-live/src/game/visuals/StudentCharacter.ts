import Phaser from 'phaser';
import { StudentAction, StudentPlayer, StudentSkin } from '../types.js';
import { AvatarManager } from '../systems/AvatarManager.js';

export class StudentCharacter {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Image;
  private deskSprite: Phaser.GameObjects.Image | null = null;
  private nameplateBg: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private avatarBadge: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null = null;
  private answerBadge: Phaser.GameObjects.Container | null = null;

  public player: StudentPlayer;
  public skin: StudentSkin;
  public currentAction: StudentAction = 'idle';
  private idleTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, player: StudentPlayer, seatX: number, seatY: number, avatarManager: AvatarManager) {
    this.scene = scene;
    this.player = player;
    this.skin = player.skin;

    this.container = scene.add.container(seatX, seatY).setDepth(20 + Math.floor(player.seatIndex / 5) * 4);

    // Chibi character sprite (aligned bottom-center)
    const textureKey = `${this.skin}_idle`;
    this.sprite = scene.add.image(0, 0, scene.textures.exists(textureKey) ? textureKey : 'blue_idle');
    this.sprite.setDisplaySize(58, 68);
    this.sprite.setOrigin(0.5, 1.0);
    this.container.add(this.sprite);

    // Wooden desk in front of student
    this.deskSprite = scene.add.image(0, 16, 'prop_desk');
    this.deskSprite.setDisplaySize(86, 44);
    this.deskSprite.setOrigin(0.5, 0.5);
    this.deskSprite.setDepth(2);
    this.container.add(this.deskSprite);

    // Nameplate background
    this.nameplateBg = scene.add.graphics();
    this.nameplateBg.setDepth(3);
    this.container.add(this.nameplateBg);

    // Nickname text
    const teamColor = player.team === 'red' ? '#ef4444' : player.team === 'blue' ? '#3b82f6' : '#ffffff';
    this.nameText = scene.add.text(0, -74, player.nickname, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: teamColor,
      align: 'center',
    });
    this.nameText.setOrigin(0.5, 1.0);
    this.nameText.setDepth(4);
    this.container.add(this.nameText);

    this.drawNameplate();
    this.setupAvatarBadge(avatarManager);
    this.startIdleMotion();
  }

  private drawNameplate(): void {
    this.nameplateBg.clear();
    const textW = Math.max(48, this.nameText.width + 10);
    const textH = 14;
    const x = -textW / 2;
    const y = -88;

    // Background pill with dark translucent border
    this.nameplateBg.fillStyle(0x0f172a, 0.85);
    this.nameplateBg.fillRoundedRect(x, y, textW, textH, 4);

    if (this.player.team === 'red') {
      this.nameplateBg.lineStyle(1.5, 0xef4444, 0.9);
      this.nameplateBg.strokeRoundedRect(x, y, textW, textH, 4);
    } else if (this.player.team === 'blue') {
      this.nameplateBg.lineStyle(1.5, 0x3b82f6, 0.9);
      this.nameplateBg.strokeRoundedRect(x, y, textW, textH, 4);
    } else {
      this.nameplateBg.lineStyle(1, 0x64748b, 0.6);
      this.nameplateBg.strokeRoundedRect(x, y, textW, textH, 4);
    }
  }

  private setupAvatarBadge(avatarManager: AvatarManager): void {
    // Generate circular fallback badge with initial
    const fallbackCanvas = avatarManager.getFallbackBadgeCanvas(
      this.player.nickname,
      this.player.team === 'red' ? '#dc2626' : this.player.team === 'blue' ? '#2563eb' : '#059669',
      32
    );
    const canvasKey = `avatar_badge_${this.player.id}`;
    if (!this.scene.textures.exists(canvasKey)) {
      this.scene.textures.addCanvas(canvasKey, fallbackCanvas);
    }

    const badgeImg = this.scene.add.image(0, -96, canvasKey);
    badgeImg.setDisplaySize(20, 20);
    badgeImg.setOrigin(0.5, 0.5);
    badgeImg.setDepth(5);
    this.container.add(badgeImg);
    this.avatarBadge = badgeImg;

    // If safe HTTPS URL available, load image and swap texture
    if (this.player.avatarUrl && avatarManager.isUrlSafe(this.player.avatarUrl)) {
      avatarManager.loadAvatarImage(
        this.player.avatarUrl,
        (img) => {
          if (!this.scene || !this.scene.textures) return;
          const imgKey = `avatar_real_${this.player.id}`;
          if (!this.scene.textures.exists(imgKey)) {
            const c = document.createElement('canvas');
            c.width = 64;
            c.height = 64;
            const ctx = c.getContext('2d');
            if (ctx) {
              ctx.beginPath();
              ctx.arc(32, 32, 30, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(img, 0, 0, 64, 64);
              this.scene.textures.addCanvas(imgKey, c);
            }
          }
          if (this.avatarBadge && this.scene.textures.exists(imgKey)) {
            (this.avatarBadge as Phaser.GameObjects.Image).setTexture(imgKey);
          }
        },
        () => {
          // Graceful fallback to initial badge already rendered
        }
      );
    }
  }

  public setAction(action: StudentAction): void {
    if (this.currentAction === action) return;
    this.currentAction = action;

    const textureKey = `${this.skin}_${action}`;
    if (this.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
    } else {
      this.sprite.setTexture(`${this.skin}_idle`);
    }
  }

  public walkInFromDoor(startX: number, startY: number, targetX: number, targetY: number, onComplete?: () => void): void {
    this.container.setPosition(startX, startY);
    this.setAction('walk');
    this.stopIdleMotion();

    // Bobbing walk tween
    const bob = this.scene.tweens.add({
      targets: this.sprite,
      y: -6,
      duration: 160,
      yoyo: true,
      repeat: 6,
      ease: 'Sine.easeInOut',
    });

    this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      y: targetY,
      duration: 950,
      ease: 'Sine.easeOut',
      onComplete: () => {
        bob.stop();
        this.setAction('idle');
        this.startIdleMotion();
        if (onComplete) onComplete();
      },
    });
  }

  public showAnswerChoice(choice: string): void {
    if (this.answerBadge) {
      this.answerBadge.destroy();
    }

    const badge = this.scene.add.container(18, -48);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x38bdf8, 1);
    bg.fillCircle(0, 0, 10);
    bg.lineStyle(1.5, 0xffffff, 1);
    bg.strokeCircle(0, 0, 10);

    const txt = this.scene.add.text(0, 0, choice, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    badge.add([bg, txt]);
    badge.setDepth(6);
    this.container.add(badge);
    this.answerBadge = badge;

    // Subtle scale pop
    this.scene.tweens.add({
      targets: badge,
      scale: 1.25,
      duration: 160,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  public reactCorrect(pointsAwarded = 10): void {
    this.setAction('cheer');
    this.stopIdleMotion();

    // Joyful jump
    this.scene.tweens.add({
      targets: this.sprite,
      y: -15,
      duration: 160,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.setAction('idle');
        this.startIdleMotion();
      },
    });

    // Floating points tag (+10)
    const pts = this.scene.add.text(this.container.x, this.container.y - 70, `+${pointsAwarded}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#4ade80',
    }).setOrigin(0.5, 0.5).setDepth(25);

    this.scene.tweens.add({
      targets: pts,
      y: pts.y - 25,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeOut',
      onComplete: () => pts.destroy(),
    });
  }

  public reactWrong(): void {
    this.setAction('wrong');
    this.stopIdleMotion();

    // Gentle head shake
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 4,
      duration: 120,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.sprite.setAngle(0);
        this.setAction('idle');
        this.startIdleMotion();
      },
    });
  }

  public danceParty(): void {
    this.setAction('cheer');
    this.stopIdleMotion();

    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -10,
      scaleX: 1.05,
      duration: 220 + Phaser.Math.Between(-30, 30),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public clearAnswerBadge(): void {
    if (this.answerBadge) {
      this.answerBadge.destroy();
      this.answerBadge = null;
    }
  }

  private startIdleMotion(): void {
    this.stopIdleMotion();
    this.sprite.setY(0);
    this.sprite.setAngle(0);

    // Randomized harmless breathing delay so 25 students don't move in robotic sync
    const randomDelay = Phaser.Math.Between(0, 800);
    const duration = Phaser.Math.Between(1300, 1700);

    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      y: -2,
      duration,
      delay: randomDelay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopIdleMotion(): void {
    if (this.idleTween) {
      this.idleTween.stop();
      this.idleTween = null;
    }
  }

  public destroy(): void {
    this.stopIdleMotion();
    this.container.destroy();
  }
}
