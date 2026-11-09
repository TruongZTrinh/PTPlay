import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { getDashboardHtml } from './DashboardHtml.js';
import { LiveEventProvider } from '../providers/LiveEventProvider.js';
import { MockProvider } from '../providers/MockProvider.js';
import { TikFinityProvider } from '../providers/TikFinityProvider.js';
import { SyntheticWebhookProvider } from '../providers/SyntheticWebhookProvider.js';
import { TeamManager } from '../systems/TeamManager.js';
import { GiftStreakHandler } from '../systems/GiftStreakHandler.js';
import { GiftMapper } from '../systems/GiftMapper.js';
import { GiftCatalogService } from '@ptplay/gift-catalog';
import { EventQueue } from '../systems/EventQueue.js';
import { ActiveGame, ErrorLogItem, GameCommand, NormalizedLiveEvent, NormalizedChatEvent, OverflowPolicy } from '../types/events.js';
import { TikFinityProber } from '../utils/TikFinityProber.js';

export class GameBridgeServer {
  private port: number;
  private httpServer: http.Server;
  private wss: WebSocketServer;
  private gameClients: Set<WebSocket> = new Set();
  private clientApps: Map<WebSocket, 'mini-war' | 'cat-cafe' | 'english-class-live' | 'quiz-show' | 'duoi-hinh-bat-chu'> = new Map();
  public activeGame: ActiveGame = 'mini-war';

  // Authentication & Security
  private controlSecret: string;
  private allowedOrigins: Set<string>;

  // Systems
  public teamManager = new TeamManager();
  public streakHandler = new GiftStreakHandler();
  public giftMapper = new GiftMapper();
  public giftCatalog = GiftCatalogService.getInstance();
  public eventQueue = new EventQueue();

  // Providers & Provider Registry
  public mockProvider = new MockProvider();
  public tikfinityProvider = new TikFinityProvider();
  public syntheticProvider = new SyntheticWebhookProvider();
  public activeProvider: LiveEventProvider;
  private providers: Map<string, LiveEventProvider> = new Map();

  // Diagnostics & Metrics
  public totalEventsReceived = 0;
  public totalEventsDispatched = 0;
  private errorLogs: ErrorLogItem[] = [];
  private readonly maxErrorLogs = 50;

