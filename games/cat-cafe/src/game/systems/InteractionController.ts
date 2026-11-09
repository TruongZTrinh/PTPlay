import Phaser from 'phaser';
import { CatManager } from './CatManager';
import { CafeSimulation } from './CafeSimulation';
import { EffectManager } from './EffectManager';
import { CAFE_CONFIG } from '../config/CafeConfig';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { TTSController } from './TTSController';

export interface InteractionResponse {
  success: boolean;
  action: string;
  messageVi: string;
}

export class InteractionController {
  private scene: Phaser.Scene;
  private catManager: CatManager;
  private simulation: CafeSimulation;
  private effectManager: EffectManager;
  private onFeedbackCallback?: (msg: string) => void;
  private userCooldowns: Map<string, number> = new Map();

  constructor(
    scene: Phaser.Scene,
    catManager: CatManager,
    simulation: CafeSimulation,
    effectManager: EffectManager
  ) {
    this.scene = scene;
    this.catManager = catManager;
    this.simulation = simulation;
    this.effectManager = effectManager;
  }

  public setFeedbackCallback(cb: (msg: string) => void): void {
    this.onFeedbackCallback = cb;
  }

  private notify(msg: string): void {
    this.onFeedbackCallback?.(msg);
  }

  private isRateLimited(viewerId: string): boolean {
    const last = this.userCooldowns.get(viewerId) || 0;
    const now = Date.now();
    if (now - last < CAFE_CONFIG.userCooldownMs) {
      return true;
    }
    this.userCooldowns.set(viewerId, now);
    return false;
  }

  public handleJoin(viewerId: string, nickname: string): InteractionResponse {
    const result = this.catManager.handleViewerJoin(viewerId, nickname);
    this.notify(result.messageVi);
    if (result.isNew) {
      CafeAudioEngine.getInstance().playDoorbell();
      const coatName = result.cat?.coat?.nameVi;
      TTSController.getInstance().welcomeNewViewer(nickname, coatName);
    } else if (!result.isWaitlisted) {
      TTSController.getInstance().welcomeReturningViewer(nickname);
    }
    return {
      success: !result.isWaitlisted,
      action: 'cat_cafe.join',
      messageVi: result.messageVi,
    };
  }

  public handleFeed(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.feed', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) {
      return { success: false, action: 'cat_cafe.feed', messageVi: 'Thao tác quá nhanh, hãy chờ chút nhé!' };
    }

    const target = this.simulation.getFoodTarget();
    cat.walkTo(target.x, target.y, () => {
      cat.eatFood(() => {
        this.effectManager.spawnSparkles(cat.x, cat.y - 30, 8);
      });
    });

