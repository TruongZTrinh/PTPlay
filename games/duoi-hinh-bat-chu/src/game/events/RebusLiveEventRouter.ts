import { PTPlayGameClient, SharedMusicManager } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { RebusEngine } from '../systems/RebusEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { Scoreboard } from '../ui/Scoreboard';
import { TTSController } from '../systems/TTSController';

export class RebusLiveEventRouter {
  private client: PTPlayGameClient;
  private likeCountThisPuzzle = 0;
  private targetLikeCount = 20;
  private likeRewardClaimedThisPuzzle = false;
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

  public onPuzzleStarted(): void {
    this.likeCountThisPuzzle = 0;
    this.likeRewardClaimedThisPuzzle = false;
  }

  public simulateLikes(count: number = 20, nickname: string = 'KhánGiảThảTim'): void {
    const uId = `user_${Date.now()}`;
    this.handleCommand({
      id: `sim_like_${Date.now()}`,
      action: 'rebus.like',
      user: { userId: uId, uniqueId: uId, nickname },
      metadata: { likeCount: count },
      timestamp: Date.now(),
    });
  }

  public getLikeStats(): { current: number; target: number; claimed: boolean } {
    return {
      current: this.likeCountThisPuzzle,
      target: this.targetLikeCount,
      claimed: this.likeRewardClaimedThisPuzzle,
    };
  }

