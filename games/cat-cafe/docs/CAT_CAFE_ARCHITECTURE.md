# CAFÉ MÒE (PTPlay Cat Café LIVE) V1.0 — Architecture Specification

**Project:** PTPlay Cat Café LIVE (Café Mòe)  
**Version:** V1.0 Production Release  
**Target Platform:** Windows PC, browser-based game (captured by TikTok LIVE Studio / OBS Studio)  
**Game Engine:** Phaser 3 + TypeScript + Vite  
**Live Stream Engine:** PTPlay LIVE Bridge (Node.js, TypeScript, WebSocket)  
**Aspect Ratio:** 9:16 Portrait (540x960 native, scales responsively)  
**Date:** 2026-11-03  

---

## 1. System Overview & Monorepo Architecture

PTPlay Cat Café LIVE is a relaxing 2D illustrated cat café game designed for interactive TikTok LIVE streaming. Stream viewers adopt personalized virtual cats, feed them, play with them, put them to sleep, shower them with affection, call them to the stage, take photo poses, and explore garden areas.

### Additive Integration Principle
To guarantee complete isolation and zero regression to **Mini War Arena V0.2**:
1. Mini War Arena source code (`src/`, `index.html`, `vite.config.ts`, `package.json`) remains untouched and operational on Port `5173`.
2. Cat Café is structured as an independent application located at `C:\Workspace\PTPlay-Cat-Cafe` (and linked into `PTPlay-Mini-War-Arena/games/cat-cafe` via NTFS Directory Junction), running independently on Port `5174`.
3. The shared **PTPlay LIVE Bridge** (`ptplay-live-bridge/` on Port `8088`) acts as the single unified event adapter hub:
   - Shared WebSocket server (`ws://127.0.0.1:8088/game`) with multi-client application routing (`?app=cat-cafe` or default Mini War Arena).
   - Unified provider adapters (`MockProvider` and `TikFinityProvider`).
   - Shared event queue, streak deduplication, data sanitizer, and streamer dashboard (`/admin`).

```
                +---------------------------------------+
                |    TikTok LIVE Room / TikFinity       |
                |           (ws://localhost:21213)      |
                +---------------------------------------+
                                   |
                +---------------------------------------+
                |       ptplay-live-bridge (:8088)      |
                |  - TikFinityProvider / MockProvider   |
                |  - Normalization & EventQueue         |
                |  - GiftStreakHandler & Sanitizer      |
                |  - Active Game Profile Routing        |
                +---------------------------------------+
                       /                         \
         ws://.../game (default)         ws://.../game?app=cat-cafe
                     /                             \
     +-------------------------------+   +-------------------------------+
     |      Mini War Arena (:5173)   |   |     Cat Café LIVE (:5174)     |
     |  - Team Battle Simulation     |   |  - 3 Illustrated Cozy Rooms   |
     |  - Red vs Blue Combat         |   |  - 8 Breeds & 6 Personalities |
     |  - Landscape Arena            |   |  - 10 Levels & Progression    |
     +-------------------------------+   +-------------------------------+
```

---

## 2. Ports and Communication Matrix

| Component | Port | Protocol | Purpose |
|---|---|---|---|
| **TikFinity Desktop** | `21213` | WS | TikTok LIVE desktop event socket |
| **PTPlay Live Bridge** | `8088` | HTTP & WS | Streamer Dashboard (`/admin`), API (`/api/*`), Game WS (`/game`) |
| **Mini War Arena** | `5173` | HTTP | Mini War Arena frontend game |
| **Cat Café LIVE** | `5174` | HTTP | Cat Café LIVE frontend game (9:16 portrait) |

---

## 3. Visual & Aesthetic Architecture

### Illustrated Environment (3 Distinct Rooms)
1. **Main Café (Quán Chính):** Cozy wood flooring, pastel cream wallpaper, large glass window with sunny park backdrop, counter bar with espresso machine, pastry display case, and multiple feeding and scratching spots.
2. **Sunny Garden (Vườn Mèo):** Lush green lawn, stone paver stepping path, wooden perimeter fence, stone bird fountain, flowering bushes, and fluttering butterflies.
3. **Nap Loft (Gác Ngủ Lofi):** Warm timber flooring, fairy lights strung across ceiling, skylight window viewing stars or clouds, tall bookshelves, and plush cat cushions.

### Procedural Vector Graphic Pipeline
All visual elements are generated dynamically at runtime using Phaser 3 canvas graphics pipelines (`ProceduralTextures.ts`), producing crisp vector art at any display scaling factor without external asset loading delays:
- **8 Cat Breeds:** Distinct color palettes, muzzle styles, ear insets, belly bibs, eye pigments, and coat patterns.
- **Dynamic Modular Cat Parts:** Separate animated sprites for `_body`, `_head_open`, `_head_happy`, `_head_sleep`, `_head_alert`, and `_tail`.
- **Atmospheric Lighting:** Alpha-blended color overlay rectangles supporting `day` (soft warm), `sunset` (golden amber), and `night` (deep midnight blue).
- **Particle Weather Systems:** Procedural falling rain streaks with ground splashes and fluttering garden butterflies.

---

## 4. Autonomous AI & Behavioral System

