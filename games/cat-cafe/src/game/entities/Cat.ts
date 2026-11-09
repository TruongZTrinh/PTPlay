import Phaser from 'phaser';
import { CAFE_CONFIG, COAT_VARIANTS, CatCoat, CatPersonality, PERSONALITY_DEFS, PersonalityDef } from '../config/CafeConfig';
import { Random } from '../utils/Random';
import { TextSanitizer } from '../utils/TextSanitizer';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { getCatCoatName, catAssetKey, CatCoat as V3CatCoat, CatAction } from '../cafe-moe-v3';

export type CatState =
  | 'idle'
  | 'wander'
  | 'sit'
  | 'sleep'
  | 'stretch'
  | 'groom'
  | 'eat'
  | 'play'
  | 'react'
  | 'call'
  | 'social'
  | 'angry'
  | 'dance'
  | 'zoomies'
  | 'box'
  | 'bath';

export interface CatInitData {
  id: string;
  nickname: string;
  coatVariant: number;
  personality?: CatPersonality;
  isNpc?: boolean;
  viewerId?: string;
  x?: number;
  y?: number;
}

export class Cat extends Phaser.GameObjects.Container {
  public readonly catId: string;
  public readonly isNpc: boolean;
  public readonly viewerId?: string;
  public readonly coatVariant: number;
  public readonly coat: CatCoat;
  public readonly v3Coat: V3CatCoat;
  public readonly personality: CatPersonality;
  public readonly personalityDef: PersonalityDef;
  public nickname: string;

  // Cat Needs & Metrics (0 to 100)
  public currentState: CatState = 'idle';
  public happiness = 85;
  public energy = 80;
  public hunger = 35;

  // Visual sub-elements
  private catSprite!: Phaser.GameObjects.Image;
  private nametagBg: Phaser.GameObjects.Graphics;
  private nametagText: Phaser.GameObjects.Text;
  private emoteBubble: Phaser.GameObjects.Image | null = null;
  private speechContainer: Phaser.GameObjects.Container | null = null;

  // Animation & AI Timers
  private stateDuration = 0;
  private stateElapsed = 0;
  private breatheTween: Phaser.Tweens.Tween | null = null;
  private moveTween: Phaser.Tweens.Tween | null = null;
  private walkAnimTimer: Phaser.Time.TimerEvent | null = null;
  private isRoyal = false;

  constructor(scene: Phaser.Scene, data: CatInitData) {
    const initX = data.x ?? Random.range(140, 400);
    const initY = data.y ?? Random.range(480, 720);
    super(scene, initX, initY);

    this.catId = data.id;
    this.isNpc = data.isNpc ?? false;
    this.viewerId = data.viewerId;
    this.coatVariant = Math.abs(data.coatVariant) % COAT_VARIANTS.length;
    this.coat = COAT_VARIANTS[this.coatVariant];
    this.v3Coat = getCatCoatName(this.coatVariant);

    // Personality assignment
    const personalities: CatPersonality[] = ['sleepy', 'playful', 'foodie', 'curious', 'affectionate', 'shy'];
    this.personality = data.personality || personalities[this.coatVariant % personalities.length];
    this.personalityDef = PERSONALITY_DEFS[this.personality];

    this.nickname = TextSanitizer.sanitizeNickname(data.nickname);

    // 1. Primary Illustrated Cat Sprite (High-resolution V3 transparent PNG sprite)
    const v3IdleKey = catAssetKey(this.v3Coat, 'idle');
    const legacySitKey = `cat_${this.coatVariant}_sit`;
    const spriteKey = scene.textures.exists(v3IdleKey)
      ? v3IdleKey
      : (scene.textures.exists(legacySitKey) ? legacySitKey : `cat_coat_${this.coat.id}_body`);

    this.catSprite = scene.add.image(0, 0, spriteKey);
    if (scene.textures.exists(v3IdleKey)) {
      this.catSprite.setOrigin(0.5, 0.82);
      this.catSprite.setScale(0.24);
    } else {
      this.catSprite.setOrigin(0.5, 0.72);
      this.catSprite.setScale(1);
    }
    this.add(this.catSprite);

    // 2. Cozy Wooden Carved Nametag
    this.nametagBg = scene.add.graphics();
    this.add(this.nametagBg);

    const labelColor = this.isNpc ? '#FDE68A' : '#93C5FD';
    this.nametagText = scene.add.text(0, -82, this.nickname, {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: '11px',
      fontStyle: 'bold',
      color: labelColor,
      align: 'center',
    });
    this.nametagText.setOrigin(0.5, 0.5);
    this.add(this.nametagText);

    this.redrawNametag();
    this.startIdlingAnimations();

    scene.add.existing(this);
    this.setDepth(this.y);
    this.scheduleNextAction(Random.range(2, 5));
  }

