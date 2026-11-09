import Phaser from 'phaser';
import { CafeBackground } from './environment/CafeBackground';
import { CafeFurniture } from './environment/CafeFurniture';
import { CafeLighting } from './environment/CafeLighting';
import { CafeParticles } from './environment/CafeParticles';
import { TimeOfDay, WeatherType } from '../config/CafeConfig';

export interface CatVisualState {
  id: string;
  nickname: string;
  appearance: string;
  x: number;
  y: number;
  animation: string;
}

export interface CafeViewState {
  cafeName: string;
  level: number;
  purrs: number;
  catCount: number;
  maxCats: number;
  liveStatus: 'online' | 'offline' | 'unknown';
  cats: CatVisualState[];
}

export class CafePresentation {
  private scene: Phaser.Scene;

  public background!: CafeBackground;
  public furniture!: CafeFurniture;
  public lighting!: CafeLighting;
  public particles!: CafeParticles;

  private layers!: {
    background: Phaser.GameObjects.Layer;
    furniture: Phaser.GameObjects.Layer;
    characters: Phaser.GameObjects.Layer;
    effects: Phaser.GameObjects.Layer;
    ui: Phaser.GameObjects.Layer;
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(): void {
    // 5 Clean Presentation Layers
    this.layers = {
      background: this.scene.add.layer().setDepth(0),
      furniture: this.scene.add.layer().setDepth(10),
      characters: this.scene.add.layer().setDepth(20),
      effects: this.scene.add.layer().setDepth(30),
      ui: this.scene.add.layer().setDepth(100),
    };

    // 1. Illustrated Room Environment
    this.background = new CafeBackground(this.scene);

    // 2. Illustrated Interactive Furniture
    this.furniture = new CafeFurniture(this.scene);

    // 3. Atmosphere & Lighting
    this.lighting = new CafeLighting(this.scene);

    // 4. Subtle Ambient Particles (Dust motes & Sakura petals)
    this.particles = new CafeParticles(this.scene);
  }

  public applyAtmosphere(time: TimeOfDay, weather: WeatherType): void {
    if (this.lighting) {
      this.lighting.applyAtmosphere(time, weather);
    }
  }

  public render(_state: Readonly<CafeViewState>): void {
    // Sync cat visuals & HUD if driven externally
  }

  public update(_deltaMs: number): void {
    // Lightweight ambient updates
  }

  public destroy(): void {
    if (this.background) this.background.destroy();
    if (this.furniture) this.furniture.destroy();
    if (this.lighting) this.lighting.destroy();
    if (this.particles) this.particles.destroy();
  }
}

