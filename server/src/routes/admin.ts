import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { completeTournament, resolveMatch } from '../domains/tournament';
import { emitNewMessage, emitTournamentUpdate, emitBalanceUpdate, emitGlobalTournamentChange } from '../shared/socket';
import { uploadImage } from '../shared/supabase';
import { prisma } from '../shared/prisma';
import * as wallet from '../domains/wallet';

const router = Router();

// All admin routes require ADMIN role
router.use(requireAdmin);

// Debug: test endpoint
router.get('/ping', (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});

// ─── STATS ──────────────────────────────────────────────────

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersThisWeek,
      usersThisMonth,
      bannedUsers,
      verifiedUsers,
      activeLastWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
    ]);

    const totalBalance = await prisma.user.aggregate({ _sum: { balance: true } });

    res.json({
      totalUsers,
      usersThisWeek,
      usersThisMonth,
      bannedUsers,
      verifiedUsers,
      activeLastWeek,
      totalBalance: Number(totalBalance._sum.balance || 0),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── LIST USERS ─────────────────────────────────────────────

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  status: z.enum(['active', 'banned', 'verified', 'unverified']).optional(),
  sort: z.enum(['createdAt', 'balance', 'lastLoginAt', 'username']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    const params = listUsersSchema.parse(req.query);
    const { page, limit, search, role, status, sort, order } = params;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'banned') where.isBanned = true;
    else if (status === 'active') where.isBanned = false;
    else if (status === 'verified') where.isVerified = true;
    else if (status === 'unverified') where.isVerified = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          balance: true,
          ucBalance: true,
          rating: true,
          role: true,
          isVerified: true,
          isBanned: true,
          createdAt: true,
          lastLoginAt: true,
          telegramAuth: { select: { telegramId: true, username: true } },
          googleAuth: { select: { email: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Convert Decimal to number for JSON
    const usersFormatted = users.map(u => ({
      ...u,
      balance: Number(u.balance),
      ucBalance: Number(u.ucBalance),
    }));

    res.json({
      users: usersFormatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── GET SINGLE USER ────────────────────────────────────────

router.get('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        balance: true,
        ucBalance: true,
        rating: true,
        role: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        telegramAuth: { select: { telegramId: true, username: true, firstName: true, lastName: true } },
        googleAuth: { select: { email: true, name: true } },
        _count: { select: { refreshTokens: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ ...user, balance: Number(user.balance), ucBalance: Number(user.ucBalance) });
  } catch (err) {
    console.error('Admin get user error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── BAN / UNBAN ────────────────────────────────────────────

const banSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().optional(),
});

router.patch('/users/:id/ban', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { isBanned, reason } = banSchema.parse(req.body);
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(403).json({ error: 'Нельзя забанить администратора' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned, banReason: isBanned ? (reason || 'Нарушение правил платформы') : null },
      select: { id: true, username: true, isBanned: true, banReason: true },
    });

    // If banning — revoke all refresh tokens
    if (isBanned) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });
    }

    console.log(`[ADMIN] ${req.user?.userId} ${isBanned ? 'banned' : 'unbanned'} user ${user.username}`);
    res.json(user);
  } catch (err) {
    console.error('Admin ban error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── CHANGE ROLE ────────────────────────────────────────────

const roleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
});

router.patch('/users/:id/role', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { role } = roleSchema.parse(req.body);

    if (req.params.id === req.user?.userId) {
      res.status(400).json({ error: 'Нельзя изменить свою роль' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    console.log(`[ADMIN] ${req.user?.userId} changed role of ${user.username} to ${role}`);
    res.json(user);
  } catch (err) {
    console.error('Admin role error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── CHANGE BALANCE ─────────────────────────────────────────

const balanceSchema = z.object({
  amount: z.number().refine(v => v !== 0, 'Сумма не может быть 0'),
  reason: z.string().min(1, 'Укажите причину').max(200),
});

router.patch('/users/:id/balance', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { amount, reason } = balanceSchema.parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const newBalance = Number(targetUser.balance) + amount;
    if (newBalance < 0) {
      res.status(400).json({ error: 'Баланс не может быть отрицательным' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { balance: newBalance },
      select: { id: true, username: true, balance: true },
    });

    console.log(`[ADMIN] ${req.user?.userId} changed balance of ${user.username} by ${amount} (reason: ${reason})`);
    res.json({ ...user, balance: Number(user.balance) });
  } catch (err) {
    console.error('Admin balance error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── CHANGE UC BALANCE ──────────────────────────────────────

const ucBalanceSchema = z.object({
  amount: z.number().refine(v => v !== 0, 'Сумма не может быть 0'),
  reason: z.string().min(1, 'Укажите причину').max(200),
});

router.patch('/users/:id/uc-balance', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { amount, reason } = ucBalanceSchema.parse(req.body);
    const targetId = req.params.id;
    const adminId = req.user?.userId || 'admin';

    const targetUser = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, username: true } });
    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const idempotencyKey = `admin-uc-${targetId}-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      if (amount > 0) {
        await wallet.credit(tx, targetId, amount, 'UC', {
          idempotencyKey,
          reason: `admin_adjustment: ${reason}`,
          refType: 'admin',
          refId: adminId,
        });
      } else {
        await wallet.debit(tx, targetId, Math.abs(amount), 'UC', {
          idempotencyKey,
          reason: `admin_adjustment: ${reason}`,
          refType: 'admin',
          refId: adminId,
        });
      }
    });

    const bal = await wallet.getBalance(targetId);
    console.log(`[ADMIN] ${adminId} changed UC balance of ${targetUser.username} by ${amount} (reason: ${reason})`);
    res.json({ id: targetId, username: targetUser.username, ucBalance: bal.ucBalance });
  } catch (err) {
    console.error('Admin UC balance error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── DELETE USER ────────────────────────────────────────────

router.delete('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (req.params.id === req.user?.userId) {
      res.status(400).json({ error: 'Нельзя удалить самого себя' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (targetUser.role === 'ADMIN') {
      res.status(403).json({ error: 'Нельзя удалить администратора' });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    console.log(`[ADMIN] ${req.user?.userId} deleted user ${targetUser.username}`);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── LIST TOURNAMENTS ───────────────────────────────────────

const listTournamentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
});

router.get('/tournaments', async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = listTournamentsSchema.parse(req.query);
    const where: any = {};
    if (status) where.status = status;

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          teams: { include: { players: { include: { user: { select: { id: true, username: true, avatar: true } } } } } },
          disputes: { where: { status: 'OPEN' } },
          _count: { select: { messages: true, disputes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    res.json({
      tournaments: tournaments.map(t => ({
        ...t, platformFee: Number(t.platformFee), prizePool: Number(t.prizePool),
      })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Admin list tournaments error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── GET TOURNAMENT DETAIL + MESSAGES ───────────────────────

router.get('/tournaments/:id', async (req: Request, res: Response) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id as string },
      include: {
        teams: { include: { players: { include: { user: { select: { id: true, username: true, avatar: true } } } } } },
        matches: { orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }] },
        disputes: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, username: true, avatar: true } } } },
      },
    });
    if (!tournament) { res.status(404).json({ error: 'Турнир не найден' }); return; }
    res.json({ ...tournament, platformFee: Number(tournament.platformFee), prizePool: Number(tournament.prizePool) });
  } catch (err) {
    console.error('Admin get tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── ADMIN SEND MESSAGE TO TOURNAMENT CHAT ──────────────────

const adminMessageSchema = z.object({ content: z.string().max(1000).default(''), imageUrl: z.string().optional() });

router.post('/tournaments/:id/messages', async (req: Request, res: Response) => {
  try {
    const { content, imageUrl } = adminMessageSchema.parse(req.body);
    if (!content && !imageUrl) { res.status(400).json({ error: 'Сообщение или фото обязательно' }); return; }
    const userId = req.user!.userId;
    const tid = req.params.id as string;
    const t = await prisma.tournament.findUnique({ where: { id: tid } });
    if (!t) { res.status(404).json({ error: 'Турнир не найден' }); return; }

    // Upload to Supabase if base64
    let finalImageUrl = imageUrl || null;
    if (finalImageUrl && finalImageUrl.startsWith('data:image/')) {
      const { uploadImage } = await import('../shared/supabase');
      finalImageUrl = await uploadImage(finalImageUrl, `admin/${tid}`);
    }

    const message = await prisma.tournamentMessage.create({
      data: { tournamentId: tid, userId, content: content || '📷 Фото', isAdmin: true, imageUrl: finalImageUrl },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(tid, message);
    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Admin send message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── ADMIN ASSIGN WINNER (direct, no dispute needed) ────────

const assignWinnerSchema = z.object({
  winnerId: z.string().min(1),
  resolution: z.string().min(1).max(1000),
});

router.post('/tournaments/:id/assign-winner', async (req: Request, res: Response) => {
  try {
    const { winnerId, resolution } = assignWinnerSchema.parse(req.body);
    const adminUserId = req.user!.userId;
    const tid = req.params.id as string;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tid },
      include: { matches: true },
    });
    if (!tournament) { res.status(404).json({ error: 'Турнир не найден' }); return; }

    const activeMatch = tournament.matches.find(m => m.status === 'ACTIVE' || m.status === 'DISPUTED');
    if (!activeMatch) { res.status(400).json({ error: 'Нет активного матча' }); return; }

    // Close any open disputes for this tournament
    await prisma.dispute.updateMany({
      where: { tournamentId: tid, status: 'OPEN' },
      data: { status: 'RESOLVED', resolution, resolvedById: adminUserId },
    });

    // Reset tournament status to IN_PROGRESS if it was DISPUTED
    if (tournament.status === 'DISPUTED') {
      await prisma.tournament.update({
        where: { id: tid },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Admin message in chat
    const adminWinnerMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId: tid, userId: adminUserId,
        content: `👑 Администратор назначил победителя:\n\n${resolution}`,
        isAdmin: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(tid, adminWinnerMsg);

    // Use resolveMatch for proper bracket advancement (handles semi-finals → final → completeTournament)
    await resolveMatch(tid, activeMatch.id, winnerId);

    res.json({ resolved: true, matchId: activeMatch.id, winnerId });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Admin assign winner error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── RESOLVE DISPUTE ────────────────────────────────────────

const resolveDisputeSchema = z.object({
  resolution: z.string().min(1).max(1000),
  winnerId: z.string().optional(),
});

router.post('/disputes/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { resolution, winnerId } = resolveDisputeSchema.parse(req.body);
    const adminUserId = req.user!.userId;

    const disputeId = req.params.id as string;
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) { res.status(404).json({ error: 'Жалоба не найдена' }); return; }
    if (dispute.status !== 'OPEN') { res.status(400).json({ error: 'Жалоба уже закрыта' }); return; }

    await prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'RESOLVED', resolution, resolvedById: adminUserId },
    });

    // Admin message in chat
    const adminResolveMsg = await prisma.tournamentMessage.create({
      data: {
        tournamentId: dispute.tournamentId, userId: adminUserId,
        content: `👑 Администратор решил жалобу:\n\n${resolution}`,
        isAdmin: true,
      },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    emitNewMessage(dispute.tournamentId, adminResolveMsg);
    emitTournamentUpdate(dispute.tournamentId, { event: 'dispute_resolved' });

    // If admin picks a winner, resolve the match with proper bracket advancement
    if (winnerId) {
      const activeMatch = await prisma.tournamentMatch.findFirst({
        where: { tournamentId: dispute.tournamentId, status: { in: ['ACTIVE', 'DISPUTED'] } },
      });
      if (activeMatch) {
        // Reset tournament status to IN_PROGRESS before resolving
        await prisma.tournament.update({
          where: { id: dispute.tournamentId },
          data: { status: 'IN_PROGRESS' },
        });
        // resolveMatch handles: mark match COMPLETED, advance bracket, completeTournament if final
        await resolveMatch(dispute.tournamentId, activeMatch.id, winnerId);
      }
    }

    res.json({ resolved: true });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Admin resolve dispute error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── SUPPORT MESSAGES (Admin) ─────────────────────────────────

// List all users who have support conversations (with last message preview)
router.get('/support/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.supportMessage.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
      _count: true,
      orderBy: { _max: { createdAt: 'desc' } },
    });

    const userIds = conversations.map(c => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, avatar: true, email: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    // Get last message for each user
    const lastMessages = await Promise.all(
      conversations.map(async (c) => {
        const lastMsg = await prisma.supportMessage.findFirst({
          where: { userId: c.userId },
          orderBy: { createdAt: 'desc' },
        });
        // Count unread (from user, no admin reply after)
        const lastAdminReply = await prisma.supportMessage.findFirst({
          where: { userId: c.userId, isFromUser: false },
          orderBy: { createdAt: 'desc' },
        });
        const unreadCount = lastAdminReply
          ? await prisma.supportMessage.count({
              where: { userId: c.userId, isFromUser: true, createdAt: { gt: lastAdminReply.createdAt } },
            })
          : await prisma.supportMessage.count({ where: { userId: c.userId, isFromUser: true } });

        return {
          userId: c.userId,
          user: userMap[c.userId] || null,
          messageCount: c._count,
          lastMessage: lastMsg?.content || '',
          lastMessageAt: c._max.createdAt,
          unreadCount,
        };
      })
    );

    res.json({ conversations: lastMessages });
  } catch (err) {
    console.error('Admin get support conversations error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get messages for a specific user's support chat
router.get('/support/conversations/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true, email: true, rating: true, ucBalance: true, createdAt: true },
    });

    res.json({ messages, user });
  } catch (err) {
    console.error('Admin get support messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Admin reply to support chat
router.post('/support/conversations/:userId/reply', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const adminId = req.user!.userId;
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);

    const message = await prisma.supportMessage.create({
      data: {
        userId,
        content,
        isFromUser: false,
        adminId,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Admin reply support error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── WOW MAP CRUD ────────────────────────────────────────────

const wowFieldNames: Record<string, string> = {
  mapId: 'Map ID', name: 'Название', format: 'Формат', teamCount: 'Команд',
  playersPerTeam: 'Игроков/команда', rounds: 'Раундов', image: 'Изображение',
};

const wowMapSchema = z.object({
  mapId: z.string({ required_error: 'Map ID обязателен' }).min(1, 'Map ID обязателен').max(20, 'Map ID макс. 20 символов'),
  name: z.string({ required_error: 'Название обязательно' }).min(1, 'Название обязательно').max(100, 'Название макс. 100 символов'),
  image: z.string().optional(),
  imageData: z.string().optional(),
  format: z.string({ required_error: 'Формат обязателен' }).min(1, 'Формат обязателен').max(20, 'Формат макс. 20 символов'),
  teamCount: z.number({ required_error: 'Кол-во команд обязательно', invalid_type_error: 'Команд — число' }).int('Команд — целое число').min(2, 'Минимум 2 команды').max(8, 'Максимум 8 команд'),
  playersPerTeam: z.number({ required_error: 'Игроков/команда обязательно', invalid_type_error: 'Игроков — число' }).int('Игроков — целое число').min(1, 'Минимум 1 игрок').max(4, 'Максимум 4 игрока'),
  rounds: z.number({ required_error: 'Раунды обязательны', invalid_type_error: 'Раунды — число' }).int('Раунды — целое число').min(1, 'Минимум 1 раунд').max(100, 'Максимум 100 раундов'),
  rules: z.string().optional(),
  isActive: z.boolean().optional(),
  prizeDistribution: z.string().optional(),
});

function formatZodErrors(err: z.ZodError): string {
  return err.errors.map(e => {
    const field = e.path.join('.');
    const label = wowFieldNames[field] || field;
    return `${label}: ${e.message}`;
  }).join('\n');
}

// List all WoW maps
router.get('/wow-maps', async (_req: Request, res: Response) => {
  try {
    const maps = await prisma.woWMap.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tournaments: true } } },
    });
    res.json({ maps });
  } catch (err: any) {
    console.error('List WoW maps error:', err);
    res.status(500).json({ error: 'Ошибка сервера', debug: err?.message || String(err) });
  }
});

// Create WoW map
router.post('/wow-maps', async (req: Request, res: Response) => {
  try {
    const data = wowMapSchema.parse(req.body);
    const existing = await prisma.woWMap.findUnique({ where: { mapId: data.mapId } });
    if (existing) {
      res.status(409).json({ error: 'Карта с таким ID уже существует' });
      return;
    }
    // Handle image upload
    let imageUrl = data.image || '';
    if (data.imageData) {
      imageUrl = await uploadImage(data.imageData, 'wow-maps');
    }
    if (!imageUrl) { res.status(400).json({ error: 'Нужно загрузить изображение' }); return; }
    const { imageData: _, ...rest } = data;
    const map = await prisma.woWMap.create({ data: { ...rest, image: imageUrl } });
    res.status(201).json(map);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: formatZodErrors(err) }); return; }
    console.error('Create WoW map error:', err);
    res.status(500).json({ error: 'Ошибка сервера', debug: (err as any)?.message || String(err) });
  }
});

// Update WoW map
router.put('/wow-maps/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = wowMapSchema.partial().parse(req.body);
    // Handle image upload on update
    let updateData: any = { ...data };
    if (data.imageData) {
      updateData.image = await uploadImage(data.imageData, 'wow-maps');
    }
    delete updateData.imageData;
    const map = await prisma.woWMap.update({ where: { id }, data: updateData });
    res.json(map);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: formatZodErrors(err) }); return; }
    console.error('Update WoW map error:', err);
    res.status(500).json({ error: 'Ошибка сервера', debug: (err as any)?.message || String(err) });
  }
});

// Delete WoW map
router.delete('/wow-maps/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tournamentsCount = await prisma.tournament.count({ where: { wowMapId: id } });
    if (tournamentsCount > 0) {
      // Soft delete — just deactivate
      await prisma.woWMap.update({ where: { id }, data: { isActive: false } });
      res.json({ deactivated: true, message: 'Карта деактивирована (есть связанные турниры)' });
      return;
    }
    await prisma.woWMap.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete WoW map error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── CLEANUP OLD VERBOSE SYSTEM MESSAGES ─────────────────────

router.post('/cleanup-system-messages', async (_req: Request, res: Response) => {
  try {
    const result = await prisma.tournamentMessage.deleteMany({
      where: {
        isSystem: true,
        OR: [
          { content: { contains: 'вступил в турнир' } },
          { content: { contains: 'покинул турнир' } },
          { content: { contains: 'Ищем замену' } },
        ],
      },
    });

    res.json({ deleted: result.count, message: `Удалено ${result.count} старых системных сообщений` });
  } catch (err) {
    console.error('Cleanup system messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ─── CLASSIC TOURNAMENTS (Admin) ─────────────────────────────
// ═══════════════════════════════════════════════════════════════

const classicCreateSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  map: z.string().min(1).max(100),
  mapImage: z.string().optional(),
  imageData: z.string().optional(),
  mode: z.enum(['SOLO', 'DUO', 'SQUAD']),
  server: z.enum(['EUROPE', 'NA', 'ASIA', 'ME', 'SA']),
  startTime: z.string().datetime(),
  entryFee: z.number().int().min(0),
  prizePool: z.number().int().min(0),
  maxParticipants: z.number().int().min(2).max(1000),
  winnerCount: z.number().int().min(1).max(3),
  prize1: z.number().int().min(0),
  prize2: z.number().int().min(0).optional().default(0),
  prize3: z.number().int().min(0).optional().default(0),
});

// Create classic tournament
router.post('/classic', async (req: Request, res: Response) => {
  try {
    const data = classicCreateSchema.parse(req.body);
    const adminId = req.user!.userId;

    // Handle image upload
    let mapImageUrl = data.mapImage || null;
    if (data.imageData) {
      mapImageUrl = await uploadImage(data.imageData, 'classic-maps');
    }

    const tournament = await prisma.classicTournament.create({
      data: {
        title: data.title,
        description: data.description,
        map: data.map,
        mapImage: mapImageUrl,
        mode: data.mode,
        server: data.server,
        startTime: new Date(data.startTime),
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        maxParticipants: data.maxParticipants,
        winnerCount: data.winnerCount,
        prize1: data.prize1,
        prize2: data.prize2 || 0,
        prize3: data.prize3 || 0,
        createdBy: adminId,
      },
    });

    emitGlobalTournamentChange();
    res.status(201).json(tournament);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors });
      return;
    }
    console.error('Create classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// List classic tournaments (admin view)
router.get('/classic', async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = String(status).toUpperCase();

    const [tournaments, total] = await Promise.all([
      prisma.classicTournament.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { _count: { select: { registrations: true } } },
      }),
      prisma.classicTournament.count({ where }),
    ]);

    res.json({ tournaments, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('List classic tournaments error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── CLASSIC ADMIN CHAT (must be before /classic/:id) ────────

// List all registrations with unread messages (admin inbox)
router.get('/classic/chats', async (_req: Request, res: Response) => {
  try {
    const regs = await prisma.classicRegistration.findMany({
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        tournament: { select: { id: true, title: true, map: true, mode: true, status: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const chats = regs.map(r => ({
      registrationId: r.id,
      user: r.user,
      tournament: r.tournament,
      messageCount: r._count.messages,
      lastMessage: r.messages[0] ? { content: r.messages[0].content, createdAt: r.messages[0].createdAt, isAdmin: r.messages[0].isAdmin } : null,
    }));

    res.json({ chats });
  } catch (err) {
    console.error('Admin classic chats error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get messages for a registration (admin view)
router.get('/classic/registrations/:regId/messages', async (req: Request, res: Response) => {
  try {
    const regId = req.params.regId as string;
    const messages = await prisma.classicMessage.findMany({
      where: { registrationId: regId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    res.json({ messages });
  } catch (err) {
    console.error('Admin classic messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Send admin message to a registration chat
const classicAdminMsgSchema = z.object({
  content: z.string().min(1).max(1000),
});

router.post('/classic/registrations/:regId/messages', async (req: Request, res: Response) => {
  try {
    const { content } = classicAdminMsgSchema.parse(req.body);
    const adminId = req.user!.userId;

    const regId = req.params.regId as string;
    const reg = await prisma.classicRegistration.findUnique({ where: { id: regId } });
    if (!reg) { res.status(404).json({ error: 'Регистрация не найдена' }); return; }

    const message = await prisma.classicMessage.create({
      data: {
        registrationId: regId,
        userId: adminId,
        content,
        isAdmin: true,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Admin classic send message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Broadcast message to ALL registrations of a classic tournament
const classicBroadcastSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.post('/classic/:id/broadcast', async (req: Request, res: Response) => {
  try {
    const { content } = classicBroadcastSchema.parse(req.body);
    const adminId = req.user!.userId;
    const tournamentId = req.params.id as string;

    const regs = await prisma.classicRegistration.findMany({
      where: { tournamentId },
      select: { id: true },
    });

    if (regs.length === 0) {
      res.status(400).json({ error: 'Нет регистраций' });
      return;
    }

    await prisma.classicMessage.createMany({
      data: regs.map(r => ({
        registrationId: r.id,
        userId: adminId,
        content,
        isAdmin: true,
      })),
    });

    res.json({ sent: regs.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Admin classic broadcast error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Get classic tournament detail with registrations
router.get('/classic/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tournament = await prisma.classicTournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            _count: { select: { messages: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Турнир не найден' });
      return;
    }

    res.json(tournament);
  } catch (err) {
    console.error('Get classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Update classic tournament
const classicUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  map: z.string().min(1).max(100).optional(),
  mapImage: z.string().optional().nullable(),
  imageData: z.string().optional(),
  mode: z.enum(['SOLO', 'DUO', 'SQUAD']).optional(),
  server: z.enum(['EUROPE', 'NA', 'ASIA', 'ME', 'SA']).optional(),
  startTime: z.string().datetime().optional(),
  entryFee: z.number().int().min(0).optional(),
  prizePool: z.number().int().min(0).optional(),
  maxParticipants: z.number().int().min(2).max(1000).optional(),
  winnerCount: z.number().int().min(1).max(3).optional(),
  prize1: z.number().int().min(0).optional(),
  prize2: z.number().int().min(0).optional(),
  prize3: z.number().int().min(0).optional(),
});

router.put('/classic/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = classicUpdateSchema.parse(req.body);
    const tournament = await prisma.classicTournament.findUnique({ where: { id } });
    if (!tournament) { res.status(404).json({ error: 'Турнир не найден' }); return; }
    if (tournament.status === 'COMPLETED') { res.status(400).json({ error: 'Нельзя редактировать завершённый турнир' }); return; }

    const updateData: Record<string, unknown> = { ...data };
    delete updateData.imageData;
    if (data.imageData) {
      updateData.mapImage = await uploadImage(data.imageData, 'classic-maps');
    }
    if (data.startTime) updateData.startTime = new Date(data.startTime);

    const updated = await prisma.classicTournament.update({
      where: { id },
      data: updateData,
    });

    emitGlobalTournamentChange();
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors });
      return;
    }
    console.error('Update classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Start classic tournament (close registration)
router.post('/classic/:id/start', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tournament = await prisma.classicTournament.findUnique({ where: { id } });
    if (!tournament) { res.status(404).json({ error: 'Турнир не найден' }); return; }
    if (tournament.status !== 'REGISTRATION') { res.status(400).json({ error: 'Турнир не в статусе регистрации' }); return; }

    const updated = await prisma.classicTournament.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    emitGlobalTournamentChange();
    res.json(updated);
  } catch (err) {
    console.error('Start classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Complete classic tournament — assign winners, pay prizes
const classicCompleteSchema = z.object({
  winners: z.array(z.object({
    registrationId: z.string(),
    place: z.number().int().min(1).max(3),
  })).min(1).max(3),
});

router.post('/classic/:id/complete', async (req: Request, res: Response) => {
  try {
    const { winners } = classicCompleteSchema.parse(req.body);
    const tournamentId = req.params.id as string;

    const affectedUserIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      const tournament: any = await tx.classicTournament.findUnique({
        where: { id: tournamentId },
        include: { registrations: true },
      });

      if (!tournament) throw Object.assign(new Error('Турнир не найден'), { statusCode: 404 });
      if (tournament.status !== 'IN_PROGRESS') throw Object.assign(new Error('Турнир не идёт'), { statusCode: 400 });

      // Validate winners
      for (const w of winners) {
        if (w.place > tournament.winnerCount) throw Object.assign(new Error(`Турнир имеет ${tournament.winnerCount} призовых мест`), { statusCode: 400 });
        const reg = tournament.registrations.find((r: any) => r.id === w.registrationId);
        if (!reg) throw Object.assign(new Error(`Регистрация ${w.registrationId} не найдена`), { statusCode: 400 });
      }

      // Assign places and pay prizes
      const prizeMap: Record<number, number> = { 1: tournament.prize1, 2: tournament.prize2, 3: tournament.prize3 };
      const winnerIds: Record<number, string> = {};

      for (const w of winners) {
        const reg = tournament.registrations.find((r: any) => r.id === w.registrationId)!;
        const prizeAmount = prizeMap[w.place] || 0;
        winnerIds[w.place] = w.registrationId;

        await tx.classicRegistration.update({
          where: { id: w.registrationId },
          data: { place: w.place, prizeAmount },
        });

        if (prizeAmount > 0) {
          await wallet.credit(tx, reg.userId, prizeAmount, 'UC', {
            idempotencyKey: `classic-${tournamentId}-prize-${reg.userId}-place${w.place}`,
            reason: 'classic_tournament_prize',
            refType: 'classic_tournament',
            refId: tournamentId,
          });
          affectedUserIds.push(reg.userId);
        }

        // System message in winner's chat
        const placeEmoji = w.place === 1 ? '🥇' : w.place === 2 ? '🥈' : '🥉';
        await tx.classicMessage.create({
          data: {
            registrationId: w.registrationId,
            userId: reg.userId,
            content: `${placeEmoji} Поздравляем! Вы заняли ${w.place} место и получили ${prizeAmount} UC!`,
            isSystem: true,
          },
        });
      }

      await tx.classicTournament.update({
        where: { id: tournamentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          winner1Id: winnerIds[1] || null,
          winner2Id: winnerIds[2] || null,
          winner3Id: winnerIds[3] || null,
        },
      });
    });

    // Balance updates after tx
    for (const uid of affectedUserIds) {
      const bal = await wallet.getBalance(uid);
      emitBalanceUpdate(uid, bal.balance, bal.ucBalance);
    }
    emitGlobalTournamentChange();

    res.json({ completed: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors });
      return;
    }
    if (err.statusCode) { res.status(err.statusCode).json({ error: err.message }); return; }
    console.error('Complete classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Cancel classic tournament — refund all entries
router.post('/classic/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tournamentId = req.params.id as string;
    const affectedUserIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      const tournament: any = await tx.classicTournament.findUnique({
        where: { id: tournamentId },
        include: { registrations: true },
      });

      if (!tournament) throw Object.assign(new Error('Турнир не найден'), { statusCode: 404 });
      if (tournament.status === 'COMPLETED') throw Object.assign(new Error('Нельзя отменить завершённый турнир'), { statusCode: 400 });

      // Refund all entries
      for (const reg of tournament.registrations) {
        if (tournament.entryFee > 0) {
          await wallet.credit(tx, reg.userId, tournament.entryFee, 'UC', {
            idempotencyKey: `classic-${tournamentId}-refund-${reg.userId}`,
            reason: 'classic_tournament_refund',
            refType: 'classic_tournament',
            refId: tournamentId,
          });
          affectedUserIds.push(reg.userId);
        }

        await tx.classicMessage.create({
          data: {
            registrationId: reg.id,
            userId: reg.userId,
            content: `❌ Турнир отменён. ${tournament.entryFee > 0 ? `Возврат ${tournament.entryFee} UC на баланс.` : ''}`,
            isSystem: true,
          },
        });
      }

      await tx.classicTournament.update({
        where: { id: tournamentId },
        data: { status: 'CANCELLED' },
      });
    });

    for (const uid of affectedUserIds) {
      const bal = await wallet.getBalance(uid);
      emitBalanceUpdate(uid, bal.balance, bal.ucBalance);
    }
    emitGlobalTournamentChange();

    res.json({ cancelled: true });
  } catch (err: any) {
    if (err.statusCode) { res.status(err.statusCode).json({ error: err.message }); return; }
    console.error('Cancel classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Delete classic tournament
router.delete('/classic/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tournament: any = await prisma.classicTournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
    if (!tournament) { res.status(404).json({ error: 'Турнир не найден' }); return; }
    if (tournament.status === 'IN_PROGRESS') { res.status(400).json({ error: 'Нельзя удалить турнир в процессе. Сначала отмените или завершите.' }); return; }

    // Delete messages, registrations, then tournament
    await prisma.$transaction(async (tx) => {
      await tx.classicMessage.deleteMany({ where: { registration: { tournamentId: id } } });
      await tx.classicRegistration.deleteMany({ where: { tournamentId: id } });
      await tx.classicTournament.delete({ where: { id } });
    });
    emitGlobalTournamentChange();
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete classic tournament error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
