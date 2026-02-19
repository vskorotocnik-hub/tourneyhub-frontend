/**
 * WoW (War of Worlds) strategy.
 * Map-based single-match tournaments.
 */

import type { GameTypeStrategy, PrizeResult } from '../types';

function defaultDist(tc: number): number[] {
  if (tc === 2) return [100, 0];
  if (tc === 3) return [70, 30, 0];
  if (tc === 4) return [50, 30, 20, 0];
  return [50, 30, 20, ...Array(tc - 3).fill(0)];
}

export const WowStrategy: GameTypeStrategy = {
  gameType: 'WOW',

  calculatePrizes(bet: number, teamCount: number, config?: { prizeDistribution?: string | null }): PrizeResult {
    const totalPool = bet * teamCount;
    const platformFee = totalPool * 0.1;
    const netPool = totalPool - platformFee;
    let dist: number[];
    try {
      dist = config?.prizeDistribution ? JSON.parse(config.prizeDistribution) : defaultDist(teamCount);
    } catch {
      dist = defaultDist(teamCount);
    }
    return { totalPool, platformFee, netPool, dist };
  },

  async startTournament(tx: any, tournamentId: string, _teamCount: number, userId: string, config?: any) {
    const map = config; // WoW passes the map object as config

    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    const teams = await tx.tournamentTeam.findMany({
      where: { tournamentId },
      orderBy: { slot: 'asc' },
      include: { players: { include: { user: { select: { username: true } } } } },
    });

    const match = await tx.tournamentMatch.findFirst({ where: { tournamentId } });
    if (match) {
      await tx.tournamentMatch.update({
        where: { id: match.id },
        data: { status: 'ACTIVE', teamAId: teams[0]?.id, teamBId: teams[1]?.id },
      });
    }

    const tn = (s: number) => {
      const t = teams.find((x: any) => x.slot === s);
      const c = t?.players.find((p: any) => p.isCaptain) || t?.players[0];
      return c?.user?.username || `Команда ${s}`;
    };
    const gids = (s: number) => {
      const t = teams.find((x: any) => x.slot === s);
      if (!t) return '';
      const r: string[] = [];
      for (const p of t.players) {
        if (p.gameId) r.push(p.gameId);
        if (p.partnerGameId) r.push(p.partnerGameId);
        for (const e of (p as any).extraIds || []) r.push(e);
      }
      return r.join(', ');
    };

    let msg = `🎮 WoW Матч начался!\n📍 ${map.name}\n🎯 ${map.format} • ${map.rounds}R\n\n`;
    for (let i = 0; i < teams.length; i++) msg += `⚔️ ${tn(i + 1)}\n`;
    await tx.tournamentMessage.create({ data: { tournamentId, userId, content: msg, isSystem: true } });

    let idMsg = '📋 PUBG ID:\n\n';
    for (let i = 0; i < teams.length; i++) idMsg += `👤 ${tn(i + 1)}: ${gids(i + 1)}\n`;
    idMsg += '\n👆 Добавьте друг друга и начните WoW';
    await tx.tournamentMessage.create({ data: { tournamentId, userId, content: idMsg, isSystem: true } });
  },
};