  public start(): void {
    this.client.connect();
    if (typeof fetch !== 'undefined') {
      fetch('http://localhost:8088/api/interactive-triggers?gameType=duoi-hinh-bat-chu')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.triggers && data.triggers.likeGoal) {
            this.targetLikeCount = Number(data.triggers.likeGoal.targetCount) || 20;
          }
        })
        .catch(() => {});
    }
  }

  public stop(): void {
    this.client.disconnect();
  }

  public handleCommand(cmd: GameCommand): void {
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
        this.engine.unlockNextHint(nickname, 'rose');
        break;
      }

      case 'rebus.add_time': {
        const sec = Number(cmd.metadata?.seconds || 10);
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.engine.addTime(sec, nickname);
        this.scoreboard.setChatTicker(`🌹 cộng +${sec}s thời gian suy nghĩ!`, nickname);
        break;
      }

      case 'rebus.like': {
        const count = Math.max(1, Number(cmd.metadata?.likeCount) || 1);
        this.likeCountThisPuzzle += count;

        if (!this.likeRewardClaimedThisPuzzle) {
          if (this.likeCountThisPuzzle >= this.targetLikeCount) {
            this.likeRewardClaimedThisPuzzle = true;
            this.engine.addTime(5, '20 Tim Cổ Vũ', true);
            this.scoreboard.setChatTicker(
              `❤️ Cả phòng đã thả đủ ${this.targetLikeCount} tim: +5s thời gian suy nghĩ!`,
              nickname
            );
            this.tts?.announceLikeBonus(this.targetLikeCount, 5);
          } else {
            this.scoreboard.setChatTicker(
              `thả +${count} tim! ❤️ (${this.likeCountThisPuzzle}/${this.targetLikeCount} để nhận +5s)`,
              nickname
            );
          }
        } else {
          this.scoreboard.setChatTicker(
            `thả +${count} tim! ❤️ (Đã nhận +5s câu này)`,
            nickname
          );
        }
        break;
      }

      case 'rebus.set_triggers': {
        if (cmd.metadata) {
          const likeGoal = (cmd.metadata as any).likeGoal || cmd.metadata;
          if (likeGoal.targetCount) {
            this.targetLikeCount = Number(likeGoal.targetCount) || 20;
          }
        }
        break;
      }

      case 'rebus.gift': {
        const giftName = (cmd.metadata?.giftName as string) || 'Rose';
        const cleanGift = giftName.toLowerCase();
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.giftController.triggerGiftReaction(giftName, nickname, avatarUrl);

        let perkText = '+25đ VIP & hồi lượt đoán!';
        let handledTTS = false;
        if (cleanGift.includes('heart') || cleanGift.includes('tim')) {
          this.roster.addGiftPoints(userId, 10);
          perkText = '+10đ cổ vũ!';
        } else if (cleanGift.includes('rose') || cleanGift.includes('hoa')) {
          this.roster.addGiftPoints(userId, 50);
          this.roster.grantExtraGuesses(userId, 5);
          this.engine.addTime(10, nickname, true);
          this.engine.triggerFirstCharHint(nickname, 10);
          perkText = '🌹 Tặng Hoa Hồng: Mở Chữ Đầu & +10s (+50đ VIP)!';
          handledTTS = true;
        } else if (cleanGift.includes('lion') || cleanGift.includes('su tu')) {
          this.roster.addGiftPoints(userId, 150);
          this.roster.grantExtraGuesses(userId, 10);
          this.engine.addTime(30, nickname, true);
          this.engine.triggerFirstCharHint(nickname, 30);
          perkText = '🦁 Đại gia tặng Sư Tử: +30s & Mở Chữ Đầu (+150đ)!';
          handledTTS = true;
        } else if (cleanGift.includes('universe') || cleanGift.includes('vu tru')) {
          this.roster.addGiftPoints(userId, 300);
          this.roster.grantExtraGuesses(userId, 20);
          this.engine.addTime(60, nickname, true);
          this.engine.triggerHint1(nickname, 'rose');
          this.engine.triggerFirstCharHint(nickname, 60);
          perkText = '🌌 Vũ Trụ giải cứu: +60s & Mở toàn bộ gợi ý (+300đ)!';
          handledTTS = true;
        } else {
          this.roster.addGiftPoints(userId, 20);
        }

        this.scoreboard.setChatTicker(`tặng ${giftName}: ${perkText}`, nickname);
        this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
        if (!handledTTS) {
          this.tts?.announceGift(nickname, giftName);
        }
        break;
      }

      case 'rebus.trigger_hint_1':
      case 'rebus.follow':
      case 'tiktok.follow':
      case 'follow': {
        this.roster.registerOrGet(userId, nickname, avatarUrl);
        this.engine.triggerHint1(nickname, 'follow');
        this.scoreboard.setChatTicker('đã Follow kênh và mở Gợi Ý 1!', nickname);
        break;
      }

      case 'rebus.ceremony': {
        if (cmd.metadata?.topPlayers && Array.isArray(cmd.metadata.topPlayers)) {
          cmd.metadata.topPlayers.forEach((p: any) => {
            if (p?.userId) {
              const res = this.roster.registerOrGet(p.userId, p.nickname || p.userId, p.avatarUrl);
              if (typeof p.score === 'number') {
                res.player.score = p.score;
              }
              if (p.avatarUrl) {
                res.player.avatarUrl = p.avatarUrl;
              }
            }
          });
          this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
        }
        this.engine.triggerCeremony();
        break;
      }

      case 'rebus.reset': {
        this.engine.startShow();
        break;
      }

      case 'rebus.set_voice':
      case 'set_voice':
      case 'rebus.tts_config':
      case 'tts_config': {
        const voiceName = String(cmd.metadata?.voiceName || cmd.metadata?.voice || '');
        const rate = cmd.metadata?.rate !== undefined ? Number(cmd.metadata.rate) : undefined;
        const pitch = cmd.metadata?.pitch !== undefined ? Number(cmd.metadata.pitch) : undefined;
        const volume = cmd.metadata?.volume !== undefined ? Number(cmd.metadata.volume) : undefined;
        if (voiceName || rate !== undefined || pitch !== undefined || volume !== undefined) {
          this.tts?.applyVoiceConfig({ voiceName, rate, pitch, volume });
        }
        break;
      }

      case 'rebus.tts_speak':
      case 'tts_speak': {
        const text = String(cmd.metadata?.text || cmd.metadata?.message || '');
        const voiceName = cmd.metadata?.voiceName ? String(cmd.metadata.voiceName) : undefined;
        if (voiceName) {
          this.tts?.setVoiceByName(voiceName);
        }
        if (cmd.metadata?.rate !== undefined && this.tts) {
          this.tts.rate = Number(cmd.metadata.rate);
        }
        if (cmd.metadata?.pitch !== undefined && this.tts) {
          this.tts.pitch = Number(cmd.metadata.pitch);
        }
        if (cmd.metadata?.volume !== undefined && this.tts) {
          this.tts.volume = Math.max(0, Math.min(1.0, Number(cmd.metadata.volume)));
        }
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

