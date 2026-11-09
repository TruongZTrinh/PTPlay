import { PTPlayGameClient, SharedMusicManager } from '@ptplay/game-sdk';
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

      case 'rebus.hint':
      case 'rebus.trigger_hint_1': {
        this.engine.triggerHint1(nickname, 'rose');
        break;
      }

      case 'rebus.add_time': {
        const sec = Number(cmd.metadata?.seconds || 10);
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.engine.addTime(sec, nickname);
        this.scoreboard.setChatTicker(`🌹 cộng +${sec}s thời gian suy nghĩ!`, nickname);
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
          this.engine.addTime(10, nickname);
          perkText = '🌹 Tặng Hoa Hồng: +10s Thời Gian Suy Nghĩ (+25đ)!';
        } else if (cleanGift.includes('lion') || cleanGift.includes('su tu')) {
          this.roster.addGiftPoints(userId, 150);
          this.roster.grantExtraGuesses(userId, 10);
          this.engine.addTime(30, nickname);
          this.engine.triggerFirstCharHint(nickname);
          perkText = '🦁 Đại gia tặng Sư Tử: +30s & Mở Chữ Đầu (+150đ)!';
        } else if (cleanGift.includes('universe') || cleanGift.includes('vu tru')) {
          this.roster.addGiftPoints(userId, 300);
          this.roster.grantExtraGuesses(userId, 20);
          this.engine.addTime(60, nickname);
          this.engine.triggerHint1(nickname, 'rose');
          this.engine.triggerFirstCharHint(nickname);
          perkText = '🌌 Vũ Trụ giải cứu: +60s & Mở toàn bộ gợi ý (+300đ)!';
        } else {
          this.roster.addGiftPoints(userId, 20);
        }

        this.scoreboard.setChatTicker(`tặng ${giftName}: ${perkText}`, nickname);
        this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
        this.tts?.announceGift(nickname, giftName);
        break;
      }

      case 'rebus.trigger_hint_2':
      case 'rebus.follow':
      case 'tiktok.follow':
      case 'follow': {
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.engine.triggerFirstCharHint(nickname);
        const firstChar = this.engine.currentPuzzle?.answer?.trim().charAt(0).toUpperCase() || '';
        const ticker = firstChar
          ? `đã Follow kênh và mở chữ cái đầu "${firstChar}"!`
          : `vừa theo dõi kênh!`;
        this.scoreboard.setChatTicker(ticker, nickname);
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

      case 'rebus.set_volume':
      case 'set_volume': {
        const vol = Number(cmd.metadata?.volume ?? cmd.metadata?.bgm ?? 0.3);
        SharedMusicManager.getInstance({ gameId: 'duoi-hinh-bat-chu' }).setVolume(vol);
        break;
      }

      case 'rebus.switch_music':
      case 'switch_music': {
        const cue = cmd.metadata?.cue ? String(cmd.metadata.cue) : undefined;
        const trackId = cmd.metadata?.trackId ? String(cmd.metadata.trackId) : undefined;
        const mgr = SharedMusicManager.getInstance({ gameId: 'duoi-hinh-bat-chu' });
        if (cue) mgr.playCue(cue);
        else if (trackId) mgr.playTrack(trackId);
        break;
      }
    }
  }
}

