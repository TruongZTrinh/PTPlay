import { GameCommand } from '@ptplay/live-contracts';
import { PORTS } from '@ptplay/shared-config';

export interface PTPlayClientOptions {
  gameId: string;
  bridgeUrl?: string;
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
}

export type CommandHandler = (cmd: GameCommand) => void;
export type StatusHandler = (connected: boolean, statusText: string) => void;

export class PTPlayGameClient {
  public readonly gameId: string;
  private readonly url: string;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private shouldReconnect = true;
  private reconnectIntervalMs: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;

  private commandHandlers: Set<CommandHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();

  public lastEventTime: number | null = null;
  public totalCommandsReceived = 0;

  constructor(options: PTPlayClientOptions | string) {
    if (typeof options === 'string') {
      this.gameId = options;
      this.url = `ws://localhost:${PORTS.BRIDGE}/game?app=${encodeURIComponent(options)}`;
      this.reconnectIntervalMs = 2000;
    } else {
      this.gameId = options.gameId;
      const base = options.bridgeUrl || `ws://localhost:${PORTS.BRIDGE}/game`;
      const sep = base.includes('?') ? '&' : '?';
      this.url = `${base}${sep}app=${encodeURIComponent(options.gameId)}`;
      this.reconnectIntervalMs = options.reconnectIntervalMs || 2000;
      this.shouldReconnect = options.autoReconnect !== false;
    }
  }

  public onCommand(handler: CommandHandler): () => void {
    this.commandHandlers.add(handler);
    return () => this.commandHandlers.delete(handler);
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private notifyStatus(connected: boolean, statusText: string): void {
    this.isConnected = connected;
    for (const h of this.statusHandlers) {
      try {
        h(connected, statusText);
      } catch (err) {
        console.error('[PTPlayGameClient] Status callback error:', err);
      }
    }
  }

  public connect(): void {
    this.shouldReconnect = true;
    this.initSocket();
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false, 'Ngoại tuyến (Offline)');
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  private initSocket(): void {
    if (typeof globalThis.WebSocket === 'undefined') {
      console.warn('[PTPlayGameClient] WebSocket is not defined in this environment.');
      return;
    }

    try {
      this.ws = new globalThis.WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus(true, 'Đã kết nối LIVE Bridge');
        console.log(`[PTPlayGameClient:${this.gameId}] Connected to Bridge at`, this.url);

        // Register application with Bridge
        if (this.ws && this.ws.readyState === globalThis.WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'register', app: this.gameId }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.handleIncoming(raw);
        } catch {
          // Ignore malformed payloads
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus(false, 'Mất kết nối LIVE Bridge (Đang thử lại...)');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose handles reconnect
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(10000, this.reconnectIntervalMs + this.reconnectAttempts * 500);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.initSocket();
      }
    }, delay);
  }

  private handleIncoming(data: any): void {
    if (!data || typeof data !== 'object') return;
    if (data.type === 'connected') return;

    this.lastEventTime = Date.now();
    this.totalCommandsReceived++;

    for (const h of this.commandHandlers) {
      try {
        h(data as GameCommand);
      } catch (err) {
        console.error('[PTPlayGameClient] Command handler error:', err);
      }
    }
  }

  public sendGameState(state: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === globalThis.WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'game_state',
          ...state,
        })
      );
    }
  }
}