Every cat in the café is governed by a robust 11-state behavioral state machine:
- `idle`: Breathing cycle with tail swaying and blinking.
- `blink`: Micro-animation closing and reopening eyes.
- `walk`: Smooth movement towards food, toys, beds, or social targets.
- `sit`: Upright posture observing surrounding activity.
- `sleep`: Curled loaf posture, sleeping closed eyes, rising `Zzz` particles.
- `stretch`: Playful arching animation.
- `groom`: Licking paw gesture with contented eye state.
- `eat`: Crouched at food bowl, chomping animation, floating crumb particles.
- `play`: Batting at yarn ball or butterfly, rapid pounce animation.
- `react`: Heart bursts, star sparkles, purr emotes.
- `call`: Running downstage to the streamer host area to greet the audience.
- `social`: Approaching another cat to nuzzle heads and purr together.

### 6 Personality Profiles
Each cat is assigned a personality based on the viewer's user ID hash or NPC definition:
1. `sleepy`: Frequently curls up in beds, high energy recovery, slow hunger decay.
2. `playful`: Actively pursues toys and butterflies, frequent pounces, high energy expenditure.
3. `foodie`: Gravitates toward food bowls, eats hearty portions, triggers snack requests.
4. `curious`: Explores room corners, gazes out windows, wanders between points of interest.
5. `affectionate`: Highly responsive to love hearts, purrs frequently, seeks nuzzles.
6. `shy`: Prefers quiet corners and shelves, gradually warms up to other cats.

---

## 5. Procedural Web Audio Engine

To eliminate copyright infringement risks on TikTok LIVE and provide high-fidelity audio without loading heavy audio assets, the game features a pure Web Audio synthesizer (`CafeAudioEngine.ts`):
- **Master Compressor & Soft Limiter:** Protects streamer and audience ears from audio clipping.
- **3 Lofi BGM Theme Loops:**
  - *Day Theme:* Warm Rhodes/electric piano chord progression in C Major 7 (Cmaj7 - Am7 - Dm7 - G7).
  - *Rain Theme:* Soft mellow minor 7 chords with low-pass filtered pink noise rain simulator.
  - *Night Theme:* Lofi bell music box lullaby with gentle stereo chorus.
- **Procedural Sound FX:**
  - *Purr:* Dual low-frequency triangle oscillator with 24Hz LFO tremolo modulation.
  - *Meow:* Sine oscillator with frequency glide contour and soft resonant formant.
  - *Munch:* White noise micro-bursts with steep envelope decay.
  - *Camera Shutter:* High-frequency snap and mechanical click.
  - *Doorbell Chime:* Dual crystal chime bell tones (E5 -> C5).
  - *Level-Up Fanfare:* Triumphant ascending arpeggio (C5 -> E5 -> G5 -> C6).
- **Audio Autoplay Unlock:** Complies with modern browser autoplay policies via a prominent top unlock banner and streamer modal controls.

---

## 6. Progression & Customization System

Managed by `ProgressionManager.ts` with local persistence (`localStorage`) and full JSON export/import:
- **Purr / Harmony Points:** Earned through viewer comments, feeding, playing, sleeping, gifting, and challenges.
- **10 Café Levels:**
  - Level 1: Quán Mới Khai Trương (3 initial NPCs).
  - Level 2: Góc Trà Sữa Thơm (Unlocks Wooden Cat Lamp).
  - Level 3: Khu Vườn Tràn Nắng (Unlocks Sunny Garden Room).
  - Level 4: Cây Cào Móng Cao Cấp (Unlocks 3-Tier Sisal Tree).
  - Level 5: Gác Xép Ấm Áp (Unlocks Nap Loft Room).
  - Level 6: Bát Ăn Pha Lê Vàng (Unlocks Royal Gold Bowls).
  - Level 7: Tiệm Mèo Nổi Tiếng (Unlocks Cherry Lanterns & Persian Rugs).
  - Level 8: Giường Nệm Hoàng Gia (Unlocks Velvet Cat Sofas).
  - Level 9: Vườn Bướm Thần Tiên (Unlocks Dove Fountain & Garden Butterflies).
  - Level 10: Thiên Đường Café Mòe (Max Level Trophy & Golden Wreath).
- **12 Session Challenges:** Structured goals tracking viewer joins, feeding sessions, play sessions, naps, love hearts, photos, and garden walks.
- **Breed Discovery Album:** Tracks which of the 8 unique cat coats have visited the café, awarding discovery bonuses.
- **Décor Sockets:** Customizable slots in each room for furniture, plants, rugs, and scratchers.

---

## 7. Streamer Controls & TikTok Live Overlays

- **Streamer Control Dialog (`StreamerModal.ts`):**
  - *Room & Weather Tab:* Instant 1-click room switching, time of day controls (Day, Sunset, Night), and weather presets (Sunny, Rainy, Cozy).
  - *Progression & Album Tab:* Level inspection, XP progress bars, challenges list, and 8-breed discovery collection.
  - *Audio & Overlays Tab:* BGM/SFX/Ambience volume presets and TikTok Safe Zone overlay toggle.
  - *Save & Data Tab:* Export save JSON, import save backup, and reset progress.
- **TikTok Safe Zone Overlay:** Previews TikTok's 40px outer boundary and bottom comment/gift occlusion areas (180px bottom area), ensuring cats and interactive widgets stay fully readable.
- **Interactive Quick Demo Bar:** 10 one-click action buttons (`+ MÈO`, `ĂN`, `CHƠI`, `NGỦ`, `YÊU`, `GỌI`, `CHỤP`, `VƯỜN`, `🌹`, `🔄`) allowing streamers to demonstrate gameplay or test offline without chat comments.
