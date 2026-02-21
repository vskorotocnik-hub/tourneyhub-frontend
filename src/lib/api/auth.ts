import { apiFetch, refreshAccessToken } from './base';

export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  displayName: string | null;
  avatar: string | null;
  balance: string;
  ucBalance: string;
  rating: number;
  role: string;
  isVerified: boolean;
  createdAt: string;
  telegramAuth?: { telegramId: string; username: string | null } | null;
}

export interface AuthResponse {
  user: { id: string; username: string; email: string | null };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface TelegramInitResponse {
  token: string;
  deepLink: string;
}

export interface TelegramStatusResponse {
  status: 'pending' | 'completed' | 'expired' | 'not_found';
  user?: { id: string; username: string; email: string | null };
  accessToken?: string;
  refreshToken?: string;
}

export interface GoogleConfigResponse {
  clientId: string;
  redirectUri: string;
}

export const authApi = {
  register: (data: { email: string; password: string; username: string }) =>
    apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: data }),

  telegram: (data: Record<string, unknown>) =>
    apiFetch<AuthResponse>('/api/auth/telegram', { method: 'POST', body: data }),

  telegramInit: () =>
    apiFetch<TelegramInitResponse>('/api/auth/telegram/init', { method: 'POST' }),

  telegramStatus: (token: string) =>
    apiFetch<TelegramStatusResponse>(`/api/auth/telegram/status/${token}`),

  sendCode: (email: string, type: 'register' | 'login' | 'reset_password') =>
    apiFetch<{ message: string }>('/api/auth/email/send-code', { method: 'POST', body: { email, type } }),

  verifyCode: (email: string, code: string, type: 'register' | 'login' | 'reset_password') =>
    apiFetch<{ verified: boolean }>('/api/auth/email/verify-code', { method: 'POST', body: { email, code, type } }),

  resetPassword: (email: string, password: string) =>
    apiFetch<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { email, password } }),

  googleConfig: () =>
    apiFetch<GoogleConfigResponse>('/api/auth/google/config'),

  googleAuth: (code: string, redirect_uri: string) =>
    apiFetch<AuthResponse>('/api/auth/google', { method: 'POST', body: { code, redirect_uri } }),

  me: () => apiFetch<MeResponse>('/api/auth/me'),

  logout: (refreshToken: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } }),

  refresh: () => refreshAccessToken(),
};
