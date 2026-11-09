# PTPlay Mini War Arena V1.0 — Asset Credits & Provenance

**Product:** Mini War Arena V1.0  
**Publisher:** PTPlay  
**Release Target:** Full Release V1.0 (Production-Ready)

All assets utilized in PTPlay Mini War Arena V1.0 are either custom original procedural vectors generated directly via HTML5 Canvas / Phaser 3 Graphics, pure synthesized Web Audio, or proprietary PTPlay brand assets. The game is 100% free of third-party copyrighted materials and DMCA-safe for global commercial broadcasting on TikTok LIVE.

---

## 1. 2D Visual Art & Sprites

| Asset Key | Description | Source / Provenance | License |
|---|---|---|---|
| `red-warrior`, `blue-warrior` | 2D Chibi medieval knight with armor, sword, shield, and crest | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT (Antigravity Antigravity Engine) |
| `red-archer`, `blue-archer` | 2D Chibi ranger with quiver, arrows, and curved longbow | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT |
| `red-tank`, `blue-tank` | 2D Chibi armored knight with giant tower shield & horned helm | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT |
| `red-mage`, `blue-mage` | 2D Chibi wizard with hooded robe, wizard hat & glowing magic staff | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT |
| `red-boss` | **Infernal Warlord** centerpiece with demonic horns, flame broadsword & pauldrons | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT |
| `blue-boss` | **Crystal Titan** centerpiece with spiked crystal crown & warhammer | Original procedural vector code in `TextureGenerator.ts` | Proprietary / MIT |
| `arrow-proj` | Ballistic arrow projectile with wooden shaft, fletching, and steel tip | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `magic-orb-red`, `magic-orb-blue` | Arcane pulsating spell spheres with layered cores | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `boss-ring-fire` | Fiery ground shockwave ring with inner heat gradient | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `boss-ring-crystal` | Cyan frost shockwave ring with ice shatter tell | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `crystal-shard` | Prismatic sapphire crystal projectile | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `ground-scorch` | Charred basalt crater decal for Infernal Warlord Ground Slam | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `banner-red`, `banner-blue` | Faction heraldic fort banners with gold insignia | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `shield-barrier` | Glowing energy shield aura for Tank and fort defense | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `particle-sparkle`, `particle-leaf`, `particle-snow`, `particle-ember` | Ambient atmospheric particles for 4 arena themes | Procedural graphics in `TextureGenerator.ts` | Proprietary / MIT |
| `ptplay-logo` (`ptplay-avatar.png`) | Official PTPlay brand channel avatar and icon | Provided by user / PTPlay channel | Proprietary PTPlay Brand Asset |

---

## 2. Audio & Sound FX

| Audio Feature | Technique / Implementation | Provenance / Risk |
|---|---|---|
| **Synthesizer Engine** | Real-time Web Audio API procedural synthesis (`AudioManager.ts`) with custom Oscillators (sine, triangle, sawtooth) and white/pink noise generators | 100% synthesized in browser; zero copyright risk, zero DMCA flagging |
| **Limiter & Compressor** | DynamicsCompressorNode (-18dB threshold, 12dB knee, 8:1 ratio) | Standard Web Audio API node, prevents clipping/distortion during multi-unit battle clashes |
| **Melee Combat SFX** | Frequency-bent triangle wave + filtered noise burst | Original synthesized formula |
| **Arrow Launch & Hit** | Eased pitch sweep + subtle string pluck noise | Original synthesized formula |
| **Magic Cast & AoE Splash** | Dual oscillator FM-style chirp + resonant low-pass splash | Original synthesized formula |
| **Infernal Ground Slam SFX** | Sub-bass sawtooth drop + heavy low-end pink noise rumble | Original synthesized formula |
| **Crystal Titan Shatter SFX** | High-frequency crystalline chimes + explosive shatter noise | Original synthesized formula |
| **Fanfare & Victory Audio** | Ascending pentatonic chord sequence (C - E - G - C - E) | Classical harmonic sequence |
| **Battle BGM & Beat** | Procedural 120-BPM martial cadence in A minor with kick, snare, and arpeggiator | Original procedural composition |

---

## 3. Fonts & Typography

- System font fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- Zero external webfont downloads; guarantees instant offline load without latency or licensing encumbrance.

