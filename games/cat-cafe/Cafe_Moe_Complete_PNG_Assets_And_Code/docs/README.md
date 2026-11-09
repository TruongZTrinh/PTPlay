# Café Mòe — complete transparent PNG asset pack

This is a **new visual asset bundle**, not a patch to your existing repository.

- `public/assets/cafe-moe-v3/cats/{coat}/`: five cat coats × 24 action poses, plus alternate frames for five key actions each.
- `public/assets/cafe-moe-v3/gifts/`: gift visuals, treats and celebration props.
- `public/assets/cafe-moe-v3/props/`: café furniture, bowls, toys, plants and windows.
- `public/assets/cafe-moe-v3/effects/`: transparent particle sprites and FX artwork.
- `public/assets/cafe-moe-v3/ui/`: compact buttons, nameplate, LIVE indicator and gift/hint bars.
- `src/game/cafe-moe-v3/`: example Phaser 3 + TypeScript loader and visual gift effect hook.
- `asset_manifest.json`: paths, dimensions, alpha/transparency statistics and category information.
- `previews/`: visual contact sheets for inspecting the images.

## Important

1. Source artwork was newly generated with image generation. Many discrete sprites were extracted from organized composition sheets; fine hairline edges may need hand-cleanup for production use. Original sheets are included for reference.
2. The poses are **independent transparent stills**, with a few derived frames for lightweight cycling. They are not fully rigged character animation or frame-perfect walk cycles.
3. Certain cat visual costumes/props are illustrative; integrate them with the actual existing CatAI and animation state machine rather than replacing logic.
4. The PNGs provide a real alpha channel. The preview sheets have colored backgrounds solely for browsing.
5. These assets are fictional game art; the gift mapping must be configured against actual gift identifiers received during real LIVE tests.
6. Keep official TikTok branding/trademarks separate from any third-party asset licensing checks. Do not assume every illustrated gift name is available or purchasable in your region.
7. Preserve gift streak deduplication and event queue policy in the original PTPlay LIVE Bridge.
