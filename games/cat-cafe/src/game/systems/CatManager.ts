import Phaser from 'phaser';
import { Cat } from '../entities/Cat';
import { CAFE_CONFIG, COAT_VARIANTS, CatPersonality } from '../config/CafeConfig';
import { TextSanitizer } from '../utils/TextSanitizer';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';

export interface ViewerJoinResult {
  cat: Cat;
  isNew: boolean;
  isWaitlisted: boolean;
  messageVi: string;
}

export class CatManager {
  private scene: Phaser.Scene;
  private cats: Map<string, Cat> = new Map();
  private viewerCats: Map<string, Cat> = new Map();
  private waitlist: Array<{ viewerId: string; nickname: string }> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initNpcs(): void {
    const initialSpots = [
      { x: 270, y: 620, state: 'play' as const }, // Mimi on center rug playing with pink yarn
      { x: 145, y: 468, state: 'sit' as const },  // Bánh Mì in plush pink bed
      { x: 195, y: 472, state: 'sit' as const },  // Miu Miu in plush pink bed
    ];

    for (let i = 0; i < CAFE_CONFIG.initialNpcs.length; i++) {
      const npc = CAFE_CONFIG.initialNpcs[i];
      if (!this.cats.has(npc.id)) {
        const spot = initialSpots[i % initialSpots.length];
        const cat = new Cat(this.scene, {
          id: npc.id,
          nickname: npc.nickname,
          coatVariant: npc.coatVariant,
          personality: npc.personality,
          isNpc: true,
          x: spot.x,
          y: spot.y,
        });
        if (spot.state === 'play') {
          cat.playWithToy();
        }
        this.cats.set(cat.catId, cat);
        ProgressionManager.getInstance().discoverBreed(npc.coatVariant);
      }
    }
  }

  public getCatByViewerId(viewerId: string): Cat | undefined {
    return this.viewerCats.get(viewerId);
  }

  public getCatById(catId: string): Cat | undefined {
    return this.cats.get(catId);
  }

  public getAllCats(): Cat[] {
    return Array.from(this.cats.values());
  }

  public getViewerCount(): number {
    return this.viewerCats.size;
  }

  public getTotalCatCount(): number {
    return this.cats.size;
  }

  public isFull(): boolean {
    return this.cats.size >= CAFE_CONFIG.maxCats;
  }

  public handleViewerJoin(viewerId: string, nickname: string): ViewerJoinResult {
    // 1. Idempotency Check: Existing viewer cat
    const existing = this.viewerCats.get(viewerId);
    if (existing) {
      existing.updateNickname(nickname);
      existing.showLoveReaction();
      return {
        cat: existing,
        isNew: false,
        isWaitlisted: false,
        messageVi: `Chào mừng @${existing.nickname} trở lại quán! 🐾`,
      };
    }

    // 2. Capacity Check
    if (this.isFull()) {
      if (this.waitlist.length < CAFE_CONFIG.maxWaitlist) {
        if (!this.waitlist.some((w) => w.viewerId === viewerId)) {
          this.waitlist.push({ viewerId, nickname });
        }
      }
      return {
        cat: undefined as unknown as Cat,
        isNew: false,
        isWaitlisted: true,
        messageVi: `Quán đang đông khách (${this.cats.size}/20 mèo). Bé của bạn đang xếp hàng!`,
      };
    }

    // 3. Deterministic Breed & Personality from User ID
    const hash = TextSanitizer.hashString(viewerId);
    const coatIndex = hash % COAT_VARIANTS.length;
    const personalities: CatPersonality[] = ['sleepy', 'playful', 'foodie', 'curious', 'affectionate', 'shy'];
    const personality = personalities[(hash >> 3) % personalities.length];

    const catId = `viewer_${viewerId}_${Date.now()}`;
    const newCat = new Cat(this.scene, {
      id: catId,
      nickname,
      coatVariant: coatIndex,
      personality,
      isNpc: false,
      viewerId,
    });

    this.cats.set(catId, newCat);
    this.viewerCats.set(viewerId, newCat);

    // Track progression & album discovery
    const pm = ProgressionManager.getInstance();
    pm.discoverBreed(coatIndex);
    pm.trackAction('join');

    newCat.showLoveReaction();

    return {
      cat: newCat,
      isNew: true,
      isWaitlisted: false,
      messageVi: `Bé mèo của @${newCat.nickname} (${newCat.coat.nameVi}) đã vào quán! 🐾`,
    };
  }

  public update(time: number, delta: number): void {
    const catList = this.getAllCats();
    for (const cat of catList) {
      if (cat.active) {
        cat.update(time, delta);
      }
    }

    this.applySoftSeparation(catList);
  }

  private applySoftSeparation(catList: Cat[]): void {
    const minDist = 48;
    for (let i = 0; i < catList.length; i++) {
      for (let j = i + 1; j < catList.length; j++) {
        const c1 = catList[i];
        const c2 = catList[j];
        if (c1.currentState === 'wander' || c2.currentState === 'wander') continue;

        const dist = Phaser.Math.Distance.Between(c1.x, c1.y, c2.x, c2.y);
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) * 0.1;
          const angle = Phaser.Math.Angle.Between(c1.x, c1.y, c2.x, c2.y);
          c1.x -= Math.cos(angle) * overlap;
          c1.y -= Math.sin(angle) * overlap;
          c2.x += Math.cos(angle) * overlap;
          c2.y += Math.sin(angle) * overlap;

          // Social micro-interaction: spontaneous head-bonk purr
          if (dist < 32 && Math.random() < 0.002) {
            c1.showEmote('emote_heart', 2000);
            c2.showEmote('emote_heart', 2000);
            CafeAudioEngine.getInstance().playHappyTrill();
          }
        }
      }
    }
  }

  public repositionForRoom(): void {
    const catList = this.getAllCats();
    for (const cat of catList) {
      cat.x = Phaser.Math.Clamp(cat.x, 80, 460);
      cat.y = Phaser.Math.Clamp(cat.y, 480, 750);
      cat.setDepth(cat.y);
    }
  }

  public resetAll(): void {
    for (const cat of this.cats.values()) {
      cat.destroy();
    }
    this.cats.clear();
    this.viewerCats.clear();
    this.waitlist = [];
    this.initNpcs();
  }
}
