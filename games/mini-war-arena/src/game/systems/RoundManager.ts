import { GAME_CONFIG, Team, ArenaThemeId, ArenaThemeDef, MatchPhase, MatchRecord } from '../config/GameConfig';

export class RoundManager {
  public phase: MatchPhase = 'ATTRACT';
  public previousPhase: MatchPhase = 'ATTRACT';
  public round = 1;
  public elapsed = 0;
  public stateTime = 0; // Time spent in current phase

  // Match statistics
  public redHp = GAME_CONFIG.MAX_CORE_HP;
  public blueHp = GAME_CONFIG.MAX_CORE_HP;
  public redKills = 0;
  public blueKills = 0;
  public redTotalWins = 0;
  public blueTotalWins = 0;
  public roundSupporters: Array<{ nickname: string; team: Team; action: string }> = [];

  // Theme & Environment
  public currentThemeIndex = 0;
  public currentTheme: ArenaThemeId = 'castle';

  // Match History
  public matchHistory: MatchRecord[] = [];
  private readonly storageKey = 'ptplay_miniwar_history_v1';

  constructor() {
    this.currentTheme = GAME_CONFIG.THEME_ROTATION[0];
    this.loadMatchHistory();
  }

  /** Backwards compatibility helper for existing code checking 'ready' / 'playing' / 'paused' / 'finished' */
  public get legacyPhase(): 'ready' | 'playing' | 'paused' | 'finished' {
    if (this.phase === 'BATTLE') return 'playing';
    if (this.phase === 'PAUSED') return 'paused';
    if (this.phase === 'ROUND_RESULT' || this.phase === 'INTERMISSION') return 'finished';
    return 'ready';
  }

  public setPhase(newPhase: MatchPhase): void {
    if (this.phase === newPhase) return;
    this.previousPhase = this.phase;
    this.phase = newPhase;
    this.stateTime = 0;
  }

  public startRound(increment = false): void {
    if (increment) {
      this.round++;
      this.rotateTheme();
    }
    this.elapsed = 0;
    this.stateTime = 0;
    this.redHp = GAME_CONFIG.MAX_CORE_HP;
    this.blueHp = GAME_CONFIG.MAX_CORE_HP;
    this.redKills = 0;
    this.blueKills = 0;
    this.roundSupporters = [];
    this.setPhase('ROUND_INTRO');
  }

  public beginBattle(): void {
    this.setPhase('BATTLE');
  }

  public pause(): void {
    if (this.phase === 'BATTLE') {
      this.setPhase('PAUSED');
    }
  }

  public resume(): void {
    if (this.phase === 'PAUSED') {
      this.setPhase(this.previousPhase === 'BATTLE' ? 'BATTLE' : 'ATTRACT');
    }
  }

  public togglePause(): MatchPhase {
    if (this.phase === 'BATTLE') {
      this.pause();
    } else if (this.phase === 'PAUSED') {
      this.resume();
    }
    return this.phase;
  }

  public recordKill(team: Team): void {
    if (team === 'red') this.redKills++;
    else if (team === 'blue') this.blueKills++;
  }

  public damageCore(teamTarget: Team, amount: number): void {
    if (teamTarget === 'red') {
      this.redHp = Math.max(0, this.redHp - amount);
    } else {
      this.blueHp = Math.max(0, this.blueHp - amount);
    }
  }

  public healCore(teamTarget: Team, amount: number): void {
    if (teamTarget === 'red') {
      this.redHp = Math.min(GAME_CONFIG.MAX_CORE_HP, this.redHp + amount);
    } else {
      this.blueHp = Math.min(GAME_CONFIG.MAX_CORE_HP, this.blueHp + amount);
    }
  }

  public recordSupporter(nickname: string, team: Team, action: string): void {
    if (!nickname) return;
    this.roundSupporters.push({ nickname, team, action });
  }

