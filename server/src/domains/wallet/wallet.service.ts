import { Prisma } from '@prisma/client';
import { InsufficientBalanceError, AppError } from '../../shared/errors';

// Prisma interactive transaction client
// Uses `any` to match existing codebase pattern (tournaments.ts, wow.ts)
// and avoid IDE cache issues with regenerated Prisma client types
type TxClient = any;

interface WalletOpParams {
  idempotencyKey: string;
  reason: string;
  refType?: string;
  refId?: string;
}

interface HoldParams {
  reason: string;
  refType: string;
  refId: string;
  expiresAt?: Date;
}

type Currency = 'UC' | 'USD';

function balanceField(currency: Currency): 'ucBalance' | 'balance' {
  return currency === 'UC' ? 'ucBalance' : 'balance';
}

function currencyEnum(currency: Currency) {
  return currency === 'UC' ? 'UC' as const : 'USD' as const;
}

// ─── DEBIT ──────────────────────────────────────────────────

export async function debit(
  tx: TxClient,
  userId: string,
  amount: number,
  currency: Currency,
  params: WalletOpParams
) {
  // Idempotency check
  const existing = await tx.walletTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return existing;

  const field = balanceField(currency);

  // Decrement balance (CHECK constraint will reject if goes negative)
  let user;
  try {
    user = await tx.user.update({
      where: { id: userId },
      data: { [field]: { decrement: amount } },
      select: { ucBalance: true, balance: true },
    });
  } catch (err: any) {
    // PostgreSQL CHECK constraint violation
    if (err?.code === 'P2004' || err?.message?.includes('check constraint')) {
      const current = await tx.user.findUnique({ where: { id: userId }, select: { [field]: true } });
      throw new InsufficientBalanceError(amount, Number((current as any)?.[field] ?? 0));
    }
    throw err;
  }

  const balanceAfter = Number(user[field]);

  const transaction = await tx.walletTransaction.create({
    data: {
      userId,
      type: 'DEBIT',
      currency: currencyEnum(currency),
      amount: new Prisma.Decimal(amount),
      balanceAfter: new Prisma.Decimal(balanceAfter),
      reason: params.reason,
      refType: params.refType || null,
      refId: params.refId || null,
      idempotencyKey: params.idempotencyKey,
    },
  });

  return transaction;
}

// ─── CREDIT ─────────────────────────────────────────────────

export async function credit(
  tx: TxClient,
  userId: string,
  amount: number,
  currency: Currency,
  params: WalletOpParams
) {
  // Idempotency check
  const existing = await tx.walletTransaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return existing;

  const field = balanceField(currency);

  const user = await tx.user.update({
    where: { id: userId },
    data: { [field]: { increment: amount } },
    select: { ucBalance: true, balance: true },
  });

  const balanceAfter = Number(user[field]);

  const transaction = await tx.walletTransaction.create({
    data: {
      userId,
      type: 'CREDIT',
      currency: currencyEnum(currency),
      amount: new Prisma.Decimal(amount),
      balanceAfter: new Prisma.Decimal(balanceAfter),
      reason: params.reason,
      refType: params.refType || null,
      refId: params.refId || null,
      idempotencyKey: params.idempotencyKey,
    },
  });

  return transaction;
}

// ─── HOLD (Escrow) ──────────────────────────────────────────

