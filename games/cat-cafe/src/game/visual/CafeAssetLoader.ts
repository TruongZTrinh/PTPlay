import Phaser from 'phaser';

export class CafeAssetLoader {
  public static preload(scene: Phaser.Scene): void {
    const p = '/assets/cafe-v2';

    // 1. Backgrounds
    scene.load.svg('cafe_room_v2', `${p}/backgrounds/cafe_room_v2.svg`, { width: 540, height: 960 });

    // 2. Furniture & Props
    scene.load.svg('donut_bed_v2', `${p}/furniture/donut_bed.svg`, { width: 190, height: 95 });
    scene.load.svg('cat_tree_v2', `${p}/furniture/cat_tree.svg`, { width: 150, height: 260 });
    scene.load.svg('center_rug_v2', `${p}/furniture/center_rug.svg`, { width: 260, height: 130 });
    scene.load.svg('coffee_table_v2', `${p}/furniture/coffee_table.svg`, { width: 150, height: 120 });
    scene.load.svg('bowl_fish_full_v2', `${p}/furniture/bowl_fish_full.svg`, { width: 60, height: 36 });
    scene.load.svg('bowl_fish_empty_v2', `${p}/furniture/bowl_fish_empty.svg`, { width: 60, height: 36 });
    scene.load.svg('toy_yarn_v2', `${p}/furniture/toy_yarn.svg`, { width: 54, height: 44 });
    scene.load.svg('toy_fish_v2', `${p}/furniture/toy_fish.svg`, { width: 50, height: 28 });

    // 3. UI
    scene.load.svg('signboard_v2', `${p}/ui/signboard.svg`, { width: 170, height: 70 });
    scene.load.svg('peekaboo_cat_v2', `${p}/ui/peekaboo_cat.svg`, { width: 110, height: 50 });
    scene.load.svg('command_card_bg_v2', `${p}/ui/command_card_bg.svg`, { width: 516, height: 140 });
    scene.load.svg('lofi_banner_v2', `${p}/ui/lofi_banner.svg`, { width: 320, height: 32 });
    scene.load.svg('gift_banner_v2', `${p}/ui/gift_banner.svg`, { width: 516, height: 34 });

    // 4. Cat Breeds & Poses (8 breeds x 3 poses)
    const breedNames = [
      'ginger_tabby',
      'pure_white',
      'slate_gray',
      'tuxedo',
      'calico',
      'midnight_black',
      'honey_cream',
      'royal_siamese',
    ];

    for (let id = 0; id < breedNames.length; id++) {
      const name = breedNames[id];
      scene.load.svg(`cat_${id}_sit`, `${p}/cats/cat_${name}_sit.svg`, { width: 80, height: 90 });
      scene.load.svg(`cat_${id}_sleep`, `${p}/cats/cat_${name}_sleep.svg`, { width: 90, height: 60 });
      scene.load.svg(`cat_${id}_play`, `${p}/cats/cat_${name}_play.svg`, { width: 90, height: 70 });
    }
  }
}

