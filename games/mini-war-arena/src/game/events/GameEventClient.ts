import { GAME_CONFIG, Team, UnitType } from '../config/GameConfig';

export interface GameCommandMessage {
  id: string;
  action:
    | 'spawn_unit'
    | 'spawn_boss'
    | 'heal_team'
    | 'boost_team'
    | 'trigger_effect'
    | 'start_round'
    | 'reset_round'
    | 'pause_round'
    | 'resume_round'
    | 'join_team'
    | 'switch_theme'
    | 'toggle_fx'
    | 'clear_units'
    | 'set_core_hp'
    | 'set_round'
    | 'force_end_round'
    | 'boss_ability'
    | 'set_volume'
    | 'switch_music'
    | 'tts_speak'
    | 'set_voice'
    | 'tts_config';
  team?: Team;
  unitType?: UnitType;
  count?: number;
  amount?: number;
  duration?: number;
  user?: {
    userId: string;
    uniqueId: string;
    nickname: string;
    team?: Team;
  };
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export type CommandHandler = (cmd: GameCommandMessage) => void;

export class GameEventClient {
  private ws: WebSocket | null = null;
  private url: string;
  private isConnected = false;
  private shouldReconnect = true;
  private reconnectTimer: number | null = null;
  private handlers: Set<CommandHandler> = new Set();
  private onStatusChange?: (connected: boolean) => void;

  constructor(url = 'ws://localhost:8088/game') {
    this.url = url;
  }

  public setStatusCallback(cb: (connected: boolean) => void): void {
    this.onStatusChange = cb;
  }

  public onCommand(handler: CommandHandler): void {
    this.handlers.add(handler);
  }

  public removeCommand(handler: CommandHandler): void {
    this.handlers.delete(handler);
  }

  public connect(): void {
    this.shouldReconnect = true;
    this.initSocket();
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.onStatusChange?.(false);
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  public sendGameState(redUnits: number, blueUnits: number, redHp: number, blueHp: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'game_state',
          redUnits,
          blueUnits,
          redHp,
          blueHp,
        })
      );
    }
  }

  private initSocket(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onStatusChange?.(true);
        console.log('[GameEventClient] Connected to PTPlay Live Bridge at', this.url);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.action) {
            for (const handler of this.handlers) {
              handler(msg as GameCommandMessage);
            }
          }
        } catch (e) {
          console.warn('[GameEventClient] Malformed message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onStatusChange?.(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Will close and trigger scheduleReconnect
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.initSocket();
      }
    }, 2500);
  }
}

