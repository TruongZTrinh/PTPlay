import { LiveEventProvider } from './LiveEventProvider.js';
import { ProviderStatus } from '../types/events.js';

export class OfficialTikTokProvider extends LiveEventProvider {
  public readonly name = 'Official TikTok LIVE API';
  public readonly endpoint = 'https://open.tiktokapis.com/v2/live/';

  public async connect(): Promise<void> {
    const message =
      '[OfficialTikTokProvider] BLOCKED – Requires TikTok LIVE developer partner access, client_id, and authorized stream token. Use TikFinityProvider or MockProvider for current integration.';
    console.warn(message);
    this.emitProviderError(new Error(message));
    this.emitStatusChange();
  }

  public async disconnect(): Promise<void> {
    this.emitStatusChange();
  }

  public getStatus(): ProviderStatus {
    return {
      name: this.name,
      connected: false,
      wsConnected: false,
      liveRoomStatus: 'disconnected',
      liveRoomStatusText: 'BLOCKED – Requires approved TikTok Open Platform LIVE Partner credentials',
      endpoint: this.endpoint,
      eventsReceived: 0,
      errorsCount: 1,
      lastEventTime: null,
      details: 'BLOCKED – Requires approved TikTok Open Platform LIVE Partner credentials',
    };
  }
}

