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
    this.mc = new MCCharacter(this, 270, 520);
    this.mc.setDepth(75);

    this.scoreboard = new Scoreboard(this);
    this.congratsPresenter = new CongratulationsPresenter(this, this.avatarManager, this.audioEngine);

    // Score changed listener for instantaneous real-time leaderboard & student animation
    this.studentRoster.setOnScoreChanged((player) => {
      this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
      this.spawnOrUpdateStudent(player);
    });
    this.studentRoster.setOnPlayerRegistered((player) => {
      this.spawnOrUpdateStudent(player);
      this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
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

    const waitHeader = this.add.graphics().setDepth(65);
    waitHeader.fillStyle(0x9a3412, 1);
    waitHeader.fillRoundedRect(435, 576, 74, 25, 12);
    waitHeader.lineStyle(1.5, 0xfacc15, 1);
    waitHeader.strokeRoundedRect(435, 576, 74, 25, 12);
    this.add.text(472, 588, 'ĐANG CHỜ', {
      fontFamily: 'system-ui, sans-serif', fontSize: '10.5px', color: '#fff7d6', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(66);

    const deskLayers = new Map<number, Phaser.GameObjects.Graphics>();

    this.seatAllocator.seats.forEach((seat) => {
      let desk = deskLayers.get(seat.depth);
      if (!desk) {
        desk = this.add.graphics().setDepth(seat.depth + 1);
        deskLayers.set(seat.depth, desk);
      }

      if (seat.isTop5) {
        // Large Top-5 VIP desk corresponding to BẢNG VINH DANH
        room.fillStyle(0x92400e, 0.75);
        room.fillRoundedRect(seat.x - 35, seat.y - 40, 70, 44, 10);
        room.fillStyle(0xfff1be, 1);
        room.fillRoundedRect(seat.x - 33, seat.y - 42, 66, 42, 9);
        room.lineStyle(2, 0xd97706, 1);
        room.strokeRoundedRect(seat.x - 33, seat.y - 42, 66, 42, 9);
        room.fillStyle(0xf59e0b, 0.35);
        room.fillCircle(seat.x, seat.y - 21, 10);
        this.add.text(seat.x, seat.y - 21, `${seat.col + 1}`, {
          fontFamily: 'system-ui, sans-serif', fontSize: '10px', color: '#92400e', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(13);

        desk.fillStyle(0x78350f, 0.8);
        desk.fillRoundedRect(seat.x - 36, seat.y - 3, 72, 21, 5);
        desk.fillStyle(0xf59e0b, 1);
        desk.fillRoundedRect(seat.x - 35, seat.y - 3, 70, 19, 5);
        desk.lineStyle(1.5, 0xfef08a, 0.95);
        desk.strokeRoundedRect(seat.x - 35, seat.y - 3, 70, 19, 5);
        desk.fillStyle(0xffebad, 1);
        desk.fillRoundedRect(seat.x - 32, seat.y - 1, 64, 5, 2.5);
      } else {
        // Compact lower-row desk (8 per row)
        room.fillStyle(0x8b451f, 0.68);
        room.fillRoundedRect(seat.x - 22, seat.y - 28, 44, 30, 7);
        room.fillStyle(0xffe7ac, 1);
        room.fillRoundedRect(seat.x - 21, seat.y - 29, 42, 29, 6);
        room.lineStyle(1.2, 0xb86b30, 1);
        room.strokeRoundedRect(seat.x - 21, seat.y - 29, 42, 29, 6);
        room.fillStyle(0xc7814d, 0.5);
        room.fillCircle(seat.x, seat.y - 15, 6);

        desk.fillStyle(0x8b451f, 0.75);
        desk.fillRoundedRect(seat.x - 23, seat.y - 2, 46, 15, 4);
        desk.fillStyle(0xe5a25b, 1);
        desk.fillRoundedRect(seat.x - 22, seat.y - 2, 44, 14, 3.5);
        desk.lineStyle(1.2, 0x9c5522, 1);
        desk.strokeRoundedRect(seat.x - 22, seat.y - 2, 44, 14, 3.5);
        desk.fillStyle(0xffdf99, 1);
        desk.fillRoundedRect(seat.x - 20, seat.y, 40, 4, 2);
      }
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
    const slot = this.seatAllocator.getSlotForUser(player.userId) || this.seatAllocator.assignSeatOrWaiting(player.userId);
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
      student.walkToSeat(slot.x, slot.y, slot.scale, slot.depth, slot.isWaiting);
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
        this.studentRoster.advanceInactiveCounters();
        const allPlayers = this.studentRoster.getAllPlayers();
        allPlayers.forEach((p) => {
          this.spawnOrUpdateStudent(p);
        });
        this.scoreboard.updateLeaderboard(allPlayers);
      },

      onSeatRebalance: (onComplete) => {
        const allPlayers = this.studentRoster.getAllPlayers();
        const rankedIds = [...allPlayers]
          .filter((p) => p.score > 0)
          .sort((a, b) => b.score - a.score || b.correctCount - a.correctCount)
          .map((p) => p.userId);

        const { moves: rankMoves, top5Takeovers } = this.seatAllocator.rebalanceByRank(rankedIds);

        // Waiting viewers fly-kick seated students who haven't answered for > 5 rounds
        const sleepyIds = allPlayers
          .filter((p) => (p.roundsWithoutAnswer || 0) > 5)
          .map((p) => p.userId);
        const { moves: kickMoves, kickEvents } = this.seatAllocator.kickSleepersForWaiting(sleepyIds);
        kickEvents.forEach((ev) => {
          const sleeper = this.studentRoster.getPlayer(ev.sleeperId);
          if (sleeper) sleeper.roundsWithoutAnswer = 0;
        });

        const moves = [...rankMoves, ...kickMoves];
        if (moves.length === 0) return 0;

        moves.forEach((move) => {
          const student = this.studentCharacters.get(move.userId);
          if (student) {
            student.jumpToSeat(move.x, move.y, move.scale, move.depth, move.kind, move.isWaiting);
          }
        });

        if (kickEvents.length > 0 && top5Takeovers.length === 0) {
          const firstKick = kickEvents[0];
          const challenger = this.studentRoster.getPlayer(firstKick.challengerId);
          const sleeper = this.studentRoster.getPlayer(firstKick.sleeperId);
          if (challenger && sleeper) {
            this.audioEngine.playKungfuFlyKick(0.88);
            this.time.delayedCall(980, () => {
              this.audioEngine.playTop5Yeah();
            });
            this.scoreboard.setChatTicker(
              `💤➡️💥 bay đá ${sleeper.nickname} (ngủ gật >5 câu) để lấy chỗ ngồi!`,
              challenger.nickname
            );
          }
          return 2050;
        }

        if (top5Takeovers.length > 0) {
          const lead = top5Takeovers[0];
          const challenger = this.studentRoster.getPlayer(lead.challengerId);
          const displaced = lead.displacedId ? this.studentRoster.getPlayer(lead.displacedId) : undefined;
          if (challenger) {
            this.mc.cheer();
            this.audioEngine.playKungfuFlyKick(0.88);
            this.time.delayedCall(980, () => {
              this.audioEngine.playTop5Yeah();
            });
            const msg = displaced
              ? `🎉 YEAH! Đá bay ${displaced.nickname} để chiếm ghế Top #${lead.rank}!`
              : `🎉 YEAH! Nhảy thẳng lên ghế VIP Top #${lead.rank}!`;
            this.scoreboard.setChatTicker(msg, challenger.nickname);

            let animDone = false;
            let ttsDone = false;
            const tryFinish = () => {
              if (animDone && ttsDone) {
                onComplete?.();
              }
            };
            this.time.delayedCall(2100, () => {
              animDone = true;
              tryFinish();
            });
            this.ttsController.announceTop5Takeover(challenger.nickname, lead.rank, displaced?.nickname, () => {
              ttsDone = true;
              tryFinish();
            });
            return 'async';
          }
          return 1800;
        }
        return 800;
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

