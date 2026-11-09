import { mkdir, createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'https://beetgames.com/tiktok-gift-icons.zip';
const destDir = path.join(root, 'assets');
const dest = path.join(destDir, 'tiktok-gift-icons.zip');
const tmp = dest + '.part';
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 180000);
try {
  await fs.mkdir(destDir, { recursive: true });
  const res = await fetch(url, { signal: controller.signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length') || 0);
  if (total > 550 * 1024 * 1024) throw new Error('ZIP too large');
  let received = 0;
  const maxBytes = 550 * 1024 * 1024;
  const stream = Readable.fromWeb(res.body);
  stream.on('data', chunk => { received += chunk.length; if (received > maxBytes) stream.destroy(new Error('ZIP exceeded size limit')); });
  await pipeline(stream, createWriteStream(tmp));
  const fd = await fs.open(tmp, 'r');
  const sig = Buffer.alloc(4); await fd.read(sig, 0, 4, 0); await fd.close();
  if (sig[0] !== 0x50 || sig[1] !== 0x4b) throw new Error('Downloaded file is not a ZIP');
  await fs.rename(tmp, dest);
  console.log(`Saved ${dest} (${(received/1048576).toFixed(1)} MB).`);
  console.log('Extract only if you accept third-party intellectual-property terms. Original icons belong to TikTok/ByteDance.');
} catch (e) { try { await fs.rm(tmp, {force:true}); } catch {} console.error('ICON DOWNLOAD FAILED:', e.message); process.exitCode=1; }
finally { clearTimeout(timer); }
