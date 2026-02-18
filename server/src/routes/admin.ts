import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';
import { completeTournament, resolveMatch } from './tournaments';
import { emitNewMessage, emitTournamentUpdate } from '../lib/socket';
import { uploadImage } from '../lib/supabase';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(requireAdmin);

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

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const newBalance = Number(targetUser.ucBalance) + amount;
    if (newBalance < 0) {
      res.status(400).json({ error: 'UC баланс не может быть отрицательным' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ucBalance: newBalance },
      select: { id: true, username: true, ucBalance: true },
    });

    console.log(`[ADMIN] ${req.user?.userId} changed UC balance of ${user.username} by ${amount} (reason: ${reason})`);
    res.json({ ...user, ucBalance: Number(user.ucBalance) });
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
      const { uploadImage } = await import('../lib/supabase');
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

const wowMapSchema = z.object({
  mapId: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  image: z.string().optional(),            // URL (existing) or empty for upload
  imageData: z.string().optional(),         // base64 image data for upload
  format: z.string().min(1).max(20),
  teamCount: z.number().int().min(2).max(8),
  playersPerTeam: z.number().int().min(1).max(4),
  rounds: z.number().int().min(1).max(100),
  rules: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  gamesPlayed: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  prizeDistribution: z.string().optional(),
});

// List all WoW maps
router.get('/wow-maps', async (_req: Request, res: Response) => {
  try {
    const maps = await prisma.woWMap.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tournaments: true } } },
    });
    res.json({ maps });
  } catch (err) {
    console.error('List WoW maps error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
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
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные', details: err.flatten().fieldErrors }); return; }
    console.error('Create WoW map error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
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
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Неверные данные' }); return; }
    console.error('Update WoW map error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
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

export default router;
