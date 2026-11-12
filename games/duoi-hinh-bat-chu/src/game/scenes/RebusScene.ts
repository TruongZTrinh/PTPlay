import Phaser from 'phaser';
import { EaselBoardPresentation } from '../visuals/EaselBoardPresentation';
import { MCCharacter } from '../visuals/MCCharacter';
import { Scoreboard } from '../ui/Scoreboard';
import { StudentCharacter } from '../visuals/StudentCharacter';
import { AudioEngine } from '../audio/AudioEngine';
import { TTSController } from '../systems/TTSController';
import { SeatAllocator } from '../systems/SeatAllocator';
import { StudentRoster } from '../systems/StudentRoster';
import { AvatarManager } from '../systems/AvatarManager';
import { RebusEngine } from '../systems/RebusEngine';
import { GiftReactionController } from '../systems/GiftReactionController';
import { StreamerModal } from '../ui/StreamerModal';
import { RebusLiveEventRouter } from '../events/RebusLiveEventRouter';
import { CongratulationsPresenter } from '../visuals/CongratulationsPresenter';

export class RebusScene extends Phaser.Scene {
  private easelBoard!: EaselBoardPresentation;
  private mc!: MCCharacter;
  private scoreboard!: Scoreboard;
  private studentCharacters: Map<string, StudentCharacter> = new Map();
  private waitingSpectators: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private nextWalkInReadyAt: number = 0;
  private congratsPresenter!: CongratulationsPresenter;

  private audioEngine!: AudioEngine;
  private ttsController!: TTSController;
  private seatAllocator!: SeatAllocator;
  private studentRoster!: StudentRoster;
  private avatarManager!: AvatarManager;
  private rebusEngine!: RebusEngine;
  private giftController!: GiftReactionController;
  private streamerModal!: StreamerModal;
  private liveRouter!: RebusLiveEventRouter;

  constructor() {
    super('RebusScene');
  }

  public create(): void {
    this.cameras.main.setZoom(2).centerOn(270, 480);

    // 1. Audio and Systems
    this.audioEngine = new AudioEngine();
    this.ttsController = new TTSController(this.audioEngine);
    this.seatAllocator = new SeatAllocator();
    this.studentRoster = new StudentRoster(this.seatAllocator);
    this.avatarManager = new AvatarManager(this);
    this.giftController = new GiftReactionController(this, this.audioEngine);

    // 2. Audio unlock overlay
    this.setupAudioUnlock();

    // 3. Visuals & Presentation
    this.easelBoard = new EaselBoardPresentation(this);
    this.createClassroomSeats();
    this.createWaitingSpectators();
    this.mc = new MCCharacter(this, 270, 520);
    this.mc.setDepth(75);

    this.scoreboard = new Scoreboard(this);
    this.congratsPresenter = new CongratulationsPresenter(this, this.avatarManager, this.audioEngine);

    // Score changed listener for instantaneous real-time leaderboard & student animation
    this.studentRoster.setOnScoreChanged((player) => {
      this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
      this.spawnOrUpdateStudent(player);
    });

    // 4. Instantiate visible chibi students
    this.renderInitialStudents();

    // 5. Rebus Engine
    this.rebusEngine = new RebusEngine(
      this.studentRoster,
      this.audioEngine,
      this.ttsController
    );

    this.setupEngineEvents();

    // 6. Streamer Control Modal
    this.streamerModal = new StreamerModal(
      this,
      this.rebusEngine,
      this.ttsController,
      this.audioEngine,
      this.studentRoster,
      this.giftController
    );

    // 7. Live Bridge Connection (ws://localhost:8088 via Game SDK)
    this.liveRouter = new RebusLiveEventRouter(
      this.rebusEngine,
      this.studentRoster,
      this.giftController,
      this.scoreboard,
      this.ttsController
    );
    this.liveRouter.start();
    this.streamerModal.setLiveRouter(this.liveRouter);

    // 8. Start First Round
    this.rebusEngine.startShow();
  }

