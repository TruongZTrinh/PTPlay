# ☕ Café Mòe — Visual Art & UI Architecture Guide (V2)

## 1. Overview & Visual Direction

Café Mòe V2 transforms the live interactive cat café game into a cozy, storybook-style 2D indie game designed specifically for 9:16 mobile portrait streaming on TikTok LIVE.

The core philosophy separates **Visual Presentation** from **Gameplay & Event Handling**:
- **Gameplay Engine & AI**: Manages cat personalities, hunger, energy, happiness, pathfinding, and viewer ownership.
- **PTPlay LIVE Bridge / TikFinity**: Handles viewer comments, join commands (`MÈO`), interactions (`ĂN`, `CHƠI`, `NGỦ`, `YÊU`, etc.), gifts (`Rose`, `Heart`, `Universe`), deduplication, and rate limiting.
- **CafePresentation Layer**: Renders illustrated environments, depth-sorted furniture, animated cat sprites, volumetric atmospheric lighting, ambient particles, and the 9:16 broadcast HUD.

---

## 2. Visual Architecture & Layering

The visual system is organized into 5 distinct depths:

```
Layer 5 (Depth 2000): Broadcast Interface
  ├── Carved Wooden Signboard (PTPlay Café Mòe • 📍 Quán Chính)
  ├── Level Milestone & Purrs Progress Bar
  ├── Cat Count Pill (🐱 4/20 Mèo)
  ├── LIVE Status Indicator (🟢 LIVE Online)
  ├── Settings Gear Button (⚙️)
  ├── Floating Lofi Music Banner with Animated Equalizer Bars
  ├── Peekaboo Cat Head (peeking over parchment command card)
  ├── Parchment Scroll Command Panel (🐾 MÈO, 🐟 ĂN, 🧶 CHƠI, 💤 NGỦ, 💖 YÊU)
  └── Special Gifts Highlight Strip (Rose, Heart, Universe)

Layer 4 (Depth 800 - 900): Atmospheric Effects & Lighting
  ├── Volumetric Sunbeams streaming through window
  ├── Ambient Dust Motes & Sakura Petals
  └── Time-of-Day / Weather Tint Overlays (Sunset Amber, Midnight Indigo, Rain)

Layer 3 (Depth 400 - 750): Characters & Depth Sorting
  ├── Animated 2D Illustrated Cat Sprites (8 Breeds × Poses)
  ├── Coordinated Nametags with Staggered Heights
  └── State Poses: Sitting, Lounging Curled Up, Playful Batting, Eating

Layer 2 (Depth 20 - 720): Interactive Furniture & Props
  ├── Plush Quilted Donut Cat Bed (Left Floor)
  ├── Multi-Tiered Sisal Cat Tree (Right Floor)
  ├── Bohemian Circular Paw-Print Rug (Center Floor)
  ├── Low Round Coffee Table with Cat Latte Art & Daisies (Foreground Right)
  ├── Ceramic Food Bowls with Fish Treats (Counter Edge)
  └── Toys: Pink Yarn Ball & Blue Fabric Fish

Layer 1 (Depth 0): Room Background
  ├── Arched Center Window overlooking Cherry Blossom Tree & Blue Sky
  ├── Ruffled Cream Curtains with Bow Tiebacks
  ├── Chalkboard Menu "Café Mòe ❤️" with Steaming Latte Art
  ├── Bookshelf with Succulents, Books, and Maneki-Neko Lucky Cat
  ├── Service Counter with Pastry Case, Cakes, Espresso Machine & Fishbowl
  └── Warm Honey Hardwood Plank Flooring with Natural Grain
```

---

## 3. Cat Coat Breeds & Animated Poses

All 8 illustrated cat breeds maintain deterministic hashing from TikTok viewer IDs:

1. **Mướp Cam Đáng Yêu (Ginger Tabby)**: Amber-orange coat with darker honey stripes, emerald green eyes.
2. **Bạch Tuyết Kiêu Kỳ (Pure White Cloud)**: Fluffy white coat, pink ears, sparkling sky-blue eyes.
3. **Xám Tro Lạnh Lùng (Smoky Slate Gray)**: Slate blue-gray coat, silver chest, amber-gold eyes.
4. **Tuxedo Quý Tộc (Tuxedo Gentleman)**: Midnight coat with white bib, white socks, lime green eyes.
5. **Tam Thể May Mắn (Calico Lucky Charm)**: Calico patches, golden bell collar, seafoam green eyes.
6. **Mun Đen Huyền Bí (Midnight Black)**: Jet black coat, bright yellow topaz eyes.
7. **Vàng Kem Dịu Dàng (Honey Cream)**: Soft cream pastel, honey markings, turquoise eyes.
8. **Xiêm Quý Phái (Royal Siamese)**: Cream body, dark chocolate mask, ears, and sapphire eyes.

### Dynamic Pose States:
- `sit`: Upright, alert sitting posture with breathing tween and head tilt.
- `sleep`: Curled up peacefully on side/paws with closed eyes, slow breathing, and floating `zZ` sleep particles.
- `play`: Playfully rolling on back/side with batting paws and open laughing mouth.
- `eat`: Head bobbing toward ceramic food bowl with heart pop effects and crunch audio.
- `react`: Bouncing joyfully with floating heart shower upon receiving `YÊU` or likes.

---

## 4. Mobile 9:16 Broadcast Interface

Designed specifically for TikTok LIVE mobile viewing:
- **Clean Stream**: Streamer diagnostic buttons are moved to the Streamer Modal (`⚙️` or `TAB`/`ESC`), keeping the broadcast feed uncluttered.
- **Top Safe Zone**: Compact 90px header fits cleanly above live streams without obstructing game action.
- **Bottom Safe Zone**: Parchment command card is neatly tucked in the lower quadrant (`y: 760 - 950`), accounting for TikTok's live chat overlay and gift banners.
- **Legibility**: High-contrast typography with dark stroke outlines ensures crystal-clear readability on 540×960 and 1080×1920 phone displays.

---

## 5. Verification & Performance

- **Automated Tests**: 26 passed, 0 failed (`npm test`).
- **Production Build**: Clean compilation with Vite & TypeScript (`npm run build`).
- **Framerate Target**: Solid 60 FPS on WebGL/Canvas with optimized SVG texture caching.

