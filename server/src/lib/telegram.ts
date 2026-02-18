import crypto from 'crypto';
import { getEnv } from '../config/env';

export interface TelegramLoginData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(data: TelegramLoginData): boolean {
  const env = getEnv();
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  const { hash, ...rest } = data;

  // Build check string: sorted key=value pairs joined by \n
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n');

  // Secret key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // HMAC-SHA256 of the check string
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (hmac !== hash) return false;

  // Check auth_date is not older than 1 day (86400 seconds)
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 86400) return false;

  return true;
}
