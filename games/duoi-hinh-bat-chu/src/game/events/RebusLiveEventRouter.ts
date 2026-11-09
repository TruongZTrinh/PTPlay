import { PTPlayGameClient } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { RebusEngine } from '../systems/RebusEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { Scoreboard } from '../ui/Scoreboard';

export class RebusLiveEventRouter {
  private client: PTPlayGameClient;
  private engine: RebusEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private scoreboard: Scoreboard;

  constructor(
    engine: RebusEngine,
    roster: StudentRoster,
    giftController: GiftReactionController,
    scoreboard: Scoreboard
  ) {
    this.engine = engine;
    this.roster = roster;
    this.giftController = giftController;
    this.scoreboard = scoreboard;

    this.client = new PTPlayGameClient('duoi-hinh-bat-chu');
    this.client.onCommand((cmd: GameCommand) => this.handleCommand(cmd));
    this.client.onStatusChange((connected: boolean, statusText: string) => {
      console.log(`[RebusLiveRouter] Bridge status: ${connected} (${statusText})`);
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
      case 'rebus.join': {
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.scoreboard.setChatTicker('vừa tham gia phòng chơi!', nickname);
        break;
      }

      case 'rebus.answer': {
        const guess = String(cmd.metadata?.guess || '');
        if (guess) {
          this.roster.registerOrGet(userId, nickname, avatarUrl);
          this.engine.submitGuess(userId, guess);
          this.scoreboard.setChatTicker(`đoán: "${guess}"`, nickname);
        }
        break;
      }

      case 'rebus.hint': {
        this.engine.triggerHint1();
        break;
      }

      case 'rebus.gift': {
        const giftName = (cmd.metadata?.giftName as string) || 'Rose';
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.giftController.triggerGiftReaction(giftName, nickname, avatarUrl);
        this.scoreboard.setChatTicker(`gửi tặng ${giftName}! 🎁`, nickname);
        break;
      }

      case 'rebus.reset': {
        this.engine.startShow();
        break;
      }
    }
  }
}
