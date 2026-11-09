import { Team } from '../types/events.js';

export interface UserTeamRecord {
  userId: string;
  uniqueId: string;
  nickname: string;
  team: Team;
  updatedAt: number;
}

export class TeamManager {
  private userTeams: Map<string, UserTeamRecord> = new Map();
  public allowSwitchTeam = true;
  public defaultPolicy: 'auto_balance' | 'red' | 'blue' | 'ignore' = 'auto_balance';

  public processComment(
    user: { userId: string; uniqueId: string; nickname: string },
    comment: string
  ): { joined: boolean; team?: Team; oldTeam?: Team; reason?: string } {
    const text = comment.trim().toLowerCase();

    // Regex patterns for Red vs Blue
    const isRed = /(^|\s)(đỏ|do|red|phe\s*đỏ|team\s*đỏ|team\s*red|🔴)(\s|$|[!?.])/i.test(text);
    const isBlue = /(^|\s)(xanh|blue|phe\s*xanh|team\s*xanh|team\s*blue|🔵)(\s|$|[!?.])/i.test(text);

    if (isRed && isBlue) {
      return { joined: false, reason: 'Chứa cả hai từ khóa ĐỎ và XANH' };
    }

    let targetTeam: Team | null = null;
    if (isRed) targetTeam = 'red';
    else if (isBlue) targetTeam = 'blue';

    if (!targetTeam) {
      return { joined: false, reason: 'Không có từ khóa chọn đội' };
    }

    const existing = this.userTeams.get(user.userId);
    if (existing) {
      if (existing.team === targetTeam) {
        return { joined: false, team: targetTeam, reason: 'Đã thuộc đội này từ trước' };
      }
      if (!this.allowSwitchTeam) {
        return { joined: false, team: existing.team, reason: 'Cấu hình không cho phép đổi đội' };
      }
      const oldTeam = existing.team;
      existing.team = targetTeam;
      existing.updatedAt = Date.now();
      existing.nickname = user.nickname;
      existing.uniqueId = user.uniqueId;
      return { joined: true, team: targetTeam, oldTeam };
    }

    const record: UserTeamRecord = {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      team: targetTeam,
      updatedAt: Date.now(),
    };
    this.userTeams.set(user.userId, record);
    return { joined: true, team: targetTeam };
  }

  public resolveUserTeam(
    user: { userId: string; uniqueId: string; nickname: string },
    currentUnitsRed = 0,
    currentUnitsBlue = 0
  ): Team | null {
    const existing = this.userTeams.get(user.userId);
    if (existing) return existing.team;

    if (this.defaultPolicy === 'ignore') {
      return null;
    }

    let assignedTeam: Team;
    if (this.defaultPolicy === 'auto_balance') {
      assignedTeam = currentUnitsRed <= currentUnitsBlue ? 'red' : 'blue';
    } else {
      assignedTeam = this.defaultPolicy;
    }

    this.userTeams.set(user.userId, {
      userId: user.userId,
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      team: assignedTeam,
      updatedAt: Date.now(),
    });

    return assignedTeam;
  }

  public getUserTeam(userId: string): Team | undefined {
    return this.userTeams.get(userId)?.team;
  }

  public getTeamCounts(): { red: number; blue: number } {
    let red = 0;
    let blue = 0;
    for (const record of this.userTeams.values()) {
      if (record.team === 'red') red++;
      else if (record.team === 'blue') blue++;
    }
    return { red, blue };
  }

  public getAllMembers(): UserTeamRecord[] {
    return Array.from(this.userTeams.values());
  }

  public clear(): void {
    this.userTeams.clear();
  }
}

