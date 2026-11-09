import { CafeEventClient } from './CafeEventClient';
import { ParsedCafeCommand } from './CafeCommandAdapter';

export class MockEventHarness {
  private client: CafeEventClient;
  private userIndex = 1;

  constructor(client: CafeEventClient) {
    this.client = client;
  }

  public simulateJoin(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${this.userIndex++}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.join',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateFeed(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.feed',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulatePlay(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.play',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateNap(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.nap',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateLove(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.love',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateAngry(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.angry',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateDance(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.dance',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateZoomies(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.zoomies',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateBox(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.box',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateBath(customNick?: string): ParsedCafeCommand {
    const nick = customNick || `MèoCon_${Math.max(1, this.userIndex - 1)}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.bath',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }

  public simulateLion(customNick?: string): ParsedCafeCommand {
    return this.simulateGift('Lion', 1, customNick);
  }

  public simulateGift(giftName: string, count = 1, customNick?: string): ParsedCafeCommand {
    const nick = customNick || `FanCung_${this.userIndex++}`;
    const cmd: ParsedCafeCommand = {
      action: 'cat_cafe.gift_effect',
      userId: `mock_user_${nick.toLowerCase()}`,
      uniqueId: `@${nick.toLowerCase()}`,
      nickname: nick,
      metadata: { giftName, count },
    };
    (this.client as any).dispatchCommand(cmd);
    return cmd;
  }
}

