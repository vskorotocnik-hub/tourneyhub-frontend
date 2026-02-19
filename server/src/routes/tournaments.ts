import { Router, Request, Response } from 'express';
import { TournamentStatus } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { emitNewMessage, emitTournamentUpdate, emitBalanceUpdate, emitTournamentStarted, emitUnreadUpdate, emitGlobalTournamentChange } from '../shared/socket';
import { prisma } from '../shared/prisma';
import { withRetry } from '../shared/retry';
import * as wallet from '../domains/wallet';
import { generateBracket, TdmStrategy, resolveMatch } from '../domains/tournament';

const router = Router();

// All tournament routes require auth
router.use(requireAuth);

// ─── HELPERS (delegated to domains/tournament) ──────────────

const calculatePrizes = TdmStrategy.calculatePrizes.bind(TdmStrategy);

// startTournamentInTx delegates to TdmStrategy
const startTournamentInTx = TdmStrategy.startTournament.bind(TdmStrategy);

// ─── CREATE TOURNAMENT ────────────────────────────────────────

const createSchema = z.object({
  teamMode: z.enum(['SOLO', 'DUO']),
  teamCount: z.number().int().min(2).max(4),
  bet: z.number().int().min(60).max(3000),
  server: z.enum(['EUROPE', 'NA', 'ASIA', 'ME', 'SA']),
  playerId: z.string().regex(/^\d{10}$/, 'ID должен быть 10 цифр'),
  partnerId: z.string().regex(/^\d{10}$/).optional(),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const userId = req.user!.userId;

    // Validate duo requires partnerId
    if (data.teamMode === 'DUO' && !data.partnerId) {
      res.status(400).json({ error: 'Для Duo нужен ID напарника' });
      return;
    }

    // Check user exists and is not banned (balance checked by wallet.debit inside tx)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, rating: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Аккаунт заблокирован' });
      return;
    }

    // ─── MATCHMAKING + CREATE in one serializable transaction ───
    const { totalPool, platformFee } = calculatePrizes(data.bet, data.teamCount);

    const result = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        // 1. Try to find a matching SEARCHING tournament (inside tx for consistency)
        const RATING_WINDOWS = [200, 400, 700, 99999];
        let candidate: any = null;

        for (const window of RATING_WINDOWS) {
          candidate = await tx.tournament.findFirst({
            where: {
              status: 'SEARCHING',
              teamMode: data.teamMode,
              teamCount: data.teamCount,
              bet: data.bet,
              server: data.server,
              creatorId: { not: userId },
            },
            include: { teams: { include: { players: { include: { user: { select: { rating: true } } } } } } },
            orderBy: { createdAt: 'asc' },
          });

          if (candidate) {
            // Verify it's not full and user isn't already in it
            const isFull = candidate.teams.length >= candidate.teamCount;
            const alreadyIn = candidate.teams.some((t: any) => t.players.some((p: any) => p.userId === userId));
            if (isFull || alreadyIn) {
              candidate = null;
              continue;
            }
            // Check rating proximity
            const creatorPlayer = candidate.teams[0]?.players.find((p: any) => p.isCaptain);
            const creatorRating = creatorPlayer?.user?.rating ?? 1000;
            if (Math.abs(creatorRating - user.rating) <= window) break;
            candidate = null; // rating too far, try wider window
          }
        }

        if (candidate) {
          // 2a. JOIN existing tournament
          const nextSlot = candidate.teams.length + 1;
          const isFull = nextSlot >= candidate.teamCount;

          await wallet.debit(tx, userId, candidate.bet, 'UC', {
            idempotencyKey: `tournament-${candidate.id}-entry-${userId}`,
            reason: 'tournament_entry',
            refType: 'tournament',
            refId: candidate.id,
          });

          const team = await tx.tournamentTeam.create({
            data: { tournamentId: candidate.id, slot: nextSlot },
          });

          await tx.tournamentPlayer.create({
            data: { teamId: team.id, userId, gameId: data.playerId, partnerGameId: data.partnerId || null, isCaptain: true },
          });

          if (isFull) {
            await startTournamentInTx(tx, candidate.id, candidate.teamCount, userId);
          }

          return {
            id: candidate.id,
            status: isFull ? 'IN_PROGRESS' : 'SEARCHING',
            teamMode: data.teamMode,
            teamCount: data.teamCount,
            bet: data.bet,
            server: data.server,
            matched: true,
          };
        }

        // 2b. No match found → CREATE new tournament
        const t = await tx.tournament.create({
          data: {
            teamMode: data.teamMode,
            teamCount: data.teamCount,
            bet: data.bet,
            server: data.server,
            platformFee,
            prizePool: totalPool - platformFee,
            creatorId: userId,
          },
        });

        await wallet.debit(tx, userId, data.bet, 'UC', {
          idempotencyKey: `tournament-${t.id}-entry-${userId}`,
          reason: 'tournament_entry',
          refType: 'tournament',
          refId: t.id,
        });

        const team = await tx.tournamentTeam.create({
          data: { tournamentId: t.id, slot: 1 },
        });

        await tx.tournamentPlayer.create({
          data: { teamId: team.id, userId, gameId: data.playerId, partnerGameId: data.partnerId || null, isCaptain: true },
        });

        const bracket = generateBracket(data.teamCount);
        for (const match of bracket) {
          await tx.tournamentMatch.create({
            data: {
              tournamentId: t.id,
              round: match.round,
              matchOrder: match.matchOrder,
              status: 'PENDING',
            },
          });
        }

        await tx.tournamentMessage.create({
          data: {
            tournamentId: t.id,
            userId,
            content: `Турнир создан! ${data.teamMode === 'SOLO' ? '1v1' : '2v2'} • ${data.teamCount} команды • ${data.bet} UC`,
            isSystem: true,
          },
        });

        return {
          id: t.id,
          status: t.status,
          teamMode: t.teamMode,
          teamCount: t.teamCount,
          bet: t.bet,
          server: t.server,
          matched: false,
        };
      }, { isolationLevel: 'Serializable' })
    );

    // Real-time: balance update for creator
    const creatorBal = await wallet.getBalance(userId);
    emitBalanceUpdate(userId, creatorBal.balance, creatorBal.ucBalance);

    // Real-time: if matched into existing tournament and it started
    if ((result as any).matched && (result as any).status === 'IN_PROGRESS') {
      const allPlayers = await prisma.tournamentPlayer.findMany({
        where: { team: { tournamentId: (result as any).id } },
        select: { userId: true },
      });
      emitTournamentStarted((result as any).id, allPlayers.map(p => p.userId));
    }

    // Broadcast to ALL clients that tournament list changed
    emitGlobalTournamentChange();

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors });
      return;
    }
    console.error('Create tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY ACTIVE TOURNAMENTS ────────────────────────────────────

router.get('/my/active', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const players = await prisma.tournamentPlayer.findMany({
      where: {
        userId,
        team: {
          tournament: { status: { in: ['SEARCHING', 'IN_PROGRESS'] } },
        },
      },
      include: {
        team: {
          include: {
            tournament: {
              select: {
                id: true, status: true, gameType: true, teamMode: true, teamCount: true, bet: true, server: true, createdAt: true,
                wowMap: { select: { id: true, mapId: true, name: true, image: true, format: true, teamCount: true, playersPerTeam: true, rounds: true, rules: true, prizeDistribution: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tournaments = players.map(p => p.team.tournament);

    // Backward compat: also return first as `tournament`
    res.json({ tournament: tournaments[0] || null, tournaments });
  } catch (err) {
    console.error('My active tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY TOURNAMENT HISTORY (for Profile page) ───────────────────

router.get('/my/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const players = await prisma.tournamentPlayer.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            tournament: {
              include: {
                teams: {
                  include: {
                    players: {
                      include: { user: { select: { id: true, username: true, avatar: true } } },
                    },
                  },
                },
                matches: {
                  where: { status: 'COMPLETED' },
                  orderBy: { round: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tournaments = players.map(p => {
      const t = p.team.tournament;
      const userTeamId = p.teamId;

      // Determine result
      const finalMatch = t.matches[0]; // highest round completed match
      let result: 'win' | 'loss' | null = null;
      let place: number | null = null;

      if (t.status === 'COMPLETED' && finalMatch) {
        result = finalMatch.winnerId === userTeamId ? 'win' : 'loss';
        place = result === 'win' ? 1 : (t.teamCount <= 2 ? 2 : (finalMatch.round >= 2 ? 2 : t.teamCount));
      }

      // Opponents
      const opponents = t.teams
        .filter(team => team.id !== userTeamId)
        .flatMap(team => team.players)
        .filter(pl => pl.user)
        .map(pl => ({ id: pl.user!.id, username: pl.user!.username, avatar: pl.user!.avatar }));

      return {
        id: t.id,
        status: t.status,
        teamMode: t.teamMode,
        teamCount: t.teamCount,
        bet: t.bet,
        server: t.server,
        prizePool: Number(t.prizePool),
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        result,
        place,
        opponents,
      };
    });

    res.json({ tournaments });
  } catch (err) {
    console.error('My history error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY CHATS (for Messages page) ─────────────────────────────

router.get('/my/chats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Find all tournaments where user is a player — exclude SEARCHING (chat only after full team)
    const players = await prisma.tournamentPlayer.findMany({
      where: {
        userId,
        team: {
          tournament: { status: { not: 'SEARCHING' } },
        },
      },
      include: {
        team: {
          include: {
            tournament: {
              include: {
                teams: {
                  include: {
                    players: {
                      include: { user: { select: { id: true, username: true, avatar: true } } },
                    },
                  },
                },
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
                matches: {
                  where: { status: 'COMPLETED' },
                  orderBy: { round: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Batch unread counts: count messages after lastReadAt for each tournament
    const chats = await Promise.all(players.map(async (p) => {
      const t = p.team.tournament;
      const userTeamId = p.teamId;

      const opponents = t.teams
        .filter(team => team.id !== userTeamId)
        .flatMap(team => team.players)
        .filter(pl => pl.user)
        .map(pl => ({ id: pl.user!.id, username: pl.user!.username, avatar: pl.user!.avatar }));

      const lastMsg = t.messages[0] || null;

      const finalMatch = t.matches[0];
      let result: 'win' | 'loss' | null = null;
      if (t.status === 'COMPLETED' && finalMatch && finalMatch.winnerId) {
        result = finalMatch.winnerId === userTeamId ? 'win' : 'loss';
      }

      // Count unread messages (after player's lastReadAt)
      const unreadCount = await prisma.tournamentMessage.count({
        where: {
          tournamentId: t.id,
          createdAt: { gt: p.lastReadAt },
        },
      });

      return {
        tournamentId: t.id,
        status: t.status,
        teamMode: t.teamMode,
        teamCount: t.teamCount,
        bet: t.bet,
        server: t.server,
        createdAt: t.createdAt,
        opponents,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt, isSystem: lastMsg.isSystem } : null,
        result,
        unreadCount,
      };
    }));

    res.json({ chats });
  } catch (err) {
    console.error('My chats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MARK CHAT AS READ ─────────────────────────────────────────

router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tournamentId = req.params.id as string;

    // Find the player record and update lastReadAt
    const player = await prisma.tournamentPlayer.findFirst({
      where: { userId, team: { tournamentId } },
    });
    if (!player) { res.status(404).json({ error: 'Не найдено' }); return; }

    await prisma.tournamentPlayer.update({
      where: { id: player.id },
      data: { lastReadAt: new Date() },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── TOTAL UNREAD COUNT (for bottom nav badge) ────────────────

router.get('/my/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const players = await prisma.tournamentPlayer.findMany({
      where: {
        userId,
        team: { tournament: { status: { not: 'SEARCHING' } } },
      },
      include: { team: { select: { tournamentId: true } } },
    });

    let total = 0;
    for (const p of players) {
      const count = await prisma.tournamentMessage.count({
        where: {
          tournamentId: p.team.tournamentId,
          createdAt: { gt: p.lastReadAt },
        },
      });
      total += count;
    }

    res.json({ unreadCount: total });
  } catch (err) {
    console.error('Unread count error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── LIST OPEN TOURNAMENTS ───────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { server, teamMode, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {
      status: 'SEARCHING' as TournamentStatus,
      gameType: 'TDM',
    };
    if (server) where.server = String(server).toUpperCase();
    if (teamMode) where.teamMode = String(teamMode).toUpperCase();

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          teams: {
            include: {
              players: {
                select: { gameId: true, isCaptain: true, user: { select: { username: true, avatar: true } } },
              },
            },
          },
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    // Don't expose creator's rating
    const result = tournaments.map(t => ({
      id: t.id,
      status: t.status,
      teamMode: t.teamMode,
      teamCount: t.teamCount,
      bet: t.bet,
      server: t.server,
      teamsJoined: t.teams.length,
      createdAt: t.createdAt,
      creator: t.teams[0]?.players.find(p => p.isCaptain) ? {
        username: t.teams[0].players.find(p => p.isCaptain)!.user.username,
        avatar: t.teams[0].players.find(p => p.isCaptain)!.user.avatar,
      } : null,
    }));

    res.json({ tournaments: result, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('List tournaments error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── JOIN TOURNAMENT ──────────────────────────────────────────

const joinSchema = z.object({
  playerId: z.string().regex(/^\d{10}$/, 'ID должен быть 10 цифр'),
  partnerId: z.string().regex(/^\d{10}$/).optional(),
});

router.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = joinSchema.parse(req.body);
    const userId = req.user!.userId;

    // All checks + join inside serializable transaction to prevent race conditions
    const result = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const tournament = await tx.tournament.findUnique({
          where: { id },
          include: { teams: { include: { players: true } } },
        });

        if (!tournament) throw Object.assign(new Error('Турнир не найден'), { statusCode: 404 });
        if (tournament.status !== 'SEARCHING') throw Object.assign(new Error('Турнир уже начался или завершён'), { statusCode: 400 });
        if (tournament.teams.length >= tournament.teamCount) throw Object.assign(new Error('Турнир заполнен'), { statusCode: 400 });

        const alreadyIn = tournament.teams.some(t => t.players.some(p => p.userId === userId));
        if (alreadyIn) throw Object.assign(new Error('Вы уже в этом турнире'), { statusCode: 400 });

        if (tournament.teamMode === 'DUO' && !data.partnerId) throw Object.assign(new Error('Для Duo нужен ID напарника'), { statusCode: 400 });

        const nextSlot = tournament.teams.length + 1;
        const isFull = nextSlot >= tournament.teamCount;

        // Deduct UC via wallet ledger
        await wallet.debit(tx, userId, tournament.bet, 'UC', {
          idempotencyKey: `tournament-${id}-entry-${userId}`,
          reason: 'tournament_entry',
          refType: 'tournament',
          refId: id,
        });

        // Create team
        const team = await tx.tournamentTeam.create({
          data: { tournamentId: id, slot: nextSlot },
        });

        // Add player
        await tx.tournamentPlayer.create({
          data: { teamId: team.id, userId, gameId: data.playerId, partnerGameId: data.partnerId || null, isCaptain: true },
        });

        // If tournament is full, start it
        if (isFull) {
          await startTournamentInTx(tx, id, tournament.teamCount, userId);
        }

        return { teamSlot: nextSlot, isFull };
      }, { isolationLevel: 'Serializable' })
    );

    // Real-time balance update for the joining user
    const joinBal = await wallet.getBalance(userId);
    emitBalanceUpdate(userId, joinBal.balance, joinBal.ucBalance);

    // Real-time: if tournament started, notify all participants
    if (result.isFull) {
      const allPlayers = await prisma.tournamentPlayer.findMany({
        where: { team: { tournamentId: id } },
        select: { userId: true },
      });
      const userIds = allPlayers.map(p => p.userId);
      emitTournamentStarted(id, userIds);
    }
    // Emit team count so join tab updates in real-time
    const currentTeams = await prisma.tournamentTeam.count({ where: { tournamentId: id } });
    emitTournamentUpdate(id, { event: 'player_joined', teamsJoined: currentTeams, tournamentId: id });

    // Broadcast to ALL clients that tournament list changed
    emitGlobalTournamentChange();

    res.json({
      joined: true,
      slot: result.teamSlot,
      tournamentStarted: result.isFull,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors });
      return;
    }
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error('Join tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET TOURNAMENT DETAIL ───────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          orderBy: { slot: 'asc' },
          include: {
            players: {
              select: {
                id: true,
                gameId: true,
                isCaptain: true,
                user: { select: { id: true, username: true, avatar: true } },
              },
            },
          },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
          include: {
            teamA: { include: { players: { select: { user: { select: { username: true } }, isCaptain: true } } } },
            teamB: { include: { players: { select: { user: { select: { username: true } }, isCaptain: true } } } },
            winner: true,
          },
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Турнир не найден' });
      return;
    }

    // Check user is a participant
    const isParticipant = tournament.teams.some(t => t.players.some(p => p.user.id === userId));

    // Find user's team
    const userTeam = tournament.teams.find(t => t.players.some(p => p.user.id === userId));

    res.json({
      ...tournament,
      isParticipant,
      userTeamId: userTeam?.id || null,
      userTeamSlot: userTeam?.slot || null,
    });
  } catch (err) {
    console.error('Get tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── TOURNAMENT CHAT ─────────────────────────────────────────

router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { after } = req.query;

    const where: Record<string, unknown> = { tournamentId: id };
    if (after) {
      where.createdAt = { gt: new Date(String(after)) };
    }

    const messages = await prisma.tournamentMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

const messageSchema = z.object({
  content: z.string().min(1).max(500),
});

router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { content } = messageSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check user is participant
    const participant = await prisma.tournamentPlayer.findFirst({
      where: {
        userId,
        team: { tournamentId: id },
      },
    });

    if (!participant) {
      res.status(403).json({ error: 'Вы не участник этого турнира' });
      return;
    }

    const message = await prisma.tournamentMessage.create({
      data: { tournamentId: id, userId, content },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    // Real-time: notify all tournament participants
    emitNewMessage(id, message);
    emitUnreadUpdate(userId);

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── SUBMIT MATCH RESULT ─────────────────────────────────────

const resultSchema = z.object({
  winnerId: z.string(), // teamId of who the user thinks won
});

router.post('/:id/matches/:matchId/result', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const matchId = req.params.matchId as string;
    const { winnerId } = resultSchema.parse(req.body);
    const userId = req.user!.userId;

    const match = await prisma.tournamentMatch.findFirst({
      where: { id: matchId, tournamentId: id },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
        tournament: true,
      },
    });

    if (!match) {
      res.status(404).json({ error: 'Матч не найден' });
      return;
    }

    if (match.status !== 'ACTIVE' && match.status !== 'DISPUTED') {
      res.status(400).json({ error: 'Матч не активен' });
      return;
    }

    // Determine which team the user belongs to
    const isTeamA = match.teamA?.players.some(p => p.userId === userId);
    const isTeamB = match.teamB?.players.some(p => p.userId === userId);

    if (!isTeamA && !isTeamB) {
      res.status(403).json({ error: 'Вы не участник этого матча' });
      return;
    }

    // Validate winnerId is one of the teams
    if (winnerId !== match.teamAId && winnerId !== match.teamBId) {
      res.status(400).json({ error: 'Неверный ID команды-победителя' });
      return;
    }

    // Update result
    const updateData: Record<string, string> = {};
    if (isTeamA) updateData.teamAResult = winnerId;
    if (isTeamB) updateData.teamBResult = winnerId;

    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    // Get updated match to check if both submitted
    const updatedMatch = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
    });

    if (!updatedMatch) {
      res.status(500).json({ error: 'Ошибка' });
      return;
    }

    // Check if both teams have submitted
    if (updatedMatch.teamAResult && updatedMatch.teamBResult) {
      if (updatedMatch.teamAResult === updatedMatch.teamBResult) {
        // Both agree — resolve match
        // If it was disputed, revert statuses first
        if (match.status === 'DISPUTED') {
          await prisma.tournamentMatch.update({
            where: { id: matchId },
            data: { status: 'ACTIVE' },
          });
          await prisma.tournament.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
          });
          // Auto-cancel any open Dispute records since results now agree
          await prisma.dispute.updateMany({
            where: { tournamentId: id, status: 'OPEN' },
            data: { status: 'CANCELLED' },
          });
        }
        await resolveMatch(id, matchId, updatedMatch.teamAResult);
        res.json({ status: 'resolved', winnerId: updatedMatch.teamAResult });
        return;
      } else if (match.status !== 'DISPUTED') {
        // Disagreement — dispute (only if not already disputed)
        await prisma.tournamentMatch.update({
          where: { id: matchId },
          data: { status: 'DISPUTED' },
        });
        await prisma.tournament.update({
          where: { id },
          data: { status: 'DISPUTED' },
        });
        const isSolo = match.tournament.teamMode === 'SOLO';
        const submitter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        const disputeMsg = await prisma.tournamentMessage.create({
          data: {
            tournamentId: id,
            userId,
            content: `⚠️ Результаты не совпадают!\n\n${isSolo ? 'Оба игрока указали' : 'Обе команды указали'}, что победили. Начат спор.\n\n📸 Пожалуйста, отправьте в этот чат доказательства победы:\n• Скриншот результата матча\n• Видео или ссылку на запись\n\nАдминистратор рассмотрит спор на основе предоставленных доказательств.`,
            isSystem: true,
          },
          include: { user: { select: { id: true, username: true, avatar: true } } },
        });
        emitNewMessage(id, disputeMsg);
        emitTournamentUpdate(id, { event: 'disputed' });
        res.json({ status: 'disputed' });
        return;
      } else {
        // Already disputed, results still disagree — just acknowledge
        const submitterUser2 = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        const isSolo2 = match.tournament.teamMode === 'SOLO';
        const stillDisagreeMsg = await prisma.tournamentMessage.create({
          data: {
            tournamentId: id,
            userId,
            content: `🔄 ${submitterUser2?.username || 'Игрок'} изменил свой результат. Результаты всё ещё не совпадают.\n\nОжидаем решение администратора или корректировку от ${isSolo2 ? 'соперника' : 'другой команды'}.`,
            isSystem: true,
          },
          include: { user: { select: { id: true, username: true, avatar: true } } },
        });
        emitNewMessage(id, stillDisagreeMsg);
        emitTournamentUpdate(id, { event: 'result_updated' });
        res.json({ status: 'disputed', message: 'Результаты обновлены, но всё ещё не совпадают' });
        return;
      }
    }

    // Only one team submitted so far
    const submitterUser = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const otherTeam = isTeamA ? match.teamB : match.teamA;
    const otherCaptain = otherTeam?.players.find(p => p.isCaptain) || otherTeam?.players[0];
    const otherTeamName = otherCaptain ? (await prisma.user.findUnique({ where: { id: otherCaptain.userId }, select: { username: true } }))?.username : null;
    const waitMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId: id,
        userId,
        content: `✅ ${submitterUser?.username || 'Игрок'} отправил результат. Ожидаем ответ от ${otherTeamName || 'соперника'}.`,
        isSystem: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(id, waitMsg);
    emitTournamentUpdate(id, { event: 'result_submitted' });

    res.json({ status: 'waiting', message: 'Ожидаем результат от другой команды' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Submit result error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// resolveMatch and completeTournament are now in domains/tournament/tournament.service.ts
// Re-exported via the import at the top of this file for use in submit result handler above.

// ─── CANCEL / LEAVE TOURNAMENT ───────────────────────────────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { teams: { include: { players: true } } },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Турнир не найден' });
      return;
    }

    if (tournament.status !== 'SEARCHING') {
      res.status(400).json({ error: 'Нельзя отменить начатый турнир' });
      return;
    }

    // Find user's team
    const userTeam = tournament.teams.find(t => t.players.some(p => p.userId === userId));
    if (!userTeam) {
      res.status(403).json({ error: 'Вы не участник этого турнира' });
      return;
    }

    const isLastTeam = tournament.teams.length <= 1;

    await prisma.$transaction(async (tx) => {
      // Refund the leaving player(s) via wallet ledger
      for (const player of userTeam.players) {
        await wallet.credit(tx, player.userId, tournament.bet, 'UC', {
          idempotencyKey: `tournament-${id}-refund-${player.userId}`,
          reason: 'tournament_refund',
          refType: 'tournament',
          refId: id,
        });
      }
      // Delete team players, then team
      await tx.tournamentPlayer.deleteMany({ where: { teamId: userTeam.id } });
      await tx.tournamentTeam.delete({ where: { id: userTeam.id } });

      const leaver = await tx.user.findUnique({ where: { id: userId }, select: { username: true } });

      if (isLastTeam) {
        // Last participant left → cancel tournament
        await tx.tournament.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });
      } else {
        // Re-number remaining team slots
        const remainingTeams = await tx.tournamentTeam.findMany({
          where: { tournamentId: id },
          orderBy: { slot: 'asc' },
        });
        for (let i = 0; i < remainingTeams.length; i++) {
          await tx.tournamentTeam.update({
            where: { id: remainingTeams[i].id },
            data: { slot: i + 1 },
          });
        }
        // Silent leave — no system message needed
      }
    });

    // Real-time: refund balance update
    const refundBal = await wallet.getBalance(userId);
    emitBalanceUpdate(userId, refundBal.balance, refundBal.ucBalance);
    emitTournamentUpdate(id, { event: 'player_left', tournamentId: id });

    // Broadcast to ALL clients that tournament list changed
    emitGlobalTournamentChange();

    res.json({ cancelled: true, action: isLastTeam ? 'cancelled' : 'left' });
  } catch (err) {
    console.error('Cancel/leave tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── FILE DISPUTE ────────────────────────────────────────────

const disputeSchema = z.object({
  reason: z.string().min(5, 'Опишите причину подробнее').max(1000),
  videoUrl: z.string().url().max(500).optional(),
  targetTeamId: z.string().optional(), // required when >2 teams — who is the complaint about
});

router.post('/:id/disputes', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id as string;
    const { reason, videoUrl, targetTeamId } = disputeSchema.parse(req.body);
    const userId = req.user!.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: { include: { players: { include: { user: { select: { username: true } } } } } },
        matches: { where: { status: { in: ['ACTIVE', 'DISPUTED'] } } },
        disputes: { where: { status: 'OPEN' } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Турнир не найден' });
      return;
    }

    // Check user is participant
    const isParticipant = tournament.teams.some(t => t.players.some(p => p.userId === userId));
    if (!isParticipant) {
      res.status(403).json({ error: 'Вы не участник этого турнира' });
      return;
    }

    // For >2 teams, targetTeamId is required
    if (tournament.teamCount > 2 && !targetTeamId) {
      res.status(400).json({ error: 'Укажите, на кого подаёте жалобу' });
      return;
    }

    // Check no open dispute already
    const existingDispute = tournament.disputes.find(d => d.reporterId === userId);
    if (existingDispute) {
      res.status(400).json({ error: 'У вас уже есть открытая жалоба' });
      return;
    }

    // Find the active match where the user's team is playing
    const userTeam = tournament.teams.find(t => t.players.some(p => p.userId === userId));
    const activeMatch = tournament.matches.find(m =>
      userTeam && (m.teamAId === userTeam.id || m.teamBId === userTeam.id)
    ) || tournament.matches[0];
    if (!activeMatch) {
      res.status(400).json({ error: 'Нет активного матча для жалобы' });
      return;
    }

    // Build reason with target info for admin visibility
    const targetTeam = targetTeamId ? tournament.teams.find(t => t.id === targetTeamId) : null;
    const targetNames = targetTeam
      ? targetTeam.players.map(p => p.user?.username || 'Игрок').join(', ')
      : null;
    const fullReason = targetNames ? `[На: ${targetNames}] ${reason}` : reason;

    const dispute = await prisma.dispute.create({
      data: {
        tournamentId,
        matchId: activeMatch.id,
        reporterId: userId,
        reason: fullReason,
        videoUrl: videoUrl || null,
      },
    });

    // Update tournament status
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'DISPUTED' },
    });

    // System message about dispute
    const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const targetInfo = targetNames ? ` на ${targetNames}` : '';
    const disputeSysMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId,
        userId,
        content: `⚠️ ${reporter?.username || 'Игрок'} подал жалобу${targetInfo}. Администратор рассмотрит спор.`,
        isSystem: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(tournamentId, disputeSysMsg);
    emitTournamentUpdate(tournamentId, { event: 'dispute_filed' });

    res.status(201).json(dispute);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Неверные данные' });
      return;
    }
    console.error('File dispute error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── CANCEL DISPUTE ──────────────────────────────────────────

router.delete('/:id/disputes/:disputeId', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id as string;
    const disputeId = req.params.disputeId as string;
    const userId = req.user!.userId;

    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, tournamentId },
    });

    if (!dispute) {
      res.status(404).json({ error: 'Жалоба не найдена' });
      return;
    }

    if (dispute.reporterId !== userId) {
      res.status(403).json({ error: 'Только подавший может отменить жалобу' });
      return;
    }

    if (dispute.status !== 'OPEN') {
      res.status(400).json({ error: 'Жалоба уже закрыта' });
      return;
    }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'CANCELLED' },
    });

    // Check if there are other open disputes
    const otherOpen = await prisma.dispute.count({
      where: { tournamentId, status: 'OPEN', id: { not: disputeId } },
    });

    // If no other open disputes, revert tournament status
    if (otherOpen === 0) {
      // Check for active OR disputed matches (disputed from result disagreement)
      const hasActiveOrDisputedMatch = await prisma.tournamentMatch.findFirst({
        where: { tournamentId, status: { in: ['ACTIVE', 'DISPUTED'] } },
      });
      if (hasActiveOrDisputedMatch) {
        // If match is still DISPUTED (result disagreement), keep tournament DISPUTED
        // Only revert to IN_PROGRESS if match is ACTIVE (no result disagreement)
        const newStatus = hasActiveOrDisputedMatch.status === 'DISPUTED' ? 'DISPUTED' : 'IN_PROGRESS';
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: newStatus as any },
        });
      }
    }

    const reporter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const cancelMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId,
        userId,
        content: `✅ ${reporter?.username || 'Игрок'} отменил жалобу. Продолжайте матч.`,
        isSystem: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(tournamentId, cancelMsg);
    emitTournamentUpdate(tournamentId, { event: 'dispute_cancelled' });

    res.json({ cancelled: true });
  } catch (err) {
    console.error('Cancel dispute error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── RESPOND TO DISPUTE ──────────────────────────────────────

const respondSchema = z.object({
  response: z.string().min(5, 'Опишите ваш ответ подробнее').max(1000),
});

router.post('/:id/disputes/:disputeId/respond', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id as string;
    const disputeId = req.params.disputeId as string;
    const { response } = respondSchema.parse(req.body);
    const userId = req.user!.userId;

    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, tournamentId, status: 'OPEN' },
    });

    if (!dispute) {
      res.status(404).json({ error: 'Жалоба не найдена или уже закрыта' });
      return;
    }

    if (dispute.reporterId === userId) {
      res.status(400).json({ error: 'Нельзя ответить на свою жалобу' });
      return;
    }

    // Check user is participant
    const isParticipant = await prisma.tournamentPlayer.findFirst({
      where: { userId, team: { tournamentId } },
    });
    if (!isParticipant) {
      res.status(403).json({ error: 'Вы не участник этого турнира' });
      return;
    }

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: { response, responderId: userId },
    });

    const responder = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const respondMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId,
        userId,
        content: `💬 ${responder?.username || 'Игрок'} ответил на жалобу:\n\n${response}`,
        isSystem: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(tournamentId, respondMsg);
    emitTournamentUpdate(tournamentId, { event: 'dispute_responded' });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Неверные данные' });
      return;
    }
    console.error('Respond dispute error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET DISPUTES ────────────────────────────────────────────

router.get('/:id/disputes', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id as string;

    const disputes = await prisma.dispute.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ disputes });
  } catch (err) {
    console.error('Get disputes error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── SEND MESSAGE WITH IMAGE ─────────────────────────────────

const imageMessageSchema = z.object({
  content: z.string().max(500).default(''),
  imageUrl: z.string().min(1), // base64 data URL or regular URL
});

router.post('/:id/messages/image', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { content, imageUrl: rawImage } = imageMessageSchema.parse(req.body);
    const userId = req.user!.userId;

    const participant = await prisma.tournamentPlayer.findFirst({
      where: { userId, team: { tournamentId: id } },
    });

    if (!participant) {
      res.status(403).json({ error: 'Вы не участник этого турнира' });
      return;
    }

    // Upload to Supabase if base64, otherwise use URL as-is
    let finalUrl = rawImage;
    if (rawImage.startsWith('data:image/')) {
      const { uploadImage } = await import('../shared/supabase');
      finalUrl = await uploadImage(rawImage, `tournaments/${id}`);
    }

    const message = await prisma.tournamentMessage.create({
      data: { tournamentId: id, userId, content: content || '📷 Фото', imageUrl: finalUrl },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Send image message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