export async function hold(
  tx: TxClient,
  userId: string,
  amount: number,
  currency: Currency,
  params: HoldParams
) {
  const field = balanceField(currency);

  // Decrement balance (funds are locked)
  let user;
  try {
    user = await tx.user.update({
      where: { id: userId },
      data: { [field]: { decrement: amount } },
      select: { ucBalance: true, balance: true },
    });
  } catch (err: any) {
    if (err?.code === 'P2004' || err?.message?.includes('check constraint')) {
      const current = await tx.user.findUnique({ where: { id: userId }, select: { [field]: true } });
      throw new InsufficientBalanceError(amount, Number((current as any)?.[field] ?? 0));
    }
    throw err;
  }

  const balanceAfter = Number(user[field]);

  const escrowHold = await tx.escrowHold.create({
    data: {
      userId,
      amount: new Prisma.Decimal(amount),
      currency: currencyEnum(currency),
      status: 'HELD',
      reason: params.reason,
      refType: params.refType,
      refId: params.refId,
      expiresAt: params.expiresAt || null,
    },
  });

  await tx.walletTransaction.create({
    data: {
      userId,
      type: 'HOLD',
      currency: currencyEnum(currency),
      amount: new Prisma.Decimal(amount),
      balanceAfter: new Prisma.Decimal(balanceAfter),
      reason: params.reason,
      refType: params.refType,
      refId: params.refId,
      idempotencyKey: `hold-${escrowHold.id}`,
      escrowHoldId: escrowHold.id,
    },
  });

  return escrowHold;
}

// ─── CAPTURE HOLD ───────────────────────────────────────────

export async function captureHold(tx: TxClient, holdId: string) {
  const escrow = await tx.escrowHold.findUnique({ where: { id: holdId } });
  if (!escrow) throw new AppError(404, 'Escrow hold не найден', 'ESCROW_NOT_FOUND');
  if (escrow.status !== 'HELD') throw new AppError(400, `Escrow в статусе ${escrow.status}, ожидался HELD`, 'INVALID_ESCROW_STATE');

  await tx.escrowHold.update({
    where: { id: holdId },
    data: { status: 'CAPTURED' },
  });

  // Funds were already deducted during hold — just record the capture
  const field = balanceField(escrow.currency as Currency);
  const user = await tx.user.findUnique({ where: { id: escrow.userId }, select: { ucBalance: true, balance: true } });
  const balanceAfter = Number((user as any)?.[field] ?? 0);

  await tx.walletTransaction.create({
    data: {
      userId: escrow.userId,
      type: 'CAPTURE',
      currency: escrow.currency,
      amount: escrow.amount,
      balanceAfter: new Prisma.Decimal(balanceAfter),
      reason: `capture: ${escrow.reason}`,
      refType: escrow.refType,
      refId: escrow.refId,
      idempotencyKey: `capture-${holdId}`,
      escrowHoldId: holdId,
    },
  });

  return escrow;
}

// ─── RELEASE HOLD ───────────────────────────────────────────

export async function releaseHold(tx: TxClient, holdId: string) {
  const escrow = await tx.escrowHold.findUnique({ where: { id: holdId } });
  if (!escrow) throw new AppError(404, 'Escrow hold не найден', 'ESCROW_NOT_FOUND');
  if (escrow.status !== 'HELD') throw new AppError(400, `Escrow в статусе ${escrow.status}, ожидался HELD`, 'INVALID_ESCROW_STATE');

  await tx.escrowHold.update({
    where: { id: holdId },
    data: { status: 'RELEASED' },
  });

  // Return funds to user
  const field = balanceField(escrow.currency as Currency);
  const user = await tx.user.update({
    where: { id: escrow.userId },
    data: { [field]: { increment: Number(escrow.amount) } },
    select: { ucBalance: true, balance: true },
  });

  const balanceAfter = Number(user[field]);

  await tx.walletTransaction.create({
    data: {
      userId: escrow.userId,
      type: 'RELEASE',
      currency: escrow.currency,
      amount: escrow.amount,
      balanceAfter: new Prisma.Decimal(balanceAfter),
      reason: `release: ${escrow.reason}`,
      refType: escrow.refType,
      refId: escrow.refId,
      idempotencyKey: `release-${holdId}`,
      escrowHoldId: holdId,
    },
  });

  return escrow;
}

// ─── GET BALANCE ────────────────────────────────────────────

export async function getBalance(userId: string) {
  const { prisma } = await import('../../shared/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, ucBalance: true },
  });
  if (!user) throw new AppError(404, 'Пользователь не найден', 'USER_NOT_FOUND');
  return { balance: Number(user.balance), ucBalance: Number(user.ucBalance) };
}
