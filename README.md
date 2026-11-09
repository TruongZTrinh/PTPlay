# PTPlay Platform 🎮

> **Scalable Multi-Game TikTok LIVE Gaming Platform** — Built for 20+ interactive live games.

---

## 🏛️ Platform Architecture

```text
PTPlay/
│
├── apps/
│   ├── admin/                    # Central Management Portal (Port 8080)
│   └── bridge/                   # Shared Authoritative LIVE Bridge (Port 8088)
│
├── packages/
│   ├── game-sdk/                 # Shared Game Client & Sanitizer SDK
│   ├── live-contracts/           # Normalized Event & Command Contracts
│   └── shared-config/            # Central Ports & Registry Types
│
├── games/
│   ├── mini-war-arena/           # Game 01: 2D Cartoon Auto-Battler (Port 5173)
│   ├── cat-cafe/                 # Game 02: Cozy Cat Simulator (Port 5174)
│   └── ...                       # Future Games
│
├── config/
│   └── games.json                # Typed Central Game Registry
│
├── scripts/
│   ├── start-platform.mjs        # Master Platform Orchestrator
│   └── validate-games.mjs        # Game Registry Validator
│
├── RUN_PTPLAY_WINDOWS.bat        # 1-Click Master Launcher for Windows
└── package.json                  # NPM Workspaces Monorepo
```

---

## 🚀 Quick Start

### 1. Master Launcher (Windows)
Double-click `RUN_PTPLAY_WINDOWS.bat` or run:
```cmd
RUN_PTPLAY_WINDOWS.bat
```

### 2. Command Line (NPM)
```bash
# 1. Install all dependencies across all packages & games (Linked once)
npm install

# 2. Validate Game Registry
npm run validate

# 3. Start authoritative LIVE Bridge + Admin + Mini War Arena
npm start

# Or start with Café Mòe:
npm run start:catcafe
```

---

## 🔌 Default Ports

| Component | Port | Description |
| :--- | :--- | :--- |
| **LIVE Bridge** | `8088` | Authoritative TikTok event ingestion & WebSocket pipeline |
| **Bridge Dashboard** | `8088/admin` | Streamer control room & diagnostic probe |
| **Central Admin** | `8080` | Unified platform manager & multi-game process supervisor |
| **Mini War Arena** | `5173` | Game 1: Red vs Blue auto-battler |
| **Café Mòe** | `5174` | Game 2: 9:16 mobile portrait interactive cat café |
| **TikFinity Desktop** | `21213` | External desktop connector (optional if using mock or synthetic) |

---

## ➕ Adding a New Game (in 5 Minutes)

1. Create `games/<your-new-game>/`
2. In `package.json`, set `"dependencies": { "@ptplay/game-sdk": "*" }`
3. Connect with standard SDK:
   ```typescript
   import { PTPlayGameClient } from '@ptplay/game-sdk';
   const client = new PTPlayGameClient('your-new-game');
   client.onCommand((cmd) => {
     console.log('Action from TikTok:', cmd.action);
   });
   client.connect();
   ```
4. Register your game in [`config/games.json`](file:///config/games.json) with an available port.
5. Run `npm run validate`. Done!
