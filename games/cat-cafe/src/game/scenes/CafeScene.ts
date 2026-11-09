import Phaser from 'phaser';
import { CafeSimulation } from '../systems/CafeSimulation';
import { CatManager } from '../systems/CatManager';
import { EffectManager } from '../systems/EffectManager';
import { InteractionController } from '../systems/InteractionController';
import { CafeEventClient } from '../events/CafeEventClient';
import { MockEventHarness } from '../events/MockEventHarness';
import { ParsedCafeCommand } from '../events/CafeCommandAdapter';
import { CAFE_CONFIG, RoomId, TimeOfDay, WeatherType } from '../config/CafeConfig';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { GiftReactionFx } from '../visual-v2';
import { GiftReactionVisuals } from '../cafe-moe-v3';

export class CafeScene extends Phaser.Scene {
  public simulation!: CafeSimulation;
  public catManager!: CatManager;
  public effectManager!: EffectManager;
  public interactionController!: InteractionController;
  public eventClient!: CafeEventClient;
  public mockHarness!: MockEventHarness;
  public giftFx!: GiftReactionFx;
  public v3Visuals!: GiftReactionVisuals;

  private stateBroadcastTimer = 0;

  constructor() {
    super({ key: 'CafeScene' });
  }

  public create(): void {
    const pm = ProgressionManager.getInstance();

    // 1. Initialize Core Systems
    this.simulation = new CafeSimulation(this);
    this.catManager = new CatManager(this);
    this.effectManager = new EffectManager(this);
    this.giftFx = new GiftReactionFx(this);
    this.v3Visuals = new GiftReactionVisuals(this);
    this.interactionController = new InteractionController(
      this,
      this.catManager,
      this.simulation,
      this.effectManager
    );

    // 2. Build Saved Room Environment
    this.simulation.buildRoom(pm.data.settings.activeRoom);

    // 3. Spawn Initial NPCs & Host Cat (PTPlay on top of cat tree)
    this.catManager.initNpcs();
    this.catManager.handleViewerJoin('host_ptplay_0', 'PTPlay 💙');
    const ptplayCat = this.catManager.getCatByViewerId('host_ptplay_0');
    if (ptplayCat) {
      ptplayCat.setPosition(440, 395);
      ptplayCat.takeNap(999999);
    }
    this.notifyCatCount();

    // 4. Hook Progression Callbacks
    pm.onLeveledUp = (ms) => {
      CafeAudioEngine.getInstance().playLevelUp();
      this.effectManager.triggerCafeCelebration(`🎉 LÊN CẤP ${ms.level}: ${ms.titleVi}! 🎉`);
      this.game.events.emit('progression_updated');
    };

    pm.onChallengeCompleted = (ch) => {
      this.game.events.emit('toast_message', `🎯 Hoàn thành thử thách: ${ch.titleVi} (+${ch.rewardPurrs} Purrs)!`);
      this.game.events.emit('progression_updated');
    };

    pm.onPurrsChanged = (_total, gained) => {
      if (gained && gained > 0) {
        CafeAudioEngine.getInstance().playCoinChime();
      }
      this.game.events.emit('progression_updated');
    };

    // 5. Hook Feedback Callback to Toast
    this.interactionController.setFeedbackCallback((msg) => {
      this.game.events.emit('toast_message', msg);
    });

    // 6. Connect to PTPlay LIVE Bridge
    this.eventClient = new CafeEventClient(CAFE_CONFIG.bridgeWsUrl);
    this.mockHarness = new MockEventHarness(this.eventClient);

    this.eventClient.onStatusChange((status) => {
      this.game.events.emit('bridge_status_changed', status);
    });

    this.eventClient.onCommand((cmd: ParsedCafeCommand) => {
      this.handleIncomingCommand(cmd);
    });

    this.eventClient.connect();

    // 7. Event Listeners for UI & Streamer Controls
    this.game.events.on('switch_room', (roomId: RoomId) => {
      this.simulation.buildRoom(roomId);
      this.catManager.repositionForRoom();
      this.game.events.emit('room_changed', roomId);
    });

    this.game.events.on('switch_atmosphere', (data: { time: TimeOfDay; weather: WeatherType }) => {
      this.simulation.applyAtmosphere(data.time, data.weather);
    });

    // Mock Commands from UI
    this.game.events.on('mock_join', () => {
      this.mockHarness.simulateJoin();
      this.notifyCatCount();
    });

    this.game.events.on('mock_feed', () => this.mockHarness.simulateFeed());
    this.game.events.on('mock_play', () => this.mockHarness.simulatePlay());
    this.game.events.on('mock_nap', () => this.mockHarness.simulateNap());
    this.game.events.on('mock_love', () => this.mockHarness.simulateLove());
    this.game.events.on('mock_call', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleCall(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_photo', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handlePhoto(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_garden', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleGarden(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_angry', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleAngry(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_dance', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleDance(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_zoomies', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleZoomies(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_box', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleBox(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_bath', () => {
      const cats = this.catManager.getAllCats();
      if (cats.length > 0) {
        const cat = cats[cats.length - 1];
        this.interactionController.handleBath(cat.viewerId || 'admin', cat.nickname);
      }
    });
    this.game.events.on('mock_rose', () => this.mockHarness.simulateGift('Rose', 1));
    this.game.events.on('mock_heart', () => this.mockHarness.simulateGift('Heart', 1));
    this.game.events.on('mock_universe', () => this.mockHarness.simulateGift('Universe', 1));
    this.game.events.on('mock_lion', () => this.mockHarness.simulateLion());
    this.game.events.on('mock_reset', () => {
      this.catManager.resetAll();
      this.effectManager.clearAll();
      this.simulation.replenishBowls();
      this.notifyCatCount();
      this.game.events.emit('toast_message', '🔄 Đã đặt lại toàn bộ quán mèo!');
    });

    // Whole-cafe ambient reaction events
    this.game.events.on('cafe_party_all_cats', () => {
      const cats = this.catManager.getAllCats();
      cats.forEach((c) => {
        if (c.currentState !== 'sleep') {
          c.becomeParty(4000);
        }
      });
    });

    this.game.events.on('cafe_hail_royal_cat', (royalCat?: any) => {
      const cats = this.catManager.getAllCats();
      cats.forEach((c) => {
        if (c !== royalCat && c.currentState !== 'sleep') {
          if (royalCat) c.turnToward(royalCat.x);
          if (Math.random() < 0.5) c.showLoveReaction();
          else c.becomeParty(3500);
        }
      });
    });

    // Streamer Keyboard Shortcuts
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-M', () => this.game.events.emit('mock_join'));
      this.input.keyboard.on('keydown-F', () => this.game.events.emit('mock_feed'));
      this.input.keyboard.on('keydown-P', () => this.game.events.emit('mock_play'));
      this.input.keyboard.on('keydown-S', () => this.game.events.emit('mock_nap'));
      this.input.keyboard.on('keydown-L', () => this.game.events.emit('mock_love'));
      this.input.keyboard.on('keydown-R', () => this.game.events.emit('mock_rose'));
      this.input.keyboard.on('keydown-H', () => this.game.events.emit('mock_heart'));
      this.input.keyboard.on('keydown-U', () => this.game.events.emit('mock_universe'));
      this.input.keyboard.on('keydown-O', () => this.game.events.emit('mock_lion'));
      this.input.keyboard.on('keydown-C', () => this.game.events.emit('mock_call'));
      this.input.keyboard.on('keydown-A', () => this.game.events.emit('mock_angry'));
      this.input.keyboard.on('keydown-D', () => this.game.events.emit('mock_dance'));
      this.input.keyboard.on('keydown-Z', () => this.game.events.emit('mock_zoomies'));
      this.input.keyboard.on('keydown-B', () => this.game.events.emit('mock_box'));
      this.input.keyboard.on('keydown-T', () => this.game.events.emit('mock_bath'));
    }
  }

  public update(time: number, delta: number): void {
    this.catManager.update(time, delta);

    this.stateBroadcastTimer += delta;
    if (this.stateBroadcastTimer >= 3000) {
      this.stateBroadcastTimer = 0;
      if (this.eventClient.connected) {
        this.eventClient.sendGameState(
          this.catManager.getTotalCatCount(),
          this.catManager.getViewerCount()
        );
      }
    }
  }

  private handleIncomingCommand(cmd: ParsedCafeCommand): void {
    switch (cmd.action) {
      case 'cat_cafe.join':
        this.interactionController.handleJoin(cmd.userId, cmd.nickname);
        this.notifyCatCount();
        break;

      case 'cat_cafe.feed': {
        this.interactionController.handleFeed(cmd.userId, cmd.nickname);
        const cat = this.catManager.getCatByViewerId(cmd.userId);
        if (cat) {
          this.v3Visuals.play('fish_basket', cat, cat.x, cat.y, 1);
        }
        break;
      }

      case 'cat_cafe.play': {
        this.interactionController.handlePlay(cmd.userId, cmd.nickname);
        const cat = this.catManager.getCatByViewerId(cmd.userId);
        if (cat) {
          this.v3Visuals.play('yarn_ball', cat, cat.x, cat.y, 1);
        }
        break;
      }

      case 'cat_cafe.nap':
        this.interactionController.handleNap(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.love': {
        this.interactionController.handleLove(cmd.userId, cmd.nickname);
        const cat = this.catManager.getCatByViewerId(cmd.userId);
        const lx = cat ? cat.x : 270;
        const ly = cat ? cat.y : 480;
        this.v3Visuals.play('heart', cat, lx, ly, 1);
        break;
      }

      case 'cat_cafe.call':
        this.interactionController.handleCall(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.photo':
        this.interactionController.handlePhoto(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.garden':
        this.interactionController.handleGarden(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.angry':
        this.interactionController.handleAngry(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.dance':
        this.interactionController.handleDance(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.zoomies':
        this.interactionController.handleZoomies(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.box':
        this.interactionController.handleBox(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.bath':
        this.interactionController.handleBath(cmd.userId, cmd.nickname);
        break;

      case 'cat_cafe.switch_room': {
        const roomId = (cmd.metadata?.roomId as RoomId) || 'main_cafe';
        this.simulation.buildRoom(roomId);
        this.catManager.repositionForRoom();
        this.game.events.emit('room_changed', roomId);
        this.game.events.emit('toast_message', `🚪 Đã chuyển sang: ${roomId.toUpperCase()}`);
        break;
      }

      case 'cat_cafe.switch_atmosphere': {
        const time = (cmd.metadata?.time as TimeOfDay) || 'day';
        const weather = (cmd.metadata?.weather as WeatherType) || 'sunny';
        this.simulation.applyAtmosphere(time, weather);
        this.game.events.emit('toast_message', `🌤 Không khí: ${time} / ${weather}`);
        break;
      }

      case 'cat_cafe.add_purrs': {
        const amount = Number(cmd.metadata?.amount) || 50;
        ProgressionManager.getInstance().addPurrPoints(amount);
        this.game.events.emit('toast_message', `✨ Thưởng +${amount} Điểm Purr!`);
        break;
      }

      case 'cat_cafe.set_purrs': {
        const amount = Math.max(0, Number(cmd.metadata?.amount) || 0);
        ProgressionManager.getInstance().data.purrPoints = amount;
        ProgressionManager.getInstance().save();
        this.game.events.emit('toast_message', `✨ Điểm Purr: ${amount}`);
        break;
      }

      case 'cat_cafe.set_level': {
        const lvl = Math.min(10, Math.max(1, Number(cmd.metadata?.level) || 1));
        ProgressionManager.getInstance().data.level = lvl;
        ProgressionManager.getInstance().save();
        this.game.events.emit('toast_message', `🌟 Cấp Quán Mèo: Level ${lvl}`);
        break;
      }

      case 'cat_cafe.set_volume': {
        const bgm = cmd.metadata?.bgm !== undefined ? Number(cmd.metadata.bgm) : undefined;
        const sfx = cmd.metadata?.sfx !== undefined ? Number(cmd.metadata.sfx) : undefined;
        const amb = cmd.metadata?.ambience !== undefined ? Number(cmd.metadata.ambience) : undefined;
        const pm = ProgressionManager.getInstance();
        if (bgm !== undefined) pm.data.settings.bgmVolume = bgm;
        if (sfx !== undefined) pm.data.settings.sfxVolume = sfx;
        if (amb !== undefined) pm.data.settings.ambienceVolume = amb;
        pm.save();
        this.game.events.emit('toast_message', '🔊 Đã cập nhật âm lượng');
        break;
      }

      case 'cat_cafe.add_cat': {
        const nick = String(cmd.metadata?.nickname || 'Mèo Yêu VIP');
        const customViewerId = `admin_custom_${Date.now()}`;
        this.interactionController.handleJoin(customViewerId, nick);
        this.notifyCatCount();
        this.game.events.emit('toast_message', `🐾 Đã tạo mèo mới: ${nick}`);
        break;
      }

      case 'cat_cafe.clear_cats': {
        this.catManager.resetAll();
        this.effectManager.clearAll();
        this.notifyCatCount();
        this.game.events.emit('toast_message', '🧹 Đã xóa mèo khách, giữ lại 3 NPC');
        break;
      }

      case 'cat_cafe.gift_effect': {
        const giftName = String(cmd.metadata?.giftName || 'Gift');
        const count = Number(cmd.metadata?.count) || 1;
        this.interactionController.handleGift(cmd.userId, cmd.nickname, giftName, count);
        this.notifyCatCount();

        // High Quality V3 Gift & Cat Animation Spectacle
        const cat = this.catManager.getCatByViewerId(cmd.userId);
        const gx = cat ? cat.x : undefined;
        const gy = cat ? cat.y : undefined;
        const norm = giftName.toLowerCase();
        if (norm.includes('rose') || norm.includes('hoa') || norm.includes('grilled') || norm.includes('cá nướng')) {
          this.v3Visuals.play('rose', cat, gx, gy, count);
        } else if (norm.includes('heart') || norm.includes('tim')) {
          this.v3Visuals.play('heart', cat, gx, gy, count);
        } else if (norm.includes('universe') || norm.includes('vũ trụ')) {
          this.v3Visuals.play('universe', cat, gx, gy, count);
        } else if (norm.includes('lion') || norm.includes('su tu') || norm.includes('sư tử')) {
          this.v3Visuals.play('lion', cat, gx, gy, count);
        } else if (norm.includes('cake') || norm.includes('bánh')) {
          this.v3Visuals.play('cake', cat, gx, gy, count);
        } else if (norm.includes('fish_basket') || norm.includes('giỏ cá') || norm.includes('basket')) {
          this.v3Visuals.play('fish_basket', cat, gx, gy, count);
        } else if (norm.includes('yarn') || norm.includes('len')) {
          this.v3Visuals.play('yarn_ball', cat, gx, gy, count);
        } else if (norm.includes('fireworks') || norm.includes('pháo')) {
          this.v3Visuals.play('fireworks', cat, gx, gy, count);
        } else if (norm.includes('perfume') || norm.includes('nước hoa')) {
          this.v3Visuals.play('perfume', cat, gx, gy, count);
        } else if (norm.includes('ice_cream') || norm.includes('kem')) {
          this.v3Visuals.play('ice_cream', cat, gx, gy, count);
        } else if (norm.includes('coffee') || norm.includes('cà phê')) {
          this.v3Visuals.play('coffee', cat, gx, gy, count);
        } else {
          this.v3Visuals.play('rose', cat, gx, gy, count);
        }
        break;
      }

      case 'cat_cafe.reset':
        this.catManager.resetAll();
        this.effectManager.clearAll();
        this.notifyCatCount();
        break;
    }
  }

  private notifyCatCount(): void {
    this.game.events.emit('cat_count_changed', {
      total: this.catManager.getTotalCatCount(),
      max: CAFE_CONFIG.maxCats,
    });
  }

  public shutdown(): void {
    this.eventClient.disconnect();
    this.catManager.resetAll();
    this.effectManager.clearAll();
    this.giftFx?.destroy();
    this.v3Visuals?.destroy();
  }
}