  public setActionPose(action: CatAction): void {
    const key = catAssetKey(this.v3Coat, action);
    if (this.scene.textures.exists(key)) {
      this.catSprite.setTexture(key);
      this.catSprite.setOrigin(0.5, 0.82);
      const isFlipped = this.catSprite.scaleX < 0;
      this.catSprite.setScale(isFlipped ? -0.24 : 0.24, 0.24);
    }
  }

  public turnToward(targetX: number): void {
    const isLeft = targetX < this.x;
    this.catSprite.setScale(isLeft ? -0.24 : 0.24, 0.24);
  }

  private redrawNametag(): void {
    const textWidth = this.nametagText.width;
    const pillW = Math.max(textWidth + 18, 48);
    const pillH = 19;
    // Offset slightly for side-by-side cats so nametags never overlap
    const yOffset = this.coatVariant === 1 ? -88 : (this.coatVariant === 4 ? -76 : -82);
    const nametagY = this.currentState === 'sleep' ? -52 : yOffset;

    this.nametagText.y = nametagY;

    this.nametagBg.clear();
    // Warm dark-wood pill background
    this.nametagBg.fillStyle(0x2A1409, 0.88);
    this.nametagBg.fillRoundedRect(-pillW / 2, nametagY - pillH / 2, pillW, pillH, 9.5);
    // Border: Golden for NPC, Sky Blue / Gold for Viewers
    const borderColor = this.isNpc ? 0xF59E0B : 0x38BDF8;
    this.nametagBg.lineStyle(1.6, borderColor, 0.95);
    this.nametagBg.strokeRoundedRect(-pillW / 2, nametagY - pillH / 2, pillW, pillH, 9.5);
  }

  public updateNickname(newNickname: string): void {
    this.nickname = TextSanitizer.sanitizeNickname(newNickname);
    this.nametagText.setText(this.nickname);
    this.redrawNametag();
  }

