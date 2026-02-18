import crypto from 'crypto';
import { prisma } from './prisma';
import { getEnv } from '../config/env';

// ─── GENERATE 6-DIGIT CODE ─────────────────────────────────

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ─── SEND EMAIL VIA RESEND ─────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email not sent to', to);
    console.log('Subject:', subject);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TourneyHub <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

// ─── EMAIL TEMPLATES ────────────────────────────────────────

function codeEmailHtml(code: string, purpose: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #fff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 24px; margin: 0; color: #10b981;">TourneyHub</h1>
      </div>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 8px;">${purpose}</p>
      <div style="background: #18181b; border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff;">${code}</span>
      </div>
      <p style="color: #71717a; font-size: 12px; text-align: center;">Код действителен 10 минут. Не делитесь им ни с кем.</p>
    </div>
  `;
}

// ─── PUBLIC API ─────────────────────────────────────────────

export async function sendVerificationCode(
  email: string,
  type: 'register' | 'login' | 'reset_password'
): Promise<{ success: boolean; error?: string }> {

  // Rate limit: max 3 codes per email per type per 10 min
  const recentCount = await prisma.emailVerification.count({
    where: {
      email,
      type,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });

  if (recentCount >= 3) {
    return { success: false, error: 'Слишком много запросов. Подождите 10 минут.' };
  }

  // Delete old unverified codes for this email+type
  await prisma.emailVerification.deleteMany({
    where: { email, type, verified: false },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.emailVerification.create({
    data: { email, code, type, expiresAt },
  });

  const purposes: Record<string, string> = {
    register: 'Код подтверждения для регистрации',
    login: 'Код подтверждения для входа',
    reset_password: 'Код для сброса пароля',
  };

  const sent = await sendEmail(
    email,
    `${code} — ${purposes[type]}`,
    codeEmailHtml(code, purposes[type])
  );

  if (!sent) {
    // In dev mode, log the code to console
    const env = getEnv();
    if (env.NODE_ENV === 'development') {
      console.log(`\n📧 [DEV] Code for ${email} (${type}): ${code}\n`);
      return { success: true };
    }
    return { success: false, error: 'Ошибка отправки письма' };
  }

  return { success: true };
}

export async function verifyCode(
  email: string,
  code: string,
  type: 'register' | 'login' | 'reset_password'
): Promise<{ valid: boolean; error?: string }> {

  const record = await prisma.emailVerification.findFirst({
    where: { email, type, verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { valid: false, error: 'Код не найден. Запросите новый.' };
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return { valid: false, error: 'Код истёк. Запросите новый.' };
  }

  if (record.attempts >= 5) {
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return { valid: false, error: 'Слишком много попыток. Запросите новый код.' };
  }

  if (record.code !== code) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { valid: false, error: 'Неправильный код' };
  }

  // Mark as verified
  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return { valid: true };
}

export async function isEmailVerified(
  email: string,
  type: 'register' | 'login' | 'reset_password'
): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      type,
      verified: true,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  return !!record;
}

export async function cleanupVerification(email: string, type: string): Promise<void> {
  await prisma.emailVerification.deleteMany({ where: { email, type } });
}
