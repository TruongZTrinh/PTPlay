import { GameCommand, OverflowPolicy, Team } from '../types/events.js';

export interface EventLogItem {
  id: string;
  timestamp: number;
  userName: string;
  team?: Team;
  action: string;
  details: string;
  status: 'queued' | 'dispatched' | 'waiting' | 'dropped';
}

export class EventQueue {
  private queue: GameCommand[] = [];
  private eventLogs: EventLogItem[] = [];
  private readonly maxLogHistory = 100;

  // Configuration
  public batchIntervalMs = 200;
  public maxCommandsPerBatch = 3;
  public maxQueueSize = 250;

  // Overflow policy: 'wait' (default), 'convert_heal', 'convert_buff', 'drop'
  // Strict requirement: Never automatically convert to heal unless explicitly set by streamer.
  public overflowPolicy: OverflowPolicy = 'wait';

  // Game state feedback
  public maxUnitsPerTeam = 35;
  public currentUnitsRed = 0;
  public currentUnitsBlue = 0;

  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private dispatchCallback?: (cmd: GameCommand) => void;

  public setDispatcher(cb: (cmd: GameCommand) => void): void {
    this.dispatchCallback = cb;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.processNextBatch(), this.batchIntervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public push(command: GameCommand): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      this.logEvent(command, 'dropped', 'Hàng đợi quá tải (vượt quá 250 lệnh)');
      return false;
    }

    this.queue.push(command);
    this.logEvent(command, 'queued', 'Đã thêm vào hàng đợi');
    return true;
  }

  public updateGameState(redUnits: number, blueUnits: number): void {
    this.currentUnitsRed = redUnits;
    this.currentUnitsBlue = blueUnits;
  }

  private processNextBatch(): void {
    if (this.queue.length === 0 || !this.dispatchCallback) return;

    let dispatchedThisBatch = 0;
    const deferredCommands: GameCommand[] = [];

    while (this.queue.length > 0 && dispatchedThisBatch < this.maxCommandsPerBatch) {
      const cmd = this.queue.shift();
      if (!cmd) break;

      // Check unit limit for spawn actions
      if (cmd.action === 'spawn_unit' && cmd.team) {
        const curUnits = cmd.team === 'red' ? this.currentUnitsRed : this.currentUnitsBlue;
        if (curUnits >= this.maxUnitsPerTeam) {
          if (this.overflowPolicy === 'wait') {
            // Keep in queue until units die and space frees up
            deferredCommands.push(cmd);
            this.logEvent(
              cmd,
              'waiting',
              `Quân đội ${cmd.team.toUpperCase()} đã đạt giới hạn (${this.maxUnitsPerTeam}). Giữ trong hàng đợi chờ chỗ trống.`
            );
            continue;
          } else if (this.overflowPolicy === 'convert_heal') {
            // Explicitly opted in by streamer
            cmd.action = 'heal_team';
            cmd.amount = 80;
            cmd.metadata = { ...cmd.metadata, overflowConverted: 'heal' };
            this.logEvent(
              cmd,
              'dispatched',
              `Đạt giới hạn quân (${this.maxUnitsPerTeam}) -> Chuyển thành Hồi Máu Thành Trì +80 HP (theo cấu hình)`
            );
            this.dispatchCallback(cmd);
            dispatchedThisBatch++;
            continue;
          } else if (this.overflowPolicy === 'convert_buff') {
            // Explicitly opted in by streamer
            cmd.action = 'boost_team';
            cmd.duration = 6;
            cmd.metadata = { ...cmd.metadata, overflowConverted: 'buff' };
            this.logEvent(
              cmd,
              'dispatched',
              `Đạt giới hạn quân (${this.maxUnitsPerTeam}) -> Chuyển thành Tăng Tốc & Sát Thương (theo cấu hình)`
            );
            this.dispatchCallback(cmd);
            dispatchedThisBatch++;
            continue;
          } else {
            // Drop policy
            this.logEvent(
              cmd,
              'dropped',
              `Quân đội ${cmd.team.toUpperCase()} đã đạt giới hạn (${this.maxUnitsPerTeam}). Bỏ qua lệnh spawn.`
            );
            continue;
          }
        }
      }

      this.logEvent(cmd, 'dispatched', `Đã chuyển lệnh đến Game: ${cmd.action}`);
      this.dispatchCallback(cmd);
      dispatchedThisBatch++;
    }

    // Put deferred waiting commands back at the front of the queue
    if (deferredCommands.length > 0) {
      this.queue.unshift(...deferredCommands);
    }
  }

  private logEvent(cmd: GameCommand, status: 'queued' | 'dispatched' | 'waiting' | 'dropped', details: string): void {
    const item: EventLogItem = {
      id: cmd.id,
      timestamp: Date.now(),
      userName: cmd.user?.nickname || 'Khán Giả',
      team: cmd.team,
      action: cmd.action,
      details,
      status,
    };

    this.eventLogs.unshift(item);
    if (this.eventLogs.length > this.maxLogHistory) {
      this.eventLogs.pop();
    }
  }

  public getStats() {
    return {
      queueLength: this.queue.length,
      maxQueueSize: this.maxQueueSize,
      batchIntervalMs: this.batchIntervalMs,
      maxCommandsPerBatch: this.maxCommandsPerBatch,
      overflowPolicy: this.overflowPolicy,
    };
  }

  public getRecentLogs(): EventLogItem[] {
    return this.eventLogs;
  }

  public clear(): void {
    this.queue = [];
    this.eventLogs = [];
  }
}
