# PROMPT — PTPLAY SHARED TIKTOK GIFT REGISTRY

Inspect my current PTPlay monorepo and existing LIVE Bridge before touching production code. Import this toolkit into `packages/gift-catalog` (adjust path to real repo). Do NOT create a new TikFinity provider or overwrite existing streak handlers.

Goals:
1. Run `npm run gifts:sync` to download the latest public reference catalog from BeetGames; preserve all records including regional variants and duplicate names.
2. Run `npm run gifts:icons` only after validating the upstream download and checking rights; do not pretend all icons are in this ZIP.
3. Add a searchable Gift Catalog page to the existing PTPlay Admin, with image, name, coin reference, regions and explicit `giftId: unverified` status.
4. Add robust provider-agnostic gift identity resolution. Prioritize real `giftId` observed in normalized gift events over name, and handle name collisions visibly. Never fabricate missing IDs.
5. Add a safe optional importer for sanitized TikFinity events; store only gift metadata, not viewer IDs, cookies or account data.
6. Add config-driven gift-action mapping per game, with a preview button using MockProvider. Do not mix mappings with price/purchase logic.
7. Keep EventQueue, deltaCount, repeatEnd, idempotency and active-game routing exactly as verified; add regression tests.
8. For unknown gifts, show a generic fallback and allow streamer to map them later. Don't silently map by price.
9. Allow manual refresh with source time and region status. Protect Admin access and avoid external image requests from the Bridge to arbitrary URLs.
10. Run full builds, tests and a real TikFinity read-only gift-event check before declaring done. Do not require anyone to buy gifts for testing.

Definition of done: a shared Gift Catalog usable by Café Mòe, Mini War Arena, English Class and Quiz Show; images render correctly, verified IDs remain independent of vendor name, and no game-specific behavior is hardcoded inside the provider.
