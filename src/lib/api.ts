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
        // Before clearing, check if another tab already refreshed
        const current = getStoredTokens();
        if (current && current.refreshToken !== tokens.refreshToken) {
          // Another tab already refreshed — use their tokens
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
      // Before clearing, check if another tab already refreshed
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

// ─── AUTH API ────────────────────────────────────────────────

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

  googleAuth: (code: string, redirect_uri: string) =>
    apiFetch<AuthResponse>('/api/auth/google', { method: 'POST', body: { code, redirect_uri } }),

  me: () => apiFetch<MeResponse>('/api/auth/me'),

  logout: (refreshToken: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } }),

  refresh: () => refreshAccessToken(),
};

// ─── TOURNAMENT API ─────────────────────────────────────────

export interface TournamentListItem {
  id: string;
  status: string;
  teamMode: 'SOLO' | 'DUO';
  teamCount: number;
  bet: number;
  server: string;
  teamsJoined: number;
  createdAt: string;
  creator: { username: string; avatar: string | null } | null;
}

export interface TournamentListResponse {
  tournaments: TournamentListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TournamentPlayer {
  id: string;
  gameId: string;
  isCaptain: boolean;
  user: { id: string; username: string; avatar: string | null };
}

export interface TournamentTeam {
  id: string;
  slot: number;
  players: TournamentPlayer[];
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchOrder: number;
  status: string;
  teamA: { id: string; slot: number; players: { user: { username: string }; isCaptain: boolean }[] } | null;
  teamB: { id: string; slot: number; players: { user: { username: string }; isCaptain: boolean }[] } | null;
  teamAResult: string | null;
  teamBResult: string | null;
  winnerId: string | null;
  winner: { id: string; slot: number } | null;
}

export interface TournamentMessage {
  id: string;
  content: string;
  isSystem: boolean;
  isAdmin: boolean;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export interface Dispute {
  id: string;
  tournamentId: string;
  matchId: string;
  reporterId: string;
  reason: string;
  videoUrl: string | null;
  response: string | null;
  responderId: string | null;
  status: 'OPEN' | 'CANCELLED' | 'RESOLVED';
  resolution: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDetail {
  id: string;
  status: string;
  teamMode: 'SOLO' | 'DUO';
  teamCount: number;
  bet: number;
  server: string;
  platformFee: string;
  prizePool: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  creatorId: string;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  isParticipant: boolean;
  userTeamId: string | null;
  userTeamSlot: number | null;
}

export interface ActiveTournamentData {
  id: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  createdAt: string;
}

export const tournamentApi = {
  create: (data: {
    teamMode: string;
    teamCount: number;
    bet: number;
    server: string;
    playerId: string;
    partnerId?: string;
  }) => apiFetch<{ id: string; status: string }>('/api/tournaments', { method: 'POST', body: data }),

  list: (params?: { server?: string; teamMode?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return apiFetch<TournamentListResponse>(`/api/tournaments${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) =>
    apiFetch<TournamentDetail>(`/api/tournaments/${id}`),

  join: (id: string, data: { playerId: string; partnerId?: string }) =>
    apiFetch<{ joined: boolean; slot: number; tournamentStarted: boolean }>(
      `/api/tournaments/${id}/join`, { method: 'POST', body: data }
    ),

  cancel: (id: string) =>
    apiFetch<{ cancelled: boolean }>(`/api/tournaments/${id}`, { method: 'DELETE' }),

  getMessages: (id: string, after?: string) => {
    const qs = after ? `?after=${encodeURIComponent(after)}` : '';
    return apiFetch<{ messages: TournamentMessage[] }>(`/api/tournaments/${id}/messages${qs}`);
  },

  sendMessage: (id: string, content: string) =>
    apiFetch<TournamentMessage>(`/api/tournaments/${id}/messages`, { method: 'POST', body: { content } }),

  submitResult: (tournamentId: string, matchId: string, winnerId: string) =>
    apiFetch<{ status: string; winnerId?: string; message?: string }>(
      `/api/tournaments/${tournamentId}/matches/${matchId}/result`,
      { method: 'POST', body: { winnerId } }
    ),

  myActive: () =>
    apiFetch<{ 
      tournament: ActiveTournamentData | null;
      tournaments: ActiveTournamentData[];
    }>('/api/tournaments/my/active'),

  myChats: () =>
    apiFetch<{ chats: TournamentChatItem[] }>('/api/tournaments/my/chats'),

  // Disputes
  fileDispute: (tournamentId: string, reason: string, videoUrl?: string, targetTeamId?: string) =>
    apiFetch<Dispute>(`/api/tournaments/${tournamentId}/disputes`, { method: 'POST', body: { reason, videoUrl, targetTeamId } }),

  cancelDispute: (tournamentId: string, disputeId: string) =>
    apiFetch<{ cancelled: boolean }>(`/api/tournaments/${tournamentId}/disputes/${disputeId}`, { method: 'DELETE' }),

  respondToDispute: (tournamentId: string, disputeId: string, response: string) =>
    apiFetch<Dispute>(`/api/tournaments/${tournamentId}/disputes/${disputeId}/respond`, { method: 'POST', body: { response } }),

  getDisputes: (tournamentId: string) =>
    apiFetch<{ disputes: Dispute[] }>(`/api/tournaments/${tournamentId}/disputes`),

  // Image message
  sendImageMessage: (tournamentId: string, imageUrl: string, content?: string) =>
    apiFetch<TournamentMessage>(`/api/tournaments/${tournamentId}/messages/image`, { method: 'POST', body: { imageUrl, content: content || '' } }),

  // Tournament history (for profile)
  myHistory: () =>
    apiFetch<{ tournaments: TournamentHistoryItem[] }>('/api/tournaments/my/history'),

  // Mark chat as read
  markRead: (tournamentId: string) =>
    apiFetch<{ ok: boolean }>(`/api/tournaments/${tournamentId}/read`, { method: 'POST' }),

  // Total unread count (for bottom nav badge)
  unreadCount: () =>
    apiFetch<{ unreadCount: number }>('/api/tournaments/my/unread-count'),
};

export interface TournamentHistoryItem {
  id: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  prizePool: number;
  createdAt: string;
  completedAt: string | null;
  result: 'win' | 'loss' | null;
  place: number | null;
  opponents: { id: string; username: string; avatar: string | null }[];
}

// ─── SUPPORT API ─────────────────────────────────────────────

export interface SupportMessageItem {
  id: string;
  userId: string;
  content: string;
  isFromUser: boolean;
  isSystem: boolean;
  adminId: string | null;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export const supportApi = {
  getMessages: () =>
    apiFetch<{ messages: SupportMessageItem[] }>('/api/support/messages'),

  sendMessage: (content: string) =>
    apiFetch<SupportMessageItem>('/api/support/messages', { method: 'POST', body: { content } }),
};

export interface TournamentChatItem {
  tournamentId: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  createdAt: string;
  opponents: { id: string; username: string; avatar: string | null }[];
  lastMessage: { content: string; createdAt: string; isSystem: boolean } | null;
  result: 'win' | 'loss' | null;
  unreadCount: number;
}

