import { PTPlayGameClient } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { QuizEngine } from '../systems/QuizEngine.js';
import { GiftReactionController } from '../systems/GiftReactionController.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { TTSController } from '../systems/TTSController.js';

export class EnglishLiveEventRouter {
  private client: PTPlayGameClient;

  constructor(
    private engine: QuizEngine,
    private giftFx: GiftReactionController,
    private scoreboard: Scoreboard,
    private tts: TTSController
  ) {
    this.client = new PTPlayGameClient('english-class-live');

    this.client.onStatusChange((connected, statusText) => {
      console.log(`[EnglishLiveEventRouter] Status changed: ${connected} (${statusText})`);
      this.scoreboard.updateConnectionStatus(connected, 'LIVE');
    });

    this.client.onCommand((cmd: GameCommand) => {
      this.handleCommand(cmd);
    });

    this.client.connect();
  }

  private handleCommand(cmd: GameCommand): void {
    if (!cmd || !cmd.action) return;

    switch (cmd.action) {
      case 'english_class.join': {
        if (cmd.user) {
          const profilePic = (cmd.metadata?.profilePictureUrl as string) || undefined;
          this.engine.join({
            id: cmd.user.userId,
            nickname: cmd.user.nickname,
            avatarUrl: profilePic,
          });
        }
        break;
      }

      case 'english_class.answer': {
        if (cmd.user && cmd.metadata?.choice) {
          const choice = String(cmd.metadata.choice);
          const profilePic = (cmd.metadata?.profilePictureUrl as string) || undefined;
          this.engine.submitAnswer(
            cmd.user.userId,
            choice,
            {
              id: cmd.user.userId,
              nickname: cmd.user.nickname,
              avatarUrl: profilePic,
            }
          );
        }
        break;
      }

      case 'english_class.team': {
        if (cmd.user && cmd.team) {
          this.engine.assignTeam(cmd.user.userId, cmd.team);
        }
        break;
      }

      case 'english_class.gift': {
        const giftName = String(cmd.metadata?.giftName || 'Rose');
        const count = Number(cmd.metadata?.count || 1);
        const sender = cmd.user?.nickname || 'Khán Giả';
        this.giftFx.enqueueGift(sender, giftName, count);
        this.tts.announceGift(sender, giftName);
        break;
      }

      case 'english_class.like': {
        const likeCount = Number(cmd.metadata?.likeCount || 1);
        // Small heart sparkle batch
        this.giftFx.enqueueGift('Khán Giả', 'Heart', Math.min(5, likeCount));
        break;
      }

      case 'english_class.follow': {
        if (cmd.user) {
          this.tts.speak(`Chào mừng bạn ${cmd.user.nickname} đã theo dõi kênh!`, 'vi-VN', 1);
        }
        break;
      }

      case 'english_class.reset': {
        this.engine.startRound('quick');
        break;
      }
    }
  }

  public disconnect(): void {
    this.client.disconnect();
  }
}
