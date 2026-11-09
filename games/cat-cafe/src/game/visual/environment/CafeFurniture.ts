import Phaser from 'phaser';

export class CafeFurniture {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  public donutBed!: Phaser.GameObjects.Image;
  public catTree!: Phaser.GameObjects.Image;
  public centerRug!: Phaser.GameObjects.Image;
  public coffeeTable!: Phaser.GameObjects.Image;
  public bowls: Phaser.GameObjects.Image[] = [];
  public toyYarn!: Phaser.GameObjects.Image;
  public toyFish!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, parentContainer?: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    if (parentContainer) {
      parentContainer.add(this.container);
    }
    this.create();
  }

  public create(): void {
    // 1. Center Bohemian Paw Rug (Flat on floor, low depth so cats walk over it)
    this.centerRug = this.scene.add.image(270, 620, 'center_rug_v2');
    this.centerRug.setDepth(20);
    this.container.add(this.centerRug);

    // 2. Plush Pink Quilted Donut Cat Bed (Left side)
    this.donutBed = this.scene.add.image(175, 475, 'donut_bed_v2');
    this.donutBed.setDepth(475);
    this.container.add(this.donutBed);

    // Subtle gentle breathing pulse on the soft plush bed
    this.scene.tweens.add({
      targets: this.donutBed,
      scaleY: { from: 1, to: 1.025 },
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 3. Multi-Tiered Sisal Cat Tree (Right side)
    this.catTree = this.scene.add.image(440, 470, 'cat_tree_v2');
    this.catTree.setDepth(470);
    this.container.add(this.catTree);

    // 4. Low Round Coffee Table with Latte & Cookies (Foreground right)
    this.coffeeTable = this.scene.add.image(440, 720, 'coffee_table_v2');
    this.coffeeTable.setDepth(720);
    this.container.add(this.coffeeTable);

    // 5. Ceramic Food Bowls (Integrated naturally along counter edge)
    const bowlPositions = [
      { x: 105, y: 435 },
      { x: 145, y: 435 },
    ];
    for (let i = 0; i < bowlPositions.length; i++) {
      const pos = bowlPositions[i];
      const bowl = this.scene.add.image(pos.x, pos.y, 'bowl_fish_full_v2');
      bowl.setDepth(pos.y);
      this.container.add(bowl);
      this.bowls.push(bowl);
    }

    // 6. Toys: Pink Yarn Ball & Blue Stuffed Fish
    this.toyYarn = this.scene.add.image(235, 635, 'toy_yarn_v2');
    this.toyYarn.setDepth(635);
    this.container.add(this.toyYarn);

    // Idle wiggle on yarn ball
    this.scene.tweens.add({
      targets: this.toyYarn,
      angle: { from: -6, to: 6 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.toyFish = this.scene.add.image(175, 675, 'toy_fish_v2');
    this.toyFish.setDepth(675);
    this.container.add(this.toyFish);
  }

  public replenishBowls(): void {
    for (const bowl of this.bowls) {
      bowl.setTexture('bowl_fish_full_v2');
    }
  }

  public getBowls(): Phaser.GameObjects.Image[] {
    return this.bowls;
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}

