import { GameMusicProfile, MusicCue, MusicManagerOptions, MusicPlaybackState, MusicStateListener, MusicTrack } from './types';
import { GAME_MUSIC_PROFILES, getProfileByGame, getTrackById, getTracksByGame, PTPLAY_MUSIC_CATALOG } from './MusicCatalog';

/**
 * PTPlay Shared Background Music Manager
 * Centralized, battle-tested audio controller powering all 5 platform games.
 *
 * Features:
 *  - Dual-channel A/B crossfading (1-3s) without audio pops or gaps
 *  - Clean loop and automatic playlist rotation / shuffle for marathon livestreams
 *  - Intelligent audio ducking (-10dB ~ -15dB) during Vietnamese/Bilingual TTS
 *  - Auto-unlock on first streamer/user gesture
 *  - OBS Browser Source vs Chrome tab echo protection
 */
export class SharedMusicManager {
  private static instances: Map<string, SharedMusicManager> = new Map();

  private gameId: string;
  private profile: GameMusicProfile;
  private baseUrl: string;

  // Dual audio element channels for crossfading
  private audioA: HTMLAudioElement | null = null;
  private audioB: HTMLAudioElement | null = null;
  private activeChannel: 'A' | 'B' = 'A';
  private crossfadeTimer: any = null;

  // Volume & Ducking
  private masterVolume: number;
  private normalVolume: number;
  private duckFactor: number;
  private isMuted: boolean = false;
  private isDucked: boolean = false;
  private duckTimer: any = null;

  // State
  private isUnlocked: boolean = false;
  private isPlaying: boolean = false;
  private currentTrack: MusicTrack | null = null;
  private currentCue: MusicCue | string | null = null;
  private currentTrackIndex: number = 0;
  private playlist: MusicTrack[] = [];

  // Listeners
  private listeners: Set<MusicStateListener> = new Set();

  private constructor(options: MusicManagerOptions) {
    this.gameId = options.gameId;
    this.profile =
      options.profile ||
      getProfileByGame(options.gameId) ||
      {
        gameId: options.gameId,
        gameName: options.gameId,
        defaultVolume: 0.3,
        duckFactor: 0.38,
        cues: {},
        playlist: [],
        playlistRotation: false,
        crossfadeDurationSec: 1.5,
      };

    this.baseUrl = options.baseUrl || '';
    this.normalVolume = options.defaultVolume ?? this.profile.defaultVolume;
    this.masterVolume = this.normalVolume;
    this.duckFactor = options.duckFactor ?? this.profile.duckFactor;

    this.initPlaylist();
    this.checkSinglePlaybackProtection(options.protectSingleStreamer ?? true);

    if (options.autoUnlock !== false) {
      this.setupAutoUnlock();
    }
  }

  /**
   * Singleton factory per game ID
   */
  public static getInstance(options: MusicManagerOptions): SharedMusicManager {
    const key = options.gameId.toLowerCase().replace(/_/g, '-');
    if (!SharedMusicManager.instances.has(key)) {
      SharedMusicManager.instances.set(key, new SharedMusicManager(options));
    }
    return SharedMusicManager.instances.get(key)!;
  }

  /**
   * Initializes playlist from game profile
   */
  private initPlaylist(): void {
    const trackIds = this.profile.playlist || [];
    this.playlist = trackIds
      .map((id) => getTrackById(id))
      .filter((t): t is MusicTrack => Boolean(t));

    if (this.playlist.length === 0) {
      this.playlist = getTracksByGame(this.gameId);
    }

    if (this.playlist.length > 0) {
      this.currentTrack = this.playlist[0];
      this.currentTrackIndex = 0;
    }
  }

