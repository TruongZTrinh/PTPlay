import Phaser from 'phaser';
import { GAME_CONFIG, Team, UnitType } from '../config/GameConfig';
import { Unit } from '../entities/Unit';
import { AudioManager } from '../audio/AudioManager';
import { EffectsManager } from '../effects/EffectsManager';
import { UIManager } from '../ui/UIManager';
import { RoundManager } from './RoundManager';
import { SpawnSystem } from './SpawnSystem';
import { CombatSystem } from './CombatSystem';
import { UnitAI } from './UnitAI';
import { GameEventClient, GameCommandMessage } from '../events/GameEventClient';
import { TTSController } from './TTSController';

export class BattleManager {
  private scene: Phaser.Scene;

  // Subsystems
  public audio: AudioManager;
  public tts: TTSController;
  public effects: EffectsManager;
  public ui: UIManager;
  public roundManager: RoundManager;
  public spawnSystem: SpawnSystem;
  public combatSystem: CombatSystem;
  public eventClient: GameEventClient;

  // Units
  private units: Unit[] = [];
  private activeBoss: Unit | null = null;
  private stateBroadcastTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audio = new AudioManager();
    this.tts = new TTSController(this.audio);
    this.effects = new EffectsManager(scene);
    this.ui = new UIManager(scene);
    this.roundManager = new RoundManager();

    this.spawnSystem = new SpawnSystem(scene, this.audio, this.effects, (unit) => {
      this.units.push(unit);
      if (unit.isBoss) {
        this.activeBoss = unit;
      }
    });

    this.combatSystem = new CombatSystem(
      this.audio,
      this.effects,
      (killerTeam, victim) => {
        this.roundManager.recordKill(killerTeam);
        if (victim === this.activeBoss) {
          const bossName = victim.team === 'red' ? GAME_CONFIG.BOSSES.red.vietnameseName : GAME_CONFIG.BOSSES.blue.vietnameseName;
          this.tts.announceBossDefeated(bossName, killerTeam);
          this.activeBoss = null;
        }
      },
      (breachingTeam, damage) => {
        const targetTeam = breachingTeam === 'red' ? 'blue' : 'red';
        this.roundManager.damageCore(targetTeam, damage);
        this.tts.announceCoreBreach(targetTeam);
      }
    );

