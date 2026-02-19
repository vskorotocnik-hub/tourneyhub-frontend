import crypto from 'crypto';
import { prisma } from '../shared/prisma';
import { getEnv } from '../config/env';

const TELEGRAM_API = 'https://api.telegram.org/bot';

let lastUpdateId = 0;
let pollingInterval: ReturnType<typeof setInterval> | null = null;

async function callTelegram(method: string, body?: Record<string, unknown>): Promise<any> {
  const env = getEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
}

async function sendMessage(chatId: number, text: string, parseMode = 'HTML'): Promise<void> {
  await callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  });
}

async function handleUpdate(update: any): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const from = message.from;

  // Handle /start login_XXXXXX
  if (text.startsWith('/start login_')) {
    const token = text.replace('/start login_', '').trim();

    if (!token) {
      await sendMessage(chatId, '❌ Неверная ссылка для входа.');
      return;
    }

    // Find pending session
    const session = await prisma.telegramAuthSession.findUnique({
      where: { token },
    });

    if (!session) {
      await sendMessage(chatId, '❌ Ссылка для входа не найдена или уже использована.');
      return;
    }

    if (session.status !== 'pending') {
      await sendMessage(chatId, '⚠️ Эта ссылка уже была использована.');
      return;
    }

    if (session.expiresAt < new Date()) {
      await prisma.telegramAuthSession.update({
        where: { id: session.id },
        data: { status: 'expired' },
      });
      await sendMessage(chatId, '⏰ Ссылка для входа истекла. Попробуй ещё раз на сайте.');
      return;
    }

    // Get user photo
    let photoUrl: string | null = null;
    try {
      const photosRes = await callTelegram('getUserProfilePhotos', {
        user_id: from.id,
        limit: 1,
      });
      if (photosRes?.result?.total_count > 0) {
        const fileId = photosRes.result.photos[0][0].file_id;
        const fileRes = await callTelegram('getFile', { file_id: fileId });
        if (fileRes?.result?.file_path) {
          const env = getEnv();
          photoUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileRes.result.file_path}`;
        }
      }
    } catch {
      // Ignore photo errors
    }

    // Mark session as completed with Telegram user data
    await prisma.telegramAuthSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        telegramId: BigInt(from.id),
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        username: from.username || null,
        photoUrl,
      },
    });

    const displayName = from.first_name || from.username || 'друг';
    await sendMessage(
      chatId,
      `✅ <b>${displayName}</b>, вход выполнен!\n\nВернись на сайт — ты уже залогинен. 🎮`
    );

    return;
  }

  // Handle plain /start
  if (text === '/start') {
    await sendMessage(
      chatId,
      `👋 Привет! Я бот <b>TourneyHub</b>.\n\nЧтобы войти на сайт через Telegram, нажми кнопку "Войти через Telegram" на сайте.\n\n🌐 <a href="https://tourneyhub-preview.netlify.app/login">Перейти на сайт</a>`
    );
    return;
  }
}

async function pollUpdates(): Promise<void> {
  try {
    const result = await callTelegram('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 5,
      allowed_updates: ['message'],
    });

    if (result?.ok && result.result?.length > 0) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;
        try {
          await handleUpdate(update);
        } catch (err) {
          console.error('Error handling Telegram update:', err);
        }
      }
    }
  } catch (err) {
    console.error('Telegram polling error:', err);
  }
}

// ─── PUBLIC API ──────────────────────────────────────────────

export function generateAuthToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function createAuthSession(): Promise<{ token: string; deepLink: string }> {
  const token = generateAuthToken();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.telegramAuthSession.create({
    data: { token, expiresAt },
  });

  const env = getEnv();
  const botToken = env.TELEGRAM_BOT_TOKEN;
  // Get bot username from token (cached)
  let botUsername = 'tourneyhub_auth_bot';
  try {
    const me = await callTelegram('getMe');
    if (me?.result?.username) botUsername = me.result.username;
  } catch {}

  const deepLink = `https://t.me/${botUsername}?start=login_${token}`;

  return { token, deepLink };
}

export async function checkAuthSession(token: string) {
  const session = await prisma.telegramAuthSession.findUnique({
    where: { token },
  });

  if (!session) return { status: 'not_found' as const };
  if (session.expiresAt < new Date() && session.status === 'pending') {
    await prisma.telegramAuthSession.update({
      where: { id: session.id },
      data: { status: 'expired' },
    });
    return { status: 'expired' as const };
  }

  if (session.status === 'completed' && session.telegramId) {
    return {
      status: 'completed' as const,
      telegramId: session.telegramId,
      firstName: session.firstName,
      lastName: session.lastName,
      username: session.username,
      photoUrl: session.photoUrl,
    };
  }

  return { status: session.status as 'pending' | 'expired' };
}

export function startBotPolling(): void {
  const env = getEnv();
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not set — bot polling disabled');
    return;
  }

  // Clear any existing webhook so polling works
  callTelegram('deleteWebhook').then(() => {
    console.log('🤖 Telegram bot polling started');
  });

  pollingInterval = setInterval(pollUpdates, 2000);
}

export function stopBotPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}
