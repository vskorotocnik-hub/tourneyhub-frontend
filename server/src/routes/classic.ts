import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../shared/prisma';
import { withRetry } from '../shared/retry';
import * as wallet from '../domains/wallet';
import { emitBalanceUpdate, emitGlobalTournamentChange } from '../shared/socket';

const router = Router();

router.use(requireAuth);

// ─── LIST OPEN CLASSIC TOURNAMENTS ──────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { server, mode, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {
      status: 'REGISTRATION',
    };
    if (server) where.server = String(server).toUpperCase();
    if (mode) where.mode = String(mode).toUpperCase();

    const [tournaments, total] = await Promise.all([
      prisma.classicTournament.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: { select: { registrations: true } },
        },
      }),
      prisma.classicTournament.count({ where }),
    ]);

    const result = tournaments.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      map: t.map,
      mapImage: t.mapImage,
      mode: t.mode,
      server: t.server,
      startTime: t.startTime,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      maxParticipants: t.maxParticipants,
      registeredPlayers: t._count.registrations,
      winnerCount: t.winnerCount,
      prize1: t.prize1,
      prize2: t.prize2,
      prize3: t.prize3,
      status: t.status,
    }));

    res.json({ tournaments: result, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('List classic tournaments error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── ALL CLASSIC TOURNAMENTS (including IN_PROGRESS) ────────

router.get('/all', async (req: Request, res: Response) => {
  try {
    const { server, mode, status, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};
    if (server) where.server = String(server).toUpperCase();
    if (mode) where.mode = String(mode).toUpperCase();
    if (status) where.status = String(status).toUpperCase();
    else where.status = { in: ['REGISTRATION', 'IN_PROGRESS'] };

    const [tournaments, total] = await Promise.all([
      prisma.classicTournament.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: { select: { registrations: true } },
        },
      }),
      prisma.classicTournament.count({ where }),
    ]);

    const result = tournaments.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      map: t.map,
      mapImage: t.mapImage,
      mode: t.mode,
      server: t.server,
      startTime: t.startTime,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      maxParticipants: t.maxParticipants,
      registeredPlayers: t._count.registrations,
      winnerCount: t.winnerCount,
      prize1: t.prize1,
      prize2: t.prize2,
      prize3: t.prize3,
      status: t.status,
    }));

    res.json({ tournaments: result, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('List all classic tournaments error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY ACTIVE CLASSIC TOURNAMENTS ──────────────────────────

router.get('/my/active', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const regs = await prisma.classicRegistration.findMany({
      where: {
        userId,
        tournament: { status: { in: ['REGISTRATION', 'IN_PROGRESS'] } },
      },
      include: {
        tournament: {
          include: { _count: { select: { registrations: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tournaments = regs.map((r: any) => ({
      registrationId: r.id,
      id: r.tournament.id,
      title: r.tournament.title,
      description: r.tournament.description,
      map: r.tournament.map,
      mapImage: r.tournament.mapImage,
      mode: r.tournament.mode,
      server: r.tournament.server,
      startTime: r.tournament.startTime,
      entryFee: r.tournament.entryFee,
      prizePool: r.tournament.prizePool,
      maxParticipants: r.tournament.maxParticipants,
      registeredPlayers: r.tournament._count.registrations,
      winnerCount: r.tournament.winnerCount,
      prize1: r.tournament.prize1,
      prize2: r.tournament.prize2,
      prize3: r.tournament.prize3,
      status: r.tournament.status,
      pubgIds: r.pubgIds,
    }));

    res.json({ tournaments });
  } catch (err) {
    console.error('My active classic error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY CLASSIC HISTORY ─────────────────────────────────────

router.get('/my/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const regs = await prisma.classicRegistration.findMany({
      where: {
        userId,
        tournament: { status: { in: ['COMPLETED', 'CANCELLED'] } },
      },
      include: {
        tournament: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tournaments = regs.map((r: any) => ({
      registrationId: r.id,
      id: r.tournament.id,
      title: r.tournament.title,
      map: r.tournament.map,
      mapImage: r.tournament.mapImage,
      mode: r.tournament.mode,
      server: r.tournament.server,
      entryFee: r.tournament.entryFee,
      prizePool: r.tournament.prizePool,
      status: r.tournament.status,
      completedAt: r.tournament.completedAt,
      place: r.place,
      prizeAmount: r.prizeAmount,
      result: r.place ? 'win' : (r.tournament.status === 'CANCELLED' ? 'cancelled' : 'loss'),
    }));

    res.json({ tournaments });
  } catch (err) {
    console.error('My classic history error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── MY CLASSIC CHATS (for Messages page) ───────────────────

router.get('/my/chats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const regs = await prisma.classicRegistration.findMany({
      where: { userId },
      include: {
        tournament: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const chats = await Promise.all(regs.map(async (r: any) => {
      const [unreadCount, messageCount] = await Promise.all([
        prisma.classicMessage.count({
          where: {
            registrationId: r.id,
            createdAt: { gt: r.lastReadAt },
          },
        }),
        prisma.classicMessage.count({
          where: { registrationId: r.id },
        }),
      ]);

      const lastMsg = r.messages[0] || null;

      return {
        registrationId: r.id,
        createdAt: r.createdAt,
        tournament: {
          id: r.tournament.id,
          title: r.tournament.title,
          map: r.tournament.map,
          mode: r.tournament.mode,
          status: r.tournament.status,
        },
        messageCount,
        unreadCount,
        lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt, isAdmin: !!lastMsg.isAdmin } : null,
      };
    }));

    res.json({ chats });
  } catch (err) {
    console.error('Classic chats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── CHAT: GET MESSAGES ─────────────────────────────────────

router.get('/registrations/:regId/messages', async (req: Request, res: Response) => {
  try {
    const regId = req.params.regId as string;
    const userId = req.user!.userId;
    const { after } = req.query;

    // Verify ownership
    const reg = await prisma.classicRegistration.findUnique({ where: { id: regId } });
    if (!reg || reg.userId !== userId) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }

    const where: Record<string, unknown> = { registrationId: regId };
    if (after) where.createdAt = { gt: new Date(String(after)) };

    const messages = await prisma.classicMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark as read
    await prisma.classicRegistration.update({
      where: { id: regId },
      data: { lastReadAt: new Date() },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Classic messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── CHAT: SEND MESSAGE ─────────────────────────────────────

const messageSchema = z.object({
  content: z.string().min(1).max(500),
});

router.post('/registrations/:regId/messages', async (req: Request, res: Response) => {
  try {
    const regId = req.params.regId as string;
    const userId = req.user!.userId;
    const { content } = messageSchema.parse(req.body);

    // Verify ownership
    const reg = await prisma.classicRegistration.findUnique({ where: { id: regId } });
    if (!reg || reg.userId !== userId) {
      res.status(403).json({ error: 'Нет доступа' });
      return;
    }

    const message = await prisma.classicMessage.create({
      data: { registrationId: regId, userId, content },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Classic send message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── TOURNAMENT DETAIL ──────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const tournament: any = await prisma.classicTournament.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
        registrations: {
          where: { userId },
          select: { id: true, pubgIds: true, place: true, prizeAmount: true },
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Турнир не найден' });
      return;
    }

    const myReg = tournament.registrations[0] || null;

    res.json({
      id: tournament.id,
      title: tournament.title,
      description: tournament.description,
      map: tournament.map,
      mapImage: tournament.mapImage,
      mode: tournament.mode,
      server: tournament.server,
      startTime: tournament.startTime,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      maxParticipants: tournament.maxParticipants,
      registeredPlayers: tournament._count.registrations,
      winnerCount: tournament.winnerCount,
      prize1: tournament.prize1,
      prize2: tournament.prize2,
      prize3: tournament.prize3,
      status: tournament.status,
      startedAt: tournament.startedAt,
      completedAt: tournament.completedAt,
      isRegistered: !!myReg,
      myRegistration: myReg,
    });
  } catch (err) {
    console.error('Classic tournament detail error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── REGISTER FOR TOURNAMENT ────────────────────────────────

const registerSchema = z.object({
  pubgIds: z.array(z.string().regex(/^\d{10}$/, 'ID должен быть 10 цифр')).min(1).max(4),
});

router.post('/:id/register', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const { pubgIds } = registerSchema.parse(req.body);

    const result = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        const tournament: any = await tx.classicTournament.findUnique({
          where: { id },
          include: { _count: { select: { registrations: true } } },
        });

        if (!tournament) throw Object.assign(new Error('Турнир не найден'), { statusCode: 404 });
        if (tournament.status !== 'REGISTRATION') throw Object.assign(new Error('Регистрация закрыта'), { statusCode: 400 });
        if (tournament._count.registrations >= tournament.maxParticipants) throw Object.assign(new Error('Турнир заполнен'), { statusCode: 400 });

        // Validate pubgIds count matches mode
        const expectedIds = tournament.mode === 'SOLO' ? 1 : tournament.mode === 'DUO' ? 2 : 4;
        if (pubgIds.length !== expectedIds) {
          throw Object.assign(new Error(`Для ${tournament.mode} нужно ${expectedIds} PUBG ID`), { statusCode: 400 });
        }

        // Check not already registered
        const existing = await tx.classicRegistration.findUnique({
          where: { tournamentId_userId: { tournamentId: id, userId } },
        });
        if (existing) throw Object.assign(new Error('Вы уже зарегистрированы'), { statusCode: 400 });

        // Check user not banned
        const user = await tx.user.findUnique({ where: { id: userId }, select: { isBanned: true, username: true } });
        if (!user) throw Object.assign(new Error('Пользователь не найден'), { statusCode: 404 });
        if (user.isBanned) throw Object.assign(new Error('Ваш аккаунт заблокирован'), { statusCode: 403 });

        // Debit entry fee via wallet
        await wallet.debit(tx, userId, tournament.entryFee, 'UC', {
          idempotencyKey: `classic-${id}-entry-${userId}`,
          reason: 'classic_tournament_entry',
          refType: 'classic_tournament',
          refId: id,
        });

        // Create registration
        const reg = await tx.classicRegistration.create({
          data: { tournamentId: id, userId, pubgIds },
        });

        // Create welcome system message in private chat
        const prizeLines = [
          `🥇 1 место: ${tournament.prize1} UC`,
          tournament.winnerCount >= 2 ? `🥈 2 место: ${tournament.prize2} UC` : null,
          tournament.winnerCount >= 3 ? `🥉 3 место: ${tournament.prize3} UC` : null,
        ].filter(Boolean).join('\n');

        // Calculate countdown text instead of absolute time
        const startMs = new Date(tournament.startTime).getTime();
        const nowMs = Date.now();
        const diffMs = startMs - nowMs;
        let countdownText: string;
        if (diffMs <= 0) {
          countdownText = 'Скоро начнётся!';
        } else {
          const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          countdownText = (d > 0 ? `${d}д ` : '') + (h > 0 ? `${h}ч ` : '') + `${m}мин`;
        }

        const welcomeMsg = [
          `🎮 Вы зарегистрированы на турнир!`,
          ``,
          `📍 Карта: ${tournament.map}`,
          `👥 Режим: ${tournament.mode}`,
          `🌍 Сервер: ${tournament.server}`,
          `⏱ Старт через: ${countdownText}`,
          `💰 Взнос: ${tournament.entryFee} UC`,
          ``,
          `🏆 Призы:`,
          prizeLines,
          ``,
          tournament.description ? `📝 ${tournament.description}` : null,
          ``,
          `📌 Важно! Добавьте администратора турнира в друзья в PUBG Mobile. Когда придёт время, администратор пригласит вас в комнату.`,
          ``,
          `💬 Это ваш приватный чат с администрацией турнира. Если у вас есть вопросы — пишите здесь.`,
        ].filter(v => v !== null).join('\n');

        await tx.classicMessage.create({
          data: {
            registrationId: reg.id,
            userId,
            content: welcomeMsg,
            isSystem: true,
          },
        });

        return { registrationId: reg.id, username: user.username };
      }, { isolationLevel: 'Serializable' })
    );

    // Balance update
    const bal = await wallet.getBalance(userId);
    emitBalanceUpdate(userId, bal.balance, bal.ucBalance);
    emitGlobalTournamentChange();

    res.status(201).json({
      registered: true,
      registrationId: result.registrationId,
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
    console.error('Classic register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
