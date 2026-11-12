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

    const userId = String(cmd.metadata?.userId || cmd.user?.userId || `user_${Date.now()}`);
    const nickname = String(cmd.metadata?.nickname || cmd.user?.nickname || 'Khán giả');
    const avatarUrl = (cmd.metadata?.profilePictureUrl as string) || undefined;

    switch (cmd.action) {
      case 'rebus.join': {
        this.roster.registerOrGet(userId, nickname, avatarUrl, undefined, 'waiting');
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
        if (cmd.user?.userId) {
          this.roster.registerOrGet(userId, nickname, avatarUrl, undefined, 'waiting');
        }
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

      case 'rebus.test_top5_swap': {
        this.runTestTop5Swap(
          cmd.metadata?.userId ? String(cmd.metadata.userId) : undefined,
          cmd.metadata?.nickname ? String(cmd.metadata.nickname) : undefined
        );
        break;
      }

      case 'rebus.add_top_player': {
        this.handleAddTopPlayer(cmd.metadata || {});
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

  public runTestTop5Swap(targetUserId?: string, targetNickname?: string): void {
    const players = this.roster.getAllPlayers();
    const scored = players.filter((p) => p.score > 0).sort((a, b) => b.score - a.score);

    // Ensure at least 5 players already hold Top-5 scores so a challenger can kick one out.
    if (scored.length < 5) {
      const seedScores = [500, 400, 300, 200, 100];
      const candidates = players.filter((p) => p.userId !== targetUserId);
      candidates.slice(0, 5).forEach((p, idx) => {
        if (p.score <= 0) {
          this.roster.addGiftPoints(p.userId, seedScores[idx] || 100);
        }
      });
    }

    const updatedScored = this.roster.getAllPlayers().filter((p) => p.score > 0).sort((a, b) => b.score - a.score);
    const top5Ids = new Set(updatedScored.slice(0, 5).map((p) => p.userId));

    let challenger = targetUserId ? this.roster.getPlayer(targetUserId) : undefined;
    if (!challenger && targetUserId) {
      challenger = this.roster.registerOrGet(targetUserId, targetNickname || 'Thám Tử Mới').player;
    }
    if (!challenger || top5Ids.has(challenger.userId)) {
      challenger = this.roster.getAllPlayers().find((p) => !top5Ids.has(p.userId));
    }
    if (!challenger) {
      const id = targetUserId || `test_top5_${Date.now()}`;
      challenger = this.roster.registerOrGet(id, targetNickname || `Siêu Nhân ${Math.floor(Math.random() * 90 + 10)}`).player;
    }

    const targetBeat = (updatedScored[1]?.score || 400) + 150;
    const boost = Math.max(200, targetBeat - challenger.score);
    this.roster.addGiftPoints(challenger.userId, boost);
    this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());

    if (this.engine.currentPuzzle) {
      this.engine.submitGuess(challenger.userId, this.engine.currentPuzzle.answer);
    }
  }

  public handleAddTopPlayer(meta: Record<string, unknown>): void {
    if (meta.presetTop5) {
      const presets = [
        { userId: 'vip_top_1', nickname: 'Minh Anh', score: 500 },
        { userId: 'vip_top_2', nickname: 'Tuấn Kiệt', score: 400 },
        { userId: 'vip_top_3', nickname: 'Bảo Châu', score: 300 },
        { userId: 'vip_top_4', nickname: 'Gia Hưng', score: 200 },
        { userId: 'vip_top_5', nickname: 'Khánh Linh', score: 100 },
      ];
      presets.forEach((p) => {
        const res = this.roster.registerOrGet(p.userId, p.nickname);
        const delta = p.score - res.player.score;
        if (delta > 0) {
          this.roster.addGiftPoints(p.userId, delta);
        } else {
          res.player.score = p.score;
        }
      });
      this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
      this.engine.triggerSeatRebalance();
      this.scoreboard.setChatTicker('🏆 Đã nạp Top 5 vào Bảng Vinh Danh & Bàn Đầu!', 'Admin');
      return;
    }

    const nickname = String(meta.nickname || 'Ngôi Sao Mới').trim() || 'Ngôi Sao Mới';
    const userId = String(meta.userId || `vip_${nickname.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`);
    const targetScore = Math.max(10, Number(meta.score) || 350);

    const res = this.roster.registerOrGet(userId, nickname);
    const delta = targetScore - res.player.score;
    if (delta > 0) {
      this.roster.addGiftPoints(userId, delta);
    } else {
      res.player.score = targetScore;
    }
    this.scoreboard.updateLeaderboard(this.roster.getAllPlayers());
    this.engine.triggerSeatRebalance();
    this.scoreboard.setChatTicker(`vừa được ghi ${targetScore}đ lên Bảng Vinh Danh!`, nickname);
  }
}

