const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── TOKEN STORAGE ───────────────────────────────────────────

const TOKEN_KEY = 'tourneyhub_access_token';
const REFRESH_KEY = 'tourneyhub_refresh_token';

export function getStoredTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── REFRESH LOGIC ───────────────────────────────────────────

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return null;

  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const data = await res.json();
      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };
      storeTokens(newTokens);
      return newTokens;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── API FETCH WRAPPER ──────────────────────────────────────

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const tokens = getStoredTokens();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (tokens?.accessToken) {
    reqHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 401 — try to refresh token and retry once
  if (res.status === 401 && tokens?.refreshToken) {
    const newTokens = await refreshAccessToken();
    if (newTokens) {
      reqHeaders['Authorization'] = `Bearer ${newTokens.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new ApiError(res.status, error.error || 'Ошибка сервера', error.details);
  }

  return res.json();
}

// ─── API ERROR CLASS ─────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

// ─── AUTH API ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
  username: string;
  displayName: string | null;
  avatar: string | null;
  balance: string;
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

  // Email verification
  sendCode: (email: string, type: 'register' | 'login' | 'reset_password') =>
    apiFetch<{ message: string }>('/api/auth/email/send-code', { method: 'POST', body: { email, type } }),

  verifyCode: (email: string, code: string, type: 'register' | 'login' | 'reset_password') =>
    apiFetch<{ verified: boolean }>('/api/auth/email/verify-code', { method: 'POST', body: { email, code, type } }),

  // Reset password
  resetPassword: (email: string, password: string) =>
    apiFetch<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: { email, password } }),

  // Google OAuth
  googleConfig: () =>
    apiFetch<GoogleConfigResponse>('/api/auth/google/config'),

  googleAuth: (code: string) =>
    apiFetch<AuthResponse>('/api/auth/google', { method: 'POST', body: { code } }),

  me: () => apiFetch<MeResponse>('/api/auth/me'),

  logout: (refreshToken: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } }),

  refresh: () => refreshAccessToken(),
};
