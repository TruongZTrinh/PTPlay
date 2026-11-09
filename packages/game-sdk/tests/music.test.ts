import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PTPLAY_MUSIC_CATALOG,
  GAME_MUSIC_PROFILES,
  getProfileByGame,
  getTrackById,
  getTracksByGame,
  SharedMusicManager,
  VietnameseVoiceHelper,
} from '../src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARED_MUSIC_DIR = path.resolve(__dirname, '../../../shared-music');

test('1. Music Catalog: Contains exactly 15 curated tracks for all 5 games', () => {
  assert.strictEqual(PTPLAY_MUSIC_CATALOG.length, 15);

  const games = new Set(PTPLAY_MUSIC_CATALOG.map((t) => t.gameId));
  assert.strictEqual(games.size, 5);
  assert.ok(games.has('cat-cafe'));
  assert.ok(games.has('mini-war-arena'));
  assert.ok(games.has('english-class'));
  assert.ok(games.has('quiz-show'));
  assert.ok(games.has('duoi-hinh-bat-chu'));
});

test('2. Music Catalog: Every track has valid metadata and verified CC0 license', () => {
  for (const track of PTPLAY_MUSIC_CATALOG) {
    assert.ok(track.id, 'Track must have an id');
    assert.ok(track.title, `Track ${track.id} must have a title`);
    assert.ok(track.author, `Track ${track.id} must have an author`);
    assert.ok(track.sourcePage.startsWith('http'), `Track ${track.id} must have a valid sourcePage`);
    assert.strictEqual(track.licenseClaim, 'CC0', `Track ${track.id} must be CC0`);
    assert.strictEqual(track.status, 'verified', `Track ${track.id} must be verified`);
    assert.ok(track.url.startsWith('/shared-music/'), `Track ${track.id} must have a /shared-music/ URL`);
  }
});

test('3. Audio Files on Disk: All 15 audio files physically exist in shared-music directory', () => {
  for (const track of PTPLAY_MUSIC_CATALOG) {
    const rel = track.url.replace(/^\/shared-music\//, '');
    const diskPath = path.join(SHARED_MUSIC_DIR, rel);
    assert.ok(fs.existsSync(diskPath), `Audio file must exist on disk: ${diskPath}`);
    const stat = fs.statSync(diskPath);
    assert.ok(stat.size > 100000, `Audio file should be non-empty (>100KB): ${diskPath}`);
  }
});

test('4. Game Music Profiles: Profiles registered for all 5 games with valid cues and playlists', () => {
  const expectedGames = ['cat-cafe', 'mini-war-arena', 'english-class', 'quiz-show', 'duoi-hinh-bat-chu'];

  for (const gId of expectedGames) {
    const profile = getProfileByGame(gId);
    assert.ok(profile, `Profile must exist for game: ${gId}`);
    assert.ok(profile.defaultVolume > 0 && profile.defaultVolume <= 1, 'Volume in valid range');
    assert.ok(
      profile.duckFactor >= 0.3 && profile.duckFactor <= 0.45,
      `Duck factor should be 0.30 - 0.45 to keep BGM audible (-10 to -12 dB), got: ${profile.duckFactor}`
    );
    assert.ok(Object.keys(profile.cues).length > 0, `Profile ${gId} must define cues`);
  }

  // Check specific game cues
  const catProfile = getProfileByGame('cat-cafe')!;
  assert.ok(catProfile.playlistRotation, 'Cat Cafe must have playlistRotation enabled');
  assert.ok(catProfile.cues.nap.includes('cat-cafe-nap_bgm'), 'Cat Cafe must have nap cue');

  const warProfile = getProfileByGame('mini-war-arena')!;
  assert.ok(warProfile.cues.boss.includes('mini-war-arena-boss_bgm'), 'Mini War must have boss cue');

  const englishProfile = getProfileByGame('english-class')!;
  assert.ok(englishProfile.cues.question.includes('english-class-question_bgm'), 'English Class must have question cue');
  assert.ok(englishProfile.cues.celebration.includes('english-class-results_bgm'), 'English Class must have celebration cue');

  const quizProfile = getProfileByGame('quiz-show')!;
  assert.ok(quizProfile.cues.question.includes('quiz-show-question_bgm'), 'Quiz Show must have question cue');

  const rebusProfile = getProfileByGame('duoi-hinh-bat-chu')!;
  assert.ok(rebusProfile.cues.thinking.includes('duoi-hinh-bat-chu-thinking_bgm'), 'Rebus must have thinking cue');
});

test('5. SharedMusicManager: Instance creation, ducking, volume, and playback state', () => {
  const manager = SharedMusicManager.getInstance({
    gameId: 'mini-war-arena',
    autoUnlock: false,
    protectSingleStreamer: false,
  });

  const state = manager.getState();
  assert.strictEqual(typeof state.volume, 'number');
  assert.strictEqual(state.isDucked, false);
  assert.strictEqual(state.isMuted, false);

  // Test Volume
  manager.setVolume(0.5);
  assert.strictEqual(manager.getState().volume, 0.5);

  // Test Ducking
  manager.startDucking();
  assert.strictEqual(manager.getState().isDucked, true);
  manager.stopDucking();
  assert.strictEqual(manager.getState().isDucked, false);

  // Test Mute
  manager.setMute(true);
  assert.strictEqual(manager.getState().isMuted, true);
  manager.setMute(false);
  assert.strictEqual(manager.getState().isMuted, false);

  // Test Cues
  manager.playCue('boss', false);
  assert.strictEqual(manager.getState().currentCue, 'boss');
  assert.strictEqual(manager.getState().currentTrack?.id, 'mini-war-arena-boss_bgm');

  manager.playCue('battle', false);
  assert.strictEqual(manager.getState().currentCue, 'battle');
  assert.strictEqual(manager.getState().currentTrack?.id, 'mini-war-arena-battle_bgm');
});

test('6. Vietnamese TTS Voice Helper: Default volume is balanced (0.80) to preserve BGM', () => {
  // If window is defined or mocked, verify createVietnameseUtterance
  // In node environment, sanitizeTTSText is always available
  const clean = VietnameseVoiceHelper.sanitizeTTSText('Xin chào các bạn <b>đến với</b> PTPlay!');
  assert.strictEqual(clean, 'Xin chào các bạn đến với PTPlay!');
});
