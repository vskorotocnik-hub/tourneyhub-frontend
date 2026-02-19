/**
 * TournamentService — shared business logic for all game types.
 * resolveMatch, completeTournament, bracket advancement.
 * Game-type-specific behaviour is delegated to strategies.
 */

import { prisma } from '../../shared/prisma';
import { emitTournamentUpdate, emitBalanceUpdate, emitGlobalTournamentChange } from '../../shared/socket';
import * as wallet from '../wallet';
import { calculateRatingChange } from './bracket';
import { getStrategy } from './strategies';

// ─── RESOLVE MATCH ───────────────────────────────────────────

export async function resolveMatch(tournamentId: string, matchId: string, winnerTeamId: string) {
  let completedTournament: any = null;

  await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: { orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }] },
        teams: { include: { players: true } },
      },
    });

    if (!tournament) return;

    // Mark match as completed
    await tx.tournamentMatch.update({
      where: { id: matchId },
      data: { status: 'COMPLETED', winnerId: winnerTeamId, completedAt: new Date() },
    });

    const completedMatch = tournament.matches.find(m => m.id === matchId)!;

    // Username lookup
    const allPlayerIds = tournament.teams.flatMap(t => t.players.map(p => p.userId));
    const users = await tx.user.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, username: true },
    });
    const usernameMap = Object.fromEntries(users.map((u: any) => [u.id, u.username]));
    const teamDisplayName = (teamId: string) => {
      const team = tournament.teams.find(t => t.id === teamId);
      if (!team) return 'Команда';
      const captain = team.players.find(p => p.isCaptain) || team.players[0];
      return captain ? (usernameMap[captain.userId] || `Команда ${team.slot}`) : `Команда ${team.slot}`;
    };
    const teamPubgIds = (teamId: string) => {
      const team = tournament.teams.find(t => t.id === teamId);
      if (!team) return '';
      const ids: string[] = [];
      for (const p of team.players) {
        if (p.gameId) ids.push(p.gameId);
        if (p.partnerGameId) ids.push(p.partnerGameId);
      }
      return ids.join(', ');
    };

    // System message
    const winnerTeam = tournament.teams.find(t => t.id === winnerTeamId);
    const winnerName = teamDisplayName(winnerTeamId);
    const roundName = completedMatch.round === 1
      ? (tournament.teamCount <= 3 ? 'первом раунде' : 'полуфинале')
      : 'финале';
    await tx.tournamentMessage.create({
      data: {
        tournamentId,
        userId: winnerTeam?.players[0]?.userId || tournament.creatorId,
        content: `🏆 ${winnerName} победил в ${roundName}!`,
        isSystem: true,
      },
    });

    // Check if there's a next round
    const nextRoundMatches = tournament.matches.filter(m => m.round === completedMatch.round + 1);

    if (nextRoundMatches.length > 0) {
      const nextMatch = nextRoundMatches[0];
      const updateData: Record<string, unknown> = {};
      if (!nextMatch.teamAId) {
        updateData.teamAId = winnerTeamId;
      } else if (!nextMatch.teamBId) {
        updateData.teamBId = winnerTeamId;
      }

      const willBeReady = (nextMatch.teamAId || updateData.teamAId) && (nextMatch.teamBId || updateData.teamBId);
      if (willBeReady) {
        updateData.status = 'ACTIVE';
      }

      await tx.tournamentMatch.update({
        where: { id: nextMatch.id },
        data: updateData,
      });

      if (willBeReady) {
        const finalTeamA = (updateData.teamAId || nextMatch.teamAId) as string;
        const finalTeamB = (updateData.teamBId || nextMatch.teamBId) as string;
        const nameA = teamDisplayName(finalTeamA);
        const nameB = teamDisplayName(finalTeamB);
        await tx.tournamentMessage.create({
          data: {
            tournamentId,
            userId: winnerTeam?.players[0]?.userId || tournament.creatorId,
            content: `⚔️ Финал начинается!\n\n${nameA} vs ${nameB}`,
            isSystem: true,
          },
        });
        const idsA = teamPubgIds(finalTeamA);
        const idsB = teamPubgIds(finalTeamB);
        await tx.tournamentMessage.create({
          data: {
            tournamentId,
            userId: winnerTeam?.players[0]?.userId || tournament.creatorId,
            content: `📋 ID для финала:\n\n👤 ${nameA}: ${idsA}\n👤 ${nameB}: ${idsB}\n\n👆 Добавьте друг друга и начните матч TDM`,
            isSystem: true,
          },
        });
      }
    } else {
      // This was the final — tournament is complete
      completedTournament = await completeTournamentInTx(tx, tournamentId, winnerTeamId);
    }
  });

  // Real-time: balance updates after tournament completion (prizes paid)
  if (completedTournament) {
    for (const team of completedTournament.teams) {
      for (const player of team.players) {
        const bal = await wallet.getBalance(player.userId);
        emitBalanceUpdate(player.userId, bal.balance, bal.ucBalance);
      }
    }
    emitGlobalTournamentChange();
  }

  // Real-time: notify all clients in this tournament room to refresh
  emitTournamentUpdate(tournamentId, { event: 'match_resolved', matchId, winnerTeamId });
}

