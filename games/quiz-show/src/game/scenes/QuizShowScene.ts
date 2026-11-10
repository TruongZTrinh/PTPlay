import Phaser from 'phaser';
import { NeonStagePresentation } from '../visuals/NeonStagePresentation';
import { TeacherCharacter } from '../visuals/TeacherCharacter';
import { QuestionBoard } from '../ui/QuestionBoard';
import { Scoreboard } from '../ui/Scoreboard';
import { StudentCharacter } from '../visuals/StudentCharacter';
import { AudioEngine } from '../audio/AudioEngine';
import { TTSController } from '../systems/TTSController';
import { QuestionBank } from '../systems/QuestionBank';
import { SeatAllocator } from '../systems/SeatAllocator';
import { StudentRoster } from '../systems/StudentRoster';
import { AvatarManager } from '../systems/AvatarManager';
import { QuizShowEngine } from '../systems/QuizShowEngine';
import { GiftReactionController } from '../systems/GiftReactionController';
import { StreamerModal } from '../ui/StreamerModal';
import { QuizShowLiveEventRouter } from '../events/QuizShowLiveEventRouter';

export class QuizShowScene extends Phaser.Scene {
  private stagePresentation!: NeonStagePresentation;
  private teacher!: TeacherCharacter;
  private questionBoard!: QuestionBoard;
  private scoreboard!: Scoreboard;
  private studentCharacters: Map<string, StudentCharacter> = new Map();

  private audioEngine!: AudioEngine;
  private ttsController!: TTSController;
  private questionBank!: QuestionBank;
  private seatAllocator!: SeatAllocator;
  private studentRoster!: StudentRoster;
  private avatarManager!: AvatarManager;
  private quizEngine!: QuizShowEngine;
  private giftController!: GiftReactionController;
  private streamerModal!: StreamerModal;
  private liveRouter!: QuizShowLiveEventRouter;

  constructor() {
    super('QuizShowScene');
  }

  public create(): void {
    // 1. Audio and Systems
    this.audioEngine = new AudioEngine();
    this.ttsController = new TTSController(this.audioEngine);
    this.questionBank = new QuestionBank();
    this.seatAllocator = new SeatAllocator();
    this.studentRoster = new StudentRoster(this.seatAllocator);
    this.avatarManager = new AvatarManager(this);
    this.giftController = new GiftReactionController(this, this.audioEngine);

    // 2. Audio unlock overlay
    this.setupAudioUnlock();

    // 3. Visuals & Presentation
    this.stagePresentation = new NeonStagePresentation(this, 'studio_purple');
    this.teacher = new TeacherCharacter(this, 110, 520);
    this.teacher.setDepth(55);

    this.questionBoard = new QuestionBoard(this);
    this.scoreboard = new Scoreboard(this);

    // 4. Instantiate visible chibi students
    this.renderInitialStudents();

    // 5. Quiz Show Engine
    this.quizEngine = new QuizShowEngine(
      this.questionBank,
      this.studentRoster,
      this.audioEngine,
      this.ttsController
    );

    this.setupEngineEvents();

    // 6. Streamer Control Modal
    this.streamerModal = new StreamerModal(
      this,
      this.quizEngine,
      this.ttsController,
      this.audioEngine,
      this.studentRoster,
      this.giftController
    );

    // 7. Live Bridge Connection (ws://localhost:8088 via Game SDK)
    this.liveRouter = new QuizShowLiveEventRouter(
      this.quizEngine,
      this.studentRoster,
      this.giftController,
      this.scoreboard,
      this.ttsController
    );
    this.liveRouter.start();

    // 8. Start First Round
    this.quizEngine.startShow();
  }

  private setupAudioUnlock(): void {
    let unlocked = false;
    const unlockAudio = () => {
      if (unlocked) return;
      unlocked = true;
      this.audioEngine.unlock();
      this.ttsController?.unlock();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
    };

    try {
      this.audioEngine.unlock();
      this.ttsController?.unlock();
    } catch {}

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
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
    this.quizEngine.setEvents({
      onStateChanged: (state) => {
        this.teacher.onStateChanged(state);
      },

      onQuestionStarted: (q, round, totalRounds) => {
        this.questionBoard.setQuestion(q, round, totalRounds);
        this.scoreboard.updateLeaderboard(this.studentRoster.getAllPlayers());
      },

      onTick: (rem, tot) => {
        this.questionBoard.updateTimer(rem, tot);
      },

      onAnswerAccepted: (userId, choice) => {
        const student = this.studentCharacters.get(userId);
        if (student) {
          student.reactCorrect();
        }
      },

      onQuestionLocked: () => {
        this.questionBoard.lockQuestion();
      },

      onQuestionRevealed: (_q, correctChoice, _winnersCount) => {
        this.questionBoard.revealCorrectAnswer(correctChoice);
        const allPlayers = this.studentRoster.getAllPlayers();
        allPlayers.forEach((p) => {
          this.spawnOrUpdateStudent(p);
        });
        this.scoreboard.updateLeaderboard(allPlayers);
      },

      onCeremonyStarted: () => {
        this.teacher.cheer();
        const top3 = this.studentRoster.getTopPlayers(3);
        top3.forEach((p) => {
          const char = this.studentCharacters.get(p.userId);
          if (char) char.reactCorrect();
        });
      },

      onHeartGoalProgress: (cur, tgt, enabled, label) => {
        this.questionBoard.updateHeartGoalProgress(cur, tgt, enabled, label);
      },

      onHintTriggered: (eliminated) => {
        this.questionBoard.eliminateOptions(eliminated);
        this.teacher.cheer();
      },
    });
  }

  public shutdown(): void {
    this.quizEngine?.destroy();
    this.liveRouter?.stop();
    this.ttsController?.cancel();
  }
}
