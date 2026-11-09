import { LiveEventProvider } from './LiveEventProvider.js';
import { NormalizedLiveEvent, ProviderStatus } from '../types/events.js';

export class MockProvider extends LiveEventProvider {
  public readonly name: string = 'Mock Provider';
  public readonly endpoint: string = 'mock://in-memory';

  private connected = false;
  private eventsReceived = 0;
  private errorsCount = 0;
  private lastEventTime: number | null = null;
  private autoTimer: NodeJS.Timeout | null = null;
  private idCounter = 1;

  public async connect(): Promise<void> {
    this.connected = true;
    this.emitStatusChange();
    console.log('[MockProvider] Connected to Mock Stream Engine.');
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
    this.stopAutoSimulation();
    this.emitStatusChange();
    console.log('[MockProvider] Disconnected from Mock Stream Engine.');
  }

  public getStatus(): ProviderStatus {
    return {
      name: this.name,
      connected: this.connected,
      wsConnected: this.connected,
      liveRoomStatus: this.connected ? 'active' : 'disconnected',
      liveRoomStatusText: this.connected ? 'Chế độ giả lập Mock đang hoạt động' : 'Chế độ Mock ngắt kết nối',
      endpoint: this.endpoint,
      eventsReceived: this.eventsReceived,
      errorsCount: this.errorsCount,
      lastEventTime: this.lastEventTime,
      details: this.autoTimer ? 'Auto-simulation active (periodic mock traffic)' : 'Manual test mode',
    };
  }

  private nextId(): string {
    return `mock_${Date.now()}_${this.idCounter++}`;
  }

  private recordEvent(event: NormalizedLiveEvent): void {
    if (!this.connected) {
      console.warn('[MockProvider] Dropped event - provider is disconnected.');
      return;
    }
    this.eventsReceived++;
    this.lastEventTime = Date.now();
    this.emitLiveEvent(event);
  }

  // --- Simulation Methods ---

  public simulateChat(nickname: string, comment: string, userId?: string, avatarUrl?: string): NormalizedLiveEvent {
    const uId = userId || `user_${nickname.toLowerCase().replace(/\s+/g, '_')}`;
    const event: NormalizedLiveEvent = {
      id: this.nextId(),
      type: 'chat',
      provider: 'mock',
      userId: uId,
      uniqueId: `@${uId}`,
      nickname,
      comment,
      profilePictureUrl: avatarUrl,
      timestamp: Date.now(),
    };
    this.recordEvent(event);
    return event;
  }

  public simulateGift(
    nickname: string,
    giftName: string,
    repeatCount = 1,
    deltaCount = 1,
    repeatEnd = true,
    userId?: string,
    avatarUrl?: string
  ): NormalizedLiveEvent {
    const uId = userId || `user_${nickname.toLowerCase().replace(/\s+/g, '_')}`;
    const diamondMap: Record<string, number> = {
      Rose: 1,
      Heart: 5,
      Fireworks: 50,
      Dragon: 500,
      Lion: 1000,
      Universe: 5000,
    };
    const event: NormalizedLiveEvent = {
      id: this.nextId(),
      type: 'gift',
      provider: 'mock',
      userId: uId,
      uniqueId: `@${uId}`,
      nickname,
      giftId: giftName.toLowerCase(),
      giftName,
      diamondCount: diamondMap[giftName] || 1,
      repeatCount,
      deltaCount,
      repeatEnd,
      profilePictureUrl: avatarUrl,
      timestamp: Date.now(),
    };
    this.recordEvent(event);
    return event;
  }

  public async simulateGiftStreak(
    nickname: string,
    giftName: string,
    totalCount: number,
    delayMs = 250,
    userId?: string
  ): Promise<void> {
    const uId = userId || `user_${nickname.toLowerCase().replace(/\s+/g, '_')}`;
    for (let i = 1; i <= totalCount; i++) {
      const isEnd = i === totalCount;
      this.simulateGift(nickname, giftName, i, 1, isEnd, uId);
      if (!isEnd) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  public simulateLike(nickname = 'Fan Cuồng', count = 15): void {
    const uId = `user_${nickname.toLowerCase().replace(/\s+/g, '_')}`;
    const event: NormalizedLiveEvent = {
      id: this.nextId(),
      type: 'like',
      provider: 'mock',
      userId: uId,
      uniqueId: `@${uId}`,
      likeCount: count,
      timestamp: Date.now(),
    };
    this.recordEvent(event);
  }

  public simulateDuplicate(event: NormalizedLiveEvent): void {
    // Re-emits an exact duplicate with same ID to test deduplication system
    if (!this.connected) return;
    this.eventsReceived++;
    this.emitLiveEvent(event);
  }

  public simulateInvalidPayload(): void {
    try {
      this.errorsCount++;
      throw new Error('[MockProvider] Simulated malformed event payload: missing userId');
    } catch (e) {
      this.emitProviderError(e as Error);
    }
  }

  public toggleAutoSimulation(intervalMs = 3000): boolean {
    if (this.autoTimer) {
      this.stopAutoSimulation();
      return false;
    } else {
      this.startAutoSimulation(intervalMs);
      return true;
    }
  }

  public startAutoSimulation(intervalMs = 3000): void {
    this.stopAutoSimulation();
    const mockUsers = [
      { name: 'Hải Đăng', team: 'ĐỎ' },
      { name: 'Bảo Long', team: 'XANH' },
      { name: 'Thanh Trúc', team: 'ĐỎ' },
      { name: 'Quốc Tuấn', team: 'XANH' },
      { name: 'Ngọc Mai', team: 'ĐỎ' },
    ];
    const gifts = ['Rose', 'Rose', 'Heart', 'Fireworks', 'Lion'];

    this.autoTimer = setInterval(() => {
      if (!this.connected) return;
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const rand = Math.random();

      if (rand < 0.4) {
        // Chat comment (often team picking or cheer)
        const comments = [user.team, `${user.team} CỐ LÊN!`, 'TIẾP VIỆN ĐÂY!', 'ĐẨY ĐƯỜNG ĐI!'];
        const comment = comments[Math.floor(Math.random() * comments.length)];
        this.simulateChat(user.name, comment);
      } else if (rand < 0.85) {
        // Gift
        const gift = gifts[Math.floor(Math.random() * gifts.length)];
        const count = gift === 'Rose' ? Math.floor(Math.random() * 3) + 1 : 1;
        this.simulateGift(user.name, gift, count, count, true);
      } else {
        // Likes
        this.simulateLike(user.name, Math.floor(Math.random() * 20) + 5);
      }
    }, intervalMs);

    this.emitStatusChange();
    console.log(`[MockProvider] Auto-simulation started (${intervalMs}ms interval).`);
  }

  public stopAutoSimulation(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
      this.emitStatusChange();
      console.log('[MockProvider] Auto-simulation stopped.');
    }
  }
}

