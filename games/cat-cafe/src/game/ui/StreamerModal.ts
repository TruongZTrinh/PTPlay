import Phaser from 'phaser';
import { CAFE_CONFIG, RoomId, TimeOfDay, WeatherType, COAT_VARIANTS, SESSION_CHALLENGES } from '../config/CafeConfig';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CafeAudioEngine } from '../audio/CafeAudioEngine';
import { TTSController } from '../systems/TTSController';

export class StreamerModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private isVisible = false;
  private currentTab: 'rooms' | 'progression' | 'audio' | 'save' = 'rooms';

  // Modal Content Container
  private contentContainer: Phaser.GameObjects.Container;
  private tabButtons: Map<string, Phaser.GameObjects.Container> = new Map();

  // Callbacks
  private onRoomChange?: (room: RoomId) => void;
  private onAtmosphereChange?: (time: TimeOfDay, weather: WeatherType) => void;

  constructor(
    scene: Phaser.Scene,
    onRoomChange?: (room: RoomId) => void,
    onAtmosphereChange?: (time: TimeOfDay, weather: WeatherType) => void
  ) {
    this.scene = scene;
    this.onRoomChange = onRoomChange;
    this.onAtmosphereChange = onAtmosphereChange;

    const { width, height } = CAFE_CONFIG;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(3000);
    this.container.setVisible(false);

    // Dimmed Backdrop
    const backdrop = scene.add.graphics();
    backdrop.fillStyle(0x000000, 0.75);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    backdrop.on('pointerdown', () => this.hide());
    this.container.add(backdrop);

    // Main Modal Dialog Card
    const cardW = width - 40;
    const cardH = 680;
    const cardX = 20;
    const cardY = 120;

    const card = scene.add.graphics();
    card.fillStyle(0x0B1528, 0.96);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 20);
    card.lineStyle(2, 0x0066FF, 0.9);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 20);
    this.container.add(card);

    // Header
    const title = scene.add.text(cardX + 24, cardY + 20, '⚙️ BẢNG ĐIỀU KHIỂN CAFÉ MÒE', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.container.add(title);

    // Close 'X' Button
    const closeBtn = scene.add.text(cardX + cardW - 36, cardY + 16, '✕', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#94A3B8',
    });
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Tab Navigation Bar
    const tabs = [
      { id: 'rooms', label: '🌿 Không Gian' },
      { id: 'progression', label: '🏆 Tiến Trình' },
      { id: 'audio', label: '🔊 Âm Thanh' },
      { id: 'save', label: '💾 Lưu Trữ' },
    ];

    const tabW = (cardW - 32) / tabs.length;
    tabs.forEach((t, i) => {
      const tx = cardX + 16 + i * tabW;
      const ty = cardY + 54;
      const tContainer = scene.add.container(tx, ty);

      const tBg = scene.add.graphics();
      tContainer.add(tBg);

      const tTxt = scene.add.text(tabW / 2, 14, t.label, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      });
      tTxt.setOrigin(0.5, 0.5);
      tContainer.add(tTxt);

      const hit = scene.add.zone(tabW / 2, 14, tabW, 28);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.switchTab(t.id as any));
      tContainer.add(hit);

      this.tabButtons.set(t.id, tContainer);
      this.container.add(tContainer);
    });

    // Content Container
    this.contentContainer = scene.add.container(cardX + 16, cardY + 95);
    this.container.add(this.contentContainer);

    this.renderTabs();
  }

  private switchTab(tab: 'rooms' | 'progression' | 'audio' | 'save'): void {
    CafeAudioEngine.getInstance().playButtonClick();
    this.currentTab = tab;
    this.renderTabs();
  }

  private renderTabs(): void {
    const cardW = CAFE_CONFIG.width - 72;
    const tabW = cardW / 4;

    // Redraw tab buttons
    for (const [id, btn] of this.tabButtons.entries()) {
      const g = btn.getAt(0) as Phaser.GameObjects.Graphics;
      const isSel = id === this.currentTab;
      g.clear();
      g.fillStyle(isSel ? 0x0066FF : 0x1E293B, 1);
      g.fillRoundedRect(0, 0, tabW - 4, 28, 6);
    }

    this.contentContainer.removeAll(true);

    if (this.currentTab === 'rooms') {
      this.renderRoomsTab();
    } else if (this.currentTab === 'progression') {
      this.renderProgressionTab();
    } else if (this.currentTab === 'audio') {
      this.renderAudioTab();
    } else if (this.currentTab === 'save') {
      this.renderSaveTab();
    }
  }

  // --- TAB 1: ROOMS & WEATHER ---
  private renderRoomsTab(): void {
    const pm = ProgressionManager.getInstance();
    const curRoom = pm.data.settings.activeRoom;
    const curTime = pm.data.settings.timeOfDay;
    const curWeather = pm.data.settings.weather;

    let y = 10;
    // 1. Room Switcher
    const roomTitle = this.scene.add.text(0, y, '1. Chọn Phòng Hoạt Động:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(roomTitle);
    y += 24;

    const rooms: Array<{ id: RoomId; name: string; reqLevel: number; icon: string }> = [
      { id: 'cafe', name: 'Quán Chính', reqLevel: 1, icon: '☕' },
      { id: 'garden', name: 'Vườn Mèo', reqLevel: 3, icon: '🌿' },
      { id: 'loft', name: 'Gác Ngủ Lofi', reqLevel: 5, icon: '🌙' },
    ];

    rooms.forEach((r, idx) => {
      const isUnlocked = pm.data.level >= r.reqLevel;
      const isCurrent = curRoom === r.id;

      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(isCurrent ? 0x059669 : isUnlocked ? 0x1E293B : 0x334155, 1);
      btnBg.fillRoundedRect(idx * 154, y, 146, 50, 8);
      btnBg.lineStyle(1.5, isCurrent ? 0x34D399 : 0x475569, 1);
      btnBg.strokeRoundedRect(idx * 154, y, 146, 50, 8);
      this.contentContainer.add(btnBg);

      const label = this.scene.add.text(idx * 154 + 12, y + 8, `${r.icon} ${r.name}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: isUnlocked ? '#FFFFFF' : '#94A3B8',
      });
      this.contentContainer.add(label);

      const sub = this.scene.add.text(idx * 154 + 12, y + 28, isUnlocked ? (isCurrent ? '• Đang chọn' : 'Nhấp chuyển') : `Mở ở Cấp ${r.reqLevel}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        color: isCurrent ? '#A7F3D0' : '#CBD5E1',
      });
      this.contentContainer.add(sub);

      if (isUnlocked) {
        const zone = this.scene.add.zone(idx * 154 + 73, y + 25, 146, 50);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          this.onRoomChange?.(r.id);
          this.renderRoomsTab();
        });
        this.contentContainer.add(zone);
      }
    });

    y += 75;

    // 2. Weather Preset
    const weatherTitle = this.scene.add.text(0, y, '2. Thời Tiết & Khí Hậu:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(weatherTitle);
    y += 24;

    const weathers: Array<{ id: WeatherType; name: string; icon: string }> = [
      { id: 'sunny', name: 'Nắng Ấm Áp', icon: '☀️' },
      { id: 'rainy', name: 'Mưa Rào Chill', icon: '🌧️' },
      { id: 'cozy', name: 'Thư Giãn Mát Mẻ', icon: '🍃' },
    ];

    weathers.forEach((w, idx) => {
      const isCurrent = curWeather === w.id;
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(isCurrent ? 0x2563EB : 0x1E293B, 1);
      btnBg.fillRoundedRect(idx * 154, y, 146, 44, 8);
      btnBg.lineStyle(1.5, isCurrent ? 0x60A5FA : 0x475569, 1);
      btnBg.strokeRoundedRect(idx * 154, y, 146, 44, 8);
      this.contentContainer.add(btnBg);

      const label = this.scene.add.text(idx * 154 + 12, y + 14, `${w.icon} ${w.name}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      });
      this.contentContainer.add(label);

      const zone = this.scene.add.zone(idx * 154 + 73, y + 22, 146, 44);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.onAtmosphereChange?.(curTime, w.id);
        this.renderRoomsTab();
      });
      this.contentContainer.add(zone);
    });

    y += 65;

    // 3. Time of Day
    const timeTitle = this.scene.add.text(0, y, '3. Khung Giờ Trong Ngày:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(timeTitle);
    y += 24;

    const times: Array<{ id: TimeOfDay; name: string; icon: string }> = [
      { id: 'day', name: 'Ban Ngày', icon: '🌤️' },
      { id: 'sunset', name: 'Hoàng Hôn', icon: '🌇' },
      { id: 'night', name: 'Đêm Ấm', icon: '🌃' },
    ];

    times.forEach((t, idx) => {
      const isCurrent = curTime === t.id;
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(isCurrent ? 0x7C3AED : 0x1E293B, 1);
      btnBg.fillRoundedRect(idx * 154, y, 146, 44, 8);
      btnBg.lineStyle(1.5, isCurrent ? 0xA78BFA : 0x475569, 1);
      btnBg.strokeRoundedRect(idx * 154, y, 146, 44, 8);
      this.contentContainer.add(btnBg);

      const label = this.scene.add.text(idx * 154 + 12, y + 14, `${t.icon} ${t.name}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      });
      this.contentContainer.add(label);

      const zone = this.scene.add.zone(idx * 154 + 73, y + 22, 146, 44);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.onAtmosphereChange?.(t.id, curWeather);
        this.renderRoomsTab();
      });
      this.contentContainer.add(zone);
    });
  }

  // --- TAB 2: PROGRESSION, CHALLENGES & ALBUM ---
  private renderProgressionTab(): void {
    const pm = ProgressionManager.getInstance();
    const curLevel = pm.getCurrentMilestone();
    const nextLevel = pm.getNextMilestone();

    let y = 10;
    // Current Level Card
    const lvlCard = this.scene.add.graphics();
    lvlCard.fillStyle(0x1E293B, 0.9);
    lvlCard.fillRoundedRect(0, y, 460, 72, 10);
    lvlCard.lineStyle(1.5, 0xF59E0B, 0.8);
    lvlCard.strokeRoundedRect(0, y, 460, 72, 10);
    this.contentContainer.add(lvlCard);

    const lvlText = this.scene.add.text(14, y + 12, `CẤP ĐỘ QUÁN: CẤP ${pm.data.level} — ${curLevel.titleVi}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(lvlText);

    const purrText = this.scene.add.text(14, y + 36, `Điểm Hài Lòng (Purr Points): ${pm.data.purrPoints} điểm`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#93C5FD',
    });
    this.contentContainer.add(purrText);

    if (nextLevel) {
      const nextTxt = this.scene.add.text(14, y + 52, `Cấp tiếp theo: ${nextLevel.requiredPurrs} điểm (${nextLevel.rewardVi})`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#6EE7B7',
      });
      this.contentContainer.add(nextTxt);
    }

    y += 88;

    // Challenges Header
    const chTitle = this.scene.add.text(0, y, '📋 Thử Thách Livestream Hôm Nay:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(chTitle);
    y += 22;

    // Show top 4 active challenges
    SESSION_CHALLENGES.slice(0, 4).forEach((ch) => {
      const prog = pm.data.challengeProgress[ch.id] || 0;
      const isDone = pm.data.completedChallenges.includes(ch.id);

      const chBg = this.scene.add.graphics();
      chBg.fillStyle(isDone ? 0x064E3B : 0x111827, 0.85);
      chBg.fillRoundedRect(0, y, 460, 40, 6);
      chBg.lineStyle(1, isDone ? 0x10B981 : 0x374151, 1);
      chBg.strokeRoundedRect(0, y, 460, 40, 6);
      this.contentContainer.add(chBg);

      const t = this.scene.add.text(12, y + 6, `${isDone ? '✅' : '⏳'} ${ch.titleVi} — ${ch.descVi}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: isDone ? '#6EE7B7' : '#FFFFFF',
      });
      this.contentContainer.add(t);

      const sub = this.scene.add.text(12, y + 22, `Tiến độ: ${prog}/${ch.targetCount} lượt | Thưởng: +${ch.rewardPurrs} Purrs`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#94A3B8',
      });
      this.contentContainer.add(sub);
      y += 46;
    });

    y += 10;
    // Album Breeds Discovered
    const albumTitle = this.scene.add.text(0, y, `🐾 Bộ Sưu Tập Mèo Đã Gặp: ${pm.data.discoveredBreeds.length}/8 Giống`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(albumTitle);
    y += 24;

    COAT_VARIANTS.forEach((c, idx) => {
      const found = pm.data.discoveredBreeds.includes(c.id);
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const bx = col * 116;
      const by = y + row * 46;

      const badge = this.scene.add.graphics();
      badge.fillStyle(found ? 0x1E293B : 0x0F172A, 1);
      badge.fillRoundedRect(bx, by, 110, 40, 6);
      badge.lineStyle(1.5, found ? c.primaryColor : 0x334155, 1);
      badge.strokeRoundedRect(bx, by, 110, 40, 6);
      this.contentContainer.add(badge);

      const name = this.scene.add.text(bx + 8, by + 6, found ? c.nameVi : '??? Mèo Ẩn', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: found ? '#FFFFFF' : '#64748B',
      });
      this.contentContainer.add(name);

      const state = this.scene.add.text(bx + 8, by + 22, found ? '✓ Đã mở khoá' : 'Chưa gặp', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '9px',
        color: found ? '#34D399' : '#64748B',
      });
      this.contentContainer.add(state);
    });
  }

  // --- TAB 3: AUDIO & DISPLAY SETTINGS ---
  private renderAudioTab(): void {
    const pm = ProgressionManager.getInstance();
    const s = pm.data.settings;

    let y = 10;
    const title = this.scene.add.text(0, y, '🔊 Cài Đặt Âm Lượng & Hiển Thị Stream:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(title);
    y += 30;

    // BGM Slider Simulation
    this.createVolumeRow('Nhạc Nền (BGM)', s.bgmVolume, y, (val) => {
      s.bgmVolume = val;
      CafeAudioEngine.getInstance().applySettings();
      pm.save();
    });
    y += 54;

    // SFX Slider Simulation
    this.createVolumeRow('Hiệu Ứng (SFX Mèo)', s.sfxVolume, y, (val) => {
      s.sfxVolume = val;
      CafeAudioEngine.getInstance().applySettings();
      pm.save();
    });
    y += 54;

    // Ambience Slider Simulation
    this.createVolumeRow('Môi Trường (Mưa/Gió)', s.ambienceVolume, y, (val) => {
      s.ambienceVolume = val;
      CafeAudioEngine.getInstance().applySettings();
      pm.save();
    });
    y += 58;

    // Test Sounds Section
    const testTitle = this.scene.add.text(0, y, 'Bàn Thử Nghiệm 12 Âm Thanh Mèo & Hiệu Ứng Thực Tế:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(testTitle);
    y += 24;

    const testButtons = [
      { label: '🐱 Meo Thật', fn: () => CafeAudioEngine.getInstance().playMeow() },
      { label: '🦁 Rừ Rừ Thật', fn: () => CafeAudioEngine.getInstance().playPurr() },
      { label: '🌸 Chào Trill', fn: () => CafeAudioEngine.getInstance().playHappyTrill() },
      { label: '💤 Mèo Ngủ Khò', fn: () => CafeAudioEngine.getInstance().playCuteYawn() },
      { label: '🐟 Nhai Cá', fn: () => CafeAudioEngine.getInstance().playMunch() },
      { label: '🥣 Bát Ăn Sứ', fn: () => CafeAudioEngine.getInstance().playBowlClink() },
      { label: '🧶 Chuông Chơi', fn: () => CafeAudioEngine.getInstance().playYarnJingle() },
      { label: '🪵 Cào Móng', fn: () => CafeAudioEngine.getInstance().playScratch() },
      { label: '💖 Nổ Bóng Tim', fn: () => CafeAudioEngine.getInstance().playHeartPop() },
      { label: '✨ Quà Lấp Lánh', fn: () => CafeAudioEngine.getInstance().playSparkleShower() },
      { label: '🔔 Chuông Cửa', fn: () => CafeAudioEngine.getInstance().playDoorbell() },
      { label: '🗣️ TTS Chào Mừng', fn: () => TTSController.getInstance().welcomeNewViewer('KhánGiảVIP', 'Mèo Vàng Cam') },
    ];

    testButtons.forEach((btn, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const bx = col * 115;
      const by = y + row * 34;

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x0284C7, 0.95);
      bg.fillRoundedRect(bx, by, 108, 28, 6);
      bg.lineStyle(1.2, 0x38BDF8, 0.8);
      bg.strokeRoundedRect(bx, by, 108, 28, 6);
      this.contentContainer.add(bg);

      const label = this.scene.add.text(bx + 54, by + 14, btn.label, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      });
      label.setOrigin(0.5, 0.5);
      this.contentContainer.add(label);

      const zone = this.scene.add.zone(bx + 54, by + 14, 108, 28);
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        CafeAudioEngine.getInstance().unlock();
        btn.fn();
      });
      this.contentContainer.add(zone);
    });
    y += 114;

    // Streamer Overlays
    const overlayTitle = this.scene.add.text(0, y, 'Tùy Chọn Màn Hình Livestream:', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(overlayTitle);
    y += 28;

    // Safe Zone Toggle Button
    const szBtn = this.scene.add.graphics();
    szBtn.fillStyle(s.safeZoneVisible ? 0x059669 : 0x1E293B, 1);
    szBtn.fillRoundedRect(0, y, 220, 40, 8);
    szBtn.lineStyle(1.5, s.safeZoneVisible ? 0x34D399 : 0x475569, 1);
    szBtn.strokeRoundedRect(0, y, 220, 40, 8);
    this.contentContainer.add(szBtn);

    const szText = this.scene.add.text(16, y + 12, `Khung An Toàn TikTok: ${s.safeZoneVisible ? 'BẬT' : 'TẮT'}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    this.contentContainer.add(szText);

    const szZone = this.scene.add.zone(110, y + 20, 220, 40);
    szZone.setInteractive({ useHandCursor: true });
    szZone.on('pointerdown', () => {
      s.safeZoneVisible = !s.safeZoneVisible;
      pm.save();
      this.scene.game.events.emit('toggle_safe_zone', s.safeZoneVisible);
      this.renderAudioTab();
    });
    this.contentContainer.add(szZone);

    // TTS Welcoming Toggle Button
    const isTtsOn = TTSController.getInstance().getEnabled();
    const ttsBtn = this.scene.add.graphics();
    ttsBtn.fillStyle(isTtsOn ? 0x059669 : 0x1E293B, 1);
    ttsBtn.fillRoundedRect(230, y, 220, 40, 8);
    ttsBtn.lineStyle(1.5, isTtsOn ? 0x34D399 : 0x475569, 1);
    ttsBtn.strokeRoundedRect(230, y, 220, 40, 8);
    this.contentContainer.add(ttsBtn);

    const ttsText = this.scene.add.text(246, y + 12, `TTS Chào Mừng: ${isTtsOn ? 'BẬT' : 'TẮT'}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    this.contentContainer.add(ttsText);

    const ttsZone = this.scene.add.zone(340, y + 20, 220, 40);
    ttsZone.setInteractive({ useHandCursor: true });
    ttsZone.on('pointerdown', () => {
      TTSController.getInstance().setEnabled(!isTtsOn);
      this.renderAudioTab();
    });
    this.contentContainer.add(ttsZone);
  }

  private createVolumeRow(label: string, curVal: number, y: number, onChange: (val: number) => void): void {
    const txt = this.scene.add.text(0, y, `${label}: ${Math.round(curVal * 100)}%`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#FFFFFF',
    });
    this.contentContainer.add(txt);

    // Preset volume buttons: 0%, 30%, 60%, 100%
    const levels = [0, 0.3, 0.6, 1.0];
    levels.forEach((lvl, i) => {
      const isSel = Math.abs(curVal - lvl) < 0.1;
      const bx = 220 + i * 58;

      const bg = this.scene.add.graphics();
      bg.fillStyle(isSel ? 0x0066FF : 0x1E293B, 1);
      bg.fillRoundedRect(bx, y - 4, 52, 26, 6);
      bg.lineStyle(1, isSel ? 0x60A5FA : 0x475569, 1);
      bg.strokeRoundedRect(bx, y - 4, 52, 26, 6);
      this.contentContainer.add(bg);

      const l = this.scene.add.text(bx + 26, y + 9, `${Math.round(lvl * 100)}%`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '10px',
        color: '#FFFFFF',
      });
      l.setOrigin(0.5, 0.5);
      this.contentContainer.add(l);

      const z = this.scene.add.zone(bx + 26, y + 9, 52, 26);
      z.setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        onChange(lvl);
        this.renderAudioTab();
      });
      this.contentContainer.add(z);
    });
  }

  // --- TAB 4: SAVE, EXPORT & RESET ---
  private renderSaveTab(): void {
    const pm = ProgressionManager.getInstance();

    let y = 10;
    const title = this.scene.add.text(0, y, '💾 Quản Lý Dữ Liệu & Sao Lưu (Cloud / Local Save):', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    this.contentContainer.add(title);
    y += 30;

    const info = this.scene.add.text(0, y, `Thời điểm lưu gần nhất: ${new Date(pm.data.lastSavedAt).toLocaleString()}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      color: '#94A3B8',
    });
    this.contentContainer.add(info);
    y += 35;

    // Export Button
    const expBg = this.scene.add.graphics();
    expBg.fillStyle(0x059669, 1);
    expBg.fillRoundedRect(0, y, 220, 44, 8);
    this.contentContainer.add(expBg);

    const expText = this.scene.add.text(110, y + 22, '📥 Xuất Dữ Liệu (Copy JSON)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    expText.setOrigin(0.5, 0.5);
    this.contentContainer.add(expText);

    const expZone = this.scene.add.zone(110, y + 22, 220, 44);
    expZone.setInteractive({ useHandCursor: true });
    expZone.on('pointerdown', () => {
      const jsonStr = pm.exportJson();
      navigator.clipboard?.writeText(jsonStr);
      this.scene.game.events.emit('toast_message', '📋 Đã sao chép file JSON lưu trữ vào bộ nhớ tạm!');
    });
    this.contentContainer.add(expZone);

    // Reset Button
    const rstBg = this.scene.add.graphics();
    rstBg.fillStyle(0xDC2626, 1);
    rstBg.fillRoundedRect(240, y, 210, 44, 8);
    this.contentContainer.add(rstBg);

    const rstText = this.scene.add.text(345, y + 22, '🔄 Đặt Lại Từ Đầu (Reset)', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    rstText.setOrigin(0.5, 0.5);
    this.contentContainer.add(rstText);

    const rstZone = this.scene.add.zone(345, y + 22, 210, 44);
    rstZone.setInteractive({ useHandCursor: true });
    rstZone.on('pointerdown', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình Quán Mèo về Cấp 1 không?')) {
        pm.resetAll();
        this.scene.game.events.emit('toast_message', '🔄 Đã đặt lại dữ liệu quán mèo về ban đầu!');
        this.hide();
        window.location.reload();
      }
    });
    this.contentContainer.add(rstZone);
  }

  public show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    this.renderTabs();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
  }

  public toggle(): void {
    if (this.isVisible) this.hide();
    else this.show();
  }
}

