import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// ─── GET SUPPORT MESSAGES ───────────────────────────────────

router.get('/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.json({ messages });
  } catch (err) {
    console.error('Get support messages error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── SEND SUPPORT MESSAGE ───────────────────────────────────

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

router.post('/messages', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { content } = messageSchema.parse(req.body);

    const message = await prisma.supportMessage.create({
      data: {
        userId,
        content,
        isFromUser: true,
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    res.status(201).json(message);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }
    console.error('Send support message error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