  private startIdlingAnimations(): void {
    if (this.breatheTween) {
      this.breatheTween.stop();
    }
    this.breatheTween = this.scene.tweens.add({
      targets: this.catSprite,
      scaleY: { from: 0.24, to: 0.247 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public update(_time: number, delta: number): void {
    this.setDepth(this.y);

    // Dynamic needs decay based on personality
    const dtSec = delta / 1000;
    this.hunger = Math.min(100, this.hunger + dtSec * 0.15 * this.personalityDef.hungerRate);
    if (this.currentState === 'sleep') {
      this.energy = Math.min(100, this.energy + dtSec * 2.5 * this.personalityDef.energyRecovery);
    } else {
      this.energy = Math.max(0, this.energy - dtSec * 0.1);
    }

    // AI state timer
    if (this.stateDuration > 0) {
      this.stateElapsed += dtSec;
      if (this.stateElapsed >= this.stateDuration) {
        this.onStateTimerExpired();
      }
    }
  }

  public scheduleNextAction(delaySec: number): void {
    this.stateDuration = delaySec;
    this.stateElapsed = 0;
  }

  private onStateTimerExpired(): void {
    this.stateDuration = 0;
    this.stateElapsed = 0;

    if (this.isRoyal) return;

    // Reset from transient actions back to idle
    if (
      this.currentState === 'eat' ||
      this.currentState === 'play' ||
      this.currentState === 'sleep' ||
      this.currentState === 'react' ||
      this.currentState === 'stretch' ||
      this.currentState === 'groom' ||
      this.currentState === 'call' ||
      this.currentState === 'social' ||
      this.currentState === 'angry' ||
      this.currentState === 'dance' ||
      this.currentState === 'zoomies' ||
      this.currentState === 'box' ||
      this.currentState === 'bath'
    ) {
      this.catSprite.clearTint();
      this.transitionTo('idle');
      this.scheduleNextAction(Random.range(3, 7));
      return;
    }

    // Autonomous behavior weighted by personality & needs
    if (this.energy < 25 || (this.personality === 'sleepy' && Math.random() < 0.35)) {
      this.takeNap(Random.range(8, 15));
      return;
    }

    if (this.hunger > 70 || (this.personality === 'foodie' && Math.random() < 0.35)) {
      this.walkTo(Random.range(110, 150), Random.range(440, 460), () => {
        this.eatFood();
      });
      return;
    }

    const roll = Math.random();
    if (roll < 0.3) {
      // Wander to a cozy spot in playable area
      const destX = Random.range(CAFE_CONFIG.safeMargin + 40, CAFE_CONFIG.width - CAFE_CONFIG.safeMargin - 40);
      const destY = Random.range(480, 720);
      this.walkTo(destX, destY, () => {
        this.transitionTo('idle');
        this.scheduleNextAction(Random.range(3, 7));
      });
    } else if (roll < 0.5) {
      // Stretch or Groom
      if (Math.random() < 0.5) this.stretchCat();
      else this.groomCat();
    } else if (roll < 0.72) {
      // Sit down comfortably
      this.sitDown(Random.range(4, 8));
    } else {
      // Play near rug toy zone
      this.walkTo(Random.range(240, 320), Random.range(590, 650), () => {
        this.playWithToy();
      });
    }
  }

  public walkTo(targetX: number, targetY: number, onComplete?: () => void): void {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    if (this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }

    this.transitionTo('wander');
    const movingLeft = targetX < this.x;
    this.catSprite.setScale(movingLeft ? -0.24 : 0.24, 0.24);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const speed = 80;
    const duration = Math.max(700, (dist / speed) * 1000);

    // Alternate walk poses: walk_1 <-> walk_2
    let step = 0;
    this.setActionPose('walk_1');
    this.catSprite.setScale(movingLeft ? -0.24 : 0.24, 0.24);
    this.walkAnimTimer = this.scene.time.addEvent({
      delay: 180,
      loop: true,
      callback: () => {
        step = (step + 1) % 2;
        this.setActionPose(step === 0 ? 'walk_1' : 'walk_2');
        this.catSprite.setScale(movingLeft ? -0.24 : 0.24, 0.24);
      },
    });

    const walkBob = this.scene.tweens.add({
      targets: this.catSprite,
      y: '-=4',
      duration: 180,
      yoyo: true,
      repeat: Math.floor(duration / 360),
    });

    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Linear',
      onComplete: () => {
        if (this.walkAnimTimer) {
          this.walkAnimTimer.remove();
          this.walkAnimTimer = null;
        }
        walkBob.stop();
        this.catSprite.y = 0;
        this.moveTween = null;
        this.setActionPose('idle');
        this.catSprite.setScale(movingLeft ? -0.24 : 0.24, 0.24);
        if (onComplete) onComplete();
      },
    });
  }

  public sitDown(durationSec = 5): void {
    this.transitionTo('sit');
    this.scheduleNextAction(durationSec);
  }

  public stretchCat(): void {
    this.transitionTo('stretch');
    this.setActionPose('stretch');
    this.scene.tweens.add({
      targets: this.catSprite,
      scaleX: (this.catSprite.scaleX > 0 ? 0.27 : -0.27),
      scaleY: 0.21,
      duration: 500,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.setActionPose('idle');
        this.scheduleNextAction(Random.range(2, 4));
      },
    });
  }

  public groomCat(): void {
    this.transitionTo('groom');
    this.setActionPose('groom');
    this.scene.tweens.add({
      targets: this.catSprite,
      angle: { from: -6, to: 6 },
      duration: 240,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.catSprite.angle = 0;
        this.happiness = Math.min(100, this.happiness + 10);
        this.setActionPose('idle');
        this.scheduleNextAction(Random.range(3, 5));
      },
    });
  }