  private createClassroomSeats(): void {
    const room = this.add.graphics().setDepth(12);
    room.fillStyle(0x653519, 0.9);
    room.fillRoundedRect(18, 568, 504, 333, 16);
    room.fillStyle(0xf8c17d, 0.95);
    room.fillRoundedRect(22, 572, 496, 325, 13);
    room.lineStyle(3, 0x8b451f, 1);
    room.strokeRoundedRect(22, 572, 496, 325, 13);

    room.fillStyle(0x064e3b, 1);
    room.fillRoundedRect(120, 576, 212, 25, 12);
    room.lineStyle(1.5, 0xfacc15, 1);
    room.strokeRoundedRect(120, 576, 212, 25, 12);
    this.add.text(226, 588, 'LỚP HỌC ĐANG THAM GIA', {
      fontFamily: 'system-ui, sans-serif', fontSize: '12.5px', color: '#fff7d6', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(13);

    // Waiting zone on the right side (in place of the 7th desk column)
    room.fillStyle(0xffe7ac, 0.42);
    room.fillRoundedRect(432, 608, 80, 282, 10);
    room.lineStyle(1.5, 0xb86b30, 0.45);
    room.strokeRoundedRect(432, 608, 80, 282, 10);

    room.fillStyle(0x9a3412, 1);
    room.fillRoundedRect(435, 576, 74, 25, 12);
    room.lineStyle(1.5, 0xfacc15, 1);
    room.strokeRoundedRect(435, 576, 74, 25, 12);
    this.add.text(472, 588, 'ĐANG CHỜ', {
      fontFamily: 'system-ui, sans-serif', fontSize: '10.5px', color: '#fff7d6', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(13);

    const deskLayers = new Map<number, Phaser.GameObjects.Graphics>();

    this.seatAllocator.seats.forEach((seat) => {
      // Back chair/cushion behind the student (compact 58px desk width)
      room.fillStyle(0x8b451f, 0.7);
      room.fillRoundedRect(seat.x - 29, seat.y - 34, 58, 38, 9);
      room.fillStyle(0xffe7ac, 1);
      room.fillRoundedRect(seat.x - 27, seat.y - 36, 54, 36, 8);
      room.lineStyle(1.5, 0xb86b30, 1);
      room.strokeRoundedRect(seat.x - 27, seat.y - 36, 54, 36, 8);
      room.fillStyle(0xc7814d, 0.55);
      room.fillCircle(seat.x, seat.y - 18, 8);

      // Front wooden desk in front of the student's legs so they appear seated
      let desk = deskLayers.get(seat.depth);
      if (!desk) {
        desk = this.add.graphics().setDepth(seat.depth + 1);
        deskLayers.set(seat.depth, desk);
      }
      desk.fillStyle(0x8b451f, 0.75);
      desk.fillRoundedRect(seat.x - 30, seat.y - 3, 60, 19, 5);
      desk.fillStyle(0xe5a25b, 1);
      desk.fillRoundedRect(seat.x - 29, seat.y - 3, 58, 17, 4);
      desk.lineStyle(1.5, 0x9c5522, 1);
      desk.strokeRoundedRect(seat.x - 29, seat.y - 3, 58, 17, 4);
      desk.fillStyle(0xffdf99, 1);
      desk.fillRoundedRect(seat.x - 27, seat.y - 1, 54, 5, 2.5);
    });
  }

  private setupAudioUnlock(): void {
    let unlocked = false;

    const unlockAudio = () => {
      if (unlocked) return;
      unlocked = true;

      this.audioEngine.unlock();
      this.ttsController?.unlock();

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('pointerdown', unlockAudio);
      this.input.off('pointerdown', unlockAudio);
    };

    // Auto-attempt unlock immediately
    try {
      this.audioEngine.unlock();
      this.ttsController?.unlock();
    } catch {}

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    this.input.once('pointerdown', unlockAudio);
  }

  private createWaitingSpectators(): void {
    const skins = ['boy_02', 'girl_03', 'boy_04', 'girl_01', 'boy_03', 'girl_02'];
    this.seatAllocator.waitingSpots.forEach((spot, i) => {
      const skinId = skins[i % skins.length];
      const baseKey = `student_${skinId}`;
      const happyKey = `student_${skinId}_happy`;
      const textureKey = this.textures.exists(baseKey) ? baseKey : 'props_desk';
      const sprite = this.add.sprite(spot.x, spot.y + 4, textureKey);
      sprite.setOrigin(0.5, 0.85);
      sprite.setScale(spot.scale * 0.76);
      sprite.setDepth(spot.depth);
      this.waitingSpectators.set(spot.index, sprite);

      const swayDir = i % 2 === 0 ? 1 : -1;
      this.tweens.add({
        targets: sprite,
        y: spot.y - 5,
        angle: { from: -6 * swayDir, to: 6 * swayDir },
        duration: 340 + (i % 3) * 70,
        yoyo: true,
        repeat: -1,
        delay: i * 140,
        ease: 'Sine.easeInOut',
      });

      this.time.addEvent({
        delay: 2400 + i * 650,
        loop: true,
        callback: () => {
          if (!sprite.visible || !sprite.scene) return;
          if (this.textures.exists(happyKey)) {
            sprite.setTexture(happyKey);
            this.time.delayedCall(1100, () => {
              if (sprite.scene && this.textures.exists(baseKey)) {
                sprite.setTexture(baseKey);
              }
            });
          }
          this.tweens.add({
            targets: sprite,
            scaleX: spot.scale * 0.84,
            scaleY: spot.scale * 0.84,
            duration: 160,
            yoyo: true,
            ease: 'Quad.easeOut',
          });
        },
      });
    });
  }

  private renderInitialStudents(): void {
    const players = this.studentRoster.getAllPlayers();
    players.forEach((player) => {
      this.spawnOrUpdateStudent(player);
    });
    this.scoreboard.updateLeaderboard(players);
  }

  private spawnOrUpdateStudent(player: any): void {
    const slot = this.seatAllocator.assignSeatOrWaiting(player.userId);
    if (slot.isWaiting) {
      const waitSpot = this.seatAllocator.getAssignedWaitingSpot(player.userId);
      if (waitSpot) {
        const spectator = this.waitingSpectators.get(waitSpot.index);
        if (spectator) spectator.setVisible(false);
      }
    }

    let student = this.studentCharacters.get(player.userId);

    if (!student) {
      student = new StudentCharacter(this, player, this.avatarManager, slot.x, slot.y, slot.scale);
      student.setDepth(slot.depth);
      student.setWaitingMode(slot.isWaiting);
      this.studentCharacters.set(player.userId, student);

      const now = this.time.now;
      const startAt = Math.max(now, this.nextWalkInReadyAt);
      const delayMs = Math.max(0, startAt - now);
      this.nextWalkInReadyAt = startAt + 160;
      student.walkInFromEntrance(delayMs);
    } else {
      student.setPosition(slot.x, slot.y);
      student.setScale(slot.scale);
      student.setDepth(slot.depth);
      student.setWaitingMode(slot.isWaiting);
      student.updatePlayer(player);
    }
  }

  private setupEngineEvents(): void {
    this.rebusEngine.setEvents({
      onStateChanged: (state) => {
        if (state !== 'finished') this.congratsPresenter.hideCeremony();
        this.mc.onStateChanged(state);
        if (state === 'intro' || state === 'idle') {
          this.audioEngine.playCue('lobby');
        } else if (state === 'guessing') {
          this.audioEngine.playCue('thinking');
        } else if (state === 'celebrate' || state === 'reveal') {
          this.audioEngine.playCue('transition');
        }
      },

      onPuzzleStarted: (p, round, totalRounds) => {
        this.easelBoard.setPuzzle(p, round, totalRounds);
        this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
        this.liveRouter?.onPuzzleStarted();
      },

      onTick: (rem, tot) => {
        this.easelBoard.updateTimer(rem, tot);
      },

      onTimeAdded: (seconds, sponsorName) => {
        this.easelBoard.showTimeAdded(seconds, sponsorName);
      },

      onHint1Triggered: (h1, sponsorName) => {
        this.easelBoard.showHint1(h1, sponsorName);
      },

      onHint2Triggered: (h2, firstChar, sponsorName) => {
        this.easelBoard.showHint2(h2, firstChar, sponsorName);
      },

      onGuessAttempt: (userId, guess, isCorrect, solverRank, points) => {
        const student = this.studentCharacters.get(userId);
        if (student) {
          if (isCorrect) {
            student.reactCorrect();
          } else {
            student.reactWrong();
          }
        }
        if (isCorrect) {
          this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
          if (solverRank && solverRank > 1) {
            const medal = solverRank === 2 ? '🥈 VỀ NHÌ' : '🥉 VỀ BA';
            const player = this.studentRoster.getPlayer(userId);
            const name = player ? player.nickname : userId;
            this.scoreboard.setChatTicker(`${medal}: +${points}đ tốc độ!`, name);
          }
        }
      },

      onPuzzleSolved: (puzzle, winner, points) => {
        this.mc.cheer();
        const winnerChar = this.studentCharacters.get(winner.userId);
        if (winnerChar) {
          winnerChar.reactCorrect();
        }
        this.scoreboard.setChatTicker(`⚡ NHANH NHẤT: "${puzzle.answer}" (+${points}đ)!`, winner.nickname);
        this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
        this.congratsPresenter.showRoundWinner(winner.nickname, puzzle.answer, points);
      },

      onPuzzleRevealed: (puzzle, solved, winner) => {
        this.easelBoard.revealAnswer(puzzle.answer, solved, winner?.nickname);
        const allPlayers = this.studentRoster.getAllPlayers();
        allPlayers.forEach((p) => {
          this.spawnOrUpdateStudent(p);
        });
        this.scoreboard.updateLeaderboard(allPlayers);
      },

      onCeremonyStarted: () => {
        this.mc.cheer();
        const top3 = this.studentRoster.getTopPlayers(3);
        top3.forEach((p) => {
          const char = this.studentCharacters.get(p.userId);
          if (char) char.reactCorrect();
        });
        this.congratsPresenter.showCeremonyPodium(top3);
      },
    });
  }

  public shutdown(): void {
    this.rebusEngine?.destroy();
    this.liveRouter?.stop();
    this.ttsController?.cancel();
    this.audioEngine?.stopBGM();
    this.congratsPresenter?.destroy();
  }
}

