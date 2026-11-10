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
    this.mc = new MCCharacter(this, 270, 548);
    this.mc.setDepth(55);

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
    room.fillRoundedRect(158, 576, 224, 25, 12);
    room.lineStyle(1.5, 0xfacc15, 1);
    room.strokeRoundedRect(158, 576, 224, 25, 12);
    this.add.text(270, 588, 'LỚP HỌC ĐANG THAM GIA', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#fff7d6', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(13);

    this.seatAllocator.seats.forEach((seat) => {
      room.fillStyle(0x8b451f, 0.7);
      room.fillRoundedRect(seat.x - 44, seat.y - 39, 88, 61, 11);
      room.fillStyle(0xffe7ac, 1);
      room.fillRoundedRect(seat.x - 42, seat.y - 41, 84, 58, 9);
      room.lineStyle(1.5, 0xb86b30, 1);
      room.strokeRoundedRect(seat.x - 42, seat.y - 41, 84, 58, 9);
      room.fillStyle(0xe5a25b, 1);
      room.fillRoundedRect(seat.x - 43, seat.y + 6, 86, 18, 5);
      room.fillStyle(0xffd887, 1);
      room.fillRoundedRect(seat.x - 38, seat.y + 8, 76, 5, 2);
      room.fillStyle(0xc7814d, 0.65);
      room.fillCircle(seat.x, seat.y - 19, 12);
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

  private renderInitialStudents(): void {
    const players = this.studentRoster.getAllPlayers();
    players.forEach((player) => {
      this.spawnOrUpdateStudent(player);
    });
    this.scoreboard.updateLeaderboard(players);
  }

  private spawnOrUpdateStudent(player: any): void {
    const seat = this.seatAllocator.getAssignedSeat(player.userId) || this.seatAllocator.assignSeat(player.userId);
    let student = this.studentCharacters.get(player.userId);

    if (!student) {
      student = new StudentCharacter(this, player, this.avatarManager, seat.x, seat.y, seat.scale);
      student.setDepth(seat.depth);
      this.studentCharacters.set(player.userId, student);
    } else {
      student.setPosition(seat.x, seat.y);
      student.setScale(seat.scale);
      student.setDepth(seat.depth);
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

