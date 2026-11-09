import { LiveEventProvider } from './LiveEventProvider.js';
import {
  LiveRoomStatus,
  NormalizedLiveEvent,
  ProviderStatus,
  RawEventLogItem,
  NormalizedChatEvent,
  NormalizedGiftEvent,
  NormalizedLikeEvent,
  NormalizedFollowEvent,
  NormalizedRoomStatusEvent,
} from '../types/events.js';
import { DataSanitizer } from '../utils/sanitizer.js';

/**
 * Deliberately different raw webhook payload structure
 * representing an alternative external streaming provider or custom gateway
 * (e.g., YouTube/Twitch webhook relay, CloudEvents stream bus).
 */
export interface SyntheticRawWebhook {
  specversion?: string;
  eventType:
    | 'chat.message'
    | 'stream.donation'
    | 'stream.like'
    | 'stream.follow'
    | 'room.heartbeat'
    | string;
  eventId: string;
  timestampIso?: string;
  sender: {
    accountId: string;
    handle: string;
    displayName: string;
    avatar?: string;
  };
  payload: {
    // Chat
    text?: string;
    // Donation / Gift
    skuId?: string | number;
    skuTitle?: string;
    count?: number;
    delta?: number;
    isFinished?: boolean;
    seriesId?: string;
    diamonds?: number;
    // Like
    reactionCount?: number;
    totalReactions?: number;
    // Room
    isOnline?: boolean;
    viewers?: number;
  };
}

export class SyntheticWebhookProvider extends LiveEventProvider {
  public readonly name = 'Synthetic Webhook Provider';
  public readonly endpoint: string;

  private isConnected = false;
  private roomStatus: LiveRoomStatus = 'active';
  private eventsCount = 0;
  private errorsCount = 0;
  private lastEventTime: number | null = null;
  private rawLogs: RawEventLogItem[] = [];
  private readonly maxLogs = 50;

  constructor(endpoint = 'webhook://synthetic-provider/events') {
    super();
    this.endpoint = endpoint;
  }

  public async connect(): Promise<void> {
    this.isConnected = true;
    this.roomStatus = 'active';
    this.emitStatusChange();
    console.log('[SyntheticWebhookProvider] Connected & listening for synthetic webhook payloads.');
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    this.roomStatus = 'disconnected';
    this.emitStatusChange();
    console.log('[SyntheticWebhookProvider] Disconnected.');
  }

  public getStatus(): ProviderStatus {
    return {
      name: this.name,
      connected: this.isConnected,
      wsConnected: this.isConnected,
      liveRoomStatus: this.isConnected ? this.roomStatus : 'disconnected',
      liveRoomStatusText: this.isConnected
        ? 'Synthetic Webhook Engine hoạt động (Sẵn sàng nhận sự kiện độc lập)'
        : 'Synthetic Webhook Engine ngắt kết nối',
      endpoint: this.endpoint,
      eventsReceived: this.eventsCount,
      errorsCount: this.errorsCount,
      lastEventTime: this.lastEventTime,
      details: 'Provider độc lập đa định dạng (Alternative Event Schema)',
    };
  }

  public getRawLogs(): RawEventLogItem[] {
    return [...this.rawLogs];
  }

  public clearRawLogs(): void {
    this.rawLogs = [];
  }

  private recordRawLog(eventType: string, payload: unknown): void {
    const item: RawEventLogItem = {
      id: `synthetic_${Date.now()}_${this.eventsCount}`,
      timestamp: Date.now(),
      event: eventType,
      sanitizedJson: DataSanitizer.toSanitizedJson(payload),
    };
    this.rawLogs.unshift(item);
    if (this.rawLogs.length > this.maxLogs) {
      this.rawLogs.pop();
    }
  }