    ProgressionManager.getInstance().trackAction('feed');
    const msg = `🍽️ @${cat.nickname} đang chạy tới bát ăn!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.feed', messageVi: msg };
  }

  public handlePlay(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.play', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) {
      return { success: false, action: 'cat_cafe.play', messageVi: 'Thao tác quá nhanh!' };
    }

    const target = this.simulation.getPlayTarget();
    cat.walkTo(target.x, target.y, () => {
      cat.playWithToy(() => {
        this.effectManager.spawnSparkles(cat.x, cat.y - 20, 10);
      });
    });

    ProgressionManager.getInstance().trackAction('play');
    const msg = `🧶 @${cat.nickname} đang chơi đùa hăng say!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.play', messageVi: msg };
  }

  public handleNap(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.nap', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) {
      return { success: false, action: 'cat_cafe.nap', messageVi: 'Thao tác quá nhanh!' };
    }

    const target = this.simulation.getNapTarget();
    cat.walkTo(target.x, target.y, () => {
      cat.takeNap(12);
    });

    ProgressionManager.getInstance().trackAction('nap');
    const msg = `💤 @${cat.nickname} cuộn tròn đi ngủ thật ngoan.`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.nap', messageVi: msg };
  }

  public handleLove(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      // General audience heart taps (e.g. from TikTok screen tap likes)
      this.effectManager.spawnHeartShower(CAFE_CONFIG.width / 2 + (Math.random() * 200 - 100), 460, 5);
      CafeAudioEngine.getInstance().playHeartPop();
      ProgressionManager.getInstance().trackAction('love');
      const msg = `💖 @${nickname} vừa thả tim cho quán mèo! (Gõ 'MÈO' để nhận mèo riêng nhé🐾)`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.love', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) {
      return { success: false, action: 'cat_cafe.love', messageVi: 'Thao tác quá nhanh!' };
    }

    cat.showLoveReaction();
    this.effectManager.spawnHeartShower(cat.x, cat.y - 20, 12);
    ProgressionManager.getInstance().trackAction('love');

    const msg = `💖 @${cat.nickname} vui sướng được thả tim!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.love', messageVi: msg };
  }

  public handleCall(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.call', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.call', messageVi: 'Chờ chút nhé!' };

    const hostSpot = this.simulation.getHostSpot();
    cat.walkTo(hostSpot.x + (Math.random() * 80 - 40), hostSpot.y, () => {
      cat.callToFront();
    });

    ProgressionManager.getInstance().trackAction('join');
    const msg = `📢 @${cat.nickname} chạy ra chào khán giả!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.call', messageVi: msg };
  }

  public handlePhoto(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.photo', messageVi: msg };
    }

    cat.showEmote('emote_camera', 3000);
    CafeAudioEngine.getInstance().playCameraShutter();

    // Flash screen effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xFFFFFF, 0.45);
    flash.fillRect(0, 0, CAFE_CONFIG.width, CAFE_CONFIG.height);
    flash.setDepth(2500);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 350,
      onComplete: () => flash.destroy(),
    });

    ProgressionManager.getInstance().trackAction('photo');
    const msg = `📸 Tách! Đã chụp một bức ảnh tuyệt đẹp cho @${cat.nickname}!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.photo', messageVi: msg };
  }

  public handleGarden(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.garden', messageVi: msg };
    }

    // If garden is unlocked in progression, switch or give feedback
    const pm = ProgressionManager.getInstance();
    if (!pm.isItemUnlocked('room_garden')) {
      const msg = `🔒 Vườn Mèo sẽ mở khoá khi quán đạt Cấp 3 (hiện tại: Cấp ${pm.data.level})!`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.garden', messageVi: msg };
    }

    cat.showLoveReaction();
    pm.trackAction('garden');
    const msg = `🌿 @${cat.nickname} thích thú dạo chơi ngoài Vườn Mèo!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.garden', messageVi: msg };
  }

  public handleAngry(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.angry', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.angry', messageVi: 'Chờ chút nhé!' };

    cat.becomeAngry();
    TTSController.getInstance().announceAngry(cat.nickname);
    ProgressionManager.getInstance().addPurrPoints(3);

    const msg = `😾 @${cat.nickname} đang giận dỗi tím người kìa! Mau dỗ trẫm đi!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.angry', messageVi: msg };
  }

  public handleDance(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.dance', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.dance', messageVi: 'Chờ chút nhé!' };

    cat.doDance();
    TTSController.getInstance().announceDance(cat.nickname);
    ProgressionManager.getInstance().addPurrPoints(5);

    const msg = `💃 @${cat.nickname} đang bật chế độ quẩy tưng bừng! Nhảy cực sung!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.dance', messageVi: msg };
  }

  public handleZoomies(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.zoomies', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.zoomies', messageVi: 'Chờ chút nhé!' };

    cat.doZoomies();
    TTSController.getInstance().announceZoomies(cat.nickname);
    ProgressionManager.getInstance().addPurrPoints(5);

    const msg = `⚡ @${cat.nickname} bị ngáo ba giờ sáng, phóng bạt mạng không phanh!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.zoomies', messageVi: msg };
  }

  public handleBox(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.box', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.box', messageVi: 'Chờ chút nhé!' };

    cat.hideInBox();
    TTSController.getInstance().announceBox(cat.nickname);
    ProgressionManager.getInstance().addPurrPoints(4);

    const msg = `📦 @${cat.nickname} đã chui tọt vào hộp các-tông ngồi tự kỷ!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.box', messageVi: msg };
  }

  public handleBath(viewerId: string, nickname: string): InteractionResponse {
    const cat = this.catManager.getCatByViewerId(viewerId);
    if (!cat) {
      const msg = `@${nickname} ơi: Gõ 'MÈO' để nhận mèo của bạn trước nhé! 🐾`;
      this.notify(msg);
      return { success: false, action: 'cat_cafe.bath', messageVi: msg };
    }

    if (this.isRateLimited(viewerId)) return { success: false, action: 'cat_cafe.bath', messageVi: 'Chờ chút nhé!' };

    cat.takeBath();
    TTSController.getInstance().announceBath(cat.nickname);
    ProgressionManager.getInstance().addPurrPoints(4);

    const msg = `🧼 @${cat.nickname} đang tắm rửa liếm lông siêu điệu đà, xinh xắn!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.bath', messageVi: msg };
  }

  public handleGift(viewerId: string, nickname: string, giftName: string, count = 1): InteractionResponse {
    const normalizedGift = giftName.toLowerCase().trim();
    let cat = this.catManager.getCatByViewerId(viewerId);

    if (!cat) {
      const joinRes = this.catManager.handleViewerJoin(viewerId, nickname);
      cat = joinRes.cat;
    }

    // Award bonus Purr Points for gifts
    ProgressionManager.getInstance().addPurrPoints(15 * Math.min(count, 10));

    // Announce via Vietnamese TTS
    TTSController.getInstance().announceGift(nickname, giftName, count);

    if (normalizedGift.includes('rose') || normalizedGift.includes('hoa') || normalizedGift.includes('cá') || normalizedGift.includes('fish')) {
      this.simulation.setSpecialFishBowl();
      CafeAudioEngine.getInstance().playSparkleShower();
      if (cat) {
        const target = this.simulation.getFoodTarget();
        cat.walkTo(target.x, target.y, () => {
          cat?.eatFood();
          this.effectManager.spawnSparkles(target.x, target.y, 12);
        });
      }
      this.effectManager.spawnHeartShower(CAFE_CONFIG.width / 2, 400, 10);
      const msg = `🐟 Quà ${giftName} x${count} từ @${nickname}! Thưởng món cá đặc biệt!`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    if (normalizedGift.includes('heart') || normalizedGift.includes('tim')) {
      CafeAudioEngine.getInstance().playHeartPop();
      CafeAudioEngine.getInstance().playSparkleShower();
      this.effectManager.spawnHeartShower(CAFE_CONFIG.width / 2, 450, 16);
      if (cat) cat.showLoveReaction();
      const msg = `💖 Cơn mưa tim từ @${nickname}! Toàn quán mèo ngập tràn tình yêu!`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    if (normalizedGift.includes('lion') || normalizedGift.includes('su tu') || normalizedGift.includes('sư tử')) {
      CafeAudioEngine.getInstance().playLevelUp();
      CafeAudioEngine.getInstance().playSparkleShower();
      this.effectManager.triggerCafeCelebration(`🦁 ĐẠI LỄ HOÀNG GIA: @${nickname} TẶNG LION! 👑`);
      if (cat) cat.becomeRoyal(8500);
      const msg = `👑 @${nickname} tặng LION x${count}! Mèo đăng quang Vua Hoàng Gia! 🦁`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    if (normalizedGift.includes('cake') || normalizedGift.includes('bánh')) {
      CafeAudioEngine.getInstance().playLevelUp();
      CafeAudioEngine.getInstance().playSparkleShower();
      if (cat) cat.eatFood();
      const msg = `🎂 Quà Bánh Kem x${count} từ @${nickname}! Cả quán mèo ăn tiệc ngọt ngào!`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    if (normalizedGift.includes('yarn') || normalizedGift.includes('len')) {
      CafeAudioEngine.getInstance().playYarnJingle();
      if (cat) cat.playWithToy();
      const msg = `🧶 Quà Cuộn Len x${count} từ @${nickname}! Bé mèo đùa nghịch tưng bừng!`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    if (normalizedGift.includes('fireworks') || normalizedGift.includes('pháo')) {
      CafeAudioEngine.getInstance().playLevelUp();
      CafeAudioEngine.getInstance().playSparkleShower();
      this.effectManager.triggerCafeCelebration(`🎆 PHÁO HOA RỰC RỠ TỪ @${nickname}! ✨`);
      if (cat) cat.becomeParty(4000);
      const msg = `🎆 @${nickname} tặng Pháo Hoa x${count}! Rực sáng cả quán mèo!`;
      this.notify(msg);
      return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
    }

    this.effectManager.triggerCafeCelebration(`✨ Quà ${giftName} x${count} từ @${nickname}! ✨`);
    CafeAudioEngine.getInstance().playSparkleShower();
    CafeAudioEngine.getInstance().playLevelUp();
    if (cat) cat.showLoveReaction();
    const msg = `🎉 @${nickname} tặng ${giftName} x${count}! Cả quán mèo mở tiệc!`;
    this.notify(msg);
    return { success: true, action: 'cat_cafe.gift_effect', messageVi: msg };
  }
}
