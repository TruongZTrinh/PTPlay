import { PTPlayGameClient } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { QuizShowEngine } from '../systems/QuizShowEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { Scoreboard } from '../ui/Scoreboard';
import { ChoiceLetter } from '../types';

export class QuizShowLiveEventRouter {
  private client: PTPlayGameClient;
  private engine: QuizShowEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private scoreboard: Scoreboard;

  constructor(
    engine: QuizShowEngine,
    roster: StudentRoster,
    giftController: GiftReactionController,
    scoreboard: Scoreboard
  ) {
    this.engine = engine;
    this.roster = roster;
    this.giftController = giftController;
    this.scoreboard = scoreboard;

    this.client = new PTPlayGameClient('quiz-show');
    this.client.onCommand((cmd: GameCommand) => this.handleCommand(cmd));
    this.client.onStatusChange((connected: boolean, statusText: string) => {
      console.log(`[QuizShowLiveRouter] Bridge status: ${connected} (${statusText})`);
    });
  }

  public start(): void {
    this.client.connect();
  }

  public stop(): void {
    this.client.disconnect();
  }

  private handleCommand(cmd: GameCommand): void {
    if (!cmd || !cmd.action) return;

    const userId = cmd.user?.userId || `user_${Date.now()}`;
    const nickname = cmd.user?.nickname || 'Khán giả';
    const avatarUrl = (cmd.metadata?.profilePictureUrl as string) || undefined;

    switch (cmd.action) {
      case 'quiz_show.join': {
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.scoreboard.setChatTicker('vừa tham gia chương trình!', nickname);
        break;
      }

      case 'quiz_show.answer': {
        const choice = (cmd.metadata?.choice as ChoiceLetter) || 'A';
        // Auto register if not joined yet
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.engine.submitAnswer(userId, choice);
        this.scoreboard.setChatTicker(`chọn đáp án ${choice}`, nickname);
        break;
      }

      case 'quiz_show.team': {
        const team = cmd.team || 'red';
        this.roster.registerOrGet(userId, nickname, avatarUrl, team);
        this.scoreboard.setChatTicker(`gia nhập phe ${team === 'red' ? '🔴 ĐỎ' : '🔵 XANH'}`, nickname);
        break;
      }

      case 'quiz_show.gift': {
        const giftName = (cmd.metadata?.giftName as string) || 'Rose';
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.giftController.triggerGiftReaction(giftName, nickname, avatarUrl);
        this.scoreboard.setChatTicker(`gửi tặng ${giftName}! 🎁`, nickname);
        break;
      }

      case 'quiz_show.reset': {
        this.engine.startShow();
        break;
      }
    }
  }
}
