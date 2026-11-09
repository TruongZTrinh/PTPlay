import { GiftMappingRule, GameCommand, NormalizedGiftEvent, Team } from '../types/events.js';

export class GiftMapper {
  private rules: Map<string, GiftMappingRule> = new Map();
  private lastTriggered: Map<string, number> = new Map(); // key = ruleId + userId
  private idCounter = 1;

  constructor() {
    this.initDefaultRules();
  }

  private initDefaultRules(): void {
    const defaultRules: GiftMappingRule[] = [
      {
        id: 'rule_rose',
        giftName: 'Rose',
        giftId: 5655,
        aliases: ['hoa hồng', 'bông hồng', 'red rose', 'rose'],
        action: 'spawn_unit',
        unitType: 'warrior',
        multiplier: 2, // 1 Rose = 2 Warriors
        cooldownSec: 0,
        maxSpawnPerEvent: 20,
        enabled: true,
        description: 'Triệu hồi Chiến Binh (Warrior) x2',
      },
      {
        id: 'rule_heart',
        giftName: 'Heart',
        giftId: 'heart_01',
        aliases: ['tim', 'trái tim', 'love heart'],
        action: 'spawn_unit',
        unitType: 'archer',
        multiplier: 2, // 1 Heart = 2 Archers
        cooldownSec: 0.5,
        maxSpawnPerEvent: 10,
        enabled: true,
        description: 'Triệu hồi Cung Thủ (Archer) x2',
      },
      {
        id: 'rule_fireworks',
        giftName: 'Fireworks',
        aliases: ['pháo hoa', 'phao hoa'],
        action: 'spawn_unit',
        unitType: 'tank',
        multiplier: 1, // 1 Fireworks = 1 Tank
        cooldownSec: 2,
        maxSpawnPerEvent: 4,
        enabled: true,
        description: 'Triệu hồi Hộ Vệ Giáp Thép (Tank)',
      },
      {
        id: 'rule_icecream',
        giftName: 'Ice Cream',
        aliases: ['kem', 'ice cream cone'],
        action: 'spawn_unit',
        unitType: 'mage',
        multiplier: 1,
        cooldownSec: 1,
        maxSpawnPerEvent: 6,
        enabled: true,
        description: 'Triệu hồi Pháp Sư (Mage)',
      },
      {
        id: 'rule_lion',
        giftName: 'Lion',
        aliases: ['sư tử', 'su tu'],
        action: 'spawn_boss',
        unitType: 'boss',
        multiplier: 1,
        cooldownSec: 10,
        maxSpawnPerEvent: 1,
        enabled: true,
        description: 'Triệu hồi ĐẠI TƯỚNG BOSS!',
      },
      {
        id: 'rule_dragon',
        giftName: 'Dragon',
        aliases: ['rồng', 'rong'],
        action: 'spawn_boss',
        unitType: 'boss',
        multiplier: 1,
        cooldownSec: 10,
        maxSpawnPerEvent: 1,
        enabled: true,
        description: 'Triệu hồi ĐẠI TƯỚNG BOSS!',
      },
      {
        id: 'rule_medkit',
        giftName: 'Medkit',
        aliases: ['hộp cứu thương', 'túi cứu thương', 'heal'],
        action: 'heal_team',
        multiplier: 1,
        cooldownSec: 5,
        maxSpawnPerEvent: 1,
        enabled: true,
        description: 'Hồi phục +250 HP Thành Trì',
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  public findRule(giftName?: string, giftId?: string | number): GiftMappingRule | undefined {
    const lower = (giftName || '').toLowerCase().trim();
    const idStr = giftId !== undefined && giftId !== null ? String(giftId).toLowerCase().trim() : '';

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // 1. Direct match by provider giftId if rule defines one
      if (rule.giftId !== undefined && rule.giftId !== null) {
        const ruleIdStr = String(rule.giftId).toLowerCase().trim();
        if (idStr && ruleIdStr === idStr) {
          return rule;
        }
        if (lower && ruleIdStr === lower) {
          return rule;
        }
      }

      // 2. Direct match by giftName
      if (lower && rule.giftName.toLowerCase().trim() === lower) {
        return rule;
      }

      // 3. Match aliases if rule defines aliases
      if (rule.aliases && Array.isArray(rule.aliases)) {
        for (const alias of rule.aliases) {
          const lowerAlias = alias.toLowerCase().trim();
          if (lower && lowerAlias === lower) {
            return rule;
          }
          if (idStr && lowerAlias === idStr) {
            return rule;
          }
        }
      }
    }
    return undefined;
  }

  public mapGiftToCommand(
    event: NormalizedGiftEvent,
    team: Team,
    deltaCount: number
  ): { command?: GameCommand; reason?: string } {
    const rule = this.findRule(event.giftName, event.giftId);
    if (!rule) {
      // Unmapped gift fallback: spawn 1 warrior per unit count so viewer engagement is never wasted
      return {
        command: {
          id: `cmd_${Date.now()}_${this.idCounter++}`,
          action: 'spawn_unit',
          team,
          unitType: 'warrior',
          count: Math.min(10, Math.max(1, deltaCount)),
          user: {
            userId: event.userId,
            uniqueId: event.uniqueId,
            nickname: event.nickname,
            team,
          },
          metadata: { giftName: event.giftName, unmappedFallback: true },
          timestamp: Date.now(),
        },
      };
    }

    if (!rule.enabled) {
      return { reason: `Quy tắc mapping cho quà '${event.giftName}' đang bị tắt` };
    }

    // Cooldown check per user + rule
    const now = Date.now();
    const cooldownKey = `${rule.id}_${event.userId}`;
    const lastTime = this.lastTriggered.get(cooldownKey) || 0;
    if (rule.cooldownSec > 0 && now - lastTime < rule.cooldownSec * 1000) {
      return { reason: `Quà '${event.giftName}' đang trong thời gian hồi (${rule.cooldownSec}s)` };
    }
    this.lastTriggered.set(cooldownKey, now);

    // Compute spawn quantity
    const totalCount = Math.min(rule.maxSpawnPerEvent, Math.max(1, deltaCount * rule.multiplier));

    const command: GameCommand = {
      id: `cmd_${Date.now()}_${this.idCounter++}`,
      action: rule.action,
      team,
      unitType: rule.unitType,
      count: totalCount,
      amount: rule.action === 'heal_team' ? 250 : undefined,
      duration: rule.action === 'boost_team' ? 10 : undefined,
      user: {
        userId: event.userId,
        uniqueId: event.uniqueId,
        nickname: event.nickname,
        team,
      },
      metadata: {
        giftName: event.giftName,
        ruleId: rule.id,
        repeatCount: event.repeatCount,
      },
      timestamp: now,
    };

    return { command };
  }

  public getAllRules(): GiftMappingRule[] {
    return Array.from(this.rules.values());
  }

  public saveRule(rule: GiftMappingRule): void {
    if (!rule.id) rule.id = `rule_${Date.now()}`;
    this.rules.set(rule.id, rule);
  }

  public deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  public toggleRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = !rule.enabled;
      return rule.enabled;
    }
    return false;
  }
}

