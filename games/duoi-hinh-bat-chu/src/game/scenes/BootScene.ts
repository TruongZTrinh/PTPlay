import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.cameras.main.setZoom(2).centerOn(270, 480);
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

    // 2. Student Chibi Skins (8 characters: 4 boys + 4 girls, 3 poses each)
    const studentSkins = [
      'boy_01', 'girl_01', 'boy_02', 'girl_02',
      'boy_03', 'girl_03', 'boy_04', 'girl_04',
    ];
    studentSkins.forEach((skin) => {
      this.load.image(`student_${skin}`, `${assetPath}/students/chibi_students_24/student_${skin}_idle.png`);
      this.load.image(`student_${skin}_happy`, `${assetPath}/students/chibi_students_24/student_${skin}_happy.png`);
      this.load.image(`student_${skin}_sleep`, `${assetPath}/students/chibi_students_24/student_${skin}_sleep.png`);
    });

    // 3. Props
    this.load.image('props_desk', `${assetPath}/props/student_desk.png`);
    this.load.image('props_podium', `${assetPath}/props/teacher_podium.png`);
    this.load.image('props_board', `${assetPath}/props/chalkboard.png`);

    // 4. Backgrounds
    this.load.image('bg_classroom_ai', `${assetPath}/backgrounds/classroom_ai_stage.png`);
    this.load.image('bg_resort', `${assetPath}/backgrounds/classroom_day.png`);
    this.load.image('bg_classroom_day', `${assetPath}/backgrounds/classroom_day.png`);
    this.load.image('bg_classroom_evening', `${assetPath}/backgrounds/classroom_evening.png`);
    this.load.image('bg_classroom_party', `${assetPath}/backgrounds/classroom_party.png`);

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

    // 8. Authentic Picture Puzzles are lazy-loaded per round in EaselBoardPresentation
    // to avoid preloading 950+ textures into GPU/RAM at startup.

    // 9. Game Style UI & Mode UI Assets
    this.load.image('ui_hud_top', `${assetPath}/ui/hud_top.png`);
    this.load.image('ui_round_label', `${assetPath}/ui/round_label.png`);
    this.load.image('ui_scoreboard', `${assetPath}/ui/scoreboard.png`);
    this.load.image('ui_streak_badge', `${assetPath}/ui/streak_badge.png`);
    this.load.image('ui_question_banner', `${assetPath}/ui/question_banner.png`);
    this.load.image('ui_results_banner', `${assetPath}/ui/results_banner.png`);
    this.load.image('ui_avatar_frame_gold', `${assetPath}/ui/avatar_frame_gold.png`);

    this.load.image('letter_blank', `${assetPath}/mode-ui/letter_blank.png`);
    this.load.image('letter_revealed', `${assetPath}/mode-ui/letter_revealed.png`);
    this.load.image('rebus_logo', `${assetPath}/mode-ui/rebus_logo.png`);
    this.load.image('rebus_timer', `${assetPath}/mode-ui/rebus_timer.png`);
    this.load.image('rebus_hint', `${assetPath}/mode-ui/rebus_hint.png`);
    this.load.image('rebus_fast', `${assetPath}/mode-ui/rebus_fast.png`);
    this.load.image('rebus_correct', `${assetPath}/mode-ui/rebus_correct.png`);
    this.load.image('rebus_combo', `${assetPath}/mode-ui/rebus_combo.png`);
    this.load.image('rebus_top', `${assetPath}/mode-ui/rebus_top.png`);
  }

  public create(): void {
    this.scene.start('RebusScene');
  }
}