  public update(delta: number): { roundEnded: boolean; phaseChanged: boolean } {
    this.stateTime += delta;

    if (this.phase === 'ATTRACT') {
      // Auto-countdown in attract lobby
      if (this.stateTime >= GAME_CONFIG.LOBBY_SECONDS) {
        this.startRound(false);
        return { roundEnded: false, phaseChanged: true };
      }
    } else if (this.phase === 'ROUND_INTRO') {
      if (this.stateTime >= GAME_CONFIG.INTRO_SECONDS) {
        this.beginBattle();
        return { roundEnded: false, phaseChanged: true };
      }
    } else if (this.phase === 'BATTLE') {
      this.elapsed += delta;
      if (this.redHp <= 0 || this.blueHp <= 0 || this.elapsed >= GAME_CONFIG.ROUND_SECONDS) {
        this.setPhase('ROUND_RESULT');
        return { roundEnded: true, phaseChanged: true };
      }
    } else if (this.phase === 'ROUND_RESULT') {
      if (this.stateTime >= GAME_CONFIG.RESULT_SECONDS) {
        this.setPhase('INTERMISSION');
        return { roundEnded: false, phaseChanged: true };
      }
    } else if (this.phase === 'INTERMISSION') {
      if (this.stateTime >= GAME_CONFIG.INTERMISSION_SECONDS) {
        this.startRound(true);
        return { roundEnded: false, phaseChanged: true };
      }
    }

    return { roundEnded: false, phaseChanged: false };
  }

  public determineWinner(liveRedUnits: number, liveBlueUnits: number): Team | 'draw' {
    const redScore = this.redHp + this.redKills * 12 + liveRedUnits * 10;
    const blueScore = this.blueHp + this.blueKills * 12 + liveBlueUnits * 10;

    let winner: Team | 'draw';
    if (redScore === blueScore) {
      winner = 'draw';
    } else if (redScore > blueScore) {
      winner = 'red';
      this.redTotalWins++;
    } else {
      winner = 'blue';
      this.blueTotalWins++;
    }

    // Save round record to history
    this.saveRoundRecord(winner, redScore, blueScore);
    return winner;
  }

  public rotateTheme(): ArenaThemeDef {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % GAME_CONFIG.THEME_ROTATION.length;
    this.currentTheme = GAME_CONFIG.THEME_ROTATION[this.currentThemeIndex];
    return GAME_CONFIG.ARENAS[this.currentTheme];
  }

  public setTheme(themeId: ArenaThemeId): ArenaThemeDef {
    this.currentTheme = themeId;
    this.currentThemeIndex = Math.max(0, GAME_CONFIG.THEME_ROTATION.indexOf(themeId));
    return GAME_CONFIG.ARENAS[this.currentTheme];
  }

  public getThemeDef(): ArenaThemeDef {
    return GAME_CONFIG.ARENAS[this.currentTheme] || GAME_CONFIG.ARENAS.castle;
  }

  public getRemainingSeconds(): number {
    return Math.max(0, Math.ceil(GAME_CONFIG.ROUND_SECONDS - this.elapsed));
  }

  public getLobbyCountdown(): number {
    return Math.max(0, Math.ceil(GAME_CONFIG.LOBBY_SECONDS - this.stateTime));
  }

  public getIntermissionCountdown(): number {
    return Math.max(0, Math.ceil(GAME_CONFIG.INTERMISSION_SECONDS - this.stateTime));
  }

  private saveRoundRecord(winner: Team | 'draw', redScore: number, blueScore: number): void {
    const record: MatchRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roundNumber: this.round,
      themeId: this.currentTheme,
      winner,
      durationSeconds: Math.round(this.elapsed),
      redScore,
      blueScore,
      redKills: this.redKills,
      blueKills: this.blueKills,
      redCoreHp: this.redHp,
      blueCoreHp: this.blueHp,
      topSupporters: this.roundSupporters.slice(-10),
      timestamp: Date.now(),
    };

    this.matchHistory.unshift(record);
    if (this.matchHistory.length > 30) {
      this.matchHistory.pop();
    }
    this.persistMatchHistory();
  }

  private persistMatchHistory(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.matchHistory));
      }
    } catch {
      // LocalStorage unavailable in node/headless test
    }
  }

  private loadMatchHistory(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            this.matchHistory = parsed;
          }
        }
      }
    } catch {
      // Ignore load error
    }
  }

  public exportHistoryJson(): string {
    return JSON.stringify(this.matchHistory, null, 2);
  }

  public clearHistory(): void {
    this.matchHistory = [];
    this.redTotalWins = 0;
    this.blueTotalWins = 0;
    this.persistMatchHistory();
  }
}
