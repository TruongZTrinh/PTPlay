import type { CafeGiftVisual } from './GiftReactionFx';

/**
 * Presentation only; configure these after examining REAL normalized gift payloads.
 * TikTok gift IDs, names and subscriptions may vary. This mapping is a design
 * example; it must not invent provider IDs or grant rewards by itself.
 */
export interface AcceptedGiftVisualEvent {
  giftId?: string | number;
  giftName?: string;
  /** Already computed by existing Bridge. Never treat cumulative repeatCount as a delta. */
  deltaCount?: number;
}

const DEFAULT_NAMES: Readonly<Record<string, CafeGiftVisual>> = {
  rose: 'rose',
  heart: 'heart',
  universe: 'universe',
};

/** Add verified provider gift IDs in streamer configuration if needed. */
export function getGiftVisual(
  event: AcceptedGiftVisualEvent,
  byGiftId: Readonly<Record<string, CafeGiftVisual>> = {},
): CafeGiftVisual | undefined {
  const fromId = event.giftId == null ? undefined : byGiftId[String(event.giftId)];
  if (fromId) return fromId;
  return event.giftName ? DEFAULT_NAMES[event.giftName.trim().toLowerCase()] : undefined;
}
