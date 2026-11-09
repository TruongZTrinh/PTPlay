import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const SOURCE = 'https://beetgames.com/tiktok-gifts.json';
const MAX_BYTES = 30 * 1024 * 1024;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 35000);
let response;
try {
  response = await fetch(SOURCE, { signal: controller.signal, headers: { 'Accept': 'application/json', 'User-Agent': 'PTPlayGiftCatalog/1.0' } });
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) throw new Error('Catalog exceeds safety size limit');
  const raw = JSON.parse(bytes.toString('utf8'));
  if (!Array.isArray(raw.gifts) || raw.gifts.length < 100) throw new Error('Unexpected source JSON schema (gifts missing)');
  const unique = new Set();
  const normalized = raw.gifts.map((g, index) => {
    if (!g || typeof g.name !== 'string' || typeof g.slug !== 'string') return null;
    const coins = Number(g.coins);
    if (!Number.isSafeInteger(coins) || coins < 0) return null;
    const regions = Array.isArray(g.regions) ? [...new Set(g.regions.filter(x => typeof x === 'string' && /^[A-Z]{2}$/.test(x)))] : [];
    const img = typeof g.image_url === 'string' && g.image_url.startsWith('/images/gifts/') ? `https://beetgames.com${g.image_url}` : null;
    let key = `${g.slug}@${coins}`;
    if (unique.has(key)) key = `${key}#${index}`;
    unique.add(key);
    return { referenceKey: key, giftId: null, name: g.name, coins, regions, iconUrl: img, localIcon: null,
      pageUrl: typeof g.page_url === 'string' && g.page_url.startsWith('/tiktok-gifts/') ? `https://beetgames.com${g.page_url}` : null,
      priceStatus: 'third-party-reference', idStatus: 'unverified', iconSource: 'BeetGames', updatedAt: g.updated_at ?? raw.updated_at ?? null };
  }).filter(Boolean);
  const vn = normalized.filter(g => g.regions.includes('VN'));
  await mkdir(dataDir, { recursive: true });
  const meta = { formatVersion: 1, source: SOURCE, provider: 'reference-only-not-tiktok-official', sourceUpdatedAt: raw.updated_at ?? null,
    importedAt: new Date().toISOString(), note: 'Name/price/image region snapshot; NO validated giftId. Actual room gift list may differ.' };
  const files = [
    ['tiktok-gifts.all.json', { ...meta, total: normalized.length, gifts: normalized }],
    ['tiktok-gifts.vn.json', { ...meta, region: 'VN', total: vn.length, gifts: vn }]
  ];
  for (const [name, obj] of files) {
    const tmp = path.join(dataDir, name + '.part');
    await writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
    await rename(tmp, path.join(dataDir, name));
  }
  const quote = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const csv = rows => ['referenceKey,giftId,name,coins,regions,iconUrl,pageUrl,idStatus', ...rows.map(g => [g.referenceKey,'',g.name,g.coins,g.regions.join(';'),g.iconUrl,g.pageUrl,g.idStatus].map(quote).join(','))].join('\r\n');
  await writeFile(path.join(dataDir, 'tiktok-gifts.all.csv'), csv(normalized), 'utf8');
  await writeFile(path.join(dataDir, 'tiktok-gifts.vn.csv'), csv(vn), 'utf8');
  console.log(`Synced ${normalized.length} public reference rows; ${vn.length} rows tagged VN. Source date: ${raw.updated_at ?? 'unknown'}`);
  console.log('Exported JSON and CSV in data/. Public catalog does NOT contain verified giftId.');
} catch (e) {
  console.error('SYNC FAILED:', e.message);
  process.exitCode = 1;
} finally { clearTimeout(timer); }