  public eatFood(onComplete?: () => void): void {
    this.transitionTo('eat');
    this.setActionPose('eat');
    this.showEmote('emote_food', 2800);
    CafeAudioEngine.getInstance().playBowlClink();
    CafeAudioEngine.getInstance().playMunch();

    this.scene.tweens.add({
      targets: this.catSprite,
      y: '+=5',
      duration: 200,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.catSprite.y = 0;
        this.happiness = Math.min(100, this.happiness + 20);
        this.hunger = Math.max(0, this.hunger - 35);
        this.setActionPose('idle');
        this.scheduleNextAction(Random.range(3, 6));
        if (onComplete) onComplete();
      },
    });
  }

  public playWithToy(onComplete?: () => void): void {
    this.transitionTo('play');
    this.setActionPose('play');
    this.showEmote('emote_play', 3000);
    CafeAudioEngine.getInstance().playYarnJingle();
    CafeAudioEngine.getInstance().playScratch();

    this.scene.tweens.add({
      targets: this,
      y: '-=16',
      duration: 250,
      yoyo: true,
      repeat: 3,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.happiness = Math.min(100, this.happiness + 25);
        this.energy = Math.max(10, this.energy - 15);
        this.setActionPose('idle');
        this.scheduleNextAction(Random.range(3, 6));
        if (onComplete) onComplete();
      },
    });
  }

  public takeNap(durationSec = 8): void {
    this.transitionTo('sleep');
    this.setActionPose('sleep');
    this.showEmote('emote_sleep', durationSec * 1000);
    CafeAudioEngine.getInstance().playCuteYawn();
    this.scheduleNextAction(durationSec);
  }

  public showLoveReaction(): void {
    this.transitionTo('react');
    this.setActionPose('love');
    this.showEmote('emote_heart', 3000);
    CafeAudioEngine.getInstance().playHeartPop();
    CafeAudioEngine.getInstance().playPurr();

    this.scene.tweens.add({
      targets: this.catSprite,
      y: '-=14',
      duration: 250,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.catSprite.y = 0;
        this.happiness = 100;
        this.scene.time.delayedCall(2200, () => {
          if (this.currentState === 'react') {
            this.setActionPose('idle');
          }
        });
        this.scheduleNextAction(4);
      },
    });
  }

  public becomeRoyal(durationMs = 8500): void {
    this.isRoyal = true;
    this.transitionTo('react');
    this.setActionPose('royal');
    this.showEmote('emote_heart', durationMs);

    this.scene.tweens.add({
      targets: this.catSprite,
      scaleY: 0.26,
      scaleX: (this.catSprite.scaleX > 0 ? 0.25 : -0.25),
      duration: 400,
      yoyo: true,
      repeat: 7,
    });

    this.scene.time.delayedCall(durationMs, () => {
      this.isRoyal = false;
      this.setActionPose('idle');
      this.scheduleNextAction(Random.range(2, 5));
    });
  }

  public becomeParty(durationMs = 4000): void {
    if (this.isRoyal) this.isRoyal = false;
    this.setActionPose('party');
    this.scene.tweens.add({
      targets: this.catSprite,
      angle: { from: -8, to: 8 },
      duration: 180,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.catSprite.angle = 0;
        this.setActionPose('idle');
      },
    });
  }

  public becomeAngry(onComplete?: () => void): void {
    if (this.isRoyal) this.isRoyal = false;
    this.transitionTo('angry');
    this.setActionPose('meow');
    this.catSprite.setTint(0xFF6B6B);
    this.showEmote('emote_angry', 3200);

    const audio = CafeAudioEngine.getInstance();
    audio.playHiss();
    this.scene.time.delayedCall(400, () => audio.playGrumpyMeow());

    const angryLines = [
      'Trẫm đang dỗi! Mau dỗ bằng cá nướng đi! 😾💢',
      'Hờn cả thế giới rồi! Không thèm ngó ai nữa! 😾',
      'Khè khè! Đừng đụng vào trẫm lúc này nha! 😾',
      'Sen đâu rồi? Phục vụ kiểu này là trẫm quạu nha! 💢',
    ];
    this.showSpeechBubble(Random.choice(angryLines), 3500);

    this.scene.tweens.add({
      targets: this.catSprite,
      x: { from: -6, to: 6 },
      duration: 65,
      yoyo: true,
      repeat: 10,
      onComplete: () => {
        this.catSprite.x = 0;
        this.catSprite.clearTint();
        this.happiness = Math.max(10, this.happiness - 15);
        this.scheduleNextAction(4);
        if (onComplete) onComplete();
      },
    });
  }

  public doDance(onComplete?: () => void): void {
    if (this.isRoyal) this.isRoyal = false;
    this.transitionTo('dance');
    this.setActionPose('party');
    this.showEmote('emote_dance', 3200);
    CafeAudioEngine.getInstance().playDanceJingle();

    const danceLines = [
      'Lên nhạc là quẩy! Meo meo lắc mông! 💃✨',
      'Nhạc căng đét! Quán mèo thành vũ trường rồi! 🪩🎶',
      'Bật chế độ quẩy tưng bừng! Nhảy cực sung luôn! 🕺',
    ];
    this.showSpeechBubble(Random.choice(danceLines), 3500);

    this.scene.tweens.add({
      targets: this.catSprite,
      angle: { from: -14, to: 14 },
      scaleY: { from: 0.22, to: 0.27 },
      duration: 180,
      yoyo: true,
      repeat: 8,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.catSprite.angle = 0;
        this.catSprite.scaleY = 0.24;
        this.happiness = Math.min(100, this.happiness + 25);
        this.setActionPose('idle');
        this.scheduleNextAction(4);
        if (onComplete) onComplete();
      },
    });
  }

  public doZoomies(onComplete?: () => void): void {
    if (this.isRoyal) this.isRoyal = false;
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    if (this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }

    this.transitionTo('zoomies');
    this.setActionPose('jump');
    this.showEmote('emote_zoomies', 3000);
    CafeAudioEngine.getInstance().playZoomies();

    const zoomLines = [
      'Năng lượng 3 giờ sáng! Tránh đường cho trẫm phi! 🏎️💨',
      'Bật số turbo! Mèo ngáo xuất kích! ⚡🚀',
      'Không có phanh đâu! Đâm trúng là ráng chịu nha! 🌪️',
    ];
    this.showSpeechBubble(Random.choice(zoomLines), 3000);

    // Fast zigzag waypoints across the cafe floor
    const p1 = { x: Random.range(130, 200), y: Random.range(490, 680) };
    const p2 = { x: Random.range(310, 420), y: Random.range(500, 710) };
    const p3 = { x: Random.range(180, 340), y: Random.range(530, 660) };

    this.turnToward(p1.x);
    this.moveTween = this.scene.tweens.add({
      targets: this,
      x: p1.x,
      y: p1.y,
      duration: 380,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.turnToward(p2.x);
        this.setActionPose('walk_2');
        this.moveTween = this.scene.tweens.add({
          targets: this,
          x: p2.x,
          y: p2.y,
          duration: 400,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
            this.turnToward(p3.x);
            this.setActionPose('jump');
            this.moveTween = this.scene.tweens.add({
              targets: this,
              x: p3.x,
              y: p3.y,
              duration: 360,
              ease: 'Back.easeOut',
              onComplete: () => {
                this.moveTween = null;
                this.energy = Math.max(10, this.energy - 20);
                this.happiness = Math.min(100, this.happiness + 20);
                this.setActionPose('idle');
                this.scheduleNextAction(Random.range(3, 5));
                if (onComplete) onComplete();
              },
            });
          },
        });
      },
    });
  }

  public hideInBox(onComplete?: () => void): void {
    if (this.isRoyal) this.isRoyal = false;
    this.transitionTo('box');
    this.setActionPose('box');
    this.showEmote('emote_box', 3500);
    CafeAudioEngine.getInstance().playScratch();

    const boxLines = [
      'Hộp carton là chân ái! Pháo đài bất khả xâm phạm! 📦👑',
      'Nếu trẫm vừa, trẫm sẽ ngồi! Giường đắt tiền vứt xó! 📦',
      'Trong hộp này, trẫm là bá chủ vũ trụ! Miễn tiếp khách! 📦✨',
    ];
    this.showSpeechBubble(Random.choice(boxLines), 3500);

    this.scene.tweens.add({
      targets: this.catSprite,
      y: { from: 0, to: -8 },
      duration: 320,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.catSprite.y = 0;
        this.happiness = Math.min(100, this.happiness + 15);
        this.scheduleNextAction(Random.range(4, 7));
        if (onComplete) onComplete();
      },
    });
  }

  public takeBath(onComplete?: () => void): void {
    if (this.isRoyal) this.isRoyal = false;
    this.transitionTo('bath');
    this.setActionPose('bath');
    this.showEmote('emote_bath', 3200);
    CafeAudioEngine.getInstance().playPurr();

    const bathLines = [
      'Liếm lông sạch sẽ, tút lại nhan sắc đón triệu view! ✨🧼',
      'Spa cao cấp 5 sao tại gia! Phải thơm tho mới có nhiều fan! 💅',
      'Lông mượt óng ả thế này ai mà không mê cho được! 🧼✨',
    ];
    this.showSpeechBubble(Random.choice(bathLines), 3500);

    this.scene.tweens.add({
      targets: this.catSprite,
      angle: { from: -7, to: 7 },
      duration: 250,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.catSprite.angle = 0;
        this.happiness = Math.min(100, this.happiness + 15);
        this.setActionPose('idle');
        this.scheduleNextAction(Random.range(3, 6));
        if (onComplete) onComplete();
      },
    });
  }

  public callToFront(onComplete?: () => void): void {
    this.transitionTo('call');
    this.setActionPose('call');
    CafeAudioEngine.getInstance().playHappyTrill();

    const line = Random.choice(this.personalityDef.dialogues);
    this.showSpeechBubble(line, 4000);

    this.scene.tweens.add({
      targets: this,
      y: '-=12',
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.scheduleNextAction(4);
        if (onComplete) onComplete();
      },
    });
  }

  public showEmote(textureKey: string, durationMs = 2500): void {
    if (this.emoteBubble) {
      this.emoteBubble.destroy();
      this.emoteBubble = null;
    }

    const emoteKey = this.scene.textures.exists(textureKey) ? textureKey : 'emote_heart';
    if (!this.scene.textures.exists(emoteKey)) return;

    this.emoteBubble = this.scene.add.image(0, -106, emoteKey);
    this.emoteBubble.setScale(0);
    this.add(this.emoteBubble);

    this.scene.tweens.add({
      targets: this.emoteBubble,
      scale: 1,
      y: '-=6',
      duration: 260,
      ease: 'Back.easeOut',
    });

    this.scene.time.delayedCall(durationMs, () => {
      if (this.emoteBubble && this.active) {
        this.scene.tweens.add({
          targets: this.emoteBubble,
          alpha: 0,
          y: '-=12',
          duration: 300,
          onComplete: () => {
            if (this.emoteBubble) {
              this.emoteBubble.destroy();
              this.emoteBubble = null;
            }
          },
        });
      }
    });
  }

  public showSpeechBubble(text: string, durationMs = 3500): void {
    if (this.speechContainer) {
      this.speechContainer.destroy();
      this.speechContainer = null;
    }

    this.speechContainer = this.scene.add.container(0, -116);
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: "'Segoe UI', 'Baloo 2', sans-serif",
      fontSize: '11px',
      color: '#451A03',
      align: 'center',
    });
    label.setOrigin(0.5, 0.5);

    const padX = 14;
    const padY = 8;
    const w = label.width + padX * 2;
    const h = label.height + padY * 2;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xFFF9EE, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(1.6, 0xD97706, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

    // Speech beak pointing down
    bg.fillTriangle(-5, h / 2, 5, h / 2, 0, h / 2 + 6);

    this.speechContainer.add(bg);
    this.speechContainer.add(label);
    this.add(this.speechContainer);

    this.scene.time.delayedCall(durationMs, () => {
      if (this.speechContainer && this.active) {
        this.speechContainer.destroy();
        this.speechContainer = null;
      }
    });
  }

  private transitionTo(newState: CatState): void {
    this.currentState = newState;
    if (this.isRoyal && newState !== 'react') {
      this.isRoyal = false;
    }

    if (newState === 'sleep') {
      this.setActionPose('sleep');
    } else if (newState === 'play') {
      this.setActionPose('play');
    } else if (newState === 'eat') {
      this.setActionPose('eat');
    } else if (newState === 'react') {
      this.setActionPose('love');
    } else if (newState === 'call') {
      this.setActionPose('call');
    } else if (newState === 'wander') {
      this.setActionPose('walk_1');
    } else if (newState === 'stretch') {
      this.setActionPose('stretch');
    } else if (newState === 'groom') {
      this.setActionPose('groom');
    } else if (newState === 'angry') {
      this.setActionPose('meow');
    } else if (newState === 'dance') {
      this.setActionPose('party');
    } else if (newState === 'zoomies') {
      this.setActionPose('jump');
    } else if (newState === 'box') {
      this.setActionPose('box');
    } else if (newState === 'bath') {
      this.setActionPose('bath');
    } else {
      this.catSprite.clearTint();
      this.setActionPose('idle');
    }

    this.redrawNametag();
  }

  public destroy(fromScene?: boolean): void {
    if (this.walkAnimTimer) {
      this.walkAnimTimer.remove();
      this.walkAnimTimer = null;
    }
    if (this.breatheTween) {
      this.breatheTween.stop();
      this.breatheTween = null;
    }
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = null;
    }
    super.destroy(fromScene);
  }
}
