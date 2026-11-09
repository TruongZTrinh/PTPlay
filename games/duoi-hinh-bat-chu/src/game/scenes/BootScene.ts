import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    const width = 540;
    const height = 960;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d131f, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 50, 'Đuổi Hình Bắt Chữ', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2, 320, 20, 10);

    const progressBar = this.add.graphics();
    const loadingText = this.add.text(width / 2, height / 2 + 35, 'Đang tải tài nguyên...', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#38bdf8',
    }).setOrigin(0.5);

    this.load.on('progress', (val: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xf59e0b, 1);
      progressBar.fillRoundedRect(width / 2 - 158, height / 2 + 2, 316 * val, 16, 8);
      loadingText.setText(`Đang tải tài nguyên... ${Math.round(val * 100)}%`);
    });

    const assetPath = 'assets/rebus-v1';

    // 1. Teacher Poses (10 poses)
    const teacherPoses = [
      'idle', 'talk', 'point', 'happy', 'surprise',
      'think', 'sad', 'cheer', 'clap', 'explain'
    ];
    teacherPoses.forEach((pose) => {
      this.load.image(`teacher_${pose}`, `${assetPath}/teacher/teacher_${pose}.png`);
    });

    // 2. Student Chibi Skins (8 colors)
    const studentColors = [
      'blue', 'red', 'purple', 'pink',
      'yellow', 'green', 'teal', 'orange'
    ];
    studentColors.forEach((color) => {
      this.load.image(`student_${color}`, `${assetPath}/students/student_${color}_idle.png`);
      this.load.image(`student_${color}_cheer`, `${assetPath}/students/student_${color}_cheer.png`);
      this.load.image(`student_${color}_think`, `${assetPath}/students/student_${color}_think.png`);
      this.load.image(`student_${color}_sad`, `${assetPath}/students/student_${color}_sad.png`);
    });

    // 3. Props
    this.load.image('props_desk', `${assetPath}/props/props_desk.png`);
    this.load.image('props_podium', `${assetPath}/props/props_podium.png`);
    this.load.image('props_board', `${assetPath}/props/props_board.png`);

    // 4. Backgrounds
    this.load.image('bg_resort', `${assetPath}/backgrounds/bg_resort_day.png`);
    this.load.image('bg_studio', `${assetPath}/backgrounds/bg_studio_neon.png`);
    this.load.image('bg_party', `${assetPath}/backgrounds/bg_class_party.png`);

    // 5. Clue Icons (100+ transparent PNG clue icons)
    const clueIcons = [
      'arrow', 'ball', 'balloon', 'banana', 'bell', 'bike', 'blue', 'boat', 'book', 'bread',
      'bridge', 'buffalo', 'bulb', 'butterfly', 'cake', 'camera', 'car', 'cat', 'caterpillar',
      'cherry', 'chicken', 'clock', 'cloud', 'coin', 'crab', 'crown', 'cup', 'dog', 'donut',
      'door', 'dragon', 'earth', 'egg', 'elephant', 'eye', 'face', 'fairy', 'fire', 'firework',
      'fish', 'fishcake', 'flag', 'flower', 'foot', 'frog', 'fruit', 'gift', 'glasses', 'goat',
      'gold', 'hand', 'hat', 'heart', 'honey', 'horse', 'house', 'ice', 'key', 'lamp', 'leaf',
      'lightning', 'lion', 'lotus', 'mask', 'medal', 'microphone', 'milk', 'moon', 'mountain',
      'mouse', 'music', 'needle', 'paint', 'paw', 'pen', 'pencil', 'pepper', 'phone', 'pizza',
      'puzzle', 'rain', 'rainbow', 'red', 'river', 'rock', 'rose', 'salt', 'saw', 'scissors',
      'sea', 'shield', 'shirt', 'shirt2', 'shoe', 'shrimp', 'snow', 'soup', 'star', 'strawberry',
      'sun', 'sunflower', 'sunglasses', 'sword', 'target', 'tooth', 'train', 'tree', 'trophy',
      'umbrella', 'universe', 'water', 'well', 'white', 'wind', 'window'
    ];
    clueIcons.forEach((icon) => {
      this.load.image(`clue_${icon}`, `${assetPath}/clue-icons/${icon}.png`);
    });

    // 6. Gifts
    this.load.image('gift_rose', `${assetPath}/gifts/gift_rose.png`);
    this.load.image('gift_heart', `${assetPath}/gifts/gift_heart.png`);
    this.load.image('gift_donut', `${assetPath}/gifts/gift_donut.png`);
    this.load.image('gift_crown', `${assetPath}/gifts/gift_crown.png`);
    this.load.image('gift_universe', `${assetPath}/gifts/gift_universe.png`);

    // 7. Effects
    this.load.image('effect_star', `${assetPath}/effects/effect_star.png`);
    this.load.image('effect_heart', `${assetPath}/effects/effect_heart.png`);
    this.load.image('effect_correct', `${assetPath}/effects/effect_correct.png`);
    this.load.image('effect_wrong', `${assetPath}/effects/effect_wrong.png`);
  }

  public create(): void {
    this.scene.start('RebusScene');
  }
}

