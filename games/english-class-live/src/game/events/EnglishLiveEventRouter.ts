import { PTPlayGameClient, SharedMusicManager, VietnameseVoiceHelper } from '@ptplay/game-sdk';
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
          const speechNick = VietnameseVoiceHelper.formatNicknameForSpeech(cmd.user.nickname, 'học sinh mới');
          this.tts.speak(`Chào mừng bạn ${speechNick} đã theo dõi kênh!`, 'vi-VN', 1);
        }
        break;
      }

      case 'english_class.reset': {
        this.engine.startRound('quick');
        break;
      }

      case 'english_class.tts_speak':
      case 'tts_speak': {
        const text = String(cmd.metadata?.text || cmd.metadata?.message || '');
        const lang = (cmd.metadata?.lang === 'en-US' || cmd.metadata?.lang === 'en-GB') ? cmd.metadata.lang : 'vi-VN';
        if (text) {
          this.tts.speak(text, lang, 2);
        }
        break;
      }

      case 'english_class.set_volume':
      case 'set_volume': {
        const vol = Number(cmd.metadata?.volume ?? cmd.metadata?.bgm ?? 0.3);
        SharedMusicManager.getInstance({ gameId: 'english-class' }).setVolume(vol);
        break;
      }

      case 'english_class.switch_music':
      case 'switch_music': {
        const cue = cmd.metadata?.cue;
        const trackId = cmd.metadata?.trackId;
        const mgr = SharedMusicManager.getInstance({ gameId: 'english-class' });
        if (typeof cue === 'string') mgr.playCue(cue);
        else if (typeof trackId === 'string') mgr.playTrack(trackId);
        break;
      }
    }
  }

  public disconnect(): void {
    this.client.disconnect();
  }
}
