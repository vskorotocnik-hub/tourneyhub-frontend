/**
 * TDM (Team Deathmatch) strategy.
 * Bracket-based tournaments with rating-window matchmaking.
 */

import type { GameTypeStrategy, PrizeResult } from '../types';
import { generateBracket } from '../bracket';

export const TdmStrategy: GameTypeStrategy = {
  gameType: 'TDM',

  calculatePrizes(bet: number, teamCount: number): PrizeResult {
    const totalPool = bet * teamCount;
    const platformFee = totalPool * 0.1;
    const netPool = totalPool - platformFee;

    const distributions: Record<number, number[]> = {
      2: [1.0, 0],
      3: [0.6, 0.3, 0.1],
      4: [0.5, 0.25, 0.15, 0.1],
    };
    const dist = distributions[teamCount] || distributions[2];
    return { totalPool, platformFee, netPool, dist };
  },

  async startTournament(tx: any, tournamentId: string, teamCount: number, userId: string) {
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    const allTeams = await tx.tournamentTeam.findMany({
      where: { tournamentId },
      orderBy: { slot: 'asc' },
      include: { players: { include: { user: { select: { username: true } } } } },
    });

    const matches = await tx.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
    });

    // Helper: get team display name (captain username)
    const teamName = (slot: number) => {
      const team = allTeams.find((t: any) => t.slot === slot);
      if (!team) return `Команда ${slot}`;
      const captain = team.players.find((p: any) => p.isCaptain) || team.players[0];
      return captain?.user?.username || `Команда ${slot}`;
    };

    // Helper: get team PUBG IDs (includes partner IDs for DUO)
    const teamGameIds = (slot: number) => {
      const team = allTeams.find((t: any) => t.slot === slot);
      if (!team) return '';
      const ids: string[] = [];
      for (const p of team.players) {
        if (p.gameId) ids.push(p.gameId);
        if (p.partnerGameId) ids.push(p.partnerGameId);
      }
      return ids.join(', ');
    };

    const bracket = generateBracket(teamCount);
    for (let i = 0; i < bracket.length; i++) {
      const b = bracket[i];
      const match = matches[i];
      if (!match) continue;

      const updateData: Record<string, unknown> = {};
      if (b.teamASlot) {
        const tA = allTeams.find((t: any) => t.slot === b.teamASlot);
        if (tA) updateData.teamAId = tA.id;
      }
      if (b.teamBSlot) {
        const tB = allTeams.find((t: any) => t.slot === b.teamBSlot);
        if (tB) updateData.teamBId = tB.id;
      }
      if (b.round === 1) updateData.status = 'ACTIVE';

      if (Object.keys(updateData).length > 0) {
        await tx.tournamentMatch.update({ where: { id: match.id }, data: updateData });
      }
    }

    // Bracket announcement with real usernames
    const bracketMsg = teamCount === 2
      ? `🏆 Турнир начался!\n\n⚔️ Финал: ${teamName(1)} vs ${teamName(2)}`
      : teamCount === 3
      ? `🏆 Турнир начался!\n\n⚔️ Раунд 1: ${teamName(1)} vs ${teamName(2)}\n⏳ ${teamName(3)} ждёт финала`
      : `🏆 Турнир начался!\n\n⚔️ ПФ 1: ${teamName(1)} vs ${teamName(2)}\n⚔️ ПФ 2: ${teamName(3)} vs ${teamName(4)}`;

    await tx.tournamentMessage.create({
      data: { tournamentId, userId, content: bracketMsg, isSystem: true },
    });

    // Send PUBG IDs for the first active match
    const firstBracket = bracket[0];
    if (firstBracket?.teamASlot && firstBracket?.teamBSlot) {
      const idsA = teamGameIds(firstBracket.teamASlot);
      const idsB = teamGameIds(firstBracket.teamBSlot);
      const nameA = teamName(firstBracket.teamASlot);
      const nameB = teamName(firstBracket.teamBSlot);
      const idsMsg = `📋 ID для матча:\n\n👤 ${nameA}: ${idsA}\n👤 ${nameB}: ${idsB}\n\n👆 Добавьте друг друга в PUBG Mobile и начните матч TDM`;
      await tx.tournamentMessage.create({
        data: { tournamentId, userId, content: idsMsg, isSystem: true },
      });
    }

    // For 4-team tournaments, also send IDs for second semi-final
    if (teamCount === 4 && bracket[1]?.teamASlot && bracket[1]?.teamBSlot) {
      const idsA = teamGameIds(bracket[1].teamASlot);
      const idsB = teamGameIds(bracket[1].teamBSlot);
      const nameA = teamName(bracket[1].teamASlot);
      const nameB = teamName(bracket[1].teamBSlot);
      const idsMsg = `📋 ID для ПФ 2:\n\n👤 ${nameA}: ${idsA}\n👤 ${nameB}: ${idsB}\n\n👆 Добавьте друг друга и начните матч TDM`;
      await tx.tournamentMessage.create({
        data: { tournamentId, userId, content: idsMsg, isSystem: true },
      });
    }
  },
};
