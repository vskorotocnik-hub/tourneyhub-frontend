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

export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!res.ok) {
        const current = getStoredTokens();
        if (current && current.refreshToken !== tokens.refreshToken) {
          return current;
        }
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
      const current = getStoredTokens();
      if (current && current.refreshToken !== tokens.refreshToken) {
        return current;
      }
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
    throw new ApiError(res.status, error.error || 'Ошибка сервера', error.details, error.reason);
  }

  return res.json();
}

// ─── API ERROR CLASS ─────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;
  reason?: string;

  constructor(status: number, message: string, details?: Record<string, string[]>, reason?: string) {
    super(message);
    this.status = status;
    this.details = details;
    this.reason = reason;
    this.name = 'ApiError';
  }
}
