# PTPlay Shared Music Integration — Antigravity Prompt

Audit the existing PTPlay monorepo and implement ONE reusable background-music system for all registered games. Use `music-catalog.json` as **unreviewed source candidates**, not as downloaded production tracks.

1. Place approved files in a shared asset folder or in each Vite app's public assets, with properly resolved URLs. Do not store duplicate per-game copies when packaging can share them.
2. Implement a GameMusicProfile registry keyed by game ID with lobby, gameplay, boss, result and celebration cues (as applicable).
3. Add playlist shuffle/rotation, clean loop, crossfade (1–3 sec), user gesture unlock and volume controls.
4. Audio ducking: when TTS begins, ramp BGM down by approximately 10–15 dB; ramp back on completion, including errors/timeouts.
5. Ensure only ONE live-audible playback path on the streaming PC. Avoid Chrome + OBS double playback and avoid TTS being silent in OBS Browser Source.
6. Provide PTPlay Admin controls: select/preview music, set volume, mute, monitor license/credit/source fields, avoid accidental double streams.
7. Keep TikFinityProvider and PTPlay LIVE Bridge unchanged; music is game side, not a TikTok provider responsibility.
8. Store audio source license records and verification status, do not auto-publish unreviewed music.
9. Test 540×960 and 1080×1920 OBS Browser Source, audio capture, long-session looping, performance and browser autoplay behavior.
10. Use existing assets and music if they are already adequate; do not destroy current playlists.

Deliver a working shared music package, documented import workflow, audio routing guidance and independent test results.
