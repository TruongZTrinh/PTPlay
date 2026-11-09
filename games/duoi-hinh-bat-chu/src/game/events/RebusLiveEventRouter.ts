import { PTPlayGameClient } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { RebusEngine } from '../systems/RebusEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { Scoreboard } from '../ui/Scoreboard';
import { TTSController } from '../systems/TTSController';

export class RebusLiveEventRouter {
  private client: PTPlayGameClient;
  private engine: RebusEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private scoreboard: Scoreboard;
  private tts?: TTSController;

  constructor(
    engine: RebusEngine,
    roster: StudentRoster,
    giftController: GiftReactionController,
    scoreboard: Scoreboard,
    tts?: TTSController
  ) {
    this.engine = engine;
    this.roster = roster;
    this.giftController = giftController;
    this.scoreboard = scoreboard;
    this.tts = tts;

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
        this.tts?.announcePlayerJoin(nickname);
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
        const cleanGift = giftName.toLowerCase();
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.giftController.triggerGiftReaction(giftName, nickname, avatarUrl);

        let perkText = '+25đ VIP & hồi lượt đoán!';
        if (cleanGift.includes('heart') || cleanGift.includes('tim')) {
          this.roster.addGiftPoints(userId, 10);
          perkText = '+10đ cổ vũ!';
        } else if (cleanGift.includes('rose') || cleanGift.includes('hoa')) {
          this.roster.addGiftPoints(userId, 25);
          this.roster.grantExtraGuesses(userId, 3);
          perkText = '+25đ VIP & hồi 3 lượt đoán!';
        } else if (cleanGift.includes('lion') || cleanGift.includes('su tu')) {
          this.roster.addGiftPoints(userId, 150);
          this.roster.grantExtraGuesses(userId, 10);
          this.engine.triggerHint1();
          perkText = 'Đại gia mở Gợi ý cho cả lớp (+150đ)!';
        } else if (cleanGift.includes('universe') || cleanGift.includes('vu tru')) {
          this.roster.addGiftPoints(userId, 300);
          this.roster.grantExtraGuesses(userId, 20);
          this.engine.triggerHint2();
          perkText = 'Vũ Trụ giải cứu: Mở chữ cái đầu (+300đ)!';
        } else {
          this.roster.addGiftPoints(userId, 20);
        }

        this.scoreboard.setChatTicker(`tặng ${giftName}: ${perkText}`, nickname);
        this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
        this.tts?.announceGift(nickname, giftName);
        break;
      }

      case 'rebus.reset': {
        this.engine.startShow();
        break;
      }

      case 'rebus.tts_speak':
      case 'tts_speak': {
        const text = String(cmd.metadata?.text || cmd.metadata?.message || '');
        if (text) {
          this.tts?.speak(text, true);
        }
        break;
      }
    }
  }
}