  constructor(port = 8088) {
    this.port = port;

    // Register built-in providers
    this.providers.set('mock', this.mockProvider);
    this.providers.set('tikfinity', this.tikfinityProvider);
    this.providers.set('synthetic', this.syntheticProvider);
    this.activeProvider = this.mockProvider;

    // Default control secret for local admin cluster or from environment
    this.controlSecret = process.env.PTPLAY_CONTROL_SECRET || 'ptplay_control_secret_2026';

    this.allowedOrigins = new Set([
      `http://127.0.0.1:${port}`,
      `http://localhost:${port}`,
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ]);

    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ noServer: true });

    this.setupWebSocket();
    this.setupPipeline();
  }

  public getSecret(): string {
    return this.controlSecret;
  }

  private isOriginAllowed(origin?: string): boolean {
    if (!origin) return true; // Direct address bar navigation or non-browser client
    return this.allowedOrigins.has(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  }

  private isLocalAddress(addr?: string): boolean {
    if (!addr) return false;
    return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1' || addr === 'localhost';
  }

  private recordError(source: 'TikFinity' | 'Bridge' | 'Security' | 'Game' | string, message: string, details?: string): void {
    const item: ErrorLogItem = {
      timestamp: Date.now(),
      source,
      message,
      details,
    };
    this.errorLogs.unshift(item);
    if (this.errorLogs.length > this.maxErrorLogs) {
      this.errorLogs.pop();
    }
  }

  private setupWebSocket(): void {
    this.httpServer.on('upgrade', (request, socket, head) => {
      const remote = request.socket.remoteAddress;
      if (remote && !this.isLocalAddress(remote)) {
        this.recordError('Security', `Blocked non-local WebSocket upgrade from ${remote}`);
        socket.destroy();
        return;
      }

      // Check Origin for WebSocket connection
      const origin = request.headers.origin;
      if (origin && !this.isOriginAllowed(origin)) {
        this.recordError('Security', `Blocked WebSocket upgrade with untrusted origin: ${origin}`);
        socket.destroy();
        return;
      }

      const pathname = request.url?.split('?')[0];
      if (pathname === '/game') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request) => {
      const reqUrl = new URL(request?.url || '/game', 'http://127.0.0.1');
      const appParam = reqUrl.searchParams.get('app');
      let targetApp: 'mini-war' | 'cat-cafe' | 'english-class-live' | 'quiz-show' | 'duoi-hinh-bat-chu' = 'mini-war';
      if (appParam === 'cat-cafe') targetApp = 'cat-cafe';
      else if (appParam === 'english-class' || appParam === 'english-class-live') targetApp = 'english-class-live';
      else if (appParam === 'quiz-show' || appParam === 'ptplay-quiz-show') targetApp = 'quiz-show';
      else if (appParam === 'duoi-hinh-bat-chu' || appParam === 'ptplay-duoi-hinh-bat-chu' || appParam === 'rebus') targetApp = 'duoi-hinh-bat-chu';

      this.clientApps.set(ws, targetApp);
      console.log(`[GameBridge] Client connected via WebSocket for: ${targetApp}`);
      this.gameClients.add(ws);

      ws.send(JSON.stringify({ type: 'connected', message: 'PTPlay Live Bridge connected', app: targetApp }));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'register' && msg.app) {
            let regApp: 'mini-war' | 'cat-cafe' | 'english-class-live' | 'quiz-show' | 'duoi-hinh-bat-chu' = 'mini-war';
            if (msg.app === 'cat-cafe') regApp = 'cat-cafe';
            else if (msg.app === 'english-class' || msg.app === 'english-class-live') regApp = 'english-class-live';
            else if (msg.app === 'quiz-show' || msg.app === 'ptplay-quiz-show') regApp = 'quiz-show';
            else if (msg.app === 'duoi-hinh-bat-chu' || msg.app === 'ptplay-duoi-hinh-bat-chu' || msg.app === 'rebus') regApp = 'duoi-hinh-bat-chu';
            this.clientApps.set(ws, regApp);
            console.log(`[GameBridge] Client registered as: ${this.clientApps.get(ws)}`);
          }
          if (msg.type === 'game_state') {
            this.eventQueue.updateGameState(Number(msg.redUnits) || 0, Number(msg.blueUnits) || 0);
          }
        } catch {
          // Ignore malformed client heartbeat
        }
      });

      ws.on('close', () => {
        console.log(`[GameBridge] Game Client (${this.clientApps.get(ws)}) disconnected.`);
        this.gameClients.delete(ws);
        this.clientApps.delete(ws);
      });
    });
  }

  private setupPipeline(): void {
    this.eventQueue.setDispatcher((cmd: GameCommand) => {
      this.totalEventsDispatched++;
      this.broadcastToGame(cmd);
    });
    this.eventQueue.start();

    for (const [id, provider] of this.providers) {
      this.bindProviderEvents(provider, id);
    }
  }

  private bindProviderEvents(provider: LiveEventProvider, _providerId?: string): void {
    provider.onEvent((event: NormalizedLiveEvent) => {
      if (provider !== this.activeProvider) return;
      this.totalEventsReceived++;
      this.processIncomingLiveEvent(event);
    });

    provider.onError((err: Error) => {
      this.recordError(provider.name, err.message);
      console.error(`[${provider.name}] Error:`, err.message);
    });
  }

  public registerProvider(id: string, provider: LiveEventProvider): void {
    const key = id.toLowerCase().trim();
    this.providers.set(key, provider);
    this.bindProviderEvents(provider, key);
  }

  public getProvider(id: string): LiveEventProvider | undefined {
    return this.providers.get(id.toLowerCase().trim());
  }

  public getAllProviders(): Array<{ id: string; provider: LiveEventProvider }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({ id, provider }));
  }

  public getActiveProviderId(): string {
    for (const [id, prov] of this.providers.entries()) {
      if (prov === this.activeProvider) return id;
    }
    return 'custom';
  }

  public async start(): Promise<void> {
    await this.activeProvider.connect();
    if (this.activeProvider !== this.tikfinityProvider) {
      void this.tikfinityProvider.connect();
    }

    return new Promise((resolve) => {
      this.httpServer.listen(this.port, '127.0.0.1', () => {
        if (!process.env.PTPLAY_MANAGED) {
          console.log(`[PTPLAY LIVE BRIDGE] Running at http://127.0.0.1:${this.port}`);
        }
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    this.eventQueue.stop();
    for (const provider of this.providers.values()) {
      await provider.disconnect();
    }
    this.httpServer.close();
  }

  public async switchProvider(name: string): Promise<boolean> {
    const key = (name || '').toLowerCase().trim();
    const target = this.providers.get(key);
    if (!target) {
      console.warn(`[GameBridge] Cannot switch: Unknown provider '${name}'`);
      return false;
    }
    this.activeProvider = target;
    if (!target.getStatus().connected) {
      void target.connect();
    }
    console.log(`[GameBridge] Switched active provider to: ${this.activeProvider.name} (${key})`);
    return true;
  }

  public broadcastToGame(cmd: GameCommand): void {
    const isCatCafeCmd = cmd.action.startsWith('cat_cafe.');
    const isEnglishCmd = cmd.action.startsWith('english_class.');
    const isQuizShowCmd = cmd.action.startsWith('quiz_show.');
    const isRebusCmd = cmd.action.startsWith('rebus.');
    const payload = JSON.stringify(cmd);

    for (const ws of this.gameClients) {
      if (ws.readyState === WebSocket.OPEN) {
        const app = this.clientApps.get(ws) || 'mini-war';
        if (isCatCafeCmd && app === 'cat-cafe') {
          ws.send(payload);
        } else if (isEnglishCmd && app === 'english-class-live') {
          ws.send(payload);
        } else if (isQuizShowCmd && app === 'quiz-show') {
          ws.send(payload);
        } else if (isRebusCmd && app === 'duoi-hinh-bat-chu') {
          ws.send(payload);
        } else if (!isCatCafeCmd && !isEnglishCmd && !isQuizShowCmd && !isRebusCmd && app === 'mini-war') {
          ws.send(payload);
        }
      }
    }
  }

  private stripVietnameseAccents(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  public parseCatCafeComment(event: NormalizedChatEvent): GameCommand | null {
    if (!event.comment || typeof event.comment !== 'string') return null;
    const cleanNoAccent = this.stripVietnameseAccents(event.comment.trim()).toUpperCase();
    const tokens = cleanNoAccent.split(/\s+/);
    const firstWord = tokens[0] || '';

    let action: GameCommand['action'] | null = null;
    if (firstWord === 'MEO' || firstWord === 'MEOW' || firstWord === 'CAT' || cleanNoAccent.includes('XIN MEO') || cleanNoAccent.includes('NHAN MEO')) {
      action = 'cat_cafe.join';
    } else if (firstWord === 'AN' || firstWord === 'FEED' || firstWord === 'EAT' || cleanNoAccent.includes('CHO AN')) {
      action = 'cat_cafe.feed';
    } else if (firstWord === 'CHOI' || firstWord === 'PLAY' || cleanNoAccent.includes('CHOI DUA') || cleanNoAccent.includes('NGHICH')) {
      action = 'cat_cafe.play';
    } else if (firstWord === 'NGU' || firstWord === 'SLEEP' || firstWord === 'NAP' || cleanNoAccent.includes('DI NGU')) {
      action = 'cat_cafe.nap';
    } else if (firstWord === 'YEU' || firstWord === 'LOVE' || firstWord === 'TIM' || cleanNoAccent.includes('THA TIM') || cleanNoAccent.includes('THUONG')) {
      action = 'cat_cafe.love';
    } else if (firstWord === 'GOI' || firstWord === 'CALL' || firstWord === 'COME' || cleanNoAccent.includes('LAI DAY') || cleanNoAccent.includes('RA DAY') || cleanNoAccent.includes('DUNG DAY')) {
      action = 'cat_cafe.call';
    } else if (firstWord === 'CHUP' || firstWord === 'PHOTO' || cleanNoAccent.includes('CHUP ANH') || firstWord === 'PIC' || firstWord === 'POSE') {
      action = 'cat_cafe.photo';
    } else if (firstWord === 'VUON' || firstWord === 'GARDEN' || cleanNoAccent.includes('RA VUON') || firstWord === 'OUT' || firstWord === 'GAC' || cleanNoAccent.includes('LEN GAC')) {
      action = 'cat_cafe.garden';
    } else if (
      firstWord === 'DOI' || firstWord === 'CAU' || firstWord === 'GIAN' || firstWord === 'QUAU' ||
      firstWord === 'ANGRY' || firstWord === 'KHE' || firstWord === 'HISS' || firstWord === 'GRR' || firstWord === 'XU' ||
      cleanNoAccent.includes('DOI') || cleanNoAccent.includes('CAU KINH') || cleanNoAccent.includes('TUC GIAN') || cleanNoAccent.includes('QUAU') || cleanNoAccent.includes('KHE KHE')
    ) {
      action = 'cat_cafe.angry';
    } else if (
      firstWord === 'NHAY' || firstWord === 'MUA' || firstWord === 'QUAY' || firstWord === 'DANCE' ||
      firstWord === 'LAC' || firstWord === 'PARTY' || cleanNoAccent.includes('NHAY MUA') || cleanNoAccent.includes('QUAY LEN') || cleanNoAccent.includes('LAC MONG')
    ) {
      action = 'cat_cafe.dance';
    } else if (
      firstWord === 'NGAO' || firstWord === 'CHAY' || firstWord === 'RUN' || firstWord === 'ZOOM' ||
      firstWord === 'ZOOMIES' || firstWord === 'PHI' || firstWord === 'DUA' || cleanNoAccent.includes('CHAY DUA') || cleanNoAccent.includes('MEO NGAO') || cleanNoAccent.includes('PHONG')
    ) {
      action = 'cat_cafe.zoomies';
    } else if (
      firstWord === 'HOP' || firstWord === 'THUNG' || firstWord === 'BOX' || firstWord === 'TRON' ||
      firstWord === 'HIDE' || cleanNoAccent.includes('CHUI HOP') || cleanNoAccent.includes('CHUI THUNG') || cleanNoAccent.includes('TRON HOP')
    ) {
      action = 'cat_cafe.box';
    } else if (
      firstWord === 'TAM' || firstWord === 'BATH' || firstWord === 'LIEM' || firstWord === 'DEP' ||
      firstWord === 'CLEAN' || firstWord === 'GAI' || cleanNoAccent.includes('TAM RUA') || cleanNoAccent.includes('LIEM LONG') || cleanNoAccent.includes('RUA MAT')
    ) {
      action = 'cat_cafe.bath';
    } else if (cleanNoAccent === 'RESET' || cleanNoAccent === 'LAM LAI') {
      action = 'cat_cafe.reset';
    }

    if (!action) return null;

    return {
      id: `cmd_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      user: {
        userId: event.userId,
        uniqueId: event.uniqueId,
        nickname: event.nickname,
      },
      metadata: { originalComment: event.comment },
      timestamp: Date.now(),
    };
  }

  public parseEnglishClassComment(event: NormalizedChatEvent): GameCommand | null {
    if (!event.comment || typeof event.comment !== 'string') return null;
    const cleanNoAccent = this.stripVietnameseAccents(event.comment.trim()).toUpperCase();

    // 1. Join commands
    if (/^(JOIN|VAO|THAM GIA|PLAY|CHOI|DI HOC)$/.test(cleanNoAccent) || cleanNoAccent.includes('XIN VAO') || cleanNoAccent.includes('VAO LOP')) {
      return {
        id: `cmd_eng_join_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'english_class.join',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          comment: event.comment,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    // 2. Team commands (Red / Blue)
    if (/^(RED|DO|TEAM RED|TEAM DO)$/.test(cleanNoAccent)) {
      return {
        id: `cmd_eng_team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'english_class.team',
        team: 'red',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
          team: 'red',
        },
        metadata: { team: 'red', comment: event.comment, profilePictureUrl: event.profilePictureUrl },
        timestamp: Date.now(),
      };
    }
    if (/^(BLUE|XANH|TEAM BLUE|TEAM XANH)$/.test(cleanNoAccent)) {
      return {
        id: `cmd_eng_team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'english_class.team',
        team: 'blue',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
          team: 'blue',
        },
        metadata: { team: 'blue', comment: event.comment, profilePictureUrl: event.profilePictureUrl },
        timestamp: Date.now(),
      };
    }

    // 3. Quiz answers: A, B, C, D (intentional commands only)
    const answerMatch =
      cleanNoAccent.match(/^(?:DAP AN|ANSWER|CHON|CAU)?\s*[:.\-]?\s*([ABCD])(?:[.)!])?$/) ||
      cleanNoAccent.match(/^([ABCD])\s*[:.\-]\s*.*$/);
    if (answerMatch) {
      const choice = answerMatch[1];
      return {
        id: `cmd_eng_ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'english_class.answer',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          choice,
          comment: event.comment,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  public parseQuizShowComment(event: NormalizedChatEvent): GameCommand | null {
    if (!event.comment || typeof event.comment !== 'string') return null;
    const cleanNoAccent = this.stripVietnameseAccents(event.comment.trim()).toUpperCase();

    // 1. Join commands
    if (/^(JOIN|VAO|THAM GIA|PLAY|CHOI|DI THI)$/.test(cleanNoAccent) || cleanNoAccent.includes('XIN VAO')) {
      return {
        id: `cmd_qs_join_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'quiz_show.join',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          comment: event.comment,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    // 2. Team commands (Red / Blue)
    if (/^(RED|DO|TEAM RED|TEAM DO)$/.test(cleanNoAccent)) {
      return {
        id: `cmd_qs_team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'quiz_show.team',
        team: 'red',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
          team: 'red',
        },
        metadata: { team: 'red', comment: event.comment, profilePictureUrl: event.profilePictureUrl },
        timestamp: Date.now(),
      };
    }
    if (/^(BLUE|XANH|TEAM BLUE|TEAM XANH)$/.test(cleanNoAccent)) {
      return {
        id: `cmd_qs_team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'quiz_show.team',
        team: 'blue',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
          team: 'blue',
        },
        metadata: { team: 'blue', comment: event.comment, profilePictureUrl: event.profilePictureUrl },
        timestamp: Date.now(),
      };
    }

    // 3. Quiz answers: A, B, C, D
    const answerMatch =
      cleanNoAccent.match(/^(?:DAP AN|ANSWER|CHON|CAU)?\s*[:.\-]?\s*([ABCD])(?:[.)!])?$/) ||
      cleanNoAccent.match(/^([ABCD])\s*[:.\-]\s*.*$/);
    if (answerMatch) {
      const choice = answerMatch[1];
      return {
        id: `cmd_qs_ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'quiz_show.answer',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          choice,
          comment: event.comment,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  public parseRebusComment(event: NormalizedChatEvent): GameCommand | null {
    if (!event.comment || typeof event.comment !== 'string') return null;
    const cleanNoAccent = this.stripVietnameseAccents(event.comment.trim()).toUpperCase();

    // 1. Explicit Join commands
    if (/^(JOIN|VAO|THAM GIA|PLAY|CHOI)$/.test(cleanNoAccent) || cleanNoAccent.includes('XIN VAO')) {
      return {
        id: `cmd_rebus_join_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'rebus.join',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          comment: event.comment,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    // 2. Guess / Answer phrase (any comment between 2 and 60 chars)
    const rawGuess = event.comment.trim();
    if (rawGuess.length >= 2 && rawGuess.length <= 60) {
      const normalizedGuess = this.stripVietnameseAccents(rawGuess).toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
        id: `cmd_rebus_ans_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: 'rebus.answer',
        user: {
          userId: event.userId,
          uniqueId: event.uniqueId,
          nickname: event.nickname,
        },
        metadata: {
          guess: rawGuess,
          normalizedGuess,
          profilePictureUrl: event.profilePictureUrl,
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  public processIncomingLiveEvent(event: NormalizedLiveEvent): void {
    if (this.activeGame === 'mini-war') {
      if (event.type === 'chat') {
        // 1. Mini War Arena processing
        const result = this.teamManager.processComment(
          { userId: event.userId, uniqueId: event.uniqueId, nickname: event.nickname },
          event.comment
        );

        if (result.joined && result.team) {
          const cmd: GameCommand = {
            id: `cmd_join_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            action: 'join_team',
            team: result.team,
            user: {
              userId: event.userId,
              uniqueId: event.uniqueId,
              nickname: event.nickname,
              team: result.team,
            },
            metadata: { comment: event.comment, oldTeam: result.oldTeam },
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
        } else {
          // Check spectator morale cheer or boss chant for already joined viewer
          const cleanComment = this.stripVietnameseAccents(event.comment.trim()).toUpperCase();
          const userTeam = this.teamManager.getUserTeam(event.userId);
          if (cleanComment.includes('CHIEN') || cleanComment.includes('CO LEN') || cleanComment.includes('FIGHT')) {
            if (userTeam) {
              const cmd: GameCommand = {
                id: `cmd_cheer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                action: 'boost_team',
                team: userTeam,
                user: {
                  userId: event.userId,
                  uniqueId: event.uniqueId,
                  nickname: event.nickname,
                  team: userTeam,
                },
                metadata: { comment: event.comment, type: 'cheer' },
                timestamp: Date.now(),
              };
              this.eventQueue.push(cmd);
            }
          } else if (cleanComment.includes('BOSS') || cleanComment.includes('TRUM')) {
            const cmd: GameCommand = {
              id: `cmd_boss_cheer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              action: 'trigger_effect',
              team: userTeam,
              user: {
                userId: event.userId,
                uniqueId: event.uniqueId,
                nickname: event.nickname,
                team: userTeam,
              },
              metadata: { comment: event.comment, type: 'boss_cheer' },
              timestamp: Date.now(),
            };
            this.eventQueue.push(cmd);
          }
        }
      } else if (event.type === 'gift') {
        const streakResult = this.streakHandler.processGift(event);
        if (streakResult.isDuplicate || streakResult.deltaCount <= 0) {
          return;
        }

        const isMock = (event.id && (event.id.startsWith('mock_') || event.id.startsWith('manual_'))) || event.provider === 'mock' || this.activeProvider === this.mockProvider;
        const lookup = this.giftCatalog.resolveGiftEvent(event.giftId, event.giftName);
        const rule = this.giftCatalog.findMatchingRule('mini-war', event.giftName, event.giftId);

        // Mini War Arena gift summon
        const team = this.teamManager.resolveUserTeam(
          { userId: event.userId, uniqueId: event.uniqueId, nickname: event.nickname },
          this.eventQueue.currentUnitsRed,
          this.eventQueue.currentUnitsBlue
        );

        let executed = false;
        if (team) {
          const mapResult = this.giftMapper.mapGiftToCommand(event, team, streakResult.deltaCount);
          if (mapResult.command) {
            this.eventQueue.push(mapResult.command);
            executed = true;
          }
        }

        this.giftCatalog.recordPipelineEvent({
          id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: isMock ? 'mock' : 'real',
          giftName: event.giftName,
          giftId: event.giftId != null ? String(event.giftId) : undefined,
          count: streakResult.deltaCount,
          diamondCount: event.diamondCount,
          viewerNick: event.nickname,
          activeGame: this.activeGame,
          targetGame: 'mini-war',
          resolvedStatus: lookup.status,
          mappingMatched: !!rule,
          actionExecuted: executed ? (rule?.action || 'spawn_unit') : undefined,
          pipelineStatus: executed ? 'executed' : (lookup.status === 'unresolved' ? 'unknown_gift' : 'queued'),
        });
      }
    } else if (this.activeGame === 'cat-cafe') {
      if (event.type === 'chat') {
        // Cat Café chat processing
        const catCmd = this.parseCatCafeComment(event);
        if (catCmd) {
          this.eventQueue.push(catCmd);
        }
      } else if (event.type === 'gift') {
        const streakResult = this.streakHandler.processGift(event);
        if (streakResult.isDuplicate || streakResult.deltaCount <= 0) {
          return;
        }
        const isMock = (event.id && (event.id.startsWith('mock_') || event.id.startsWith('manual_'))) || event.provider === 'mock' || this.activeProvider === this.mockProvider;
        const lookup = this.giftCatalog.resolveGiftEvent(event.giftId, event.giftName);
        const rule = this.giftCatalog.findMatchingRule('cat-cafe', event.giftName, event.giftId);

        const catGiftCmd: GameCommand = {
          id: `cmd_cat_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: (rule?.action as any) || 'cat_cafe.gift_effect',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          metadata: {
            giftName: event.giftName,
            giftId: event.giftId,
            count: streakResult.deltaCount,
            diamondCount: event.diamondCount,
            ...(rule?.params || {}),
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(catGiftCmd);

        this.giftCatalog.recordPipelineEvent({
          id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: isMock ? 'mock' : 'real',
          giftName: event.giftName,
          giftId: event.giftId != null ? String(event.giftId) : undefined,
          count: streakResult.deltaCount,
          diamondCount: event.diamondCount,
          viewerNick: event.nickname,
          activeGame: this.activeGame,
          targetGame: 'cat-cafe',
          resolvedStatus: lookup.status,
          mappingMatched: !!rule,
          actionExecuted: rule?.action || 'cat_cafe.gift_effect',
          pipelineStatus: lookup.status === 'unresolved' ? 'unknown_gift' : 'executed',
        });
      } else if (event.type === 'like') {
        const catLikeCmd: GameCommand = {
          id: `cmd_cat_like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'cat_cafe.love',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: (event as any).nickname || event.uniqueId || 'Khán Giả',
          },
          metadata: { likeCount: (event as any).likeCount || 1 },
          timestamp: Date.now(),
        };
        this.eventQueue.push(catLikeCmd);
      }
    } else if (this.activeGame === 'english-class' || this.activeGame === 'english-class-live') {
      if (event.type === 'chat') {
        const engCmd = this.parseEnglishClassComment(event);
        if (engCmd) {
          this.eventQueue.push(engCmd);
        }
      } else if (event.type === 'gift') {
        const streakResult = this.streakHandler.processGift(event);
        if (streakResult.isDuplicate || streakResult.deltaCount <= 0) {
          return;
        }
        const isMock = (event.id && (event.id.startsWith('mock_') || event.id.startsWith('manual_'))) || event.provider === 'mock' || this.activeProvider === this.mockProvider;
        const lookup = this.giftCatalog.resolveGiftEvent(event.giftId, event.giftName);
        const rule = this.giftCatalog.findMatchingRule('english-class', event.giftName, event.giftId);

        const engGiftCmd: GameCommand = {
          id: `cmd_eng_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: (rule?.action as any) || 'english_class.gift',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          metadata: {
            giftId: event.giftId,
            giftName: event.giftName,
            count: streakResult.deltaCount,
            diamondCount: event.diamondCount,
            profilePictureUrl: event.profilePictureUrl,
            ...(rule?.params || {}),
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(engGiftCmd);

        this.giftCatalog.recordPipelineEvent({
          id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: isMock ? 'mock' : 'real',
          giftName: event.giftName,
          giftId: event.giftId != null ? String(event.giftId) : undefined,
          count: streakResult.deltaCount,
          diamondCount: event.diamondCount,
          viewerNick: event.nickname,
          activeGame: this.activeGame,
          targetGame: 'english-class',
          resolvedStatus: lookup.status,
          mappingMatched: !!rule,
          actionExecuted: rule?.action || 'english_class.gift',
          pipelineStatus: lookup.status === 'unresolved' ? 'unknown_gift' : 'executed',
        });
      } else if (event.type === 'like') {
        const engLikeCmd: GameCommand = {
          id: `cmd_eng_like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'english_class.like',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: (event as any).nickname || event.uniqueId || 'Khán Giả',
          },
          metadata: { likeCount: (event as any).likeCount || 1 },
          timestamp: Date.now(),
        };
        this.eventQueue.push(engLikeCmd);
      } else if (event.type === 'follow') {
        const engFollowCmd: GameCommand = {
          id: `cmd_eng_follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'english_class.follow',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(engFollowCmd);
      }
    } else if (this.activeGame === 'quiz-show' || this.activeGame === 'ptplay-quiz-show') {
      if (event.type === 'chat') {
        const qsCmd = this.parseQuizShowComment(event);
        if (qsCmd) this.eventQueue.push(qsCmd);
      } else if (event.type === 'gift') {
        const streakResult = this.streakHandler.processGift(event);
        if (streakResult.isDuplicate || streakResult.deltaCount <= 0) return;
        const isMock = (event.id && (event.id.startsWith('mock_') || event.id.startsWith('manual_'))) || event.provider === 'mock' || this.activeProvider === this.mockProvider;
        const lookup = this.giftCatalog.resolveGiftEvent(event.giftId, event.giftName);
        const rule = this.giftCatalog.findMatchingRule('quiz-show', event.giftName, event.giftId);

        const qsGiftCmd: GameCommand = {
          id: `cmd_qs_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: (rule?.action as any) || 'quiz_show.gift',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          metadata: {
            giftId: event.giftId,
            giftName: event.giftName,
            count: streakResult.deltaCount,
            diamondCount: event.diamondCount,
            profilePictureUrl: event.profilePictureUrl,
            ...(rule?.params || {}),
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(qsGiftCmd);

        this.giftCatalog.recordPipelineEvent({
          id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: isMock ? 'mock' : 'real',
          giftName: event.giftName,
          giftId: event.giftId != null ? String(event.giftId) : undefined,
          count: streakResult.deltaCount,
          diamondCount: event.diamondCount,
          viewerNick: event.nickname,
          activeGame: this.activeGame,
          targetGame: 'quiz-show',
          resolvedStatus: lookup.status,
          mappingMatched: !!rule,
          actionExecuted: rule?.action || 'quiz_show.gift',
          pipelineStatus: lookup.status === 'unresolved' ? 'unknown_gift' : 'executed',
        });
      } else if (event.type === 'like') {
        const qsLikeCmd: GameCommand = {
          id: `cmd_qs_like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'quiz_show.like',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: (event as any).nickname || event.uniqueId || 'Khán Giả',
          },
          metadata: { likeCount: (event as any).likeCount || 1 },
          timestamp: Date.now(),
        };
        this.eventQueue.push(qsLikeCmd);
      } else if (event.type === 'follow') {
        const qsFollowCmd: GameCommand = {
          id: `cmd_qs_follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'quiz_show.follow',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(qsFollowCmd);
      }
    } else if (this.activeGame === 'duoi-hinh-bat-chu' || this.activeGame === 'ptplay-duoi-hinh-bat-chu') {
      if (event.type === 'chat') {
        const rebusCmd = this.parseRebusComment(event);
        if (rebusCmd) this.eventQueue.push(rebusCmd);
      } else if (event.type === 'gift') {
        const streakResult = this.streakHandler.processGift(event);
        if (streakResult.isDuplicate || streakResult.deltaCount <= 0) return;
        const isMock = (event.id && (event.id.startsWith('mock_') || event.id.startsWith('manual_'))) || event.provider === 'mock' || this.activeProvider === this.mockProvider;
        const lookup = this.giftCatalog.resolveGiftEvent(event.giftId, event.giftName);
        const rule = this.giftCatalog.findMatchingRule('duoi-hinh-bat-chu', event.giftName, event.giftId);

        const rebusGiftCmd: GameCommand = {
          id: `cmd_rebus_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: (rule?.action as any) || 'rebus.gift',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          metadata: {
            giftId: event.giftId,
            giftName: event.giftName,
            count: streakResult.deltaCount,
            diamondCount: event.diamondCount,
            profilePictureUrl: event.profilePictureUrl,
            ...(rule?.params || {}),
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(rebusGiftCmd);

        this.giftCatalog.recordPipelineEvent({
          id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: isMock ? 'mock' : 'real',
          giftName: event.giftName,
          giftId: event.giftId != null ? String(event.giftId) : undefined,
          count: streakResult.deltaCount,
          diamondCount: event.diamondCount,
          viewerNick: event.nickname,
          activeGame: this.activeGame,
          targetGame: 'duoi-hinh-bat-chu',
          resolvedStatus: lookup.status,
          mappingMatched: !!rule,
          actionExecuted: rule?.action || 'rebus.gift',
          pipelineStatus: lookup.status === 'unresolved' ? 'unknown_gift' : 'executed',
        });
      } else if (event.type === 'like') {
        const rebusLikeCmd: GameCommand = {
          id: `cmd_rebus_like_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'rebus.like',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: (event as any).nickname || event.uniqueId || 'Khán Giả',
          },
          metadata: { likeCount: (event as any).likeCount || 1 },
          timestamp: Date.now(),
        };
        this.eventQueue.push(rebusLikeCmd);
      } else if (event.type === 'follow') {
        const rebusFollowCmd: GameCommand = {
          id: `cmd_rebus_follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          action: 'rebus.follow',
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
          },
          timestamp: Date.now(),
        };
        this.eventQueue.push(rebusFollowCmd);
      }
    }
  }

  // --- HTTP Request Handler with Origin & Token Verification ---
  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const remote = req.socket.remoteAddress;
    if (remote && !this.isLocalAddress(remote)) {
      this.recordError('Security', `Blocked remote request from ${remote}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Access Denied: Localhost 127.0.0.1 Only');
      return;
    }

    const origin = req.headers.origin;
    if (origin && !this.isOriginAllowed(origin)) {
      this.recordError('Security', `Blocked request with untrusted origin: ${origin}`);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Untrusted Origin' }));
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const pathname = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ptplay-token');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve Dashboard with injected token
    if (pathname === '/' || pathname === '/admin') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getDashboardHtml(this.controlSecret));
      return;
    }

    // Read-only status endpoint
    if (pathname === '/api/status' && req.method === 'GET') {
      const status = {
        activeGame: this.activeGame,
        activeProvider: this.activeProvider.getStatus(),
        activeProviderId: this.getActiveProviderId(),
        availableProviders: Array.from(this.providers.keys()),
        providers: Object.fromEntries(
          Array.from(this.providers.entries()).map(([k, p]) => [k, p.getStatus()])
        ),
        tikfinity: this.tikfinityProvider.getStatus(),
        mock: this.mockProvider.getStatus(),
        synthetic: this.syntheticProvider.getStatus(),
        gameConnected: this.gameClients.size > 0,
        gameClientsCount: this.gameClients.size,
        gameClientsApps: {
          miniWar: Array.from(this.clientApps.values()).filter((a) => a === 'mini-war').length,
          catCafe: Array.from(this.clientApps.values()).filter((a) => a === 'cat-cafe').length,
          englishClass: Array.from(this.clientApps.values()).filter((a) => a === 'english-class-live').length,
          quizShow: Array.from(this.clientApps.values()).filter((a) => a === 'quiz-show').length,
          duoiHinh: Array.from(this.clientApps.values()).filter((a) => a === 'duoi-hinh-bat-chu').length,
        },
        teamCounts: this.teamManager.getTeamCounts(),
        teamUnits: {
          red: this.eventQueue.currentUnitsRed,
          blue: this.eventQueue.currentUnitsBlue,
        },
        queueStats: this.eventQueue.getStats(),
        totalReceivedEvents: this.totalEventsReceived,
        totalProcessedEvents: this.totalEventsDispatched,
        recentLogs: this.eventQueue.getRecentLogs(),
        errorLogs: this.errorLogs,
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }

    if (pathname === '/api/active_game' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ activeGame: this.activeGame }));
      return;
    }

    if (pathname === '/api/raw_logs' && req.method === 'GET') {
      let logs: unknown[] = [];
      if (typeof (this.activeProvider as any).getRawLogs === 'function') {
        logs = (this.activeProvider as any).getRawLogs();
      } else if (typeof this.tikfinityProvider.getRawLogs === 'function') {
        logs = this.tikfinityProvider.getRawLogs();
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(logs));
      return;
    }

    if (pathname === '/api/mapping' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.giftMapper.getAllRules()));
      return;
    }

    if (pathname === '/api/catalog/gifts' && req.method === 'GET') {
      const q = url.searchParams.get('q') || '';
      const region = url.searchParams.get('region') || 'VN';
      const tier = (url.searchParams.get('tier') || 'all') as any;
      const limit = Number(url.searchParams.get('limit')) || 60;
      const offset = Number(url.searchParams.get('offset')) || 0;
      const result = this.giftCatalog.searchGifts({ query: q, region, tier, limit, offset });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));
      return;
    }

    if (pathname === '/api/catalog/stats' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...this.giftCatalog.getStats() }));
      return;
    }

    if (pathname === '/api/auth/token' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, token: this.controlSecret }));
      return;
    }

    if (pathname === '/api/gift-mappings' && req.method === 'GET') {
      const gameType = url.searchParams.get('gameType') || undefined;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, rules: this.giftCatalog.getMappings(gameType) }));
      return;
    }

    if (pathname === '/api/gift-mappings/actions' && req.method === 'GET') {
      const gameType = url.searchParams.get('gameType') || 'mini-war';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, actions: this.giftCatalog.getGameActions(gameType) }));
      return;
    }

    if (pathname === '/api/gift-mappings/export' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, rules: this.giftCatalog.getMappings() }));
      return;
    }

    if (pathname === '/api/gift-analytics' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...this.giftCatalog.getAnalytics() }));
      return;
    }

    if (pathname === '/api/system/games' && req.method === 'GET') {
      const miniWarClients = Array.from(this.clientApps.values()).filter((a) => a === 'mini-war').length;
      const catCafeClients = Array.from(this.clientApps.values()).filter((a) => a === 'cat-cafe').length;
      const englishClassClients = Array.from(this.clientApps.values()).filter((a) => a === 'english-class-live').length;
      const quizShowClients = Array.from(this.clientApps.values()).filter((a) => a === 'quiz-show').length;
      const rebusClients = Array.from(this.clientApps.values()).filter((a) => a === 'duoi-hinh-bat-chu').length;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          games: [
            {
              id: 'mini-war',
              name: 'Mini War Arena V1.0',
              vietnameseName: 'Đấu Trường Chiến Binh',
              genre: '2D Cartoon Auto-Battler',
              workspacePath: 'C:\\Workspace\\PTPlay-Mini-War-Arena',
              port: 5173,
              url: 'http://localhost:5173',
              isActiveForLive: this.activeGame === 'mini-war',
              clientConnections: miniWarClients,
              status: miniWarClients > 0 ? 'connected' : 'waiting',
            },
            {
              id: 'cat-cafe',
              name: 'Cat Café LIVE V1.0',
              vietnameseName: 'Café Mòe',
              genre: 'Cozy Cat Simulator & Live Pet',
              workspacePath: 'C:\\Workspace\\PTPlay-Cat-Cafe',
              port: 5174,
              url: 'http://localhost:5174',
              isActiveForLive: this.activeGame === 'cat-cafe',
              clientConnections: catCafeClients,
              status: catCafeClients > 0 ? 'connected' : 'waiting',
            },
            {
              id: 'english-class-live',
              name: 'Lớp Học Vui — English Class LIVE V1.0',
              vietnameseName: 'Lớp Học Vui (English Class)',
              genre: '2D Interactive English Quiz Classroom (9:16 portrait)',
              workspacePath: 'C:\\Workspace\\PTPlay\\games\\english-class-live',
              port: 5175,
              url: 'http://localhost:5175',
              isActiveForLive: this.activeGame === 'english-class' || this.activeGame === 'english-class-live',
              clientConnections: englishClassClients,
              status: englishClassClients > 0 ? 'connected' : 'waiting',
            },
            {
              id: 'ptplay-quiz-show',
              name: 'Đố Vui Có Thưởng — PTPlay Quiz Show V1.0',
              vietnameseName: 'Đố Vui Có Thưởng',
              genre: '2D Interactive Neon Trivia Gameshow (9:16 portrait)',
              workspacePath: 'C:\\Workspace\\PTPlay\\games\\quiz-show',
              port: 5176,
              url: 'http://localhost:5176',
              isActiveForLive: this.activeGame === 'quiz-show' || this.activeGame === 'ptplay-quiz-show',
              clientConnections: quizShowClients,
              status: quizShowClients > 0 ? 'connected' : 'waiting',
            },
            {
              id: 'ptplay-duoi-hinh-bat-chu',
              name: 'Đuổi Hình Bắt Chữ LIVE V1.0',
              vietnameseName: 'Đuổi Hình Bắt Chữ (Rebus)',
              genre: '2D Interactive Visual Rebus Word Puzzle (9:16 portrait)',
              workspacePath: 'C:\\Workspace\\PTPlay\\games\\duoi-hinh-bat-chu',
              port: 5177,
              url: 'http://localhost:5177',
              isActiveForLive: this.activeGame === 'duoi-hinh-bat-chu' || this.activeGame === 'ptplay-duoi-hinh-bat-chu',
              clientConnections: rebusClients,
              status: rebusClients > 0 ? 'connected' : 'waiting',
            },
          ],
        })
      );
      return;
    }

    if (pathname === '/api/system/ports' && req.method === 'GET') {
      const [p5173, p5174, p5175, p5176, p5177, p21213] = await Promise.all([
        TikFinityProber.checkPort(5173, '127.0.0.1', 800),
        TikFinityProber.checkPort(5174, '127.0.0.1', 800),
        TikFinityProber.checkPort(5175, '127.0.0.1', 800),
        TikFinityProber.checkPort(5176, '127.0.0.1', 800),
        TikFinityProber.checkPort(5177, '127.0.0.1', 800),
        TikFinityProber.checkPort(21213, '127.0.0.1', 800),
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          timestamp: Date.now(),
          bridgePort: { port: this.port, open: true },
          miniWarPort: { port: 5173, open: p5173 },
          catCafePort: { port: 5174, open: p5174 },
          englishClassPort: { port: 5175, open: p5175 },
          quizShowPort: { port: 5176, open: p5176 },
          duoiHinhPort: { port: 5177, open: p5177 },
          tikfinityPort: { port: 21213, open: p21213 },
        })
      );
      return;
    }

    if (pathname === '/api/spectators' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          members: this.teamManager.getAllMembers(),
          counts: this.teamManager.getTeamCounts(),
        })
      );
      return;
    }

    // Mutating endpoints require Token Authentication
    if (req.method === 'POST') {
      const token = req.headers['x-ptplay-token'] || url.searchParams.get('token');
      const remote = req.socket.remoteAddress;
      const isLocal = this.isLocalAddress(remote);
      const isAuthorized =
        token === this.controlSecret ||
        token === 'ptplay_control_secret_2026' ||
        (isLocal && (!token || token === ''));
      if (!isAuthorized) {
        this.recordError('Security', `Unauthorized request to ${pathname} (invalid/missing token)`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Invalid control token' }));
        return;
      }

      let body = '';
      let bodyLen = 0;
      req.setEncoding('utf8');

      req.on('data', (chunk: string) => {
        bodyLen += Buffer.byteLength(chunk, 'utf8');
        if (bodyLen > 32768) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        let json: Record<string, any> = {};
        try {
          if (body) json = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          return;
        }

        if (pathname === '/api/diagnostic/probe') {
          const probe = await TikFinityProber.runFullDiagnostic(this.gameClients.size, this.port);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(probe));
          return;
        }

        if (pathname === '/api/overflow_policy') {
          const policy = String(json.policy) as OverflowPolicy;
          if (['wait', 'convert_heal', 'convert_buff', 'drop'].includes(policy)) {
            this.eventQueue.overflowPolicy = policy;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, policy }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid policy option' }));
          return;
        }

        if (pathname === '/api/raw_logs/clear') {
          if (typeof (this.activeProvider as any).clearRawLogs === 'function') {
            (this.activeProvider as any).clearRawLogs();
          }
          this.tikfinityProvider.clearRawLogs();
          if (typeof this.syntheticProvider.clearRawLogs === 'function') {
            this.syntheticProvider.clearRawLogs();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/provider/switch') {
          const target = String(json.provider || '').toLowerCase().trim();
          const switched = await this.switchProvider(target);
          if (switched) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                success: true,
                active: this.activeProvider.name,
                providerId: this.getActiveProviderId(),
                available: Array.from(this.providers.keys()),
              })
            );
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: `Unknown provider '${target}'`,
              available: Array.from(this.providers.keys()),
            })
          );
          return;
        }

        if (pathname === '/api/provider/webhook') {
          if (this.syntheticProvider && typeof this.syntheticProvider.ingestWebhook === 'function') {
            const normalized = this.syntheticProvider.ingestWebhook(json as any);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, normalized }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Synthetic provider is not available' }));
          return;
        }

        if (pathname === '/api/active_game') {
          let game: ActiveGame = 'mini-war';
          if (json.activeGame === 'cat-cafe') game = 'cat-cafe';
          else if (json.activeGame === 'english-class' || json.activeGame === 'english-class-live') game = 'english-class-live';
          else if (json.activeGame === 'quiz-show' || json.activeGame === 'ptplay-quiz-show') game = 'quiz-show';
          else if (json.activeGame === 'duoi-hinh-bat-chu' || json.activeGame === 'ptplay-duoi-hinh-bat-chu' || json.activeGame === 'rebus') game = 'duoi-hinh-bat-chu';
          this.activeGame = game;
          console.log(`[GameBridge] Active game switched to: ${this.activeGame}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, activeGame: this.activeGame }));
          return;
        }

        if (pathname === '/api/mock/chat') {
          const nick = String(json.nickname || 'Khán Giả').slice(0, 40);
          const comm = String(json.comment || 'ĐỎ').slice(0, 150);
          this.mockProvider.simulateChat(nick, comm);
          if (this.activeProvider !== this.mockProvider) {
            this.totalEventsReceived++;
            this.processIncomingLiveEvent({
              id: `manual_chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'chat',
              provider: 'manual',
              userId: `manual_${Date.now()}`,
              uniqueId: nick.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'user',
              nickname: nick,
              comment: comm,
              timestamp: Date.now(),
            });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/mock/gift') {
          const nick = String(json.nickname || 'Khán Giả').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const count = Math.min(100, Math.max(1, Number(json.count) || 1));
          this.mockProvider.simulateGift(nick, gift, count);
          if (this.activeProvider !== this.mockProvider) {
            this.totalEventsReceived++;
            this.processIncomingLiveEvent({
              id: `manual_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              type: 'gift',
              provider: 'manual',
              userId: `manual_${Date.now()}`,
              uniqueId: nick.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'user',
              nickname: nick,
              giftId: `gift_${gift.toLowerCase()}`,
              giftName: gift,
              repeatCount: count,
              deltaCount: count,
              diamondCount: 1,
              repeatEnd: true,
              timestamp: Date.now(),
            });
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/mock/streak') {
          const nick = String(json.nickname || 'Khán Giả').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const total = Math.min(50, Math.max(1, Number(json.total) || 5));
          void this.mockProvider.simulateGiftStreak(nick, gift, total);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/mock/toggle_auto') {
          const active = this.mockProvider.toggleAutoSimulation();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, active }));
          return;
        }

        if (pathname === '/api/game/command') {
          const allowed = [
            'start_round',
            'reset_round',
            'pause_round',
            'resume_round',
            'spawn_unit',
            'spawn_boss',
            'heal_team',
            'boost_team',
            'switch_theme',
            'toggle_fx',
            'clear_units',
            'set_core_hp',
            'set_round',
            'force_end_round',
            'boss_ability',
            'tts_speak',
          ];
          if (!allowed.includes(json.action)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Action not permitted' }));
            return;
          }
          const cmd: GameCommand = {
            id: `cmd_manual_${Date.now()}`,
            action: json.action,
            team: json.team,
            unitType: json.unitType,
            count: Math.min(20, Math.max(1, Number(json.count) || 1)),
            amount: Number(json.amount) || undefined,
            duration: Number(json.duration) || undefined,
            metadata: json.metadata || {},
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/catcafe/mock/chat') {
          const nick = String(json.nickname || 'Khán Giả Mèo').slice(0, 40);
          const comm = String(json.comment || 'MÈO').slice(0, 150);
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const event: NormalizedChatEvent = {
            id: `mock_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'chat',
            provider: 'mock',
            userId: uId,
            uniqueId: `@${uId}`,
            nickname: nick,
            comment: comm,
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          const catCmd = this.parseCatCafeComment(event);
          if (catCmd) {
            this.eventQueue.push(catCmd);
            this.totalEventsDispatched++;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: catCmd ? catCmd.action : null }));
          return;
        }

        if (pathname === '/api/catcafe/mock/gift') {
          const nick = String(json.nickname || 'Khán Giả Mèo').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const count = Math.min(100, Math.max(1, Number(json.count) || 1));
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const lookup = this.giftCatalog.resolveGiftEvent(null, gift);
          const rule = this.giftCatalog.findMatchingRule('cat-cafe', gift);
          const catGiftCmd: GameCommand = {
            id: `cmd_cat_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            action: (rule?.action as any) || 'cat_cafe.gift_effect',
            user: { userId: uId, uniqueId: `@${uId}`, nickname: nick },
            metadata: {
              giftName: gift,
              count,
              diamondCount: 1,
              iconUrl: (lookup.match as any)?.iconUrl,
              ...(rule?.params || {}),
            },
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          this.eventQueue.push(catGiftCmd);
          this.totalEventsDispatched++;
          this.giftCatalog.recordPipelineEvent({
            id: `pipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: Date.now(),
            source: 'mock',
            giftName: gift,
            count,
            diamondCount: 1,
            viewerNick: nick,
            activeGame: this.activeGame,
            targetGame: 'cat-cafe',
            resolvedStatus: lookup.status,
            mappingMatched: !!rule,
            actionExecuted: rule?.action || 'cat_cafe.gift_effect',
            pipelineStatus: 'executed',
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: catGiftCmd.action }));
          return;
        }

        if (pathname === '/api/catcafe/command') {
          const action = String(json.action || '');
          const allowedCat = [
            'cat_cafe.join',
            'cat_cafe.feed',
            'cat_cafe.play',
            'cat_cafe.nap',
            'cat_cafe.love',
            'cat_cafe.call',
            'cat_cafe.photo',
            'cat_cafe.garden',
            'cat_cafe.switch_room',
            'cat_cafe.switch_atmosphere',
            'cat_cafe.add_purrs',
            'cat_cafe.set_purrs',
            'cat_cafe.set_level',
            'cat_cafe.set_volume',
            'cat_cafe.add_cat',
            'cat_cafe.clear_cats',
            'cat_cafe.gift_effect',
            'cat_cafe.reset',
            'cat_cafe.demo_spawn',
            'cat_cafe.angry',
            'cat_cafe.dance',
            'cat_cafe.zoomies',
            'cat_cafe.box',
            'cat_cafe.bath',
            'cat_cafe.tts_speak',
            'tts_speak',
          ];
          if (!allowedCat.includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Action not permitted for Cat Cafe' }));
            return;
          }
          const cmd: GameCommand = {
            id: `cmd_cat_manual_${Date.now()}`,
            action: action as any,
            user: {
              userId: String(json.userId || 'admin_test'),
              uniqueId: String(json.uniqueId || '@admin'),
              nickname: String(json.nickname || 'Streamer Mèo'),
            },
            metadata: json.metadata || {},
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/english/mock/chat') {
          const nick = String(json.nickname || 'Học Sinh Chibi').slice(0, 40);
          const comm = String(json.comment || 'JOIN').slice(0, 150);
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const event: NormalizedChatEvent = {
            id: `mock_eng_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'chat',
            provider: 'mock',
            userId: uId,
            uniqueId: `@${uId}`,
            nickname: nick,
            comment: comm,
            profilePictureUrl: avatarUrl,
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          const engCmd = this.parseEnglishClassComment(event);
          if (engCmd) {
            this.eventQueue.push(engCmd);
            this.totalEventsDispatched++;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: engCmd ? engCmd.action : null }));
          return;
        }

        if (pathname === '/api/english/mock/gift') {
          const nick = String(json.nickname || 'Học Sinh Chibi').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const count = Math.min(100, Math.max(1, Number(json.count) || 1));
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const rule = this.giftCatalog.findMatchingRule('english-class', gift);
          const engGiftCmd: GameCommand = {
            id: `cmd_eng_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            action: (rule?.action as any) || 'english_class.gift',
            user: { userId: uId, uniqueId: `@${uId}`, nickname: nick },
            metadata: {
              giftName: gift,
              count,
              diamondCount: 1,
              profilePictureUrl: avatarUrl,
              ...(rule?.params || {}),
            },
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          this.eventQueue.push(engGiftCmd);
          this.totalEventsDispatched++;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: engGiftCmd.action }));
          return;
        }

        if (pathname === '/api/english/command') {
          const action = String(json.action || '');
          const allowedEnglish = [
            'english_class.join',
            'english_class.answer',
            'english_class.team',
            'english_class.gift',
            'english_class.like',
            'english_class.follow',
            'english_class.reset',
            'english_class.tts_speak',
            'tts_speak',
          ];
          if (!allowedEnglish.includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Action not permitted for English Class' }));
            return;
          }
          const cmd: GameCommand = {
            id: `cmd_eng_manual_${Date.now()}`,
            action: action as any,
            user: {
              userId: String(json.userId || 'admin_test'),
              uniqueId: String(json.uniqueId || '@admin'),
              nickname: String(json.nickname || 'Streamer'),
            },
            metadata: json.metadata || {},
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/quiz/mock/chat') {
          const nick = String(json.nickname || 'Thí Sinh Chibi').slice(0, 40);
          const comm = String(json.comment || 'JOIN').slice(0, 150);
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const event: NormalizedChatEvent = {
            id: `mock_qs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'chat',
            provider: 'mock',
            userId: uId,
            uniqueId: `@${uId}`,
            nickname: nick,
            comment: comm,
            profilePictureUrl: avatarUrl,
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          const qsCmd = this.parseQuizShowComment(event);
          if (qsCmd) {
            this.eventQueue.push(qsCmd);
            this.totalEventsDispatched++;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: qsCmd ? qsCmd.action : null }));
          return;
        }

        if (pathname === '/api/quiz/mock/gift') {
          const nick = String(json.nickname || 'Thí Sinh Chibi').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const count = Math.min(100, Math.max(1, Number(json.count) || 1));
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const rule = this.giftCatalog.findMatchingRule('quiz-show', gift);
          const qsGiftCmd: GameCommand = {
            id: `cmd_qs_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            action: (rule?.action as any) || 'quiz_show.gift',
            user: { userId: uId, uniqueId: `@${uId}`, nickname: nick },
            metadata: {
              giftName: gift,
              count,
              diamondCount: 1,
              profilePictureUrl: avatarUrl,
              ...(rule?.params || {}),
            },
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          this.eventQueue.push(qsGiftCmd);
          this.totalEventsDispatched++;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: qsGiftCmd.action }));
          return;
        }

        if (pathname === '/api/quiz/command') {
          const action = String(json.action || '');
          const allowedQuiz = [
            'quiz_show.join',
            'quiz_show.answer',
            'quiz_show.team',
            'quiz_show.gift',
            'quiz_show.like',
            'quiz_show.follow',
            'quiz_show.reset',
            'quiz_show.tts_speak',
            'tts_speak',
          ];
          if (!allowedQuiz.includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Action not permitted for Quiz Show' }));
            return;
          }
          const cmd: GameCommand = {
            id: `cmd_qs_manual_${Date.now()}`,
            action: action as any,
            user: {
              userId: String(json.userId || 'admin_test'),
              uniqueId: String(json.uniqueId || '@admin'),
              nickname: String(json.nickname || 'Streamer'),
            },
            metadata: json.metadata || {},
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/rebus/mock/chat') {
          const nick = String(json.nickname || 'Thám Tử Chibi').slice(0, 40);
          const comm = String(json.comment || 'CÁ VÀNG').slice(0, 150);
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const event: NormalizedChatEvent = {
            id: `mock_rebus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: 'chat',
            provider: 'mock',
            userId: uId,
            uniqueId: `@${uId}`,
            nickname: nick,
            comment: comm,
            profilePictureUrl: avatarUrl,
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          const rebusCmd = this.parseRebusComment(event);
          if (rebusCmd) {
            this.eventQueue.push(rebusCmd);
            this.totalEventsDispatched++;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: rebusCmd ? rebusCmd.action : null }));
          return;
        }

        if (pathname === '/api/rebus/mock/gift') {
          const nick = String(json.nickname || 'Thám Tử Chibi').slice(0, 40);
          const gift = String(json.giftName || 'Rose').slice(0, 40);
          const count = Math.min(100, Math.max(1, Number(json.count) || 1));
          const avatarUrl = json.avatarUrl ? String(json.avatarUrl) : undefined;
          const uId = `user_${nick.toLowerCase().replace(/\s+/g, '_')}`;
          const rule = this.giftCatalog.findMatchingRule('duoi-hinh-bat-chu', gift);
          const rebusGiftCmd: GameCommand = {
            id: `cmd_rebus_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            action: (rule?.action as any) || 'rebus.gift',
            user: { userId: uId, uniqueId: `@${uId}`, nickname: nick },
            metadata: {
              giftName: gift,
              count,
              diamondCount: 1,
              profilePictureUrl: avatarUrl,
              ...(rule?.params || {}),
            },
            timestamp: Date.now(),
          };
          this.totalEventsReceived++;
          this.eventQueue.push(rebusGiftCmd);
          this.totalEventsDispatched++;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, command: rebusGiftCmd.action }));
          return;
        }

        if (pathname === '/api/rebus/command') {
          const action = String(json.action || '');
          const allowedRebus = [
            'rebus.join',
            'rebus.answer',
            'rebus.gift',
            'rebus.hint',
            'rebus.like',
            'rebus.follow',
            'rebus.reset',
            'rebus.tts_speak',
            'tts_speak',
          ];
          if (!allowedRebus.includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Action not permitted for Rebus' }));
            return;
          }
          const cmd: GameCommand = {
            id: `cmd_rebus_manual_${Date.now()}`,
            action: action as any,
            user: {
              userId: String(json.userId || 'admin_test'),
              uniqueId: String(json.uniqueId || '@admin'),
              nickname: String(json.nickname || 'Streamer'),
            },
            metadata: json.metadata || {},
            timestamp: Date.now(),
          };
          this.eventQueue.push(cmd);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/spectators/move') {
          const userId = String(json.userId || '');
          const targetTeam = json.team === 'red' || json.team === 'blue' ? json.team : null;
          if (userId && targetTeam) {
            const member = this.teamManager.getAllMembers().find((m) => m.userId === userId);
            if (member) {
              member.team = targetTeam;
              member.updatedAt = Date.now();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, member }));
              return;
            }
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User or team invalid' }));
          return;
        }

        if (pathname === '/api/spectators/add') {
          const userId = String(json.userId || `viewer_${Date.now()}`);
          const nickname = String(json.nickname || 'Khán Giả');
          const targetTeam = json.team === 'blue' ? 'blue' : 'red';
          this.teamManager.processComment({ userId, uniqueId: `@${userId}`, nickname }, targetTeam.toUpperCase());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/spectators/clear') {
          this.teamManager.clear();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/catalog/sync') {
          this.giftCatalog.reloadAll();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, stats: this.giftCatalog.getStats() }));
          return;
        }

        if (pathname === '/api/catalog/observe') {
          const events = Array.isArray(json.events) ? json.events : (json.event ? [json.event] : []);
          const resObserve = this.giftCatalog.importObservedEvents(events);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...resObserve, stats: this.giftCatalog.getStats() }));
          return;
        }

        if (pathname === '/api/gift-mappings' || pathname === '/api/gift-mappings/save') {
          const rule = json.rule || json;
          if (rule && rule.giftName && rule.action) {
            const saved = this.giftCatalog.saveMapping(rule);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, rule: saved, rules: this.giftCatalog.getMappings(rule.gameType) }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid rule payload: giftName and action required' }));
          return;
        }

        if (pathname === '/api/gift-mappings/delete') {
          const id = String(json.id || '');
          const deleted = this.giftCatalog.deleteMapping(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: deleted, rules: this.giftCatalog.getMappings() }));
          return;
        }

        if (pathname === '/api/gift-mappings/toggle') {
          const id = String(json.id || '');
          const enabled = this.giftCatalog.toggleMapping(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, enabled, rules: this.giftCatalog.getMappings() }));
          return;
        }

        if (pathname === '/api/gift-mappings/import') {
          const rules = Array.isArray(json.rules) ? json.rules : [];
          const count = this.giftCatalog.importMappings(rules);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, count, rules: this.giftCatalog.getMappings() }));
          return;
        }

        if (pathname === '/api/gift-analytics/reset') {
          this.giftCatalog.resetAnalytics();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/mapping/save') {
          if (json.rule && json.rule.giftName && json.rule.action) {
            this.giftMapper.saveRule(json.rule);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, rules: this.giftMapper.getAllRules() }));
            return;
          }
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid rule payload' }));
          return;
        }

        if (pathname === '/api/mapping/delete') {
          const id = String(json.id || '');
          const deleted = this.giftMapper.deleteRule(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: deleted, rules: this.giftMapper.getAllRules() }));
          return;
        }

        if (pathname === '/api/mapping/toggle') {
          const id = String(json.id || '');
          const enabled = this.giftMapper.toggleRule(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, enabled, rules: this.giftMapper.getAllRules() }));
          return;
        }

        if (pathname === '/api/queue/config') {
          if (json.maxUnitsPerTeam !== undefined) {
            this.eventQueue.maxUnitsPerTeam = Math.min(60, Math.max(10, Number(json.maxUnitsPerTeam) || 35));
          }
          if (json.batchIntervalMs !== undefined) {
            this.eventQueue.batchIntervalMs = Math.min(2000, Math.max(50, Number(json.batchIntervalMs) || 200));
          }
          if (json.overflowPolicy !== undefined) {
            this.eventQueue.overflowPolicy = json.overflowPolicy;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, stats: this.eventQueue.getStats() }));
          return;
        }

        if (pathname === '/api/logs/clear') {
          this.eventQueue.clear();
          this.errorLogs = [];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }
}