// ─── COMPLETE TOURNAMENT (internal, runs inside tx) ──────────

async function completeTournamentInTx(tx: any, tournamentId: string, winnerTeamId: string) {
  const tournament = await tx.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { players: true } },
      matches: { where: { status: 'COMPLETED' }, orderBy: [{ round: 'desc' }, { matchOrder: 'asc' }] },
    },
  });

  if (!tournament) return tournament;

  // Resolve prize distribution via strategy
  const strategy = getStrategy(tournament.gameType);
  const { dist } = strategy.calculatePrizes(tournament.bet, tournament.teamCount);

  const allPlayerIds = tournament.teams.flatMap((t: any) => t.players.map((p: any) => p.userId));
  const users = await tx.user.findMany({
    where: { id: { in: allPlayerIds } },
    select: { id: true, username: true },
  });
  const usernameMap = Object.fromEntries(users.map((u: any) => [u.id, u.username]));

  // Placement order: winner 1st, final loser 2nd, rest 3rd+
  const placements: string[] = [winnerTeamId];
  const finalMatch = tournament.matches.find((m: any) =>
    m.round === (tournament.teamCount <= 3 ? (tournament.teamCount === 2 ? 1 : 2) : 2),
  );
  if (finalMatch) {
    const loserId = finalMatch.teamAId === winnerTeamId ? finalMatch.teamBId : finalMatch.teamAId;
    if (loserId) placements.push(loserId);
  }
  const remainingTeams = tournament.teams.filter((t: any) => !placements.includes(t.id));
  placements.push(...remainingTeams.map((t: any) => t.id));

  // Distribute prizes and update ratings
  for (let i = 0; i < placements.length; i++) {
    const teamId = placements[i];
    const team = tournament.teams.find((t: any) => t.id === teamId);
    if (!team) continue;

    const prizeAmount = Math.floor(Number(tournament.prizePool) * (dist[i] || 0));
    const isWinner = i === 0;
    const ratingChange = calculateRatingChange(tournament.bet, tournament.teamCount, isWinner);

    for (const player of team.players) {
      if (prizeAmount > 0) {
        await wallet.credit(tx, player.userId, prizeAmount, 'UC', {
          idempotencyKey: `tournament-${tournamentId}-prize-${player.userId}`,
          reason: 'tournament_prize',
          refType: 'tournament',
          refId: tournamentId,
        });
      }
      await tx.user.update({
        where: { id: player.userId },
        data: { rating: { increment: ratingChange } },
      });
    }
  }

  await tx.tournament.update({
    where: { id: tournamentId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  const winnerTeam = tournament.teams.find((t: any) => t.id === winnerTeamId);
  const prizeAmount = Math.floor(Number(tournament.prizePool) * dist[0]);
  await tx.tournamentMessage.create({
    data: {
      tournamentId,
      userId: winnerTeam?.players[0]?.userId || tournament.creatorId,
      content: `🎉 Турнир завершён! ${winnerTeam ? winnerTeam.players.map((p: any) => usernameMap[p.userId] || 'Игрок').join(', ') : 'Победитель'} получает ${prizeAmount} UC!`,
      isSystem: true,
    },
  });

  return tournament;
}

// ─── COMPLETE TOURNAMENT (public wrapper — called from admin) ─

export async function completeTournament(tournamentId: string, winnerTeamId: string) {
  const tournament = await prisma.$transaction(async (tx) => {
    return completeTournamentInTx(tx, tournamentId, winnerTeamId);
  });

  if (!tournament) return;

  for (const team of (tournament as any).teams) {
    for (const player of team.players) {
      const bal = await wallet.getBalance(player.userId);
      emitBalanceUpdate(player.userId, bal.balance, bal.ucBalance);
    }
  }

  emitGlobalTournamentChange();
}
