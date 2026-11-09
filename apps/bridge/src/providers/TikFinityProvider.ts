import { WebSocket } from 'ws';
import { LiveEventProvider } from './LiveEventProvider.js';
import { LiveRoomStatus, NormalizedLiveEvent, ProviderStatus, RawEventLogItem } from '../types/events.js';
import { DataSanitizer } from '../utils/sanitizer.js';

export interface TikFinityRawMessage {
  event: 'chat' | 'gift' | 'like' | 'follow' | 'share' | 'connected' | 'roomUser' | 'stream' | 'disconnected' | string;
  data: Record<string, unknown>;
}

export class TikFinityProvider extends LiveEventProvider {
  public readonly name = 'TikFinity Desktop Provider';
  public readonly endpoint: string;

  private ws: WebSocket | null = null;
  private wsConnected = false;
  private liveRoomStatus: LiveRoomStatus = 'disconnected';
  private hasReceivedLiveEvents = false;
  private roomViewerCount = 0;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private inactivityCheckTimer: NodeJS.Timeout | null = null;

  private eventsReceived = 0;
  private errorsCount = 0;
  private lastEventTime: number | null = null;
  private idCounter = 1;

  // RAW Event Inspector ring buffer
  private rawEventLogs: RawEventLogItem[] = [];
  private readonly maxRawLogs = 40;

  constructor(endpoint = 'ws://localhost:21213/') {
    super();
    this.endpoint = endpoint;
  }

  public async connect(): Promise<void> {
    this.shouldReconnect = true;
    this.initSocket();
    this.startInactivityChecker();
  }

