export type Team = 'red' | 'blue';
export type UnitType = 'warrior' | 'archer' | 'tank' | 'mage' | 'boss';
export type OverflowPolicy = 'wait' | 'convert_heal' | 'convert_buff' | 'drop';
export type ActiveGame = 'mini-war' | 'cat-cafe' | 'english-class' | 'english-class-live';

export type LiveRoomStatus =
  | 'disconnected'      // TikFinity app not connected or explicitly sent disconnected
  | 'unknown'           // WebSocket to TikFinity port 21213 is open, but no room events received yet
  | 'active'            // Live events recently received (< 60s)
  | 'no_recent_events'; // Was active, but no events received in the last 60s (stream is quiet, NOT disconnected)

export interface BaseEvent {
  id: string;
  provider: 'mock' | 'tikfinity' | 'official' | (string & {});
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
    | 'english_class.join'
    | 'english_class.answer'
    | 'english_class.team'
    | 'english_class.gift'
    | 'english_class.like'
    | 'english_class.follow'
    | 'english_class.reset'
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
  connected: boolean;               // Provider is running
  wsConnected?: boolean;            // Underlying WebSocket connection is open
  liveRoomStatus: LiveRoomStatus;   // Multi-state LIVE room indicator
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
  giftId?: string | number;         // Optional provider-specific ID (e.g. "5655", "item_rose_01")
  aliases?: string[];              // Optional alternate names or localized titles (e.g. ["Hoa hồng", "Rose", "5655"])
  action: 'spawn_unit' | 'spawn_boss' | 'heal_team' | 'boost_team';
  unitType?: UnitType;
  multiplier: number;
  cooldownSec: number;
  maxSpawnPerEvent: number;
  enabled: boolean;
  description: string;
}
