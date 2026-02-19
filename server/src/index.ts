// BigInt JSON serialization support
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { getEnv } from './config/env';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import tournamentRoutes from './routes/tournaments';
import supportRoutes from './routes/support';
import wowRoutes from './routes/wow';
import { startBotPolling } from './lib/telegramBot';
import { initSocketIO } from './shared/socket';
import { prisma } from './shared/prisma';
import { AppError } from './shared/errors';

const env = getEnv();
const app = express();

// ─── SECURITY ────────────────────────────────────────────────

const allowedOrigins = env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/+$/, ''));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── TRUST PROXY (must be before rate limiters for correct IP detection) ─

app.set('trust proxy', 1);

// ─── RATE LIMITING ───────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window per IP
  message: { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const telegramPollLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute (polling every 2s = 30/min, with margin)
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // 600 requests per minute per IP (chat polling + tournament ops need headroom)
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ─── PARSERS ─────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── ROUTES ──────────────────────────────────────────────────

// Telegram status polling — separate higher rate limit
app.use('/api/auth/telegram/status', telegramPollLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wow', wowRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: 'v2-wow-maps', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// ─── GLOBAL ERROR HANDLER ───────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Ошибка сервера' });
});

// ─── START ───────────────────────────────────────────────────

const httpServer = createServer(app);
initSocketIO(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`\n🚀 TourneyHub API running on http://localhost:${env.PORT}`);
  console.log(`📦 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`🔌 Socket.IO enabled\n`);

  // Start Telegram bot polling
  startBotPolling();

  // One-time cleanup: remove old verbose system messages from DB
  prisma.tournamentMessage.deleteMany({
    where: {
      isSystem: true,
      OR: [
        { content: { contains: 'вступил в турнир' } },
        { content: { contains: 'покинул турнир' } },
        { content: { contains: 'Ищем замену' } },
      ],
    },
  }).then(r => {
    if (r.count > 0) console.log(`🧹 Cleaned up ${r.count} old verbose system messages`);
  }).catch(err => console.error('Cleanup error:', err));
});

export default app;