  public async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    this.stopInactivityChecker();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected = false;
    this.liveRoomStatus = 'disconnected';
    this.hasReceivedLiveEvents = false;
    this.emitStatusChange();
    console.log('[TikFinityProvider] Disconnected.');
  }

  public getStatus(): ProviderStatus {
    let details = 'Disconnected';
    let statusText = 'Ngắt kết nối (TikFinity chưa mở hoặc cổng 21213 đóng)';

    if (this.wsConnected) {
      switch (this.liveRoomStatus) {
        case 'active':
          statusText = `Phòng LIVE đang hoạt động (${this.roomViewerCount > 0 ? `${this.roomViewerCount} người xem, ` : ''}sự kiện streaming)`;
          details = 'TikTok LIVE Room ACTIVE';
          break;
        case 'no_recent_events':
          statusText = 'Phòng LIVE đang mở (Không có sự kiện mới trong 60s qua / Yên tĩnh)';
          details = 'TikTok LIVE Room Idle (No recent events)';
          break;
        case 'unknown':
          statusText = 'Đã kết nối TikFinity Desktop (Chưa có dữ liệu phiên LIVE / Chờ kết nối TikTok)';
          details = 'TikFinity App Connected (Standby: Waiting for live room data)';
          break;
        case 'disconnected':
          statusText = 'TikFinity báo phiên LIVE chưa hoạt động';
          details = 'TikFinity App Connected but Room Disconnected';
          break;
      }
    } else if (this.shouldReconnect) {
      statusText = `Đang thử kết nối lại (Lần ${this.reconnectAttempts})... Cổng 21213 chưa mở`;
      details = `Reconnecting (attempt ${this.reconnectAttempts})... TikFinity Desktop on port 21213 not detected`;
    }

    return {
      name: this.name,
      connected: this.wsConnected,
      wsConnected: this.wsConnected,
      liveRoomStatus: this.liveRoomStatus,
      liveRoomStatusText: statusText,
      endpoint: this.endpoint,
      eventsReceived: this.eventsReceived,
      errorsCount: this.errorsCount,
      lastEventTime: this.lastEventTime,
      details,
      roomInfo: {
        viewerCount: this.roomViewerCount,
        lastEventTime: this.lastEventTime || undefined,
      },
    };
  }

  public getRawLogs(): RawEventLogItem[] {
    return this.rawEventLogs;
  }

  public clearRawLogs(): void {
    this.rawEventLogs = [];
  }

  private initSocket(): void {
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch {
        // ignore cleanup error
      }
    }

    try {
      this.ws = new WebSocket(this.endpoint);

      this.ws.on('open', () => {
        this.wsConnected = true;
        this.reconnectAttempts = 0;
        // Do NOT conclude active immediately; mark as 'unknown' until room signal or events arrive
        this.liveRoomStatus = this.hasReceivedLiveEvents ? 'active' : 'unknown';
        console.log(`[TikFinityProvider] WebSocket connection open at ${this.endpoint}`);
        this.emitStatusChange();
      });

      this.ws.on('message', (rawData: Buffer | string) => {
        this.handleMessage(rawData);
      });

      this.ws.on('close', (code, reason) => {
        const wasWs = this.wsConnected;
        this.wsConnected = false;
        this.liveRoomStatus = 'disconnected';
        if (wasWs) {
          console.warn(`[TikFinityProvider] WebSocket closed (${code}: ${reason.toString() || 'no reason'})`);
        }
        this.emitStatusChange();
        this.scheduleReconnect();
      });

      this.ws.on('error', () => {
        this.errorsCount++;
        this.emitStatusChange();
      });
    } catch {
      this.errorsCount++;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(8000, 2000 + this.reconnectAttempts * 1000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect) {
        this.initSocket();
      }
    }, delay);
  }

  private handleMessage(raw: Buffer | string): void {
    try {
      const text = raw.toString();
      const parsed: unknown = JSON.parse(text);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Message is not a JSON object');
      }

      const msg = parsed as TikFinityRawMessage;
      if (!msg.event) return;

      // Record in RAW Event Inspector with sensitive data masked
      this.recordRawLog(msg.event, msg);

      this.eventsReceived++;
      this.lastEventTime = Date.now();

      // Handle connection status events
      if (msg.event === 'connected') {
        const data = msg.data || {};
        if (data.roomConnected === false) {
          this.liveRoomStatus = 'disconnected';
        } else if (data.roomConnected === true) {
          this.liveRoomStatus = 'active';
        } else {
          // Connected to local app, but room state pending
          this.liveRoomStatus = 'unknown';
        }
        this.emitStatusChange();
        return;
      }

      if (msg.event === 'liveStatusChange' && msg.data) {
        const isLive = Boolean((msg.data as any).isLive);
        if (isLive) {
          this.liveRoomStatus = 'active';
          this.hasReceivedLiveEvents = true;
        } else {
          this.liveRoomStatus = 'disconnected';
        }
        this.emitStatusChange();
        return;
      }

      if (msg.event === 'disconnected') {
        this.liveRoomStatus = 'disconnected';
        this.emitStatusChange();
        return;
      }

      if (msg.event === 'roomUser' && msg.data) {
        this.liveRoomStatus = 'active';
        this.hasReceivedLiveEvents = true;
        if (typeof msg.data.viewerCount === 'number') {
          this.roomViewerCount = msg.data.viewerCount;
        }
        this.emitStatusChange();
        return;
      }

      // Live gameplay events prove room is active
      if (['chat', 'gift', 'like', 'follow', 'share', 'stream'].includes(msg.event)) {
        this.liveRoomStatus = 'active';
        this.hasReceivedLiveEvents = true;
      }

      const normalized = this.normalizeEvent(msg);
      if (normalized) {
        this.emitLiveEvent(normalized);
      }
    } catch (err) {
      this.errorsCount++;
      this.emitProviderError(new Error(`Failed to parse TikFinity message: ${(err as Error).message}`));
    }
  }

  private recordRawLog(eventName: string, payload: unknown): void {
    const item: RawEventLogItem = {
      id: `raw_${Date.now()}_${this.idCounter++}`,
      timestamp: Date.now(),
      event: eventName,
      sanitizedJson: DataSanitizer.toSanitizedJson(payload),
    };

    this.rawEventLogs.unshift(item);
    if (this.rawEventLogs.length > this.maxRawLogs) {
      this.rawEventLogs.pop();
    }
  }

  public normalizeEvent(msg: TikFinityRawMessage): NormalizedLiveEvent | null {
    const data = msg.data || {};
    const userId = String(data.userId || data.user_id || `anon_${Date.now()}`);
    const uniqueId = String(data.uniqueId || data.username || userId);
    const nickname = String(data.nickname || data.displayName || uniqueId);
    const userObj = data.user as Record<string, any> | undefined;
    const rawAvatar = data.profilePictureUrl || data.profilePicturUrl || data.profile_picture_url ||
      data.avatarUrl || data.avatar_url || data.profile_image_url ||
      (userObj && (userObj.profilePictureUrl || userObj.profilePicturUrl || userObj.avatarUrl));
    const profilePictureUrl = rawAvatar ? String(rawAvatar) : undefined;
    const eventId = `tikfinity_${Date.now()}_${this.idCounter++}`;

    switch (msg.event) {
      case 'chat': {
        const comment = String(data.comment || data.message || '').trim();
        if (!comment) return null;
        return {
          id: eventId,
          type: 'chat',
          provider: 'tikfinity',
          userId,
          uniqueId,
          nickname,
          comment,
          profilePictureUrl,
          timestamp: Date.now(),
        };
      }

      case 'gift': {
        const giftName = String(data.giftName || data.gift_name || 'Rose');
        const giftId = (data.giftId as string | number) || giftName.toLowerCase();
        // Support number or string repeatCount from real TikFinity payloads
        const repeatCount = Math.max(1, Number(data.repeatCount || data.count || 1));
        const diamondCount = Number(data.diamondCount || data.diamonds || 1);
        const repeatEnd = Boolean(data.repeatEnd !== undefined ? data.repeatEnd : true);
        const groupId = data.groupId ? String(data.groupId) : undefined;

        return {
          id: eventId,
          type: 'gift',
          provider: 'tikfinity',
          userId,
          uniqueId,
          nickname,
          giftId,
          giftName,
          diamondCount,
          repeatCount,
          deltaCount: 1, // Will be computed by GiftStreakHandler
          repeatEnd,
          groupId,
          profilePictureUrl,
          timestamp: Date.now(),
        };
      }

      case 'like': {
        const likeCount = Math.max(1, Number(data.likeCount || data.count || 1));
        const totalLikeCount = data.totalLikeCount ? Number(data.totalLikeCount) : undefined;
        return {
          id: eventId,
          type: 'like',
          provider: 'tikfinity',
          userId,
          uniqueId,
          likeCount,
          totalLikeCount,
          timestamp: Date.now(),
        };
      }

      case 'follow': {
        return {
          id: eventId,
          type: 'follow',
          provider: 'tikfinity',
          userId,
          uniqueId,
          nickname,
          timestamp: Date.now(),
        };
      }

      default:
        return null;
    }
  }

  private startInactivityChecker(): void {
    this.stopInactivityChecker();
    this.inactivityCheckTimer = setInterval(() => {
      // If connected to ws, and was active, but no events received for > 60 seconds:
      // Transition to 'no_recent_events' (Quiet/Idle). DO NOT mark as disconnected!
      if (this.wsConnected && this.liveRoomStatus === 'active' && this.lastEventTime) {
        if (Date.now() - this.lastEventTime > 60000) {
          this.liveRoomStatus = 'no_recent_events';
          this.emitStatusChange();
        }
      }
    }, 10000);
  }

  private stopInactivityChecker(): void {
    if (this.inactivityCheckTimer) {
      clearInterval(this.inactivityCheckTimer);
      this.inactivityCheckTimer = null;
    }
  }
}
