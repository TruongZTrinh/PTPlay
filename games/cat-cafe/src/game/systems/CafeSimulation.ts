import Phaser from 'phaser';
import { CAFE_CONFIG, RoomId, TimeOfDay, WeatherType } from '../config/CafeConfig';
import { Random } from '../utils/Random';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { CafePresentation } from '../visual/CafePresentation';

export class CafeSimulation {
  private scene: Phaser.Scene;
  public currentRoom: RoomId = 'cafe';
  public currentTimeOfDay: TimeOfDay = 'day';
  public currentWeather: WeatherType = 'sunny';

  // Presentation System
  private presentation: CafePresentation | null = null;

  // Room Container & Elements
  private roomContainer: Phaser.GameObjects.Container;
  private weatherContainer: Phaser.GameObjects.Container;
  private lightingOverlay: Phaser.GameObjects.Graphics;

  private bowls: Phaser.GameObjects.Image[] = [];
  private beds: Phaser.GameObjects.Image[] = [];
  private interactiveProps: Phaser.GameObjects.Image[] = [];
  private rainDrops: Phaser.GameObjects.Image[] = [];
  private butterflies: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.roomContainer = scene.add.container(0, 0);
    this.weatherContainer = scene.add.container(0, 0);
    this.weatherContainer.setDepth(850);

    this.lightingOverlay = scene.add.graphics();
    this.lightingOverlay.setDepth(900);

