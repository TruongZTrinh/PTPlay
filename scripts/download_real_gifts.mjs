import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const vnCatalogPath = path.join(ROOT, 'packages', 'gift-catalog', 'data', 'tiktok-gifts.vn.json');
const allCatalogPath = path.join(ROOT, 'packages', 'gift-catalog', 'data', 'tiktok-gifts.all.json');

const vn = JSON.parse(fs.readFileSync(vnCatalogPath, 'utf8'));
const all = JSON.parse(fs.readFileSync(allCatalogPath, 'utf8'));

// Target directories
const dirs = [
  path.join(ROOT, 'packages', 'gift-catalog', 'assets', 'icons'),
  path.join(ROOT, 'apps', 'admin', 'public', 'assets', 'gifts'),
  path.join(ROOT, 'games', 'cat-cafe', 'public', 'assets', 'cafe-moe-v3', 'gifts'),
  path.join(ROOT, 'games', 'cat-cafe', 'dist', 'assets', 'cafe-moe-v3', 'gifts'),
];

for (const d of dirs) {
  fs.mkdirSync(d, { recursive: true });
}

// Map of key gift names to canonical filename
const giftsToDownload = [
  { slug: 'rose', url: 'https://beetgames.com/images/gifts/rose.webp' },
  { slug: 'heart', url: 'https://beetgames.com/images/gifts/heart.webp' },
  { slug: 'lion', url: 'https://beetgames.com/images/gifts/lion.webp' },
  { slug: 'tiktok_universe', url: 'https://beetgames.com/images/gifts/tiktok_universe.webp' },
  { slug: 'birthday_cake', url: 'https://beetgames.com/images/gifts/birthday_cake.webp' },
  { slug: 'fireworks', url: 'https://beetgames.com/images/gifts/fireworks.webp' },
  { slug: 'perfume', url: 'https://beetgames.com/images/gifts/perfume.webp' },
  { slug: 'coffee', url: 'https://beetgames.com/images/gifts/coffee.webp' },
  { slug: 'ice_cream', url: 'https://beetgames.com/images/gifts/ice_cream.webp' },
  { slug: 'crown', url: 'https://beetgames.com/images/gifts/crown.webp' },
  { slug: 'cheese_donuts', url: 'https://beetgames.com/images/gifts/cheese_donuts.webp' },
  { slug: 'gift_box', url: 'https://beetgames.com/images/gifts/gift_box.webp' },
  { slug: 'gold_microphone', url: 'https://beetgames.com/images/gifts/gold_microphone.webp' },
  { slug: 'shell_castle', url: 'https://beetgames.com/images/gifts/shell_castle.webp' },
  { slug: 'sweetheart_macaron', url: 'https://beetgames.com/images/gifts/sweetheart_macaron.webp' },
  { slug: 'whale_diving', url: 'https://beetgames.com/images/gifts/whale_diving.webp' },
  { slug: 'friendship_necklace', url: 'https://beetgames.com/images/gifts/friendship_necklace.webp' },
  { slug: 'treasure_clover', url: 'https://beetgames.com/images/gifts/treasure_clover.webp' },
  { slug: 'luxury_yacht', url: 'https://beetgames.com/images/gifts/luxury_yacht.webp' },
  { slug: 'bouquet', url: 'https://beetgames.com/images/gifts/bouquet.webp' },
  { slug: 'star', url: 'https://beetgames.com/images/gifts/star.webp' },
  { slug: 'sparklers', url: 'https://beetgames.com/images/gifts/sparklers.webp' },
  { slug: 'paw', url: 'https://beetgames.com/images/gifts/paw.webp' },
  { slug: 'choc_chip_cookie', url: 'https://beetgames.com/images/gifts/choc_chip_cookie.webp' },
  { slug: 'blow_a_kiss', url: 'https://beetgames.com/images/gifts/blow_a_kiss.webp' },
  { slug: 'blue_lightning', url: 'https://beetgames.com/images/gifts/blue_lightning.webp' },
  { slug: 'club_cheers', url: 'https://beetgames.com/images/gifts/club_cheers.webp' },
  { slug: 'coldy', url: 'https://beetgames.com/images/gifts/coldy.webp' },
  { slug: 'community_gift', url: 'https://beetgames.com/images/gifts/community_gift.webp' },
  { slug: 'community_heart', url: 'https://beetgames.com/images/gifts/community_heart.webp' },
  { slug: 'eye_for_an_eye', url: 'https://beetgames.com/images/gifts/eye_for_an_eye.webp' },
  { slug: 'a_shard_of_hope', url: 'https://beetgames.com/images/gifts/a_shard_of_hope.webp' },
  { slug: 'galaxy', url: 'https://beetgames.com/images/gifts/galaxy.webp' },
  { slug: 'capybara', url: 'https://beetgames.com/images/gifts/capybara.webp' },
  { slug: 'paper_crane', url: 'https://beetgames.com/images/gifts/paper_crane.webp' },
  { slug: 'dragon', url: 'https://beetgames.com/images/gifts/dragon.webp' },
  { slug: 'magic_mirror', url: 'https://beetgames.com/images/gifts/magic_mirror.webp' },
  { slug: 'sunglasses', url: 'https://beetgames.com/images/gifts/sunglasses.webp' },
  { slug: 'flying_jets', url: 'https://beetgames.com/images/gifts/flying_jets.webp' },
  { slug: 'gaming_chair', url: 'https://beetgames.com/images/gifts/gaming_chair.webp' },
  { slug: 'money_gun', url: 'https://beetgames.com/images/gifts/money_gun.webp' },
  { slug: 'boxing_gloves', url: 'https://beetgames.com/images/gifts/boxing_gloves.webp' },
  { slug: 'diamond_ring', url: 'https://beetgames.com/images/gifts/diamond_ring.webp' },
];

