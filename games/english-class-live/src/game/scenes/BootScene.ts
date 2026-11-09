import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const A = '/assets/english-class-v1/';

    // Loading Screen Progress Bar
    const width = 540;
    const height = 960;

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(width / 2 - 140, height / 2 - 15, 280, 30, 8);

    const titleText = this.add.text(width / 2, height / 2 - 50, '🎓 PTPlay English Class LIVE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#facc15',
    }).setOrigin(0.5, 0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 35, 'Đang tải tài nguyên lớp học...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x38bdf8, 1);
      progressBar.fillRoundedRect(width / 2 - 135, height / 2 - 10, 270 * value, 20, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      titleText.destroy();
    });

    // 1. Backgrounds
    this.load.image('bg_day', A + 'backgrounds/classroom_day.png');
    this.load.image('bg_evening', A + 'backgrounds/classroom_evening.png');
    this.load.image('bg_party', A + 'backgrounds/classroom_party.png');

    // 2. Props
    this.load.image('prop_board', A + 'props/chalkboard.png');
    this.load.image('prop_desk', A + 'props/student_desk.png');
    this.load.image('prop_podium', A + 'props/teacher_podium.png');

    // 3. Teacher 6 Key Poses (PTPlay Premium Pack)
    const teacherPoses = ['idle', 'point', 'talk', 'happy', 'sad', 'cheer'];
    teacherPoses.forEach((pose) => {
      this.load.image(`teacher_${pose}`, A + `teacher/teacher_${pose}.png`);
    });

    // 4. Student 8 Skins x 4 States
    const skins = ['blue', 'pink', 'green', 'purple', 'yellow', 'orange', 'navy', 'coral'];
    const states = ['idle', 'walk', 'cheer', 'wrong'];
    skins.forEach((skin) => {
      states.forEach((st) => {
        this.load.image(`${skin}_${st}`, A + `students/${skin}/${skin}_${st}.png`);
      });
    });

    // 5. Effects & VFX Icons
    this.load.image('fx_star', A + 'effects/sparkle.png');
    this.load.image('fx_sparkle', A + 'effects/sparkle.png');
    this.load.image('fx_heart', A + 'effects/heart.png');
    this.load.image('fx_crown', A + 'gifts/crown.png');
    this.load.image('fx_confetti', A + 'effects/confetti.png');
    this.load.image('fx_universe', A + 'gifts/universe.png');
    this.load.image('fx_rose', A + 'gifts/rose.png');
  }

  create(): void {
    console.log('[BootScene] All assets loaded successfully. Starting EnglishClassScene...');
    this.scene.start('EnglishClassScene');
  }
}
