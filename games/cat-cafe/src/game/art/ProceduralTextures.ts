import Phaser from 'phaser';
import { COAT_VARIANTS, CAFE_CONFIG } from '../config/CafeConfig';

export class ProceduralTextures {
  public static generateAll(scene: Phaser.Scene): void {
    this.createShadowTexture(scene);
    this.createCatCoatTextures(scene);
    this.createMainCafeTextures(scene);
    this.createGardenTextures(scene);
    this.createLoftTextures(scene);
    this.createItemAndDecorTextures(scene);
    this.createParticleAndFxTextures(scene);
  }

  private static createShadowTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('shadow')) return;
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(32, 16, 64, 22);
    g.generateTexture('shadow', 64, 32);
    g.destroy();
  }

  // --- 8 POLISHED CAT COAT TEXTURES WITH MULTI-POSE PARTS ---
  private static createCatCoatTextures(scene: Phaser.Scene): void {
    for (const coat of COAT_VARIANTS) {
      const keyPrefix = `cat_coat_${coat.id}`;
      if (scene.textures.exists(`${keyPrefix}_head_open`)) continue;

      // 1. Sitting Body (64x64)
      const gBody = scene.make.graphics({ x: 0, y: 0 });
      gBody.fillStyle(coat.primaryColor, 1);
      gBody.fillRoundedRect(12, 18, 40, 42, 18);

      // Belly / Chest accent
      gBody.fillStyle(coat.bellyColor, 0.95);
      gBody.fillEllipse(32, 42, 22, 26);

      // Secondary Markings
      gBody.fillStyle(coat.secondaryColor, 0.85);
      if (coat.id === 0) {
        // Ginger tabby stripes
        gBody.fillRect(16, 26, 8, 3);
        gBody.fillRect(40, 26, 8, 3);
        gBody.fillRect(14, 36, 9, 3);
        gBody.fillRect(41, 36, 9, 3);
      } else if (coat.id === 3) {
        // Tuxedo black jacket & white paws
      } else if (coat.id === 4) {
        // Calico patches
        gBody.fillCircle(20, 26, 7);
        gBody.fillCircle(44, 46, 8);
      } else if (coat.id === 7) {
        // Siamese dark shoulder gradient
        gBody.fillEllipse(32, 24, 32, 10);
      }

      // Front Paws
      gBody.fillStyle(coat.bellyColor, 1);
      gBody.fillCircle(24, 56, 5);
      gBody.fillCircle(40, 56, 5);

      gBody.generateTexture(`${keyPrefix}_body`, 64, 64);
      gBody.destroy();

      // 2. Head Variants (56x48)
      this.buildHeadVariant(scene, coat, `${keyPrefix}_head_open`, 'open');
      this.buildHeadVariant(scene, coat, `${keyPrefix}_head_happy`, 'happy');
      this.buildHeadVariant(scene, coat, `${keyPrefix}_head_sleep`, 'sleep');
      this.buildHeadVariant(scene, coat, `${keyPrefix}_head_alert`, 'alert');

      // 3. Tail (32x40)
      const gTail = scene.make.graphics({ x: 0, y: 0 });
      gTail.lineStyle(7, coat.primaryColor, 1);
      gTail.beginPath();
      gTail.moveTo(6, 34);
      gTail.lineTo(22, 22);
      gTail.lineTo(20, 6);
      gTail.strokePath();

      // Tail tip
      gTail.fillStyle(coat.secondaryColor, 1);
      gTail.fillCircle(20, 6, 4.5);
      gTail.generateTexture(`${keyPrefix}_tail`, 32, 40);
      gTail.destroy();
    }
  }

  private static buildHeadVariant(scene: Phaser.Scene, coat: any, key: string, mood: 'open' | 'happy' | 'sleep' | 'alert'): void {
    const gHead = scene.make.graphics({ x: 0, y: 0 });

    // Ears
    gHead.fillStyle(coat.primaryColor, 1);
    gHead.fillTriangle(6, 20, 16, 2, 24, 20);
    gHead.fillStyle(coat.earColor, 1);
    gHead.fillTriangle(9, 18, 16, 6, 21, 18);

    gHead.fillStyle(coat.primaryColor, 1);
    gHead.fillTriangle(32, 20, 40, 2, 50, 20);
    gHead.fillStyle(coat.earColor, 1);
    gHead.fillTriangle(35, 18, 40, 6, 47, 18);

    // Chubby Cheeks & Head
    gHead.fillStyle(coat.primaryColor, 1);
    gHead.fillEllipse(28, 28, 46, 36);
    gHead.fillCircle(10, 32, 7);
    gHead.fillCircle(46, 32, 7);

    // Forehead markings
    gHead.fillStyle(coat.secondaryColor, 0.85);
    if (coat.id === 0) {
      gHead.fillRect(26, 15, 4, 7);
      gHead.fillRect(21, 17, 3, 5);
      gHead.fillRect(32, 17, 3, 5);
    } else if (coat.id === 4) {
      gHead.fillCircle(38, 22, 6);
    } else if (coat.id === 7) {
      // Siamese dark face mask
      gHead.fillEllipse(28, 30, 28, 22);
    }

    // Snout / Muzzle
    gHead.fillStyle(coat.bellyColor, 0.95);
    gHead.fillCircle(25, 34, 5);
    gHead.fillCircle(31, 34, 5);

    // Nose
    gHead.fillStyle(coat.earColor, 1);
    gHead.fillTriangle(26, 31, 30, 31, 28, 34);

    // Mouth
    gHead.lineStyle(1.5, 0x374151, 0.8);
    gHead.beginPath();
    gHead.moveTo(28, 34);
    gHead.lineTo(28, 36);
    gHead.moveTo(28, 36);
    gHead.lineTo(25, 37);
    gHead.moveTo(28, 36);
    gHead.lineTo(31, 37);
    gHead.strokePath();

    // Whiskers
    gHead.lineStyle(1, 0x4B5563, 0.6);
    gHead.lineBetween(8, 33, 20, 34);
    gHead.lineBetween(9, 37, 21, 36);
    gHead.lineBetween(48, 33, 36, 34);
    gHead.lineBetween(47, 37, 35, 36);

    // Eyes by Mood
    if (mood === 'open') {
      // Left eye
      gHead.fillStyle(coat.eyeColor, 1);
      gHead.fillCircle(20, 27, 4.5);
      gHead.fillStyle(0x111827, 1);
      gHead.fillCircle(20, 27, 2.5);
      gHead.fillStyle(0xFFFFFF, 1);
      gHead.fillCircle(19, 25.5, 1.2);
      // Right eye
      gHead.fillStyle(coat.eyeColor, 1);
      gHead.fillCircle(36, 27, 4.5);
      gHead.fillStyle(0x111827, 1);
      gHead.fillCircle(36, 27, 2.5);
      gHead.fillStyle(0xFFFFFF, 1);
      gHead.fillCircle(35, 25.5, 1.2);
    } else if (mood === 'happy') {
      gHead.lineStyle(2, 0x1F2937, 1);
      gHead.beginPath();
      gHead.arc(20, 28, 4, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(350), false);
      gHead.strokePath();
      gHead.beginPath();
      gHead.arc(36, 28, 4, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(350), false);
      gHead.strokePath();
      // Cheeks
      gHead.fillStyle(0xFDA4AF, 0.6);
      gHead.fillCircle(14, 32, 4);
      gHead.fillCircle(42, 32, 4);
    } else if (mood === 'sleep') {
      gHead.lineStyle(2, 0x4B5563, 0.9);
      gHead.lineBetween(16, 27, 24, 27);
      gHead.lineBetween(32, 27, 40, 27);
    } else if (mood === 'alert') {
      // Big wide astonished eyes
      gHead.fillStyle(coat.eyeColor, 1);
      gHead.fillCircle(20, 27, 5.5);
      gHead.fillCircle(36, 27, 5.5);
      gHead.fillStyle(0x111827, 1);
      gHead.fillCircle(20, 27, 3.5);
      gHead.fillCircle(36, 27, 3.5);
      gHead.fillStyle(0xFFFFFF, 1);
      gHead.fillCircle(19, 25, 1.8);
      gHead.fillCircle(35, 25, 1.8);
    }

    gHead.generateTexture(key, 56, 48);
    gHead.destroy();
  }

  // --- LOCATION 1: MAIN CAFÉ TEXTURES ---
  private static createMainCafeTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('floor_tile')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xDFB882, 1);
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0xD5AA6E, 1);
      g.fillRect(0, 0, 31, 31);
      g.fillRect(32, 32, 32, 32);
      g.lineStyle(1, 0xBA8B4C, 0.5);
      g.strokeRect(0, 0, 32, 32);
      g.strokeRect(32, 32, 32, 32);
      g.generateTexture('floor_tile', 64, 64);
      g.destroy();
    }

    if (!scene.textures.exists('cafe_window')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x78350F, 1);
      g.fillRoundedRect(0, 0, 140, 160, 24);
      g.fillStyle(0xBAE6FD, 1);
      g.fillRoundedRect(8, 8, 124, 144, 18);
      g.fillStyle(0xFFFFFF, 0.9);
      g.fillCircle(40, 50, 18);
      g.fillCircle(62, 44, 24);
      g.fillCircle(85, 52, 18);
      g.lineStyle(5, 0x78350F, 1);
      g.lineBetween(70, 8, 70, 152);
      g.lineBetween(8, 80, 132, 80);
      g.generateTexture('cafe_window', 140, 160);
      g.destroy();
    }

    if (!scene.textures.exists('cafe_counter')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x78350F, 1);
      g.fillRoundedRect(0, 0, 380, 20, 6);
      g.fillStyle(0xB45309, 1);
      g.fillRect(10, 20, 360, 60);
      g.lineStyle(2, 0x78350F, 0.5);
      for (let x = 30; x < 360; x += 30) g.lineBetween(x, 20, x, 80);
      // Mugs & bell jar
      g.fillStyle(0x0284C7, 1);
      g.fillRoundedRect(50, 4, 14, 12, 2);
      g.fillStyle(0xEC4899, 1);
      g.fillRoundedRect(72, 4, 14, 12, 2);
      g.fillStyle(0xE0F2FE, 0.6);
      g.fillEllipse(280, 8, 30, 18);
      g.generateTexture('cafe_counter', 380, 80);
      g.destroy();
    }

    if (!scene.textures.exists('cat_tree')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x92400E, 1);
      g.fillRoundedRect(10, 155, 80, 18, 6);
      g.fillStyle(0xD97706, 1);
      g.fillRect(38, 70, 24, 88);
      g.lineStyle(2, 0xB45309, 0.6);
      for (let y = 74; y < 155; y += 6) g.lineBetween(38, y, 62, y);
      g.fillStyle(0xFEF3C7, 1);
      g.fillRoundedRect(15, 65, 70, 14, 5);
      g.fillStyle(0xD97706, 1);
      g.fillRect(42, 20, 16, 48);
      g.fillStyle(0xFBBF24, 1);
      g.fillEllipse(50, 18, 60, 22);
      g.generateTexture('cat_tree', 100, 180);
      g.destroy();
    }
  }

  // --- LOCATION 2: SUNNY GARDEN TEXTURES ---
  private static createGardenTextures(scene: Phaser.Scene): void {
    // 1. Garden Cobblestone & Grass Floor Tile
    if (!scene.textures.exists('garden_grass_tile')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x86EFAC, 1); // Soft grass green
      g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x4ADE80, 1);
      g.fillCircle(16, 16, 10);
      g.fillCircle(48, 48, 12);
      // Small yellow and white garden buttercups
      g.fillStyle(0xFEF08A, 1);
      g.fillCircle(28, 44, 3);
      g.fillCircle(52, 18, 3);
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(12, 50, 2.5);
      g.generateTexture('garden_grass_tile', 64, 64);
      g.destroy();
    }

    // 2. Stone Bird Fountain with Water
    if (!scene.textures.exists('garden_fountain')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Base pedestal
      g.fillStyle(0x94A3B8, 1);
      g.fillRoundedRect(35, 90, 50, 30, 8);
      g.fillRect(52, 40, 16, 52);
      // Main stone water basin
      g.fillStyle(0x64748B, 1);
      g.fillEllipse(60, 40, 110, 38);
      // Shimmering blue water
      g.fillStyle(0x38BDF8, 0.95);
      g.fillEllipse(60, 36, 96, 28);
      g.fillStyle(0xE0F2FE, 0.7);
      g.fillCircle(60, 34, 6); // Water ripple
      // Tiny white dove perched on rim
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(105, 26, 6);
      g.fillEllipse(111, 28, 10, 6);
      g.fillStyle(0xF59E0B, 1);
      g.fillTriangle(102, 26, 99, 27, 102, 29); // Beak
      g.generateTexture('garden_fountain', 120, 120);
      g.destroy();
    }

    // 3. Blooming Flower Bush
    if (!scene.textures.exists('garden_bush')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x15803D, 1);
      g.fillCircle(30, 30, 24);
      g.fillCircle(50, 25, 22);
      g.fillCircle(40, 42, 24);
      // Pink Roses
      g.fillStyle(0xF43F5E, 1);
      g.fillCircle(24, 22, 6);
      g.fillCircle(44, 18, 7);
      g.fillCircle(36, 36, 6);
      g.fillCircle(54, 32, 5);
      g.fillStyle(0xFFD1DC, 1);
      g.fillCircle(24, 22, 2.5);
      g.fillCircle(44, 18, 3);
      g.generateTexture('garden_bush', 80, 70);
      g.destroy();
    }

    // 4. Fluttering Butterfly
    if (!scene.textures.exists('butterfly')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8B5CF6, 1); // Purple wings
      g.fillEllipse(8, 8, 8, 12);
      g.fillEllipse(20, 8, 8, 12);
      g.fillEllipse(9, 17, 6, 8);
      g.fillEllipse(19, 17, 6, 8);
      g.fillStyle(0xFDE047, 1);
      g.fillCircle(8, 8, 2);
      g.fillCircle(20, 8, 2);
      g.lineStyle(1.5, 0x1E1B4B, 1);
      g.lineBetween(14, 4, 14, 20);
      g.generateTexture('butterfly', 28, 24);
      g.destroy();
    }
  }

  // --- LOCATION 3: NAP LOFT TEXTURES ---
  private static createLoftTextures(scene: Phaser.Scene): void {
    // 1. Dark Cozy Timber Floor Tile
    if (!scene.textures.exists('loft_floor_tile')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x451A03, 1); // Warm dark mahogany
      g.fillRect(0, 0, 64, 64);
      g.lineStyle(1, 0x270E02, 0.7);
      g.lineBetween(0, 32, 64, 32);
      g.lineBetween(24, 0, 24, 32);
      g.lineBetween(48, 32, 48, 64);
      g.generateTexture('loft_floor_tile', 64, 64);
      g.destroy();
    }

    // 2. Bookshelf Packed with Books
    if (!scene.textures.exists('loft_bookshelf')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      // Shelf frame
      g.fillStyle(0x78350F, 1);
      g.fillRect(0, 0, 90, 110);
      g.fillStyle(0x451A03, 1);
      g.fillRect(4, 4, 82, 48);
      g.fillRect(4, 56, 82, 50);
      // Colorful books top shelf
      const colors = [0xEF4444, 0x3B82F6, 0x10B981, 0xF59E0B, 0x8B5CF6, 0xEC4899];
      let x = 8;
      for (const c of colors) {
        g.fillStyle(c, 1);
        g.fillRect(x, 14, 10, 38);
        x += 13;
      }
      // Books bottom shelf
      x = 8;
      for (const c of [0x06B6D4, 0xF97316, 0x84CC16, 0x6366F1, 0x14B8A6]) {
        g.fillStyle(c, 1);
        g.fillRect(x, 66, 12, 40);
        x += 15;
      }
      g.generateTexture('loft_bookshelf', 90, 110);
      g.destroy();
    }

    // 3. String of Glowing Fairy Lights
    if (!scene.textures.exists('fairy_lights')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(2, 0x78350F, 0.8);
      g.beginPath();
      g.moveTo(0, 10);
      g.lineTo(80, 24);
      g.lineTo(160, 10);
      g.strokePath();

      const bulbPos = [20, 50, 80, 110, 140];
      for (const bx of bulbPos) {
        const by = bx <= 80 ? 10 + (bx / 80) * 14 : 24 - ((bx - 80) / 80) * 14;
        g.fillStyle(0xFEF08A, 0.4);
        g.fillCircle(bx, by + 6, 8); // Soft glow
        g.fillStyle(0xFFFBEB, 1);
        g.fillCircle(bx, by + 6, 4); // Bright filament
      }
      g.generateTexture('fairy_lights', 160, 36);
      g.destroy();
    }

    // 4. Rainy Skylight Window
    if (!scene.textures.exists('loft_skylight')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x27272A, 1);
      g.fillRoundedRect(0, 0, 130, 80, 12);
      g.fillStyle(0x38BDF8, 0.7); // Rainy tinted glass
      g.fillRoundedRect(6, 6, 118, 68, 8);
      g.lineStyle(3, 0x18181B, 1);
      g.lineBetween(65, 6, 65, 74);
      g.lineBetween(6, 40, 124, 40);
      // Rain streaks
      g.lineStyle(1.5, 0xE0F2FE, 0.8);
      g.lineBetween(24, 14, 20, 26);
      g.lineBetween(84, 18, 78, 32);
      g.lineBetween(48, 44, 44, 58);
      g.generateTexture('loft_skylight', 130, 80);
      g.destroy();
    }
  }

  // --- 18+ PROPS & 12+ UNLOCKABLE DÉCOR ITEMS ---
  private static createItemAndDecorTextures(scene: Phaser.Scene): void {
    // Beds
    if (!scene.textures.exists('cat_bed')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFB7185, 1);
      g.fillEllipse(45, 26, 88, 44);
      g.fillStyle(0xFFE4E6, 1);
      g.fillEllipse(45, 24, 72, 34);
      g.generateTexture('cat_bed', 90, 50);
      g.destroy();
    }

    if (!scene.textures.exists('decor_royal_sofa')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7C3AED, 1); // Royal Purple Velvet
      g.fillRoundedRect(4, 10, 92, 40, 10);
      g.fillStyle(0xA78BFA, 1);
      g.fillRoundedRect(12, 16, 76, 26, 6);
      g.fillStyle(0xFBBF24, 1); // Gold trim button
      g.fillCircle(30, 28, 3);
      g.fillCircle(50, 28, 3);
      g.fillCircle(70, 28, 3);
      g.generateTexture('decor_royal_sofa', 100, 56);
      g.destroy();
    }

    // Bowls
    if (!scene.textures.exists('bowl_full')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x3B82F6, 1);
      g.fillEllipse(25, 16, 46, 24);
      g.fillStyle(0x93C5FD, 1);
      g.fillEllipse(25, 13, 38, 16);
      g.fillStyle(0x92400E, 1);
      g.fillCircle(20, 12, 3);
      g.fillCircle(25, 14, 3.5);
      g.fillCircle(30, 11, 3);
      g.generateTexture('bowl_full', 50, 30);
      g.destroy();
    }

    if (!scene.textures.exists('bowl_fish')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xF59E0B, 1); // Golden bowl
      g.fillEllipse(25, 16, 46, 24);
      g.fillStyle(0xFEF3C7, 1);
      g.fillEllipse(25, 13, 38, 16);
      g.fillStyle(0xF43F5E, 1);
      g.fillEllipse(25, 13, 20, 10);
      g.fillTriangle(33, 13, 41, 8, 41, 18);
      g.generateTexture('bowl_fish', 50, 30);
      g.destroy();
    }

    // Toys
    if (!scene.textures.exists('toy_yarn')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xEC4899, 1);
      g.fillCircle(16, 16, 14);
      g.lineStyle(2, 0xBE185D, 0.7);
      g.arc(16, 16, 10, 0.4, 2.8, false);
      g.strokePath();
      g.generateTexture('toy_yarn', 32, 32);
      g.destroy();
    }

    if (!scene.textures.exists('toy_feather')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(2, 0xD97706, 1);
      g.lineBetween(4, 36, 24, 12);
      g.fillStyle(0x38BDF8, 1);
      g.fillEllipse(26, 10, 14, 6);
      g.fillStyle(0xF43F5E, 1);
      g.fillEllipse(28, 6, 12, 5);
      g.generateTexture('toy_feather', 36, 40);
      g.destroy();
    }

    // Room Décor Unlocks
    if (!scene.textures.exists('decor_lamp')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x78350F, 1);
      g.fillRect(18, 30, 4, 16);
      g.fillEllipse(20, 46, 20, 6);
      g.fillStyle(0xFEF08A, 1);
      g.fillTriangle(8, 30, 32, 30, 20, 10);
      g.generateTexture('decor_lamp', 40, 52);
      g.destroy();
    }

    if (!scene.textures.exists('decor_trophy')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFBBF24, 1);
      g.fillRect(16, 8, 24, 26);
      g.fillCircle(28, 34, 6);
      g.fillRect(24, 34, 8, 14);
      g.fillRoundedRect(14, 46, 28, 8, 2);
      g.lineStyle(3, 0xF59E0B, 1);
      g.arc(14, 20, 8, 1.5, 4.7, false);
      g.strokePath();
      g.arc(42, 20, 8, -1.5, 1.7, false);
      g.strokePath();
      g.generateTexture('decor_trophy', 56, 56);
      g.destroy();
    }
  }

  // --- PARTICLES, WEATHER, AND EMOTES ---
  private static createParticleAndFxTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('particle_star')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFDE047, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(8, 8, 3);
      g.generateTexture('particle_star', 16, 16);
      g.destroy();
    }

    if (!scene.textures.exists('particle_heart')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFB7185, 1);
      g.fillCircle(5, 5, 4);
      g.fillCircle(11, 5, 4);
      g.fillTriangle(2, 6, 14, 6, 8, 14);
      g.generateTexture('particle_heart', 16, 16);
      g.destroy();
    }

    if (!scene.textures.exists('particle_rain')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(1.5, 0xBAE6FD, 0.7);
      g.lineBetween(2, 0, 0, 16);
      g.generateTexture('particle_rain', 6, 18);
      g.destroy();
    }

    // Emotes
    if (!scene.textures.exists('emote_heart')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(18, 18, 16);
      g.fillStyle(0xF43F5E, 1);
      g.fillCircle(13, 14, 5);
      g.fillCircle(23, 14, 5);
      g.fillTriangle(8, 15, 28, 15, 18, 25);
      g.generateTexture('emote_heart', 36, 36);
      g.destroy();
    }

    if (!scene.textures.exists('emote_sleep')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1E293B, 0.85);
      g.fillCircle(18, 18, 16);
      g.fillStyle(0x38BDF8, 1);
      g.fillRect(10, 10, 16, 3);
      g.fillRect(10, 22, 16, 3);
      g.lineStyle(3, 0x38BDF8, 1);
      g.lineBetween(24, 12, 12, 23);
      g.generateTexture('emote_sleep', 36, 36);
      g.destroy();
    }

    if (!scene.textures.exists('emote_food')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(18, 18, 16);
      g.fillStyle(0xF59E0B, 1);
      g.fillEllipse(18, 18, 14, 8);
      g.fillTriangle(24, 18, 30, 13, 30, 23);
      g.generateTexture('emote_food', 36, 36);
      g.destroy();
    }

    if (!scene.textures.exists('emote_play')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(18, 18, 16);
      g.fillStyle(0x8B5CF6, 1);
      g.fillTriangle(18, 8, 21, 16, 28, 18);
      g.fillTriangle(18, 8, 15, 16, 8, 18);
      g.fillTriangle(18, 28, 21, 20, 28, 18);
      g.fillTriangle(18, 28, 15, 20, 8, 18);
      g.generateTexture('emote_play', 36, 36);
      g.destroy();
    }

    if (!scene.textures.exists('emote_camera')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFFFFFF, 0.95);
      g.fillCircle(18, 18, 16);
      g.fillStyle(0x3B82F6, 1);
      g.fillRoundedRect(9, 12, 18, 14, 3);
      g.fillStyle(0xFFFFFF, 1);
      g.fillCircle(18, 19, 4);
      g.generateTexture('emote_camera', 36, 36);
      g.destroy();
    }
  }
}
