import { PTPlayGameClient, SharedMusicManager } from '@ptplay/game-sdk';
import { GameCommand } from '@ptplay/live-contracts';
import { QuizShowEngine } from '../systems/QuizShowEngine';
import { StudentRoster } from '../systems/StudentRoster';
import { GiftReactionController } from '../systems/GiftReactionController';
import { Scoreboard } from '../ui/Scoreboard';
import { ChoiceLetter } from '../types';
import { TTSController } from '../systems/TTSController';

export class QuizShowLiveEventRouter {
  private client: PTPlayGameClient;
  private engine: QuizShowEngine;
  private roster: StudentRoster;
  private giftController: GiftReactionController;
  private scoreboard: Scoreboard;
  private tts?: TTSController;

  constructor(
    engine: QuizShowEngine,
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

    this.client = new PTPlayGameClient('quiz-show');
    this.client.onCommand((cmd: GameCommand) => this.handleCommand(cmd));
    this.client.onStatusChange((connected: boolean, statusText: string) => {
      console.log(`[QuizShowLiveRouter] Bridge status: ${connected} (${statusText})`);
    });
  }

  public start(): void {
    this.client.connect();
    if (typeof fetch !== 'undefined') {
      fetch('http://localhost:8088/api/interactive-triggers?gameType=quiz-show')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.triggers && data.triggers.likeGoal) {
            this.engine.setHeartGoalConfig(data.triggers.likeGoal);
          }
        })
        .catch(() => {});
    }
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
        this.tts?.announcePlayerJoin(nickname);
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
        this.tts?.announceGift(nickname, giftName);
        break;
      }

      case 'quiz_show.like': {
        const count = Number(cmd.metadata?.likeCount) || 1;
        this.engine.recordHearts(count, nickname);
        this.scoreboard.setChatTicker(`thả +${count} tim! ❤️`, nickname);
        break;
      }

      case 'quiz_show.hint':
      case 'quiz_show.hint_5050': {
        this.engine.triggerHeartMilestone(nickname);
        break;
      }

      case 'quiz_show.set_triggers': {
        if (cmd.metadata) {
          const likeGoal = (cmd.metadata as any).likeGoal || cmd.metadata;
          this.engine.setHeartGoalConfig({
            enabled: likeGoal.enabled !== undefined ? Boolean(likeGoal.enabled) : true,
            targetCount: Number(likeGoal.targetCount) || 10,
            action: String(likeGoal.action || 'quiz_show.hint_5050'),
            actionLabel: String(likeGoal.actionLabel || 'Gợi ý 50:50'),
            ttsAnnouncement: likeGoal.ttsAnnouncement ? String(likeGoal.ttsAnnouncement) : undefined,
          });
        }
        break;
      }

      case 'quiz_show.reset': {
        this.engine.startShow();
        break;
      }

      case 'quiz_show.tts_speak':
      case 'tts_speak': {
        const text = String(cmd.metadata?.text || cmd.metadata?.message || '');
        if (text) {
          if (cmd.metadata?.voiceName && this.tts) {
            this.tts.setVoiceByName(String(cmd.metadata.voiceName));
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
          this.tts?.speak(text, true);
        }
        break;
      }

      case 'quiz_show.set_voice':
      case 'quiz_show.tts_config':
      case 'set_voice':
      case 'tts_config': {
        if (cmd.metadata && this.tts) {
          this.tts.applyVoiceConfig(cmd.metadata as any);
        }
        break;
      }

      case 'quiz_show.set_volume':
      case 'set_volume': {
        const vol = Number(cmd.metadata?.volume ?? cmd.metadata?.bgm ?? 0.3);
        SharedMusicManager.getInstance({ gameId: 'quiz-show' }).setVolume(vol);
        break;
      }

      case 'quiz_show.switch_music':
      case 'switch_music': {
        const cue = cmd.metadata?.cue ? String(cmd.metadata.cue) : undefined;
        const trackId = cmd.metadata?.trackId ? String(cmd.metadata.trackId) : undefined;
        const mgr = SharedMusicManager.getInstance({ gameId: 'quiz-show' });
        if (cue) mgr.playCue(cue);
        else if (trackId) mgr.playTrack(trackId);
        break;
      }
    }
  }
}