    this.eventClient = new GameEventClient();
    this.eventClient.setStatusCallback((connected) => {
      this.ui.setBridgeStatus(connected);
    });
    this.eventClient.onCommand((cmd) => {
      this.handleIncomingCommand(cmd);
    });
  }

  public init(): void {
    const currentTheme = this.roundManager.getThemeDef();

    this.ui.createUI(currentTheme, () => {
      this.audio.unlock();
      this.audio.summonUnit();
      this.startRound(false);
    });

    this.effects.setupAmbientParticles(currentTheme);
    this.eventClient.connect();

    // Background music beat ticker
    this.scene.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        if (this.roundManager.phase === 'BATTLE') {
          this.audio.tickMusic();
        }
      },
    });

    this.updateHud();
  }

  public startRound(increment: boolean): void {
    // Clear old units & effects
    for (const u of this.units) {
      u.destroy();
    }
    this.units = [];
    this.activeBoss = null;
    this.effects.clear();

    this.roundManager.startRound(increment);
    const theme = this.roundManager.getThemeDef();

    this.ui.drawBackground(theme);
    this.ui.drawBattlefield(theme);
    this.effects.setupAmbientParticles(theme);
    this.ui.showRoundIntro(this.roundManager.round, theme.vietnameseName);
    this.tts.announceMatchStart(this.roundManager.round);

    // Initial deployment: 2 warriors per lane for each team after intro
    this.scene.time.delayedCall(800, () => {
      for (let lane = 0; lane < GAME_CONFIG.LANES.length; lane++) {
        this.spawnSystem.spawnUnit('red', 'warrior', lane);
        this.spawnSystem.spawnUnit('blue', 'warrior', lane);
      }
      this.roundManager.beginBattle();
      this.ui.clearAllOverlays();
      this.ui.showAnnouncement(`VÒNG ${this.roundManager.round} · CHIẾN ĐẤU!`, GAME_CONFIG.COLORS.GOLD);
    });

    this.updateHud();
  }

  public togglePause(): void {
    const newPhase = this.roundManager.togglePause();
    if (newPhase === 'PAUSED') {
      this.ui.showAnnouncement('TRẬN ĐẤU TẠM DỪNG', GAME_CONFIG.COLORS.GOLD);
    } else if (newPhase === 'BATTLE') {
      this.ui.showAnnouncement('TRẬN ĐẤU TIẾP TỤC!', GAME_CONFIG.COLORS.GOLD);
    }
  }

  public handleIncomingCommand(cmd: GameCommandMessage): void {
    console.log('[BattleManager] Handling Command:', cmd.action, cmd);

    switch (cmd.action) {
      case 'start_round':
        this.startRound(false);
        break;

      case 'pause_round':
        this.roundManager.pause();
        this.ui.showAnnouncement('ĐÃ TẠM DỪNG', GAME_CONFIG.COLORS.GOLD);
        break;

      case 'resume_round':
        this.roundManager.resume();
        this.ui.showAnnouncement('TIẾP TỤC CHIẾN ĐẤU!', GAME_CONFIG.COLORS.GOLD);
        break;

      case 'reset_round':
        this.startRound(false);
        break;

      case 'join_team':
        if (cmd.user && cmd.team) {
          const teamName = cmd.team === 'red' ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
          this.roundManager.recordSupporter(cmd.user.nickname, cmd.team, 'Gia nhập đội');
          this.ui.showViewerTicker(`🎉 [${cmd.user.nickname}] vừa tham gia ${teamName}!`);
          this.tts.announceTeamJoin(cmd.user.nickname, cmd.team);
        }
        break;

      case 'spawn_unit':
        if (cmd.team) {
          const type = cmd.unitType || 'warrior';
          const count = Math.min(20, Math.max(1, cmd.count || 1));
          const nick = cmd.user?.nickname;
          const customLane = cmd.metadata?.lane !== undefined ? Number(cmd.metadata.lane) : -1;

          for (let i = 0; i < count; i++) {
            const lane = customLane >= 0 && customLane < GAME_CONFIG.LANES.length ? customLane : Phaser.Math.Between(0, GAME_CONFIG.LANES.length - 1);
            this.spawnSystem.spawnUnit(cmd.team, type, lane, nick);
          }

          if (nick) {
            const teamCol = cmd.team === 'red' ? 'ĐỎ' : 'XANH';
            const unitDef = GAME_CONFIG.UNITS[type];
            this.roundManager.recordSupporter(nick, cmd.team, `Triệu hồi ${count} ${unitDef.name}`);
            this.ui.showViewerTicker(`🎁 [${nick}] gọi ${count} ${unitDef.name} cho ĐỘI ${teamCol}!`);
            this.tts.announceSummon(cmd.team, unitDef.name, count, nick);
          }
        }
        break;

      case 'spawn_boss':
        if (cmd.team) {
          const nick = cmd.user?.nickname;
          const lane = 1; // Middle lane for epic boss clash
          const boss = this.spawnSystem.spawnUnit(cmd.team, 'boss', lane, nick);
          this.activeBoss = boss;

          const bossTitle = cmd.team === 'red' ? GAME_CONFIG.BOSSES.red.vietnameseName : GAME_CONFIG.BOSSES.blue.vietnameseName;
          this.ui.showAnnouncement(`⚡ ${bossTitle.toUpperCase()} XUẤT TRẬN! ⚡`, cmd.team === 'red' ? GAME_CONFIG.COLORS.RED_PRIMARY : GAME_CONFIG.COLORS.BLUE_PRIMARY);
          if (nick) {
            this.roundManager.recordSupporter(nick, cmd.team, `Triệu hồi ${bossTitle}`);
            this.ui.showViewerTicker(`👑 [${nick}] TRIỆU HỒI ${bossTitle.toUpperCase()}!`);
          }
          this.tts.announceBossSpawn(cmd.team, bossTitle, nick);
        }
        break;

      case 'heal_team':
        if (cmd.team) {
          const amount = cmd.amount || 200;
          this.roundManager.healCore(cmd.team, amount);
          this.audio.heal();
          const teamCol = cmd.team === 'red' ? 'ĐỎ' : 'XANH';
          if (cmd.user?.nickname) {
            this.roundManager.recordSupporter(cmd.user.nickname, cmd.team, `Hồi +${amount} HP thành trì`);
            this.tts.announceHeal(cmd.user.nickname, cmd.team, amount);
          }
          this.ui.showAnnouncement(`+${amount} HP THÀNH TRÌ ${teamCol}!`, GAME_CONFIG.COLORS.GOLD);
        }
        break;

      case 'boost_team':
        if (cmd.team) {
          this.audio.boost();
          for (const u of this.units) {
            if (u.alive && u.team === cmd.team) {
              u.speed *= 1.25;
              u.damage += 5;
            }
          }
          const teamName = cmd.team === 'red' ? 'ĐỘI ĐỎ' : 'ĐỘI XANH';
          if (cmd.user?.nickname) {
            this.roundManager.recordSupporter(cmd.user.nickname, cmd.team, 'Cổ vũ tinh thần');
            this.ui.showViewerTicker(`🔥 [${cmd.user.nickname}] CỔ VŨ NHIỆT LIỆT CHO ${teamName}!`);
            this.tts.announceBoost(cmd.user.nickname, cmd.team);
          }
          this.ui.showAnnouncement(`⚡ TĂNG TỐC & SÁT THƯƠNG ĐỘI ${cmd.team.toUpperCase()}! ⚡`, GAME_CONFIG.COLORS.GOLD);
        }
        break;

      case 'trigger_effect':
        if (cmd.metadata?.type === 'boss_cheer') {
          this.audio.click();
          this.ui.showAnnouncement('⚡ KHÁN GIẢ GÕ "BOSS" TÍCH NỘ ĐẠI TƯỚNG! ⚡', GAME_CONFIG.COLORS.GOLD);
        } else if (cmd.metadata?.type === 'cheer') {
          this.audio.cheer();
          this.ui.showAnnouncement(`⭐ [${cmd.user?.nickname || 'Khán giả'}] CỔ VŨ TINH THẦN!`, GAME_CONFIG.COLORS.GOLD);
        } else {
          this.audio.boost();
        }
        break;

      case 'switch_theme': {
        const themeId = cmd.metadata?.themeId as any;
        const nextTheme = themeId ? this.roundManager.setTheme(themeId) : this.roundManager.rotateTheme();
        this.ui.drawBackground(nextTheme);
        this.ui.drawBattlefield(nextTheme);
        this.effects.setupAmbientParticles(nextTheme);
        this.ui.showAnnouncement(`ĐỔI SÂN: ${nextTheme.vietnameseName.toUpperCase()}`, GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'toggle_fx': {
        this.effects.quality = this.effects.quality === 'high' ? 'low' : 'high';
        this.effects.setupAmbientParticles(this.roundManager.getThemeDef());
        this.ui.showAnnouncement(`HIỆU ỨNG: ${this.effects.quality.toUpperCase()}`, GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'clear_units': {
        for (const u of this.units) {
          u.destroy();
        }
        this.units = [];
        this.activeBoss = null;
        this.effects.clear();
        this.ui.showAnnouncement('ĐÃ XÓA TOÀN BỘ QUÂN TRÊN CHIẾN TRƯỜNG', GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'set_core_hp': {
        const team = cmd.team || 'red';
        const hp = Math.min(GAME_CONFIG.MAX_CORE_HP, Math.max(0, Number(cmd.amount) || 0));
        if (team === 'red') this.roundManager.redHp = hp;
        else this.roundManager.blueHp = hp;
        this.ui.showAnnouncement(`HP THÀNH ${team.toUpperCase()}: ${hp}`, GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'set_round': {
        const r = Math.max(1, Number(cmd.count) || 1);
        this.roundManager.round = r;
        this.startRound(false);
        this.ui.showAnnouncement(`CHUYỂN SANG VÒNG ${r}`, GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'force_end_round': {
        this.roundManager.setPhase('ROUND_RESULT');
        this.ui.showAnnouncement('KẾT THÚC VÒNG ĐẤU THEO LỆNH ADMIN', GAME_CONFIG.COLORS.GOLD);
        break;
      }

      case 'tts_speak': {
        const text = cmd.metadata?.text as string;
        if (text) {
          this.tts.speak(text, true);
        }
        break;
      }

      case 'boss_ability': {
        if (this.activeBoss && this.activeBoss.alive) {
          this.combatSystem.executeBossAoESkill(this.activeBoss, this.units);
          this.ui.showAnnouncement('⚡ KÍCH HOẠT TUYỆT KỸ ĐẠI TƯỚNG! ⚡', GAME_CONFIG.COLORS.GOLD);
        }
        break;
      }
    }

    this.updateHud();
  }

  public update(time: number, dt: number): void {
    // Delta clamping: avoid huge delta leaps if user was in another tab
    const delta = Math.min(dt / 1000, 0.05);

    // Update projectiles & visual effects
    this.effects.update(delta);

    // State machine update
    const stateResult = this.roundManager.update(delta);
    if (stateResult.roundEnded) {
      this.endRound();
      return;
    }

    if (this.roundManager.phase === 'INTERMISSION') {
      const nextThemeId = GAME_CONFIG.THEME_ROTATION[(this.roundManager.currentThemeIndex + 1) % GAME_CONFIG.THEME_ROTATION.length];
      const nextTheme = GAME_CONFIG.ARENAS[nextThemeId];
      this.ui.showIntermission(nextTheme, this.roundManager.getIntermissionCountdown());
      return;
    }

    if (this.roundManager.phase !== 'BATTLE') return;

    // Active Combat logic
    const redCount = this.units.filter((u) => u.alive && u.team === 'red').length;
    const blueCount = this.units.filter((u) => u.alive && u.team === 'blue').length;
    const redHpRatio = this.roundManager.redHp / GAME_CONFIG.MAX_CORE_HP;
    const blueHpRatio = this.roundManager.blueHp / GAME_CONFIG.MAX_CORE_HP;

    this.spawnSystem.update(delta, redHpRatio, blueHpRatio, redCount, blueCount);

    // Apply unit AI separation
    UnitAI.updateSeparation(this.units);

    // Update each unit logic & combat
    for (const u of this.units) {
      if (!u.alive) continue;

      u.updateLogic(delta, this.roundManager.elapsed);

      // Target search
      const target = UnitAI.findTarget(u, this.units);
      const dir = u.team === 'red' ? 1 : -1;

      if (target && Math.abs(target.x - u.x) <= u.range) {
        u.setAnimState('idle');

        // Boss Unique AoE Skill
        if (u.isBoss && u.skillCooldown <= 0) {
          this.combatSystem.executeBossAoESkill(u, this.units);
        } else if (u.currentCooldown <= 0) {
          this.combatSystem.executeAttack(u, target, this.units);
        }
      } else {
        u.setAnimState('run');
        u.x += dir * u.speed * delta;

        // Check tower breach
        if ((u.team === 'red' && u.x >= GAME_CONFIG.BASE_X_BLUE) || (u.team === 'blue' && u.x <= GAME_CONFIG.BASE_X_RED)) {
          this.combatSystem.handleBreach(u);
        }
      }
    }

    // Garbage collect dead units immediately when pool grows
    if (this.units.length > 50) {
      this.units = this.units.filter((u) => u.alive);
    }

    // Update Boss Bar
    if (this.activeBoss && !this.activeBoss.alive) {
      this.activeBoss = null;
    }
    this.ui.updateBossBar(this.activeBoss);

    // Broadcast state to Bridge every 0.5s
    this.stateBroadcastTimer += delta;
    if (this.stateBroadcastTimer >= 0.5) {
      this.stateBroadcastTimer = 0;
      this.eventClient.sendGameState(redCount, blueCount, this.roundManager.redHp, this.roundManager.blueHp);
      this.updateHud();
    }
  }

  private updateHud(): void {
    const redUnits = this.units.filter((u) => u.alive && u.team === 'red').length;
    const blueUnits = this.units.filter((u) => u.alive && u.team === 'blue').length;

    this.ui.updateHud(
      this.roundManager.redHp,
      this.roundManager.blueHp,
      this.roundManager.getRemainingSeconds(),
      this.roundManager.redKills,
      this.roundManager.blueKills,
      redUnits,
      blueUnits,
      this.roundManager.redTotalWins,
      this.roundManager.blueTotalWins
    );
  }

  private endRound(): void {
    const liveRed = this.units.filter((u) => u.alive && u.team === 'red').length;
    const liveBlue = this.units.filter((u) => u.alive && u.team === 'blue').length;
    const winner = this.roundManager.determineWinner(liveRed, liveBlue);

    this.audio.win();
    this.tts.announceVictory(winner);

    // Set surviving units of winning team to victory celebration
    for (const u of this.units) {
      if (u.alive && u.team === winner) {
        u.setAnimState('victory');
      }
    }

    const latestRecord = this.roundManager.matchHistory[0] || {
      id: 'rec_end',
      roundNumber: this.roundManager.round,
      themeId: this.roundManager.currentTheme,
      winner,
      durationSeconds: Math.round(this.roundManager.elapsed),
      redScore: this.roundManager.redHp + this.roundManager.redKills * 12 + liveRed * 10,
      blueScore: this.roundManager.blueHp + this.roundManager.blueKills * 12 + liveBlue * 10,
      redKills: this.roundManager.redKills,
      blueKills: this.roundManager.blueKills,
      redCoreHp: this.roundManager.redHp,
      blueCoreHp: this.roundManager.blueHp,
      topSupporters: this.roundManager.roundSupporters,
      timestamp: Date.now(),
    };

    this.ui.showVictory(latestRecord, () => {
      this.startRound(true);
    });
  }

  public destroy(): void {
    this.eventClient.disconnect();
    this.tts.destroy();
    this.effects.clear();
    for (const u of this.units) {
      u.destroy();
    }
    this.units = [];
  }
}
