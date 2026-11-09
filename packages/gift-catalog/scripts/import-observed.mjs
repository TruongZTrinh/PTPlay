import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractGiftOnly } from '../src/gift-utils.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) { console.error('Usage: npm run gifts:observe -- C:/path/to/sanitized-gift-events.json'); process.exit(1); }
const raw = await readFile(input, 'utf8');
let rows;
try { const v = JSON.parse(raw); rows = Array.isArray(v) ? v : [v]; }
catch { rows = raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)); }
const dest = path.join(root,'data','gifts.observed-ids.json');
let previous=[];
try { previous=JSON.parse(await readFile(dest,'utf8')).gifts ?? []; } catch {}
const byId = new Map(previous.map(x=>[String(x.giftId),x]));
let added=0;
for (const rawEvent of rows) {
  const record=extractGiftOnly(rawEvent);
  if (!record) continue;
  const old=byId.get(record.giftId);
  byId.set(record.giftId, record);
  if (!old) added++;
}
await mkdir(path.dirname(dest),{recursive:true});
await writeFile(dest, JSON.stringify({formatVersion:1,source:'sanitized actual event snapshots',total:byId.size,gifts:[...byId.values()].sort((a,b)=>a.name.localeCompare(b.name))},null,2),'utf8');
console.log(`Saved observed gift identity records: ${byId.size} total, ${added} new. NO usernames/user IDs or raw event bodies saved.`);
