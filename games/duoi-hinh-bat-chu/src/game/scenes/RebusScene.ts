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
    this.mc = new MCCharacter(this, 110, 520);
    this.mc.setDepth(55);

    this.scoreboard = new Scoreboard(this);
    this.congratsPresenter = new CongratulationsPresenter(this);

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

    // 8. Start First Round
    this.rebusEngine.startShow();
  }

  private setupAudioUnlock(): void {
    const unlockBtn = document.getElementById('audio-unlock-overlay');
    let unlocked = false;

    const unlockAudio = () => {
      if (unlocked) return;
      unlocked = true;

      this.audioEngine.unlock();

      if (unlockBtn) {
        unlockBtn.style.transition = 'opacity 0.3s ease';
        unlockBtn.style.opacity = '0';
        setTimeout(() => {
          unlockBtn.style.display = 'none';
        }, 300);
      }

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('pointerdown', unlockAudio);
      this.input.off('pointerdown', unlockAudio);
    };

    if (unlockBtn) {
      unlockBtn.addEventListener('click', unlockAudio);
    }
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
      },

      onTick: (rem, tot) => {
        this.easelBoard.updateTimer(rem, tot);
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

