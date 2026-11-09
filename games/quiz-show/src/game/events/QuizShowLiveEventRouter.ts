import { PTPlayGameClient } from '@ptplay/game-sdk';
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

      case 'quiz_show.reset': {
        this.engine.startShow();
        break;
      }

      case 'quiz_show.tts_speak':
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
