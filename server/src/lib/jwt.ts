import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getEnv } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY as any,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const env = getEnv();
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function generateTokenId(): string {
  return crypto.randomBytes(32).toString('hex');
}