  /**
   * Echo Protection: Prevent simultaneous audio playing from Chrome monitoring
   * tab and OBS Browser Source on the same PC.
   */
  private checkSinglePlaybackProtection(enabled: boolean): void {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isObs = Boolean((window as any).obsstudio);

      // Check explicit query parameters
      if (urlParams.get('audio') === 'mute' || urlParams.get('bgm') === '0') {
        this.isMuted = true;
        return;
      }

      // Check localStorage setting if set by streamer admin
      const storedMute = localStorage.getItem('ptplay_bgm_muted');
      if (storedMute === 'true') {
        this.isMuted = true;
        return;
      }

      // If user specified obs-only mode and this tab is not OBS, mute by default
      if (urlParams.get('audio_mode') === 'obs_only' && !isObs) {
        this.isMuted = true;
      }
    } catch {
      // Storage access may be blocked in some sandboxes
    }
  }

  /**
   * Sets up global click/tap/keypress listeners to unlock audio autoplay
   */
  private setupAutoUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlock();
      if (this.isUnlocked) {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  /**
   * Unlocks audio context / elements on user gesture
   */
  public unlock(): boolean {
    if (this.isUnlocked) return true;
    if (typeof Audio === 'undefined') return false;

    try {
      this.ensureAudioElements();
      this.isUnlocked = true;

      // If a track was queued, start playing now
      if (this.isPlaying && this.currentTrack) {
        this.playTrack(this.currentTrack.id, false);
      }

      this.notifyListeners();
      return true;
    } catch (e) {
      console.warn('[SharedMusicManager] Unlock error:', e);
      return false;
    }
  }

  /**
   * Lazily initializes dual audio elements
   */
  private ensureAudioElements(): void {
    if (typeof Audio === 'undefined') return;

    if (!this.audioA) {
      this.audioA = new Audio();
      this.audioA.preload = 'auto';
      this.audioA.onended = () => this.handleTrackEnded();
      this.audioA.onerror = (e) => console.warn('[SharedMusicManager] Audio A error:', e);
    }

    if (!this.audioB) {
      this.audioB = new Audio();
      this.audioB.preload = 'auto';
      this.audioB.onended = () => this.handleTrackEnded();
      this.audioB.onerror = (e) => console.warn('[SharedMusicManager] Audio B error:', e);
    }
  }

  /**
   * Handles track end event: clean loop or auto-rotation
   */
  private handleTrackEnded(): void {
    if (!this.isPlaying) return;

    // If profile has playlist rotation enabled, advance to next track
    if (this.profile.playlistRotation && this.playlist.length > 1) {
      this.nextTrack(true);
    } else {
      // Loop current track seamlessly
      const activeAudio = this.activeChannel === 'A' ? this.audioA : this.audioB;
      if (activeAudio) {
        activeAudio.currentTime = 0;
        void activeAudio.play().catch(() => {});
      }
    }
  }

  /**
   * Computes effective volume considering master, mute, and ducking
   */
  private getEffectiveVolume(baseVol: number = this.masterVolume): number {
    if (this.isMuted) return 0;
    if (this.isDucked) {
      return Math.max(0, Math.min(1, baseVol * this.duckFactor));
    }
    return Math.max(0, Math.min(1, baseVol));
  }

  /**
   * Resolves track URL relative to baseUrl
   */
  public resolveTrackUrl(track: MusicTrack): string {
    if (track.url.startsWith('http://') || track.url.startsWith('https://')) {
      return track.url;
    }
    if (this.baseUrl) {
      const cleanBase = this.baseUrl.replace(/\/+$/, '');
      const cleanUrl = track.url.replace(/^\/+/, '');
      return `${cleanBase}/${cleanUrl}`;
    }
    return track.url;
  }

  /**
   * Plays a cue defined in the game music profile (e.g., 'lobby', 'boss', 'question')
   */
  public playCue(cue: MusicCue | string, crossfade = true): void {
    this.currentCue = cue;
    const trackIds = this.profile.cues[cue];
    if (!trackIds || trackIds.length === 0) {
      // Fallback: try first playlist track
      if (this.playlist.length > 0) {
        this.playTrack(this.playlist[0].id, crossfade);
      }
      return;
    }

    // Pick random or first track for this cue
    const trackId = trackIds[Math.floor(Math.random() * trackIds.length)];
    this.playTrack(trackId, crossfade);
  }

  /**
   * Plays a specific track by its ID with optional crossfade
   */
  public playTrack(trackId: string, crossfade = true): void {
    const track = getTrackById(trackId) || this.playlist.find((t) => t.id === trackId);
    if (!track) {
      console.warn(`[SharedMusicManager] Track not found: ${trackId}`);
      return;
    }

    this.currentTrack = track;
    this.currentTrackIndex = this.playlist.findIndex((t) => t.id === track.id);
    if (this.currentTrackIndex === -1) {
      this.currentTrackIndex = 0;
    }

    this.isPlaying = true;
    this.ensureAudioElements();

    if (!this.audioA || !this.audioB) {
      this.notifyListeners();
      return;
    }

    const nextChannel = this.activeChannel === 'A' ? 'B' : 'A';
    const outgoing = this.activeChannel === 'A' ? this.audioA : this.audioB;
    const incoming = nextChannel === 'A' ? this.audioA : this.audioB;

    const targetUrl = this.resolveTrackUrl(track);
    incoming.src = targetUrl;
    incoming.currentTime = 0;

    const targetVol = this.getEffectiveVolume();

    if (crossfade && outgoing && !outgoing.paused && outgoing.currentTime > 0) {
      // Smooth crossfade over crossfadeDurationSec
      const durationMs = (this.profile.crossfadeDurationSec || 1.5) * 1000;
      const stepMs = 50;
      const steps = Math.max(1, Math.floor(durationMs / stepMs));
      let currentStep = 0;

      incoming.volume = 0;
      void incoming.play().catch(() => {});

      if (this.crossfadeTimer) {
        clearInterval(this.crossfadeTimer);
      }

      this.crossfadeTimer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        incoming.volume = Math.min(1, Math.max(0, targetVol * progress));
        if (outgoing) {
          outgoing.volume = Math.min(1, Math.max(0, outgoing.volume * (1 - progress)));
        }

        if (currentStep >= steps) {
          clearInterval(this.crossfadeTimer);
          this.crossfadeTimer = null;
          if (outgoing) {
            outgoing.pause();
            outgoing.currentTime = 0;
          }
          incoming.volume = targetVol;
          this.activeChannel = nextChannel;
          this.notifyListeners();
        }
      }, stepMs);
    } else {
      // Immediate switch without crossfade
      if (outgoing) {
        outgoing.pause();
        outgoing.currentTime = 0;
      }
      incoming.volume = targetVol;
      this.activeChannel = nextChannel;
      void incoming.play().catch((err) => {
        // Autoplay policy prevented playback; will resume on first user interaction
        console.log('[SharedMusicManager] Autoplay queued until user interaction.');
      });
      this.notifyListeners();
    }
  }

  /**
   * Advances to next track in playlist
   */
  public nextTrack(crossfade = true): void {
    if (this.playlist.length === 0) return;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    const next = this.playlist[this.currentTrackIndex];
    if (next) {
      this.playTrack(next.id, crossfade);
    }
  }

  /**
   * Returns to previous track in playlist
   */
  public previousTrack(crossfade = true): void {
    if (this.playlist.length === 0) return;
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    const prev = this.playlist[this.currentTrackIndex];
    if (prev) {
      this.playTrack(prev.id, crossfade);
    }
  }

  /**
   * Audio Ducking: Ramp down BGM volume by approx 10-15 dB (to ~35% volume)
   * so voice is crystal-clear while background music remains pleasantly audible.
   */
  public startDucking(customFactor?: number): void {
    if (this.isDucked) return;
    this.isDucked = true;
    if (customFactor !== undefined) {
      this.duckFactor = Math.max(0.1, Math.min(0.8, customFactor));
    }

    this.applyVolumeWithRamp(this.getEffectiveVolume(), 150);
    this.notifyListeners();
  }

  /**
   * Restores normal background music volume after TTS speech ends.
   */
  public stopDucking(rampMs = 350): void {
    if (!this.isDucked) return;
    this.isDucked = false;

    if (this.duckTimer) {
      clearTimeout(this.duckTimer);
      this.duckTimer = null;
    }

    this.applyVolumeWithRamp(this.getEffectiveVolume(), rampMs);
    this.notifyListeners();
  }

  /**
   * Convenience helper to duck for an estimated duration with auto-restore
   */
  public duck(durationMs = 2500, customFactor?: number): void {
    this.startDucking(customFactor);

    if (this.duckTimer) {
      clearTimeout(this.duckTimer);
    }

    this.duckTimer = setTimeout(() => {
      this.stopDucking(400);
    }, durationMs);
  }

  /**
   * Smoothly ramps the active audio channel's volume
   */
  private applyVolumeWithRamp(targetVol: number, rampDurationMs = 200): void {
    const active = this.activeChannel === 'A' ? this.audioA : this.audioB;
    if (!active) return;

    if (rampDurationMs <= 20) {
      active.volume = targetVol;
      return;
    }

    const startVol = active.volume;
    const diff = targetVol - startVol;
    const stepMs = 25;
    const steps = Math.max(1, Math.floor(rampDurationMs / stepMs));
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = startVol + diff * (step / steps);
      active.volume = Math.max(0, Math.min(1, current));

      if (step >= steps) {
        clearInterval(timer);
        active.volume = targetVol;
      }
    }, stepMs);
  }

  /**
   * Sets master BGM volume (0.0 to 1.0)
   */
  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.normalVolume = this.masterVolume;
    const active = this.activeChannel === 'A' ? this.audioA : this.audioB;
    if (active) {
      active.volume = this.getEffectiveVolume();
    }
    this.notifyListeners();
  }

  /**
   * Mutes or unmutes BGM
   */
  public setMute(mute: boolean): void {
    this.isMuted = mute;
    const active = this.activeChannel === 'A' ? this.audioA : this.audioB;
    if (active) {
      active.volume = this.getEffectiveVolume();
    }
    this.notifyListeners();
  }

  /**
   * Toggles play/pause state
   */
  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
    return this.isPlaying;
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.audioA) this.audioA.pause();
    if (this.audioB) this.audioB.pause();
    this.notifyListeners();
  }

  public resume(): void {
    this.isPlaying = true;
    this.ensureAudioElements();
    const active = this.activeChannel === 'A' ? this.audioA : this.audioB;
    if (active && this.currentTrack) {
      void active.play().catch(() => {});
    } else if (this.currentTrack) {
      this.playTrack(this.currentTrack.id, false);
    }
    this.notifyListeners();
  }

  /**
   * Returns current playback state snapshot
   */
  public getState(): MusicPlaybackState {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      isDucked: this.isDucked,
      volume: this.masterVolume,
      currentTrack: this.currentTrack,
      currentCue: this.currentCue,
      currentTrackIndex: this.currentTrackIndex,
      playlist: [...this.playlist],
    };
  }

  /**
   * Subscribes to playback state updates
   */
  public subscribe(listener: MusicStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[SharedMusicManager] Listener error:', err);
      }
    }
  }

  /**
   * Destroys and cleans up resources
   */
  public destroy(): void {
    if (this.crossfadeTimer) clearInterval(this.crossfadeTimer);
    if (this.duckTimer) clearTimeout(this.duckTimer);
    if (this.audioA) {
      this.audioA.pause();
      this.audioA.src = '';
      this.audioA = null;
    }
    if (this.audioB) {
      this.audioB.pause();
      this.audioB.src = '';
      this.audioB = null;
    }
    this.listeners.clear();
  }
}
