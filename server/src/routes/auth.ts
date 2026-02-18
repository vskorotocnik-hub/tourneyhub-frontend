import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken, generateTokenId } from '../lib/jwt';
import { verifyTelegramAuth, TelegramLoginData } from '../lib/telegram';
import { createAuthSession, checkAuthSession } from '../lib/telegramBot';
import { registerSchema, loginSchema, telegramAuthSchema, sendCodeSchema, verifyCodeSchema, resetPasswordSchema, googleAuthSchema } from '../validators/auth';
import { requireAuth } from '../middleware/auth';
import { getEnv } from '../config/env';
import { sendVerificationCode, verifyCode, isEmailVerified, cleanupVerification } from '../lib/email';

const router = Router();

// ─── REGISTER (Email) ────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password, username } = parsed.data;

    // Check if email or username already taken
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing) {
      if (existing.email === email) {
        res.status(409).json({ error: 'Этот email уже зарегистрирован' });
        return;
      }
      res.status(409).json({ error: 'Этот username уже занят' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        displayName: username,
      },
      select: { id: true, username: true, email: true, role: true },
    });

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const tokenId = generateTokenId();

    // Store refresh token
    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: tokenId,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: tokenId,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── LOGIN (Email) ───────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, role: true, passwordHash: true, isBanned: true },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Неправильный email или пароль' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Аккаунт заблокирован' });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Неправильный email или пароль' });
      return;
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const tokenId = generateTokenId();

    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: tokenId,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: tokenId,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── TELEGRAM AUTH ───────────────────────────────────────────

