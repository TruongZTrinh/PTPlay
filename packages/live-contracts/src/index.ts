export type Team = 'red' | 'blue';
export type UnitType = 'warrior' | 'archer' | 'tank' | 'mage' | 'boss';
export type OverflowPolicy = 'wait' | 'convert_heal' | 'convert_buff' | 'drop';
export type ActiveGame = 'mini-war' | 'cat-cafe' | (string & {});

export type LiveRoomStatus =
  | 'disconnected'      // Provider not connected or stream stopped
  | 'unknown'           // Connected to transport/app, waiting for stream events
  | 'active'            // Live events recently received (< 60s)
  | 'no_recent_events'; // Stream is active but quiet

export interface BaseEvent {
  id: string;
  provider: 'mock' | 'tikfinity' | 'official' | 'synthetic' | (string & {});
  timestamp: number;
}

export interface NormalizedChatEvent extends BaseEvent {
  type: 'chat';
  userId: string;
  uniqueId: string;
  nickname: string;
  comment: string;
  profilePictureUrl?: string;
}

export interface NormalizedGiftEvent extends BaseEvent {
  type: 'gift';
  userId: string;
  uniqueId: string;
  nickname: string;
  giftId: string | number;
  giftName: string;
  diamondCount: number;
  repeatCount: number;
  deltaCount: number;
  repeatEnd: boolean;
  groupId?: string;
  profilePictureUrl?: string;
}

export interface NormalizedLikeEvent extends BaseEvent {
  type: 'like';
  userId: string;
  uniqueId: string;
  likeCount: number;
  totalLikeCount?: number;
}

export interface NormalizedFollowEvent extends BaseEvent {
  type: 'follow';
  userId: string;
  uniqueId: string;
  nickname: string;
}

export interface NormalizedRoomStatusEvent extends BaseEvent {
  type: 'room_status';
  roomConnected: boolean;
  roomId?: string;
  viewerCount?: number;
}

export type NormalizedLiveEvent =
  | NormalizedChatEvent
  | NormalizedGiftEvent
  | NormalizedLikeEvent
  | NormalizedFollowEvent
  | NormalizedRoomStatusEvent;

export interface GameCommand {
  id: string;
  action:
    | 'spawn_unit'
    | 'spawn_boss'
    | 'heal_team'
    | 'boost_team'
    | 'trigger_effect'
    | 'start_round'
    | 'reset_round'
    | 'pause_round'
    | 'resume_round'
    | 'join_team'
    | 'switch_theme'
    | 'toggle_fx'
    | 'clear_units'
    | 'set_core_hp'
    | 'set_round'
    | 'force_end_round'
    | 'boss_ability'
    | 'cat_cafe.join'
    | 'cat_cafe.feed'
    | 'cat_cafe.play'
    | 'cat_cafe.nap'
    | 'cat_cafe.love'
    | 'cat_cafe.call'
    | 'cat_cafe.photo'
    | 'cat_cafe.garden'
    | 'cat_cafe.switch_room'
    | 'cat_cafe.switch_atmosphere'
    | 'cat_cafe.add_purrs'
    | 'cat_cafe.set_purrs'
    | 'cat_cafe.set_level'
    | 'cat_cafe.set_volume'
    | 'cat_cafe.add_cat'
    | 'cat_cafe.clear_cats'
    | 'cat_cafe.gift_effect'
    | 'cat_cafe.reset'
    | 'cat_cafe.demo_spawn'
    | (string & {});
  team?: Team;
  unitType?: UnitType;
  count?: number;
  amount?: number;
  duration?: number;
  user?: {
    userId: string;
    uniqueId: string;
    nickname: string;
    team?: Team;
  };
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface ErrorLogItem {
  timestamp: number;
  source: 'TikFinity' | 'Bridge' | 'Security' | 'Game' | (string & {});
  message: string;
  details?: string;
}

export interface ProviderStatus {
  name: string;
  connected: boolean;
  wsConnected?: boolean;
  liveRoomStatus: LiveRoomStatus;
  liveRoomStatusText: string;
  endpoint: string;
  eventsReceived: number;
  errorsCount: number;
  lastEventTime: number | null;
  details?: string;
  roomInfo?: {
    roomId?: string;
    viewerCount?: number;
    lastEventTime?: number;
  };
}

export interface RawEventLogItem {
  id: string;
  timestamp: number;
  event: string;
  sanitizedJson: string;
}

export interface GiftMappingRule {
  id: string;
  giftName: string;
  giftId?: string | number;
  aliases?: string[];
  action: 'spawn_unit' | 'spawn_boss' | 'heal_team' | 'boost_team' | (string & {});
  unitType?: UnitType;
  multiplier: number;
  cooldownSec: number;
  maxSpawnPerEvent: number;
  enabled: boolean;
  description: string;
}

