import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { emitBalanceUpdate, emitTournamentStarted, emitGlobalTournamentChange } from '../shared/socket';
import { prisma } from '../shared/prisma';
import { withRetry } from '../shared/retry';
import * as wallet from '../domains/wallet';
import { WowStrategy } from '../domains/tournament';

const router = Router();

function tmFromPPT(p: number) {
  return p === 1 ? 'SOLO' : p === 2 ? 'DUO' : p === 3 ? 'TRIO' : 'SQUAD' as const;
}

// startWoW delegates to WowStrategy
const startWoW = (tx: any, tid: string, map: any, uid: string) =>
  WowStrategy.startTournament(tx, tid, map.teamCount, uid, map);

// ─── PUBLIC ROUTES ────────────────────────────────────────────

router.get('/maps', async (_req: Request, res: Response) => {
  try {
    const maps = await prisma.woWMap.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
    res.json({ maps });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
});

router.get('/open', async (req: Request, res: Response) => {
  try {
    const w: any = { gameType: 'WOW', status: 'SEARCHING' };
    if (req.query.mapId) w.wowMapId = req.query.mapId as string;
    const ts: any[] = await prisma.tournament.findMany({
      where: w, orderBy: { createdAt: 'desc' }, take: 50,
      include: {
        wowMap: true,
        teams: { include: { players: { include: { user: { select: { id: true, username: true, avatar: true } } } } } },
      },
    });
    res.json({
      tournaments: ts.map((t: any) => {
        const ct = t.teams.find((x: any) => x.slot === 1);
        const cap = ct?.players.find((p: any) => p.isCaptain) || ct?.players[0];
        return {
          id: t.id, status: t.status, teamMode: t.teamMode, teamCount: t.teamCount,
          bet: t.bet, server: t.server, teamsJoined: t.teams.length, createdAt: t.createdAt.toISOString(),
          creator: cap ? { username: cap.user.username, avatar: cap.user.avatar } : null,
          wowMap: t.wowMap ? {
            id: t.wowMap.id, mapId: t.wowMap.mapId, name: t.wowMap.name, image: t.wowMap.image,
            format: t.wowMap.format, teamCount: t.wowMap.teamCount, playersPerTeam: t.wowMap.playersPerTeam,
            rounds: t.wowMap.rounds, rules: t.wowMap.rules, rating: t.wowMap.rating,
            gamesPlayed: t.wowMap.gamesPlayed, prizeDistribution: t.wowMap.prizeDistribution,
          } : null,
        };
      }),
    });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка' }); }
});

// ─── AUTH REQUIRED ────────────────────────────────────────────

router.use(requireAuth);

const cSchema = z.object({
  mapId: z.string().min(1),
  bet: z.number().int().min(60).max(3000),
  server: z.enum(['EUROPE', 'NA', 'ASIA', 'ME', 'SA']),
  playerId: z.string().regex(/^\d{10}$/),
  extraIds: z.array(z.string().regex(/^\d{10}$/)).optional(),
});

// ─── CREATE WOW TOURNAMENT ───────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const d = cSchema.parse(req.body);
    const uid = req.user!.userId;
    const map = await prisma.woWMap.findUnique({ where: { id: d.mapId } });
    if (!map || !map.isActive) { res.status(404).json({ error: 'Карта не найдена' }); return; }
    const ex = d.extraIds || [];
    if (ex.length !== map.playersPerTeam - 1) { res.status(400).json({ error: `Нужно ${map.playersPerTeam} ID` }); return; }
    const u = await prisma.user.findUnique({ where: { id: uid }, select: { isBanned: true } });
    if (!u) { res.status(404).json({ error: 'Не найден' }); return; }
    if (u.isBanned) { res.status(403).json({ error: 'Заблокирован' }); return; }

    const tm = tmFromPPT(map.playersPerTeam);
    const { totalPool: pool, platformFee: fee } = WowStrategy.calculatePrizes(d.bet, map.teamCount, { prizeDistribution: map.prizeDistribution });

    const result = await withRetry(() => prisma.$transaction(async (tx) => {
      // Matchmaking: find existing
      const cand: any = await tx.tournament.findFirst({
        where: { gameType: 'WOW', status: 'SEARCHING', wowMapId: map.id, bet: d.bet, server: d.server, creatorId: { not: uid } },
        include: { teams: { include: { players: true } } },
        orderBy: { createdAt: 'asc' },
      });

      if (cand) {
        const alr = cand.teams.some((t: any) => t.players.some((p: any) => p.userId === uid));
        const ns = cand.teams.length + 1;
        if (!alr && ns <= map.teamCount) {
          await wallet.debit(tx, uid, d.bet, 'UC', {
            idempotencyKey: `tournament-${cand.id}-entry-${uid}`,
            reason: 'tournament_entry',
            refType: 'tournament',
            refId: cand.id,
          });
          const team = await tx.tournamentTeam.create({ data: { tournamentId: cand.id, slot: ns } });
          await tx.tournamentPlayer.create({
            data: { teamId: team.id, userId: uid, gameId: d.playerId, partnerGameId: ex[0] || null, extraIds: ex.slice(1), isCaptain: true },
          });
          const full = ns >= map.teamCount;
          if (full) await startWoW(tx, cand.id, map, uid);
          return { id: cand.id, status: full ? 'IN_PROGRESS' : 'SEARCHING', matched: true, tournamentStarted: full };
        }
      }

      // Create new
      const t = await tx.tournament.create({
        data: {
          gameType: 'WOW', teamMode: tm, teamCount: map.teamCount, bet: d.bet, server: d.server,
          platformFee: fee, prizePool: pool - fee, creatorId: uid, wowMapId: map.id,
        },
      });
      const team = await tx.tournamentTeam.create({ data: { tournamentId: t.id, slot: 1 } });
      await tx.tournamentPlayer.create({
        data: { teamId: team.id, userId: uid, gameId: d.playerId, partnerGameId: ex[0] || null, extraIds: ex.slice(1), isCaptain: true },
      });
      await wallet.debit(tx, uid, d.bet, 'UC', {
        idempotencyKey: `tournament-${t.id}-entry-${uid}`,
        reason: 'tournament_entry',
        refType: 'tournament',
        refId: t.id,
      });
      await tx.tournamentMatch.create({ data: { tournamentId: t.id, round: 1, matchOrder: 1, status: 'PENDING' } });
      await tx.tournamentMessage.create({
        data: { tournamentId: t.id, userId: uid, content: `🎮 WoW турнир! ${map.name} • ${map.format} • ${d.bet} UC`, isSystem: true },
      });
      return { id: t.id, status: 'SEARCHING', matched: false, tournamentStarted: false };
    }, { isolationLevel: 'Serializable' }));

    // Real-time events
    const bal = await wallet.getBalance(uid);
    emitBalanceUpdate(uid, bal.balance, bal.ucBalance);
    if ((result as any).matched && (result as any).tournamentStarted) {
      const all = await prisma.tournamentPlayer.findMany({ where: { team: { tournamentId: (result as any).id } }, select: { userId: true } });
      emitTournamentStarted((result as any).id, all.map(p => p.userId));
    }
    emitGlobalTournamentChange();
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Create WoW error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── JOIN WOW TOURNAMENT ─────────────────────────────────────

const joinSchema = z.object({
  playerId: z.string().regex(/^\d{10}$/),
  extraIds: z.array(z.string().regex(/^\d{10}$/)).optional(),
});

router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const tid = req.params.id as string;
    const d = joinSchema.parse(req.body);
    const uid = req.user!.userId;

    const t: any = await prisma.tournament.findFirst({
      where: { id: tid },
      include: { wowMap: true, teams: { include: { players: true } } },
    });
    if (!t || t.gameType !== 'WOW') { res.status(404).json({ error: 'Турнир не найден' }); return; }
    if (t.status !== 'SEARCHING') { res.status(400).json({ error: 'Турнир уже начался' }); return; }

    const map = t.wowMap;
    if (!map) { res.status(400).json({ error: 'Карта не найдена' }); return; }

    const ex = d.extraIds || [];
    if (ex.length !== map.playersPerTeam - 1) { res.status(400).json({ error: `Нужно ${map.playersPerTeam} ID` }); return; }

    const alr = t.teams.some((te: any) => te.players.some((p: any) => p.userId === uid));
    if (alr) { res.status(400).json({ error: 'Уже в турнире' }); return; }

    const ns = t.teams.length + 1;
    if (ns > map.teamCount) { res.status(400).json({ error: 'Турнир заполнен' }); return; }

    const result = await withRetry(() => prisma.$transaction(async (tx) => {
      await wallet.debit(tx, uid, t.bet, 'UC', {
        idempotencyKey: `tournament-${tid}-entry-${uid}`,
        reason: 'tournament_entry',
        refType: 'tournament',
        refId: tid,
      });
      const team = await tx.tournamentTeam.create({ data: { tournamentId: tid, slot: ns } });
      await tx.tournamentPlayer.create({
        data: { teamId: team.id, userId: uid, gameId: d.playerId, partnerGameId: ex[0] || null, extraIds: ex.slice(1), isCaptain: true },
      });
      const full = ns >= map.teamCount;
      if (full) await startWoW(tx, tid, map, uid);
      return { joined: true, slot: ns, tournamentStarted: full };
    }, { isolationLevel: 'Serializable' }));

    const jBal = await wallet.getBalance(uid);
    emitBalanceUpdate(uid, jBal.balance, jBal.ucBalance);
    if (result.tournamentStarted) {
      const all = await prisma.tournamentPlayer.findMany({ where: { team: { tournamentId: tid } }, select: { userId: true } });
      emitTournamentStarted(tid, all.map(p => p.userId));
    }
    emitGlobalTournamentChange();
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Join WoW error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
