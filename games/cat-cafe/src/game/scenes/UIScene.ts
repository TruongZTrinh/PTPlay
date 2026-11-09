import Phaser from 'phaser';
import { Hud } from '../ui/Hud';
import { ChatPrompt } from '../ui/ChatPrompt';
import { StreamerModal } from '../ui/StreamerModal';
import { RoomId, TimeOfDay, WeatherType } from '../config/CafeConfig';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';

export class UIScene extends Phaser.Scene {
  private hud!: Hud;
  private prompt!: ChatPrompt;
  private streamerModal!: StreamerModal;

  constructor() {
    super({ key: 'UIScene' });
  }

  public create(): void {
    // 1. Initialize Streamer Modal Dialog
    this.streamerModal = new StreamerModal(
      this,
      (roomId: RoomId) => {
        this.game.events.emit('switch_room', roomId);
        this.hud.updateRoom(roomId);
      },
      (time: TimeOfDay, weather: WeatherType) => {
        this.game.events.emit('switch_atmosphere', { time, weather });
      }
    );

    // 2. Initialize Top Header Hud with Settings Gear button hooked to StreamerModal
    this.hud = new Hud(this, () => {
      this.streamerModal.toggle();
    });

    // 3. Connect Audio Engine Unlock Callback to HUD Banner
    CafeAudioEngine.getInstance().onUnlocked = () => {
      this.hud.hideAudioUnlockBanner();
    };

    // Any pointer down in UI unlocks audio
    this.input.on('pointerdown', () => {
      CafeAudioEngine.getInstance().unlock();
    });

    // 4. Initialize Bottom Command Guide & 10-Button Streamer Quick Demo Bar
    this.prompt = new ChatPrompt(this, {
      onJoinMock: () => this.game.events.emit('mock_join'),
      onFeedMock: () => this.game.events.emit('mock_feed'),
      onPlayMock: () => this.game.events.emit('mock_play'),
      onNapMock: () => this.game.events.emit('mock_nap'),
      onLoveMock: () => this.game.events.emit('mock_love'),
      onCallMock: () => this.game.events.emit('mock_call'),
      onPhotoMock: () => this.game.events.emit('mock_photo'),
      onGardenMock: () => this.game.events.emit('mock_garden'),
      onRoseMock: () => this.game.events.emit('mock_rose'),
      onHeartMock: () => this.game.events.emit('mock_heart'),
      onUniverseMock: () => this.game.events.emit('mock_universe'),
      onLionMock: () => this.game.events.emit('mock_lion'),
      onResetMock: () => this.game.events.emit('mock_reset'),
    });

    // 5. Listen for State Updates from CafeScene & Progression
    this.game.events.on('cat_count_changed', (data: { total: number; max: number }) => {
      this.hud.updateCatCount(data.total, data.max);
    });

    this.game.events.on('bridge_status_changed', (data: { connected: boolean; statusText?: string }) => {
      this.hud.updateStatus(data.connected, data.statusText);
    });

    this.game.events.on('toast_message', (msg: string) => {
      this.hud.showToast(msg);
    });

    this.game.events.on('room_changed', (roomId: RoomId) => {
      this.hud.updateRoom(roomId);
    });

    this.game.events.on('progression_updated', () => {
      this.hud.refreshProgressionData();
    });

    this.game.events.on('toggle_safe_zone', (visible: boolean) => {
      this.hud.setSafeZoneVisible(visible);
    });

    // 6. Streamer Keyboard Shortcuts for quick modal access
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', () => {
        CafeAudioEngine.getInstance().unlock();
      });
      this.input.keyboard.on('keydown-ESC', () => {
        this.streamerModal.toggle();
      });
      this.input.keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
        event.preventDefault();
        this.streamerModal.toggle();
      });
    }
  }
}