router.post('/telegram', async (req: Request, res: Response) => {
  try {
    const parsed = telegramAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Неверные данные Telegram' });
      return;
    }

    const tgData = parsed.data as TelegramLoginData;

    // Verify HMAC signature from Telegram
    if (!verifyTelegramAuth(tgData)) {
      res.status(401).json({ error: 'Неверная подпись Telegram' });
      return;
    }

    // Find existing Telegram user or create new one
    let telegramAuth = await prisma.telegramAuth.findUnique({
      where: { telegramId: BigInt(tgData.id) },
      include: { user: { select: { id: true, username: true, email: true, role: true, isBanned: true, banReason: true } } },
    });

    let user;

    if (telegramAuth) {
      // Existing user — update Telegram data
      if (telegramAuth.user.isBanned) {
        res.status(403).json({ error: 'BANNED', reason: telegramAuth.user.banReason || 'Нарушение правил платформы' });
        return;
      }

      await prisma.telegramAuth.update({
        where: { id: telegramAuth.id },
        data: {
          firstName: tgData.first_name || null,
          lastName: tgData.last_name || null,
          username: tgData.username || null,
          photoUrl: tgData.photo_url || null,
          authDate: new Date(tgData.auth_date * 1000),
        },
      });

      user = telegramAuth.user;
    } else {
      // New user via Telegram
      const username = tgData.username || `tg_${tgData.id}`;

      // Ensure unique username
      let finalUsername = username;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${suffix++}`;
      }

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          displayName: [tgData.first_name, tgData.last_name].filter(Boolean).join(' ') || finalUsername,
          avatar: tgData.photo_url || null,
          isVerified: true,
          telegramAuth: {
            create: {
              telegramId: BigInt(tgData.id),
              firstName: tgData.first_name || null,
              lastName: tgData.last_name || null,
              username: tgData.username || null,
              photoUrl: tgData.photo_url || null,
              authDate: new Date(tgData.auth_date * 1000),
            },
          },
        },
        select: { id: true, username: true, email: true, role: true },
      });
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const tokenId = generateTokenId();

    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: tokenId,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: tokenId,
    });
  } catch (err) {
    console.error('Telegram auth error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── REFRESH TOKEN ───────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token обязателен' });
      return;
    }

    // Find and validate stored token
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, role: true, isBanned: true } } },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      res.status(401).json({ error: 'Refresh token истёк или недействителен' });
      return;
    }

    if (stored.user.isBanned) {
      res.status(403).json({ error: 'Аккаунт заблокирован' });
      return;
    }

    // Rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const payload = { userId: stored.user.id, role: stored.user.role };
    const newAccessToken = signAccessToken(payload);
    const newTokenId = generateTokenId();

    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: newTokenId,
        userId: stored.user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newTokenId });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: req.user!.userId } });
    }
    res.json({ message: 'Выход выполнен' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── GET CURRENT USER ────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
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
        createdAt: true,
        telegramAuth: { select: { telegramId: true, username: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── TELEGRAM BOT AUTH (native app) ─────────────────────────

router.post('/telegram/init', async (_req: Request, res: Response) => {
  try {
    const { token, deepLink } = await createAuthSession();
    res.json({ token, deepLink });
  } catch (err) {
    console.error('Telegram init error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/telegram/status/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const result = await checkAuthSession(token);

    if (result.status === 'not_found') {
      res.status(404).json({ status: 'not_found' });
      return;
    }

    if (result.status !== 'completed') {
      res.json({ status: result.status });
      return;
    }

    // Auth completed — find or create user, issue tokens
    const telegramId = result.telegramId!;

    let telegramAuth = await prisma.telegramAuth.findUnique({
      where: { telegramId },
      include: { user: { select: { id: true, username: true, email: true, role: true, isBanned: true, banReason: true } } },
    });

    let user;

    if (telegramAuth) {
      if (telegramAuth.user.isBanned) {
        res.status(403).json({ error: 'BANNED', reason: telegramAuth.user.banReason || 'Нарушение правил платформы' });
        return;
      }

      // Update Telegram data
      await prisma.telegramAuth.update({
        where: { id: telegramAuth.id },
        data: {
          firstName: result.firstName || null,
          lastName: result.lastName || null,
          username: result.username || null,
          photoUrl: result.photoUrl || null,
          authDate: new Date(),
        },
      });

      user = telegramAuth.user;
    } else {
      // New user via Telegram
      const baseUsername = result.username || `tg_${telegramId}`;
      let finalUsername = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}_${suffix++}`;
      }

      user = await prisma.user.create({
        data: {
          username: finalUsername,
          displayName: [result.firstName, result.lastName].filter(Boolean).join(' ') || finalUsername,
          avatar: result.photoUrl || null,
          isVerified: true,
          telegramAuth: {
            create: {
              telegramId,
              firstName: result.firstName || null,
              lastName: result.lastName || null,
              username: result.username || null,
              photoUrl: result.photoUrl || null,
              authDate: new Date(),
            },
          },
        },
        select: { id: true, username: true, email: true, role: true },
      });
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const tokenId = generateTokenId();

    const env = getEnv();
    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: tokenId,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    // Delete the auth session (one-time use)
    await prisma.telegramAuthSession.delete({ where: { token } }).catch(() => {});

    res.json({
      status: 'completed',
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: tokenId,
    });
  } catch (err) {
    console.error('Telegram status error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── EMAIL VERIFICATION ─────────────────────────────────────

router.post('/email/send-code', async (req: Request, res: Response) => {
  try {
    const parsed = sendCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, type } = parsed.data;

    // For login/reset: check that user with this email exists
    if (type === 'login' || type === 'reset_password') {
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) {
        res.status(404).json({ error: 'Пользователь с таким email не найден' });
        return;
      }
    }

    // For register: check that email is NOT already taken
    if (type === 'register') {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        res.status(409).json({ error: 'Этот email уже зарегистрирован' });
        return;
      }
    }

    const result = await sendVerificationCode(email, type);
    if (!result.success) {
      res.status(429).json({ error: result.error });
      return;
    }

    res.json({ message: 'Код отправлен на почту' });
  } catch (err) {
    console.error('Send code error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.post('/email/verify-code', async (req: Request, res: Response) => {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, code, type } = parsed.data;
    const result = await verifyCode(email, code, type);

    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ verified: true });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── RESET PASSWORD ─────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Ошибка валидации', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    // Check that email was verified for reset
    const verified = await isEmailVerified(email, 'reset_password');
    if (!verified) {
      res.status(403).json({ error: 'Сначала подтвердите email' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // Cleanup verification records
    await cleanupVerification(email, 'reset_password');

    // Invalidate all refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── GOOGLE OAUTH ───────────────────────────────────────────

router.post('/google', async (req: Request, res: Response) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Неверные данные' });
      return;
    }

    const env = getEnv();
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      res.status(503).json({ error: 'Google OAuth не настроен' });
      return;
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: parsed.data.code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: parsed.data.redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Google token exchange error:', err);
      res.status(401).json({ error: 'Ошибка авторизации Google' });
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: 'Не удалось получить данные Google' });
      return;
    }

    const googleUser = await userRes.json() as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    // Find or create user
    let googleAuth = await prisma.googleAuth.findUnique({
      where: { googleId: googleUser.id },
      include: { user: { select: { id: true, username: true, email: true, role: true, isBanned: true, banReason: true } } },
    });

    let user;

    if (googleAuth) {
      if (googleAuth.user.isBanned) {
        res.status(403).json({ error: 'BANNED', reason: googleAuth.user.banReason || 'Нарушение правил платформы' });
        return;
      }

      // Update Google data
      await prisma.googleAuth.update({
        where: { id: googleAuth.id },
        data: { email: googleUser.email, name: googleUser.name, avatar: googleUser.picture },
      });

      user = googleAuth.user;
    } else {
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({ where: { email: googleUser.email } });

      if (existingUser) {
        // Link Google to existing account
        await prisma.googleAuth.create({
          data: {
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
            userId: existingUser.id,
          },
        });
        user = existingUser;
      } else {
        // Create new user
        const baseUsername = googleUser.name?.replace(/\s+/g, '_').toLowerCase() || `google_${googleUser.id}`;
        let finalUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20);
        if (finalUsername.length < 3) finalUsername = `user_${googleUser.id.substring(0, 8)}`;
        let suffix = 1;
        while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
          finalUsername = `${baseUsername.substring(0, 16)}_${suffix++}`;
        }

        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            username: finalUsername,
            displayName: googleUser.name || finalUsername,
            avatar: googleUser.picture || null,
            isVerified: true,
            googleAuth: {
              create: {
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.picture,
              },
            },
          },
          select: { id: true, username: true, email: true, role: true },
        });
      }
    }

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Generate tokens
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const tokenId = generateTokenId();

    const expiresAt = new Date(Date.now() + parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: tokenId,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      accessToken,
      refreshToken: tokenId,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// ─── GOOGLE CONFIG (for frontend) ───────────────────────────

router.get('/google/config', (req: Request, res: Response) => {
  const env = getEnv();
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: 'Google OAuth не настроен' });
    return;
  }
  const allowedOrigins = env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/+$/, ''));
  const origin = req.headers.origin || allowedOrigins[0];
  const matchedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  res.json({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri: `${matchedOrigin}/auth/google/callback`,
  });
});

// ─── HELPER ──────────────────────────────────────────────────

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export default router;