// Mapping for Cat Cafe game assets
const catCafeAssetAliases = {
  'lion.png': 'lion.webp',
  'lion.webp': 'lion.webp',
  'rose.png': 'rose.webp',
  'rose.webp': 'rose.webp',
  'rose_premium.png': 'rose.webp',
  'heart.png': 'heart.webp',
  'heart.webp': 'heart.webp',
  'heart_premium.png': 'heart.webp',
  'cake.png': 'birthday_cake.webp',
  'cake.webp': 'birthday_cake.webp',
  'universe.png': 'tiktok_universe.webp',
  'universe.webp': 'tiktok_universe.webp',
  'universe_premium.png': 'tiktok_universe.webp',
  'fireworks.png': 'fireworks.webp',
  'fireworks.webp': 'fireworks.webp',
  'perfume.png': 'perfume.webp',
  'perfume.webp': 'perfume.webp',
  'coffee.png': 'coffee.webp',
  'coffee.webp': 'coffee.webp',
  'ice_cream.png': 'ice_cream.webp',
  'ice_cream.webp': 'ice_cream.webp',
  'crown.png': 'crown.webp',
  'crown.webp': 'crown.webp',
  'donut.png': 'cheese_donuts.webp',
  'donut.webp': 'cheese_donuts.webp',
  'gift_box.png': 'gift_box.webp',
  'gift_box.webp': 'gift_box.webp',
  'gift_box_premium.png': 'gift_box.webp',
  'flower_bouquet.png': 'bouquet.webp',
  'flower_bouquet.webp': 'bouquet.webp',
  'star.png': 'star.webp',
  'star.webp': 'star.webp',
  'sparkle.png': 'sparklers.webp',
  'sparkle.webp': 'sparklers.webp',
  'cookie.png': 'choc_chip_cookie.webp',
  'cookie.webp': 'choc_chip_cookie.webp',
  'whale.png': 'whale_diving.webp',
  'whale.webp': 'whale_diving.webp',
  'castle.png': 'shell_castle.webp',
  'castle.webp': 'shell_castle.webp',
  'car.png': 'sweetheart_macaron.webp',
  'car.webp': 'sweetheart_macaron.webp',
  'microphone.png': 'gold_microphone.webp',
  'microphone.webp': 'gold_microphone.webp',
  'treasure.png': 'treasure_clover.webp',
  'treasure.webp': 'treasure_clover.webp',
  'ship.png': 'luxury_yacht.webp',
  'ship.webp': 'luxury_yacht.webp',
  'paw.png': 'paw.webp',
  'paw.webp': 'paw.webp',
};

async function main() {
  console.log(`Downloading ${giftsToDownload.length} key gifts...`);
  const downloaded = new Map();

  for (const item of giftsToDownload) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) {
        console.warn(`Failed ${item.slug}: HTTP ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      downloaded.set(`${item.slug}.webp`, buf);

      // Save to packages/gift-catalog/assets/icons and apps/admin/public/assets/gifts
      fs.writeFileSync(path.join(dirs[0], `${item.slug}.webp`), buf);
      fs.writeFileSync(path.join(dirs[1], `${item.slug}.webp`), buf);
      console.log(`✓ ${item.slug}.webp (${buf.length} bytes)`);
    } catch (e) {
      console.error(`Error ${item.slug}:`, e.message);
    }
  }

  // Populate Cat Cafe public and dist assets
  for (const [targetName, sourceWebp] of Object.entries(catCafeAssetAliases)) {
    const buf = downloaded.get(sourceWebp);
    if (buf) {
      fs.writeFileSync(path.join(dirs[2], targetName), buf);
      fs.writeFileSync(path.join(dirs[3], targetName), buf);
      console.log(`✓ Cat Cafe: ${targetName} <= ${sourceWebp}`);
    }
  }

  console.log('Done downloading and syncing gift assets!');
}

main().catch(console.error);
