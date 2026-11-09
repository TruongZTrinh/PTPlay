import { EventEmitter } from 'node:events';
import { NormalizedLiveEvent, ProviderStatus, RawEventLogItem } from '../types/events.js';

export abstract class LiveEventProvider extends EventEmitter {
  public abstract readonly name: string;
  public abstract readonly endpoint: string;

  public abstract connect(): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract getStatus(): ProviderStatus;

  // Optional diagnostics & raw payload inspector hooks
  public getRawLogs?(): RawEventLogItem[];
  public clearRawLogs?(): void;

  // Typed event emitter helpers
  public onEvent(callback: (event: NormalizedLiveEvent) => void): this {
    return this.on('live_event', callback);
  }

  public onStatusChange(callback: (status: ProviderStatus) => void): this {
    return this.on('status_change', callback);
  }

  public onError(callback: (error: Error) => void): this {
    return this.on('provider_error', callback);
  }

  protected emitLiveEvent(event: NormalizedLiveEvent): void {
    this.emit('live_event', event);
  }

  protected emitStatusChange(): void {
    this.emit('status_change', this.getStatus());
  }

  protected emitProviderError(error: Error): void {
    this.emit('provider_error', error);
  }
}

