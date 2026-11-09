export const PORTS = {
  BRIDGE: 8088,
  ADMIN: 8080,
  MINI_WAR: 5173,
  CAT_CAFE: 5174,
  TIKFINITY: 21213,
} as const;

export interface GameCapabilities {
  chatCommands?: boolean;
  giftStreaks?: boolean;
  teamBattles?: boolean;
  bossSpawns?: boolean;
  catInteractions?: boolean;
  progression?: boolean;
  [key: string]: boolean | undefined;
}

export interface GameRegistryItem {
  id: string;
  name: string;
  vietnameseName: string;
  genre: string;
  version: string;
  port: number;
  devCommand: string;
  buildCommand?: string;
  workspace: string;
  active: boolean;
  icon: string;
  capabilities: GameCapabilities;
  description?: string;
}

export interface PlatformConfig {
  version: string;
  platformName: string;
  bridgeEndpoint: string;
  adminPort: number;
  bridgePort: number;
  games: GameRegistryItem[];
}
