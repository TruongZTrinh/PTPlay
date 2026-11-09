# Integrate into the existing Café Mòe project

1. Copy `public/assets/cafe-moe-v3/` into the project's `public/assets/`.
2. Copy/adapt `src/game/cafe-moe-v3/` into your Phaser source tree.
3. Call `preloadCafeMoeAssets(this)` in the actual existing preload/Boot scene.
4. Display cats as Phaser images using `catAssetKey(coat, action)`. Use animation/tween/state transitions controlled by the existing Cat AI. These are **poses**, not rigged animation clips.
5. Remove the existing LARGE bottom instruction panel. Add `compact_command_strip.png` as a shallow top overlay, or retain text as real game objects for localization.
6. Only invoke `GiftReactionVisuals.play(...)` after Bridge gift normalization, duplicate/streak handling and accepted-game routing. Never process raw TikFinity messages directly in the presentation module.
7. Map real gift IDs/names in your existing configurable Bridge mapping; do not assume a particular gift is available in every TikTok market or account.
8. Preserve the working launcher, audio, saves, TikFinityProvider, Live Bridge and Mini War Arena compatibility.
9. Verify animated states, overlays, source assets, device readability and performance. Do not claim real LIVE confirmation from mock mode.