  /**
   * Ingests a raw webhook event with completely different field names and schema,
   * then translates it into a standard NormalizedLiveEvent.
   */
  public ingestWebhook(raw: SyntheticRawWebhook): NormalizedLiveEvent | null {
    if (!this.isConnected) {
      console.warn('[SyntheticWebhookProvider] Received webhook while disconnected - ignoring.');
      return null;
    }

    try {
      this.recordRawLog(raw.eventType, raw);
      this.eventsCount++;
      this.lastEventTime = Date.now();

      const normalized = this.normalizeWebhook(raw);
      if (normalized) {
        this.emitLiveEvent(normalized);
      }
      return normalized;
    } catch (err) {
      this.errorsCount++;
      const error = err instanceof Error ? err : new Error(String(err));
      this.emitProviderError(error);
      return null;
    }
  }

  private normalizeWebhook(raw: SyntheticRawWebhook): NormalizedLiveEvent | null {
    const ts = raw.timestampIso ? new Date(raw.timestampIso).getTime() : Date.now();
    const cleanNick = (raw.sender.displayName || raw.sender.handle || 'Anonymous').trim();

    switch (raw.eventType) {
      case 'chat.message': {
        const chatEvent: NormalizedChatEvent = {
          id: raw.eventId || `syn_chat_${Date.now()}`,
          type: 'chat',
          provider: 'synthetic',
          userId: raw.sender.accountId,
          uniqueId: raw.sender.handle.startsWith('@') ? raw.sender.handle : `@${raw.sender.handle}`,
          nickname: cleanNick,
          comment: (raw.payload.text || '').trim(),
          profilePictureUrl: raw.sender.avatar,
          timestamp: ts,
        };
        return chatEvent;
      }

      case 'stream.donation': {
        const giftEvent: NormalizedGiftEvent = {
          id: raw.eventId || `syn_gift_${Date.now()}`,
          type: 'gift',
          provider: 'synthetic',
          userId: raw.sender.accountId,
          uniqueId: raw.sender.handle.startsWith('@') ? raw.sender.handle : `@${raw.sender.handle}`,
          nickname: cleanNick,
          giftId: raw.payload.skuId ?? 'generic_gift',
          giftName: raw.payload.skuTitle || 'Gift',
          diamondCount: raw.payload.diamonds ?? 1,
          repeatCount: Math.max(1, Number(raw.payload.count) || 1),
          deltaCount: Math.max(1, Number(raw.payload.delta) || 1),
          repeatEnd: raw.payload.isFinished ?? true,
          groupId: raw.payload.seriesId,
          profilePictureUrl: raw.sender.avatar,
          timestamp: ts,
        };
        return giftEvent;
      }

      case 'stream.like': {
        const likeEvent: NormalizedLikeEvent = {
          id: raw.eventId || `syn_like_${Date.now()}`,
          type: 'like',
          provider: 'synthetic',
          userId: raw.sender.accountId,
          uniqueId: raw.sender.handle.startsWith('@') ? raw.sender.handle : `@${raw.sender.handle}`,
          likeCount: raw.payload.reactionCount ?? 1,
          totalLikeCount: raw.payload.totalReactions,
          timestamp: ts,
        };
        return likeEvent;
      }

      case 'stream.follow': {
        const followEvent: NormalizedFollowEvent = {
          id: raw.eventId || `syn_follow_${Date.now()}`,
          type: 'follow',
          provider: 'synthetic',
          userId: raw.sender.accountId,
          uniqueId: raw.sender.handle.startsWith('@') ? raw.sender.handle : `@${raw.sender.handle}`,
          nickname: cleanNick,
          timestamp: ts,
        };
        return followEvent;
      }

      case 'room.heartbeat': {
        const roomEvent: NormalizedRoomStatusEvent = {
          id: raw.eventId || `syn_room_${Date.now()}`,
          type: 'room_status',
          provider: 'synthetic',
          roomConnected: raw.payload.isOnline ?? true,
          viewerCount: raw.payload.viewers,
          timestamp: ts,
        };
        if (raw.payload.isOnline === false) {
          this.roomStatus = 'disconnected';
        } else {
          this.roomStatus = 'active';
        }
        this.emitStatusChange();
        return roomEvent;
      }

      default:
        return null;
    }
  }
}

