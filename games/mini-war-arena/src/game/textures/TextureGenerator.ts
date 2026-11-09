import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

/**
 * Procedural 2D Cartoon Sprite & Texture Generator
 * Produces crisp, copyright-free cartoon assets tailored for 9:16 portrait livestreaming.
 */
export class TextureGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    const { RED_PRIMARY, RED_DARK, RED_ACCENT, BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD } = GAME_CONFIG.COLORS;

    // 1. Warriors
    this.createWarrior(scene, 'red-warrior', RED_PRIMARY, RED_DARK, RED_ACCENT, GOLD);
    this.createWarrior(scene, 'blue-warrior', BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD);

    // 2. Archers
    this.createArcher(scene, 'red-archer', RED_PRIMARY, RED_DARK, RED_ACCENT, GOLD);
    this.createArcher(scene, 'blue-archer', BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD);

    // 3. Tanks
    this.createTank(scene, 'red-tank', RED_PRIMARY, RED_DARK, RED_ACCENT, GOLD);
    this.createTank(scene, 'blue-tank', BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD);

    // 4. Mages
    this.createMage(scene, 'red-mage', RED_PRIMARY, RED_DARK, RED_ACCENT, GOLD);
    this.createMage(scene, 'blue-mage', BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD);

    // 5. Bosses
    this.createBoss(scene, 'red-boss', 'red', RED_PRIMARY, RED_DARK, RED_ACCENT, GOLD);
    this.createBoss(scene, 'blue-boss', 'blue', BLUE_PRIMARY, BLUE_DARK, BLUE_ACCENT, GOLD);

    // 6. Projectiles and VFX textures
    this.createProjectiles(scene);

    // 7. Arena environment textures & ambient particles
    this.createArenaDecorations(scene);
  }

  // --- 1. WARRIOR TEXTURE ---
  private static createWarrior(scene: Phaser.Scene, key: string, primary: number, dark: number, accent: number, gold: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x07152d, 0.6);
    g.fillEllipse(47, 102, 58, 10);

    // Boots & Legs
    g.fillStyle(0x1a263c);
    g.fillRoundedRect(22, 76, 18, 22, 6);
    g.fillRoundedRect(52, 76, 18, 22, 6);
    g.fillStyle(dark);
    g.fillRoundedRect(21, 90, 20, 10, 4);
    g.fillRoundedRect(51, 90, 20, 10, 4);

    // Cloak
    g.fillStyle(dark);
    g.fillTriangle(26, 48, 66, 48, 70, 90);

    // Arms
    g.lineStyle(11, primary);
    g.lineBetween(28, 56, 13, 69); // Shield arm
    g.lineBetween(63, 54, 76, 63); // Sword arm
    g.fillStyle(0xf8cca0);
    g.fillCircle(12, 70, 7);
    g.fillCircle(78, 65, 6);

    // Sword
    g.lineStyle(5, 0x8ea2b8);
    g.lineBetween(77, 65, 85, 22);
    g.lineStyle(3, 0xf0faff);
    g.lineBetween(78, 64, 85, 24);
    g.lineStyle(5, gold);
    g.lineBetween(72, 60, 86, 63); // Crossguard

    // Body Armor
    g.fillStyle(dark);
    g.fillRoundedRect(24, 43, 44, 40, 11);
    g.fillStyle(primary);
    g.fillRoundedRect(27, 45, 38, 33, 9);
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(31, 48, 16, 10, 4);
    g.lineStyle(3, accent, 0.75);
    g.strokeRoundedRect(27, 45, 38, 33, 9);

    // Crest emblem
    g.fillStyle(gold);
    g.fillCircle(46, 63, 7);
    g.fillStyle(0x16263f);
    g.fillCircle(46, 63, 3);

    // Shield
    g.fillStyle(dark);
    g.fillRoundedRect(3, 60, 25, 30, 8);
    g.fillStyle(primary);
    g.fillRoundedRect(5, 62, 21, 24, 6);
    g.lineStyle(2, 0xfff0aa);
    g.strokeRoundedRect(5, 62, 21, 24, 6);
    g.fillStyle(gold);
    g.fillCircle(15, 74, 5);

    // Face / Head
    g.fillStyle(0xffd5a5);
    g.fillRoundedRect(30, 27, 34, 30, 10);
    // Big cartoon eyes
    g.fillStyle(0x0f1c33);
    g.fillCircle(41, 46, 3.5);
    g.fillCircle(53, 46, 3.5);
    g.fillStyle(0xffffff);
    g.fillCircle(42, 45, 1.2);
    g.fillCircle(54, 45, 1.2);

    // Helmet & Plume
    g.fillStyle(dark);
    g.fillRoundedRect(25, 13, 46, 29, 11);
    g.fillStyle(primary);
    g.fillRoundedRect(26, 11, 44, 26, 10);
    g.fillStyle(0xffffff, 0.25);
    g.fillRoundedRect(31, 14, 18, 7, 3);
    g.fillStyle(gold);
    g.fillTriangle(37, 12, 48, -1, 59, 12);
    g.fillCircle(48, 24, 5);

    g.generateTexture(key, 96, 110);
    g.destroy();
  }

  // --- 2. ARCHER TEXTURE ---
  private static createArcher(scene: Phaser.Scene, key: string, primary: number, dark: number, accent: number, gold: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x07152d, 0.55);
    g.fillEllipse(44, 100, 52, 9);

    // Legs
    g.fillStyle(0x27364b);
    g.fillRoundedRect(22, 75, 15, 22, 5);
    g.fillRoundedRect(48, 75, 15, 22, 5);
    g.fillStyle(0x60452b); // Leather boots
    g.fillRoundedRect(21, 88, 17, 11, 4);
    g.fillRoundedRect(47, 88, 17, 11, 4);

    // Quiver on back with arrows
    g.fillStyle(0x56381e);
    g.fillRoundedRect(20, 36, 14, 34, 4);
    g.lineStyle(3, 0xd0e8ff);
    g.lineBetween(23, 34, 21, 20); // Arrow fletching
    g.lineBetween(28, 34, 27, 18);
    g.fillStyle(accent);
    g.fillTriangle(19, 21, 24, 21, 22, 16);
    g.fillTriangle(25, 19, 30, 19, 28, 14);

    // Body Tunic
    g.fillStyle(dark);
    g.fillRoundedRect(26, 44, 36, 36, 9);
    g.fillStyle(primary);
    g.fillRoundedRect(28, 46, 32, 31, 7);
    g.lineStyle(2, gold);
    g.strokeRoundedRect(28, 46, 32, 31, 7);

    // Face
    g.fillStyle(0xffd5a5);
    g.fillRoundedRect(29, 26, 31, 28, 9);
    // Expressive focused eyes
    g.fillStyle(0x0f1c33);
    g.fillCircle(39, 44, 3);
    g.fillCircle(50, 44, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(40, 43, 1);
    g.fillCircle(51, 43, 1);

    // Ranger Hood / Cap
    g.fillStyle(dark);
    g.fillRoundedRect(25, 14, 40, 24, 9);
    g.fillStyle(primary);
    g.fillRoundedRect(26, 12, 38, 22, 8);
    // Feather
    g.fillStyle(gold);
    g.fillTriangle(48, 12, 58, 2, 54, 16);

    // Bow in hands
    g.lineStyle(9, primary);
    g.lineBetween(32, 54, 52, 60); // Bow arm
    g.lineBetween(30, 56, 18, 62); // String pull arm
    g.fillStyle(0xf8cca0);
    g.fillCircle(55, 62, 5);
    g.fillCircle(17, 63, 5);

    // Curved Bow
    g.lineStyle(4, 0x8b5a2b);
    g.beginPath();
    g.arc(58, 60, 26, -Math.PI * 0.45, Math.PI * 0.45);
    g.strokePath();

    // Bowstring
    g.lineStyle(1.5, 0xffffff, 0.9);
    g.lineBetween(66, 37, 20, 63);
    g.lineBetween(20, 63, 66, 83);

    // Nocked arrow
    g.lineStyle(3, 0xdfe9f2);
    g.lineBetween(20, 63, 76, 60);
    g.fillStyle(0x758c9b);
    g.fillTriangle(75, 57, 83, 60, 75, 63);

    g.generateTexture(key, 96, 110);
    g.destroy();
  }

  // --- 3. TANK TEXTURE ---
  private static createTank(scene: Phaser.Scene, key: string, primary: number, dark: number, accent: number, gold: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Large Shadow
    g.fillStyle(0x07152d, 0.65);
    g.fillEllipse(54, 106, 74, 13);

    // Thick Greaves / Legs
    g.fillStyle(0x19273c);
    g.fillRoundedRect(24, 76, 24, 25, 7);
    g.fillRoundedRect(60, 76, 24, 25, 7);
    g.fillStyle(dark);
    g.fillRoundedRect(22, 90, 28, 14, 5);
    g.fillRoundedRect(58, 90, 28, 14, 5);

    // Heavy Body Armor
    g.fillStyle(dark);
    g.fillRoundedRect(22, 40, 64, 45, 12);
    g.fillStyle(primary);
    g.fillRoundedRect(25, 42, 58, 38, 10);
    g.lineStyle(4, 0x6e87a2);
    g.strokeRoundedRect(25, 42, 58, 38, 10);
    // Golden chestplate studs
    g.fillStyle(gold);
    g.fillCircle(35, 52, 4);
    g.fillCircle(73, 52, 4);
    g.fillCircle(54, 64, 6);

    // Giant Reinforced Tower Shield on Left
    g.fillStyle(0x1b2d45);
    g.fillRoundedRect(2, 42, 34, 56, 9);
    g.fillStyle(primary);
    g.fillRoundedRect(5, 45, 28, 50, 7);
    g.lineStyle(3, gold);
    g.strokeRoundedRect(5, 45, 28, 50, 7);
    g.fillStyle(dark);
    g.fillTriangle(19, 52, 8, 70, 30, 70);
    g.fillCircle(19, 72, 6);

    // Head / Full Visor Helmet
    g.fillStyle(dark);
    g.fillRoundedRect(32, 14, 46, 32, 10);
    g.fillStyle(primary);
    g.fillRoundedRect(34, 16, 42, 28, 9);
    // Glowing horizontal visor
    g.fillStyle(0x091423);
    g.fillRoundedRect(39, 29, 32, 8, 3);
    g.fillStyle(accent);
    g.fillRoundedRect(42, 31, 26, 4, 2);

    // Massive Iron Horns on Helmet
    g.fillStyle(gold);
    g.fillTriangle(33, 20, 20, 4, 37, 15);
    g.fillTriangle(77, 20, 90, 4, 73, 15);

    // Heavy War Hammer on Right
    g.lineStyle(6, 0x614833);
    g.lineBetween(78, 70, 94, 28);
    // Hammer head
    g.fillStyle(0x4a6078);
    g.fillRoundedRect(84, 20, 22, 22, 5);
    g.lineStyle(2, gold);
    g.strokeRoundedRect(84, 20, 22, 22, 5);

    g.generateTexture(key, 110, 116);
    g.destroy();
  }

  // --- 4. MAGE TEXTURE ---
  private static createMage(scene: Phaser.Scene, key: string, primary: number, dark: number, accent: number, gold: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Shadow
    g.fillStyle(0x07152d, 0.55);
    g.fillEllipse(46, 102, 54, 9);

    // Mystical Robe (Flared bottom)
    g.fillStyle(dark);
    g.fillTriangle(20, 96, 72, 96, 46, 42);
    g.fillStyle(primary);
    g.fillTriangle(23, 94, 69, 94, 46, 46);
    // Robe trim
    g.lineStyle(3, gold);
    g.lineBetween(23, 94, 69, 94);
    g.lineBetween(46, 48, 46, 92);

    // Mystic Belt & Gem
    g.fillStyle(0x19273c);
    g.fillRoundedRect(32, 66, 28, 7, 3);
    g.fillStyle(gold);
    g.fillCircle(46, 69, 4.5);

    // Head
    g.fillStyle(0xffd5a5);
    g.fillRoundedRect(32, 28, 28, 26, 8);
    // Glowing eyes
    g.fillStyle(accent);
    g.fillCircle(41, 42, 3.5);
    g.fillCircle(51, 42, 3.5);
    g.fillStyle(0xffffff);
    g.fillCircle(41, 42, 1.5);
    g.fillCircle(51, 42, 1.5);

    // Pointed Wizard Hat
    g.fillStyle(dark);
    g.fillEllipse(46, 31, 56, 13);
    g.fillStyle(primary);
    g.fillEllipse(46, 30, 52, 11);
    g.fillStyle(dark);
    g.fillTriangle(27, 28, 65, 28, 48, -2);
    g.fillStyle(primary);
    g.fillTriangle(29, 27, 63, 27, 48, 1);
    // Hat ribbon & star
    g.fillStyle(gold);
    g.fillRoundedRect(33, 23, 26, 5, 2);
    g.fillCircle(46, 25, 4);

    // Magic Staff in Left Hand
    g.lineStyle(5, 0x634226);
    g.lineBetween(18, 96, 18, 20); // Staff shaft
    // Staff head prongs
    g.lineStyle(3, gold);
    g.lineBetween(13, 24, 18, 15);
    g.lineBetween(23, 24, 18, 15);
    // Glowing Magic Orb atop staff
    g.fillStyle(accent, 0.4);
    g.fillCircle(18, 12, 12);
    g.fillStyle(accent);
    g.fillCircle(18, 12, 8);
    g.fillStyle(0xffffff);
    g.fillCircle(18, 10, 3.5);

    // Casting Hand
    g.lineStyle(8, primary);
    g.lineBetween(54, 52, 68, 60);
    g.fillStyle(0xf8cca0);
    g.fillCircle(71, 62, 5);
    // Magic spark at casting hand
    g.fillStyle(accent, 0.8);
    g.fillCircle(75, 62, 4);

    g.generateTexture(key, 96, 110);
    g.destroy();
  }

  // --- 5. BOSS TEXTURE ---
  private static createBoss(scene: Phaser.Scene, key: string, team: 'red' | 'blue', primary: number, dark: number, accent: number, gold: number): void {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Boss has larger 140x150 canvas
    // Massive Ground Shadow
    g.fillStyle(0x040e1f, 0.75);
    g.fillEllipse(70, 140, 106, 18);

    // Heavy Plated Boots
    g.fillStyle(0x111c2e);
    g.fillRoundedRect(34, 102, 30, 34, 8);
    g.fillRoundedRect(76, 102, 30, 34, 8);
    g.fillStyle(dark);
    g.fillRoundedRect(31, 122, 36, 17, 6);
    g.fillRoundedRect(73, 122, 36, 17, 6);
    g.lineStyle(3, gold);
    g.strokeRoundedRect(31, 122, 36, 17, 6);
    g.strokeRoundedRect(73, 122, 36, 17, 6);

    // Flowing Cape
    g.fillStyle(dark);
    g.fillTriangle(30, 52, 110, 52, 122, 132);
    g.fillTriangle(30, 52, 110, 52, 18, 132);

    // Colossal Chest Armor
    g.fillStyle(0x131f31);
    g.fillRoundedRect(28, 48, 84, 62, 15);
    g.fillStyle(primary);
    g.fillRoundedRect(32, 52, 76, 54, 13);
    g.lineStyle(4, gold);
    g.strokeRoundedRect(32, 52, 76, 54, 13);

    // Glowing Power Core (Emblem)
    g.fillStyle(0x060f1d);
    g.fillCircle(70, 78, 15);
    g.fillStyle(accent);
    g.fillCircle(70, 78, 11);
    g.fillStyle(0xffffff);
    g.fillCircle(70, 76, 5);

    // Massive Spiked Shoulders (Pauldrons)
    g.fillStyle(dark);
    g.fillRoundedRect(14, 46, 32, 28, 8);
    g.fillRoundedRect(94, 46, 32, 28, 8);
    g.fillStyle(primary);
    g.fillRoundedRect(17, 48, 26, 24, 6);
    g.fillRoundedRect(97, 48, 26, 24, 6);
    // Spikes on Pauldrons
    g.fillStyle(gold);
    g.fillTriangle(18, 46, 27, 30, 36, 46);
    g.fillTriangle(98, 46, 107, 30, 116, 46);

    // Boss Head & Helm
    g.fillStyle(dark);
    g.fillRoundedRect(44, 18, 52, 38, 12);
    g.fillStyle(primary);
    g.fillRoundedRect(47, 20, 46, 34, 10);

    // Glowing Eyes
    g.fillStyle(0x050c18);
    g.fillRoundedRect(52, 34, 36, 10, 4);
    g.fillStyle(accent);
    g.fillCircle(60, 39, 4.5);
    g.fillCircle(80, 39, 4.5);
    g.fillStyle(0xffffff);
    g.fillCircle(60, 38, 2);
    g.fillCircle(80, 38, 2);

    // Unique Team Headpiece
    if (team === 'red') {
      // Red Warlord: Menacing Demonic Horns
      g.fillStyle(gold);
      g.fillTriangle(48, 24, 18, -10, 56, 18);
      g.fillTriangle(44, 22, 18, -10, 30, 6);
      g.fillTriangle(92, 24, 122, -10, 84, 18);
      g.fillTriangle(96, 22, 122, -10, 110, 6);
    } else {
      // Blue Titan: Majestic Spiked Crystal Crown
      g.fillStyle(gold);
      g.fillTriangle(50, 20, 54, -4, 60, 20);
      g.fillTriangle(64, 20, 70, -10, 76, 20);
      g.fillTriangle(80, 20, 86, -4, 90, 20);
      g.fillCircle(70, 22, 5);
    }

    // Boss Giant Weapon
    if (team === 'red') {
      // Massive Flaming Broadsword
      g.lineStyle(8, 0x303e50);
      g.lineBetween(106, 92, 132, 12);
      g.lineStyle(5, 0xff7b2e);
      g.lineBetween(106, 90, 132, 14);
      g.lineStyle(2, 0xfff3a3);
      g.lineBetween(106, 88, 132, 16);
      g.fillStyle(gold);
      g.fillRoundedRect(98, 86, 20, 10, 3); // Crossguard
    } else {
      // Massive Crystal Warhammer
      g.lineStyle(8, 0x423528);
      g.lineBetween(106, 96, 128, 16);
      g.fillStyle(0x356598);
      g.fillRoundedRect(114, 10, 24, 28, 6);
      g.lineStyle(3, accent);
      g.strokeRoundedRect(114, 10, 24, 28, 6);
      g.fillStyle(0xffffff);
      g.fillCircle(126, 24, 5);
    }

    g.generateTexture(key, 142, 154);
    g.destroy();
  }

  // --- 6. PROJECTILES AND VFX ---
  private static createProjectiles(scene: Phaser.Scene): void {
    // Arrow
    if (!scene.textures.exists('arrow-proj')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(3, 0x6e5033);
      g.lineBetween(4, 8, 30, 8); // Shaft
      g.fillStyle(0x9db2c2);
      g.fillTriangle(30, 4, 38, 8, 30, 12); // Tip
      g.fillStyle(GAME_CONFIG.COLORS.GOLD);
      g.fillTriangle(2, 4, 8, 8, 2, 8); // Fletch top
      g.fillTriangle(2, 12, 8, 8, 2, 8); // Fletch bottom
      g.generateTexture('arrow-proj', 40, 16);
      g.destroy();
    }

    // Magic Orb Red
    if (!scene.textures.exists('magic-orb-red')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(GAME_CONFIG.COLORS.RED_PRIMARY, 0.4);
      g.fillCircle(16, 16, 15);
      g.fillStyle(GAME_CONFIG.COLORS.RED_PRIMARY, 0.85);
      g.fillCircle(16, 16, 10);
      g.fillStyle(GAME_CONFIG.COLORS.GOLD, 0.9);
      g.fillCircle(16, 16, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(16, 16, 2.5);
      g.generateTexture('magic-orb-red', 32, 32);
      g.destroy();
    }

    // Magic Orb Blue
    if (!scene.textures.exists('magic-orb-blue')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(GAME_CONFIG.COLORS.BLUE_PRIMARY, 0.4);
      g.fillCircle(16, 16, 15);
      g.fillStyle(GAME_CONFIG.COLORS.BLUE_PRIMARY, 0.85);
      g.fillCircle(16, 16, 10);
      g.fillStyle(GAME_CONFIG.COLORS.BLUE_ACCENT, 0.9);
      g.fillCircle(16, 16, 6);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(16, 16, 2.5);
      g.generateTexture('magic-orb-blue', 32, 32);
      g.destroy();
    }

    // Boss Shockwave ring
    if (!scene.textures.exists('shockwave-ring')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(5, GAME_CONFIG.COLORS.GOLD, 0.9);
      g.strokeCircle(48, 48, 42);
      g.lineStyle(2, 0xffffff, 0.7);
      g.strokeCircle(48, 48, 45);
      g.generateTexture('shockwave-ring', 96, 96);
      g.destroy();
    }
  }

  // --- 7. ARENA DECORATIONS & AMBIENT PARTICLES ---
  private static createArenaDecorations(scene: Phaser.Scene): void {
    // 1. Sparkle Particle
    if (!scene.textures.exists('particle-sparkle')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffe680, 0.9);
      g.fillCircle(8, 8, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 2);
      g.generateTexture('particle-sparkle', 16, 16);
      g.destroy();
    }

    // 2. Leaf Particle (Forest Theme)
    if (!scene.textures.exists('particle-leaf')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x22c55e, 0.85);
      g.fillEllipse(10, 8, 14, 6);
      g.lineStyle(1, 0x15803d, 0.7);
      g.lineBetween(4, 8, 16, 8);
      g.generateTexture('particle-leaf', 20, 16);
      g.destroy();
    }

    // 3. Snow / Frost Crystal Particle (Crystal Pass Theme)
    if (!scene.textures.exists('particle-snow')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7dd3fc, 0.8);
      g.fillCircle(8, 8, 4);
      g.lineStyle(1.5, 0xffffff, 0.9);
      g.lineBetween(8, 2, 8, 14);
      g.lineBetween(2, 8, 14, 8);
      g.generateTexture('particle-snow', 16, 16);
      g.destroy();
    }

    // 4. Ember Particle (Ember Keep Theme)
    if (!scene.textures.exists('particle-ember')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf97316, 0.9);
      g.fillCircle(8, 8, 5);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(8, 8, 2.5);
      g.generateTexture('particle-ember', 16, 16);
      g.destroy();
    }

    // 5. Shield Barrier Aura
    if (!scene.textures.exists('shield-barrier')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38bdf8, 0.25);
      g.fillCircle(32, 32, 30);
      g.lineStyle(3, 0x7dd3fc, 0.9);
      g.strokeCircle(32, 32, 29);
      g.lineStyle(1.5, 0xffffff, 0.75);
      g.strokeCircle(32, 32, 25);
      g.generateTexture('shield-barrier', 64, 64);
      g.destroy();
    }

    // 6. Boss Unique Shockwave - Fire (Infernal Warlord)
    if (!scene.textures.exists('boss-ring-fire')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(7, 0xf97316, 0.85);
      g.strokeCircle(64, 64, 56);
      g.lineStyle(4, 0xfacc15, 0.95);
      g.strokeCircle(64, 64, 60);
      g.lineStyle(2, 0xffffff, 1);
      g.strokeCircle(64, 64, 54);
      g.generateTexture('boss-ring-fire', 128, 128);
      g.destroy();
    }

    // 7. Boss Unique Shockwave - Crystal (Crystal Titan)
    if (!scene.textures.exists('boss-ring-crystal')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.lineStyle(7, 0x0284c7, 0.85);
      g.strokeCircle(64, 64, 56);
      g.lineStyle(4, 0x38bdf8, 0.95);
      g.strokeCircle(64, 64, 60);
      g.lineStyle(2, 0xe0f2fe, 1);
      g.strokeCircle(64, 64, 54);
      g.generateTexture('boss-ring-crystal', 128, 128);
      g.destroy();
    }

    // 8. Crystal Shard
    if (!scene.textures.exists('crystal-shard')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x38bdf8, 0.9);
      g.fillTriangle(12, 2, 22, 28, 2, 28);
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(12, 4, 18, 26, 6, 26);
      g.generateTexture('crystal-shard', 24, 30);
      g.destroy();
    }

    // 9. Ground Scorch Decal
    if (!scene.textures.exists('ground-scorch')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x180808, 0.6);
      g.fillEllipse(48, 24, 88, 38);
      g.fillStyle(0xf97316, 0.35);
      g.fillEllipse(48, 24, 60, 22);
      g.generateTexture('ground-scorch', 96, 48);
      g.destroy();
    }

    // 10. Team Banners
    if (!scene.textures.exists('banner-red')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x8a142c);
      g.fillRoundedRect(0, 0, 36, 54, 4);
      g.fillStyle(0xff3355);
      g.fillRoundedRect(3, 3, 30, 48, 3);
      g.fillStyle(GAME_CONFIG.COLORS.GOLD);
      g.fillCircle(18, 20, 8);
      g.fillStyle(0x8a142c);
      g.fillCircle(18, 20, 4);
      g.fillTriangle(3, 40, 18, 50, 33, 40);
      g.generateTexture('banner-red', 36, 54);
      g.destroy();
    }

    if (!scene.textures.exists('banner-blue')) {
      const g = scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x0a3c94);
      g.fillRoundedRect(0, 0, 36, 54, 4);
      g.fillStyle(0x0066ff);
      g.fillRoundedRect(3, 3, 30, 48, 3);
      g.fillStyle(GAME_CONFIG.COLORS.GOLD);
      g.fillCircle(18, 20, 8);
      g.fillStyle(0x0a3c94);
      g.fillCircle(18, 20, 4);
      g.fillTriangle(3, 40, 18, 50, 33, 40);
      g.generateTexture('banner-blue', 36, 54);
      g.destroy();
    }
  }
}

