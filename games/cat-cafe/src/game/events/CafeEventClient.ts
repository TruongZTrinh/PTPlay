import { CafeCommandAdapter, ParsedCafeCommand } from './CafeCommandAdapter';

export type CafeCommandHandler = (cmd: ParsedCafeCommand) => void;
export type ConnectionStatusHandler = (status: { connected: boolean; statusText: string }) => void;

export class CafeEventClient {
  private ws: WebSocket | null = null;
  private url: string;
  private isConnected = false;
  private shouldReconnect = true;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private handlers: Set<CafeCommandHandler> = new Set();
  private statusHandlers: Set<ConnectionStatusHandler> = new Set();
  private adapter: CafeCommandAdapter;
  private seenEventIds: Set<string> = new Set();
  private readonly maxSeenIds = 200;

  public lastEventTime: number | null = null;
  public totalEventsReceived = 0;
  public totalCommandsDispatched = 0;

  constructor(url = 'ws://localhost:8088/game?app=cat-cafe') {
    this.url = url;
    this.adapter = new CafeCommandAdapter();
  }

  public onCommand(handler: CafeCommandHandler): void {
    this.handlers.add(handler);
  }

  public removeCommand(handler: CafeCommandHandler): void {
    this.handlers.delete(handler);
  }

  public onStatusChange(handler: ConnectionStatusHandler): void {
    this.statusHandlers.add(handler);
  }

  private notifyStatus(connected: boolean, statusText: string): void {
    this.isConnected = connected;
    for (const h of this.statusHandlers) {
      h({ connected, statusText });
    }
  }

  public connect(): void {
    this.shouldReconnect = true;
    this.initSocket();
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false, 'Ngoại tuyến (Chế độ Độc Lập / Standalone)');
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  private initSocket(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus(true, 'Đã kết nối LIVE Bridge (Sẵn sàng nhận lệnh)');
        console.log('[CafeEventClient] Connected to PTPlay Live Bridge at', this.url);

        // Send registration
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'register', app: 'cat-cafe' }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.handleIncomingMessage(raw);
        } catch (e) {
          console.warn('[CafeEventClient] Malformed message', e);
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus(false, 'Mất kết nối Bridge (Đang thử lại...)');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };
    } catch {
      this.notifyStatus(false, 'Không thể kết nối Bridge');
      this.scheduleReconnect();
    }
  }

  private handleIncomingMessage(msg: Record<string, any>): void {
    if (!msg) return;

    // Deduplicate by message/event ID if present
    if (msg.id && typeof msg.id === 'string') {
      if (this.seenEventIds.has(msg.id)) {
        return; // Duplicate ignored
      }
      this.seenEventIds.add(msg.id);
      if (this.seenEventIds.size > this.maxSeenIds) {
        const first = this.seenEventIds.values().next().value;
        if (first) this.seenEventIds.delete(first);
      }
    }

    this.totalEventsReceived++;
    this.lastEventTime = Date.now();

    // 1. If message is already a normalized Cat Café GameCommand
    if (msg.action && typeof msg.action === 'string' && msg.action.startsWith('cat_cafe.')) {
      const cmd: ParsedCafeCommand = {
        action: msg.action as import('./CafeCommandAdapter').CatCafeAction,
        userId: msg.user?.userId || 'unknown',
        uniqueId: msg.user?.uniqueId || '@unknown',
        nickname: msg.user?.nickname || 'Khán Giả',
        metadata: msg.metadata,
      };
      this.dispatchCommand(cmd);
      return;
    }

    // 2. If message is a raw/normalized chat event from Bridge
    if (msg.type === 'chat' && msg.comment) {
      const parsed = this.adapter.parseComment(
        msg.userId || 'anon',
        msg.uniqueId || '@anon',
        msg.nickname || 'Khán Giả',
        msg.comment
      );
      if (parsed) {
        this.dispatchCommand(parsed);
      }
      return;
    }

    // 3. If message is a raw/normalized gift event from Bridge
    if (msg.type === 'gift' && msg.giftName) {
      const delta = Number(msg.deltaCount) || Number(msg.repeatCount) || 1;
      const parsed = this.adapter.parseGift(
        msg.userId || 'anon',
        msg.uniqueId || '@anon',
        msg.nickname || 'Khán Giả',
        msg.giftName,
        delta
      );
      this.dispatchCommand(parsed);
      return;
    }
  }

  private dispatchCommand(cmd: ParsedCafeCommand): void {
    this.totalCommandsDispatched++;
    for (const handler of this.handlers) {
      try {
        handler(cmd);
      } catch (e) {
        console.error('[CafeEventClient] Handler error:', e);
      }
    }
  }

  public sendGameState(catCount: number, viewerCatCount: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'game_state',
          app: 'cat-cafe',
          catCount,
          viewerCatCount,
          timestamp: Date.now(),
        })
      );
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== null) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 5000);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.initSocket();
      }
    }, delay);
  }
}
