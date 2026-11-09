// Pure functions. Keep provider gift ID identity independent from 3rd-party public reference slugs.
export function normalizeName(value: any): string {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase()
    .replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ');
}

export function safeHTTPS(value: any): string | null {
  try {
    const u = new URL(String(value));
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

export interface ResolveGiftResult {
  status: 'observed-id' | 'name-only-unverified' | 'ambiguous' | 'unresolved';
  giftId?: string | null;
  record: any | null;
  candidates?: any[];
  eventName?: string;
}

export function resolveGift(
  event: any,
  catalog: readonly any[],
  observed: readonly any[] = []
): ResolveGiftResult {
  const input = event?.data && typeof event.data === 'object' ? event.data : event;
  const rawId = input?.giftId ?? input?.gift?.id ?? input?.gift?.giftId ?? input?.gift_id;
  const giftId = rawId == null ? null : String(rawId);
  const name = String(input?.giftName ?? input?.gift?.name ?? input?.name ?? '').trim();
  // Reference Coin price is NOT interchangeable with event diamondCount.
  // Only a coinPrice explicitly verified by the operator may disambiguate name collisions.
  const manualCoinPrice = input?.verifiedCoinPrice;
  const coins = manualCoinPrice != null && Number.isSafeInteger(Number(manualCoinPrice))
    ? Number(manualCoinPrice) : null;
  if (giftId != null) {
    const verified = (observed || []).find(x => String(x.giftId) === giftId);
    if (verified) {
      const match = (catalog ?? []).find(x => normalizeName(x.name) === normalizeName(verified.name));
      return { status: 'observed-id', giftId, record: match ?? verified, eventName: name };
    }
  }
  if (!name) return { status: 'unresolved', giftId, record: null };
  const candidates = (catalog ?? []).filter(g => normalizeName(g.name) === normalizeName(name));
  if (candidates.length === 0) return { status: 'unresolved', giftId, record: null, eventName: name };
  const byCoins = coins == null ? candidates : candidates.filter(g => g.coins === coins);
  const matches = byCoins.length ? byCoins : candidates;
  // Multiple catalogue rows with the same name/price may be regional variants. Never silently pick a different gift.
  if (matches.length !== 1) return { status: 'ambiguous', giftId, candidates: matches, record: null, eventName: name };
  return { status: 'name-only-unverified', giftId, record: matches[0], eventName: name };
}

export function extractGiftOnly(raw: any) {
  if (raw?.event != null && raw.event !== 'gift') return null;
  const d = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
  if (!d || typeof d !== 'object') return null;
  const giftId = d.giftId ?? d.gift_id ?? d.gift?.id ?? d.gift?.giftId;
  const giftName = d.giftName ?? d.gift?.name ?? d.name;
  if (giftId == null || !giftName || !/^\d+$/.test(String(giftId))) return null;
  const money = d.diamondCount ?? d.gift?.diamondCount;
  const picture = d.giftPictureUrl ?? d.gift?.pictureUrl ?? d.gift?.imageUrl ?? d.gift?.iconUrl;
  return {
    giftId: String(giftId),
    name: String(giftName).slice(0, 128),
    diamondCount: Number.isFinite(Number(money)) && Number(money) >= 0 ? Number(money) : null,
    pictureUrl: safeHTTPS(picture),
    source: 'observed-tikfinity-gift-event' as const
  };
}