    const saved = ProgressionManager.getInstance().data.settings;
    this.currentRoom = saved.activeRoom;
    this.currentTimeOfDay = saved.timeOfDay;
    this.currentWeather = saved.weather;
  }

  public buildRoom(roomId: RoomId = this.currentRoom): void {
    this.currentRoom = roomId;
    this.clearRoom();

    if (roomId === 'cafe') {
      this.buildMainCafe();
    } else if (roomId === 'garden') {
      this.buildSunnyGarden();
    } else if (roomId === 'loft') {
      this.buildNapLoft();
    }

    this.applyAtmosphere(this.currentTimeOfDay, this.currentWeather);
  }

  private clearRoom(): void {
    if (this.presentation) {
      this.presentation.destroy();
      this.presentation = null;
    }

    for (const b of this.bowls) b.destroy();
    this.bowls = [];
    for (const bed of this.beds) bed.destroy();
    this.beds = [];
    for (const p of this.interactiveProps) p.destroy();
    this.interactiveProps = [];
    for (const bf of this.butterflies) bf.destroy();
    this.butterflies = [];

    this.roomContainer.removeAll(true);
  }

  // --- LOCATION 1: PREMIUM ILLUSTRATED CAFÉ (V2 ARCHITECTURE) ---
  private buildMainCafe(): void {
    this.presentation = new CafePresentation(this.scene);
    this.presentation.create();

    // Link interactive props and navigation targets
    this.bowls = this.presentation.furniture.getBowls();
    this.beds = [this.presentation.furniture.donutBed];
    this.interactiveProps = [
      this.presentation.furniture.catTree,
      this.presentation.furniture.toyYarn,
      this.presentation.furniture.toyFish,
      this.presentation.furniture.coffeeTable,
    ];
  }

  // --- LOCATION 2: SUNNY GARDEN ---
  private buildSunnyGarden(): void {
    const { width, height } = CAFE_CONFIG;

    // 1. Garden Sky & Distant Treeline
    const sky = this.scene.add.graphics();
    sky.fillStyle(0xBAE6FD, 1);
    sky.fillRect(0, 0, width, 380);

    // Fluffy clouds
    sky.fillStyle(0xFFFFFF, 0.85);
    sky.fillCircle(100, 140, 30);
    sky.fillCircle(140, 130, 45);
    sky.fillCircle(180, 145, 30);
    sky.fillCircle(380, 160, 35);
    sky.fillCircle(420, 150, 50);

    // Distant Green Hills
    sky.fillStyle(0x4ADE80, 1);
    sky.fillEllipse(120, 380, 340, 120);
    sky.fillEllipse(440, 380, 320, 130);
    this.roomContainer.add(sky);

    // 2. Soft Grass Garden Floor
    const grass = this.scene.add.tileSprite(width / 2, (height + 340) / 2, width, height - 340, 'garden_grass_tile');
    grass.setAlpha(0.96);
    this.roomContainer.add(grass);

    // 3. Wooden Patio Deck on Left
    const deck = this.scene.add.graphics();
    deck.fillStyle(0xD97706, 0.95);
    deck.fillRoundedRect(16, 420, 180, 220, 12);
    deck.lineStyle(2, 0xB45309, 0.8);
    deck.strokeRoundedRect(16, 420, 180, 220, 12);
    for (let y = 445; y < 640; y += 24) deck.lineBetween(16, y, 196, y);
    deck.setDepth(420);
    this.roomContainer.add(deck);

    // 4. Stone Bird Fountain with Bubbling Water
    const fountain = this.scene.add.image(width / 2 + 60, 470, 'garden_fountain');
    fountain.setDepth(470);
    this.roomContainer.add(fountain);
    this.interactiveProps.push(fountain);

    // 5. Flower Bushes
    const bush1 = this.scene.add.image(70, 370, 'garden_bush');
    bush1.setDepth(370);
    this.roomContainer.add(bush1);

    const bush2 = this.scene.add.image(470, 390, 'garden_bush');
    bush2.setDepth(390);
    this.roomContainer.add(bush2);

    // 6. Food Bowls on Deck
    for (let i = 0; i < 2; i++) {
      const bowl = this.scene.add.image(70 + i * 44, 460, 'bowl_fish_full_v2');
      bowl.setDepth(465);
      this.roomContainer.add(bowl);
      this.bowls.push(bowl);
    }

    // 7. Garden Napping Mat
    const bed = this.scene.add.image(105, 570, 'donut_bed_v2');
    bed.setScale(0.85);
    bed.setDepth(570);
    this.roomContainer.add(bed);
    this.beds.push(bed);

    // 8. Fluttering Butterflies
    for (let i = 0; i < 3; i++) {
      const bf = this.scene.add.image(Random.range(120, 450), Random.range(420, 680), 'butterfly');
      bf.setDepth(800);
      this.roomContainer.add(bf);
      this.butterflies.push(bf);

      this.scene.tweens.add({
        targets: bf,
        x: '+=35',
        y: '-=25',
        angle: { from: -15, to: 15 },
        duration: Random.range(1800, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // --- LOCATION 3: NAP LOFT ---
  private buildNapLoft(): void {
    const { width, height } = CAFE_CONFIG;

    // 1. Attic Slanted Timber Ceiling & Wallpaper
    const atticWall = this.scene.add.graphics();
    atticWall.fillStyle(0x3B1F12, 1);
    atticWall.fillRect(0, 0, width, 400);

    // Cozy wallpaper panels
    atticWall.fillStyle(0xFEF3C7, 0.9);
    atticWall.fillRect(20, 120, width - 40, 260);

    // Exposed Dark Wooden Beams
    atticWall.fillStyle(0x270E02, 1);
    atticWall.fillRect(0, 110, width, 18);
    atticWall.fillRect(0, 370, width, 18);
    atticWall.fillRect(width / 2 - 12, 110, 24, 270);
    this.roomContainer.add(atticWall);

    // 2. Dark Timber Floor
    const floor = this.scene.add.tileSprite(width / 2, (height + 388) / 2, width, height - 388, 'loft_floor_tile');
    floor.setAlpha(0.96);
    this.roomContainer.add(floor);

    // 3. Starlight Dormer Window
    const dormer = this.scene.add.image(width / 2, 220, 'loft_window');
    dormer.setDepth(2);
    this.roomContainer.add(dormer);

    // 4. Warm Hanging Fairy Lights
    const lights = this.scene.add.image(width / 2, 130, 'loft_fairylights');
    lights.setDepth(300);
    this.roomContainer.add(lights);

    // 5. Packed Bookshelf on Right Wall
    const shelf = this.scene.add.image(450, 360, 'loft_bookshelf');
    shelf.setDepth(365);
    this.roomContainer.add(shelf);
    this.interactiveProps.push(shelf);

    // 6. Royal Velvet Sofa
    const sofa = this.scene.add.image(140, 480, 'decor_royal_sofa');
    sofa.setDepth(480);
    this.roomContainer.add(sofa);
    this.interactiveProps.push(sofa);

    // 7. Plush Sleeping Beds
    const bed1 = this.scene.add.image(280, 560, 'donut_bed_v2');
    bed1.setDepth(560);
    this.roomContainer.add(bed1);
    this.beds.push(bed1);

    const bed2 = this.scene.add.image(120, 680, 'donut_bed_v2');
    bed2.setDepth(680);
    bed2.setScale(0.85);
    this.roomContainer.add(bed2);
    this.beds.push(bed2);

    // 8. Bowls on Wooden Tray
    for (let i = 0; i < 2; i++) {
      const bowl = this.scene.add.image(380 + i * 42, 650, 'bowl_fish_full_v2');
      bowl.setDepth(655);
      this.roomContainer.add(bowl);
      this.bowls.push(bowl);
    }
  }

  // --- ATMOSPHERE, LIGHTING & WEATHER OVERLAYS ---
  public applyAtmosphere(timeOfDay: TimeOfDay, weather: WeatherType): void {
    this.currentTimeOfDay = timeOfDay;
    this.currentWeather = weather;

    if (this.presentation) {
      this.presentation.applyAtmosphere(timeOfDay, weather);
    } else {
      const { width, height } = CAFE_CONFIG;
      this.lightingOverlay.clear();

      if (timeOfDay === 'sunset') {
        this.lightingOverlay.fillStyle(0xF59E0B, 0.16);
        this.lightingOverlay.fillRect(0, 0, width, height);
      } else if (timeOfDay === 'night') {
        this.lightingOverlay.fillStyle(0x08142D, 0.42);
        this.lightingOverlay.fillRect(0, 0, width, height);
      }
    }

    // Weather Effects
    this.clearWeatherEffects();
    if (weather === 'rainy') {
      this.createRainEffect();
      CafeAudioEngine.getInstance().startAmbience('rainy');
      CafeAudioEngine.getInstance().startBgm('rainy');
    } else {
      CafeAudioEngine.getInstance().startAmbience('sunny');
      CafeAudioEngine.getInstance().startBgm(timeOfDay === 'night' ? 'night' : 'day');
    }

    // Save to preferences
    const pm = ProgressionManager.getInstance();
    pm.data.settings.activeRoom = this.currentRoom;
    pm.data.settings.timeOfDay = this.currentTimeOfDay;
    pm.data.settings.weather = this.currentWeather;
    pm.save();
  }

  private clearWeatherEffects(): void {
    for (const r of this.rainDrops) r.destroy();
    this.rainDrops = [];
    this.weatherContainer.removeAll(true);
  }

  private createRainEffect(): void {
    const { width, height } = CAFE_CONFIG;
    for (let i = 0; i < 35; i++) {
      const drop = this.scene.add.image(Random.range(0, width), Random.range(0, height), 'particle_rain');
      drop.setAlpha(Random.range(0.3, 0.8));
      this.weatherContainer.add(drop);
      this.rainDrops.push(drop);

      this.scene.tweens.add({
        targets: drop,
        y: `+=${height + 40}`,
        x: '-=30',
        duration: Random.range(450, 750),
        repeat: -1,
        ease: 'Linear',
      });
    }
  }

  // Navigation Targets by Room
  public getFoodTarget(): { x: number; y: number } {
    if (this.bowls.length > 0) {
      const bowl = Random.choice(this.bowls);
      return { x: bowl.x + Random.range(-6, 6), y: bowl.y + 14 };
    }
    return { x: 125, y: 450 };
  }

  public getNapTarget(): { x: number; y: number } {
    if (this.currentRoom === 'cafe') {
      // Pick between cozy donut bed or cat tree upper perch
      if (Math.random() < 0.65) {
        return { x: 175 + Random.range(-20, 20), y: 475 + Random.range(-8, 8) };
      } else {
        return { x: 440, y: 395 };
      }
    }
    if (this.beds.length > 0) {
      const bed = Random.choice(this.beds);
      return { x: bed.x, y: bed.y };
    }
    return { x: 175, y: 475 };
  }

  public getPlayTarget(): { x: number; y: number } {
    if (this.currentRoom === 'cafe') {
      // Play on center rug with yarn or near cat tree
      if (Math.random() < 0.7) {
        return { x: 270 + Random.range(-30, 30), y: 620 + Random.range(-15, 15) };
      } else {
        return { x: 440 + Random.range(-20, 20), y: 480 + Random.range(-15, 15) };
      }
    } else if (this.currentRoom === 'garden') {
      return { x: Random.range(280, 420), y: Random.range(480, 620) };
    } else if (this.currentRoom === 'loft') {
      return { x: Random.range(200, 360), y: Random.range(500, 620) };
    }
    return { x: 270, y: 620 };
  }

  public getHostSpot(): { x: number; y: number } {
    return { x: CAFE_CONFIG.width / 2, y: 700 };
  }

  public replenishBowls(): void {
    if (this.presentation) {
      this.presentation.furniture.replenishBowls();
    } else {
      for (const b of this.bowls) b.setTexture('bowl_fish_full_v2');
    }
  }

  public setSpecialFishBowl(): void {
    if (this.bowls.length > 0) {
      const bowl = this.bowls[0];
      bowl.setTexture('bowl_fish_full_v2');
      this.scene.tweens.add({
        targets: bowl,
        scaleY: 1.25,
        duration: 200,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.scene.time.delayedCall(8000, () => {
            if (bowl.active) bowl.setTexture('bowl_fish_full_v2');
          });
        },
      });
    }
  }
}
