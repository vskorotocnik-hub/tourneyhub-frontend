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

// ─── ХРАНЕНИЕ ТОКЕНОВ ───────────────────────────────────────

const TOKEN_KEY = 'admin_access_token';
const REFRESH_KEY = 'admin_refresh_token';

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

// ─── ОБНОВЛЕНИЕ ТОКЕНА ──────────────────────────────────────

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
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

// ─── ЗАПРОСЫ К API ──────────────────────────────────────────

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
    let msg = error.debug ? `${error.error}: ${error.debug}` : (error.error || 'Ошибка сервера');
    // Append field-level validation details if present
    if (error.details && typeof error.details === 'object') {
      const fieldErrors = Object.entries(error.details)
        .filter(([, v]) => Array.isArray(v) && (v as string[]).length > 0)
        .map(([field, errs]) => `• ${field}: ${(errs as string[]).join(', ')}`)
        .join('\n');
      if (fieldErrors) msg = `${msg}\n${fieldErrors}`;
    }
    throw new ApiError(res.status, msg, error.details);
  }

  return res.json();
}

// ─── ТИПЫ ───────────────────────────────────────────────────

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
}

export interface AuthResponse {
  user: { id: string; username: string; email: string | null };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface AdminUserItem {
  id: string;
  email: string | null;
  username: string;
  displayName: string | null;
  avatar: string | null;
  balance: number;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isVerified: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  telegramAuth: { telegramId: string; username: string | null } | null;
  googleAuth: { email: string } | null;
}

export interface AdminUsersResponse {
  users: AdminUserItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  usersThisWeek: number;
  usersThisMonth: number;
  bannedUsers: number;
  verifiedUsers: number;
  activeLastWeek: number;
  totalBalance: number;
}

// ─── АВТОРИЗАЦИЯ ────────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: data }),

  me: () => apiFetch<MeResponse>('/api/auth/me'),

  logout: (refreshToken: string) =>
    apiFetch('/api/auth/logout', { method: 'POST', body: { refreshToken } }),

  setup: () =>
    apiFetch<{ message: string }>('/api/admin/setup', { method: 'POST' }),
};

// ─── АДМИН API ──────────────────────────────────────────────

export const adminApi = {
  stats: () =>
    apiFetch<AdminStatsResponse>('/api/admin/stats'),

  users: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return apiFetch<AdminUsersResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUser: (id: string) =>
    apiFetch<AdminUserItem>(`/api/admin/users/${id}`),

  banUser: (id: string, isBanned: boolean, reason?: string) =>
    apiFetch<{ id: string; username: string; isBanned: boolean }>(`/api/admin/users/${id}/ban`, { method: 'PATCH', body: { isBanned, reason } }),

  changeRole: (id: string, role: string) =>
    apiFetch<{ id: string; username: string; role: string }>(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),

  changeBalance: (id: string, amount: number, reason: string) =>
    apiFetch<{ id: string; username: string; balance: number }>(`/api/admin/users/${id}/balance`, { method: 'PATCH', body: { amount, reason } }),

  changeUcBalance: (id: string, amount: number, reason: string) =>
    apiFetch<{ id: string; username: string; ucBalance: number }>(`/api/admin/users/${id}/uc-balance`, { method: 'PATCH', body: { amount, reason } }),

  deleteUser: (id: string) =>
    apiFetch<{ message: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // Tournaments
  tournaments: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return apiFetch<AdminTournamentsResponse>(`/api/admin/tournaments${qs ? `?${qs}` : ''}`);
  },

  getTournament: (id: string) =>
    apiFetch<AdminTournamentDetail>(`/api/admin/tournaments/${id}`),

  sendMessage: (tournamentId: string, content: string, imageUrl?: string) =>
    apiFetch<AdminMessage>(`/api/admin/tournaments/${tournamentId}/messages`, { method: 'POST', body: { content, imageUrl } }),

  resolveDispute: (disputeId: string, resolution: string, winnerId?: string) =>
    apiFetch<{ resolved: boolean }>(`/api/admin/disputes/${disputeId}/resolve`, { method: 'POST', body: { resolution, winnerId } }),

  assignWinner: (tournamentId: string, winnerId: string, resolution: string) =>
    apiFetch<{ resolved: boolean }>(`/api/admin/tournaments/${tournamentId}/assign-winner`, { method: 'POST', body: { winnerId, resolution } }),
};

// ─── TOURNAMENT ADMIN TYPES ─────────────────────────────────

export interface AdminTournamentItem {
  id: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  prizePool: number;
  platformFee: number;
  createdAt: string;
  teams: { id: string; slot: number; players: { user: { id: string; username: string; avatar: string | null }; isCaptain: boolean }[] }[];
  disputes: { id: string; reporterId: string; reason: string; status: string }[];
  _count: { messages: number; disputes: number };
}

export interface AdminTournamentsResponse {
  tournaments: AdminTournamentItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminMessage {
  id: string;
  content: string;
  isSystem: boolean;
  isAdmin: boolean;
  imageUrl: string | null;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
}

export interface AdminDispute {
  id: string;
  tournamentId: string;
  matchId: string;
  reporterId: string;
  reason: string;
  videoUrl: string | null;
  response: string | null;
  responderId: string | null;
  status: string;
  resolution: string | null;
  resolvedById: string | null;
  createdAt: string;
}

export interface AdminTournamentDetail {
  id: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  prizePool: number;
  platformFee: number;
  createdAt: string;
  teams: { id: string; slot: number; players: { user: { id: string; username: string; avatar: string | null }; isCaptain: boolean }[] }[];
  matches: { id: string; round: number; matchOrder: number; status: string; teamAId: string | null; teamBId: string | null; winnerId: string | null }[];
  disputes: AdminDispute[];
  messages: AdminMessage[];
}

// ─── WOW MAP TYPES ──────────────────────────────────────────

export interface WoWMapAdmin {
  id: string;
  mapId: string;
  name: string;
  image: string;
  format: string;
  teamCount: number;
  playersPerTeam: number;
  rounds: number;
  rules: string | null;
  rating: number;
  gamesPlayed: number;
  isActive: boolean;
  prizeDistribution: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { tournaments: number };
}

// ─── CLASSIC TOURNAMENT TYPES ────────────────────────────────

export interface ClassicTournamentItem {
  id: string;
  title: string | null;
  description: string | null;
  map: string;
  mapImage: string | null;
  mode: string;
  server: string;
  startTime: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  winnerCount: number;
  prize1: number;
  prize2: number;
  prize3: number;
  status: string;
  createdBy: string;
  winner1Id: string | null;
  winner2Id: string | null;
  winner3Id: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  _count: { registrations: number };
}

export interface ClassicRegistrationItem {
  id: string;
  tournamentId: string;
  userId: string;
  pubgIds: string[];
  place: number | null;
  prizeAmount: number;
  createdAt: string;
  user: { id: string; username: string; avatar: string | null };
  _count: { messages: number };
}

export interface ClassicTournamentDetail extends ClassicTournamentItem {
  registrations: ClassicRegistrationItem[];
}

export interface ClassicMessageItem {
  id: string;
  registrationId: string;
  userId: string;
  content: string;
  isSystem: boolean;
  isAdmin: boolean;
  imageUrl: string | null;
  createdAt: string;
}

export interface ClassicChatItem {
  registrationId: string;
  user: { id: string; username: string; avatar: string | null };
  tournament: { id: string; title: string | null; map: string; mode: string; status: string };
  messageCount: number;
  lastMessage: { content: string; createdAt: string; isAdmin: boolean } | null;
}

// ─── CLASSIC TOURNAMENT ADMIN API ───────────────────────────

export const classicApi = {
  list: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return apiFetch<{ tournaments: ClassicTournamentItem[]; total: number; page: number; totalPages: number }>(
      `/api/admin/classic${qs ? `?${qs}` : ''}`
    );
  },

  get: (id: string) =>
    apiFetch<ClassicTournamentDetail>(`/api/admin/classic/${id}`),

  create: (data: Record<string, unknown>) =>
    apiFetch<ClassicTournamentItem>('/api/admin/classic', { method: 'POST', body: data }),

  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<ClassicTournamentItem>(`/api/admin/classic/${id}`, { method: 'PUT', body: data }),

  start: (id: string) =>
    apiFetch<ClassicTournamentItem>(`/api/admin/classic/${id}/start`, { method: 'POST' }),

  complete: (id: string, winners: { registrationId: string; place: number }[]) =>
    apiFetch<{ completed: boolean }>(`/api/admin/classic/${id}/complete`, { method: 'POST', body: { winners } }),

  cancel: (id: string) =>
    apiFetch<{ cancelled: boolean }>(`/api/admin/classic/${id}/cancel`, { method: 'POST' }),

  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/admin/classic/${id}`, { method: 'DELETE' }),

  // Chat
  chats: () =>
    apiFetch<{ chats: ClassicChatItem[] }>('/api/admin/classic/chats'),

  getMessages: (regId: string) =>
    apiFetch<{ messages: ClassicMessageItem[] }>(`/api/admin/classic/registrations/${regId}/messages`),

  sendMessage: (regId: string, content: string) =>
    apiFetch<ClassicMessageItem>(`/api/admin/classic/registrations/${regId}/messages`, { method: 'POST', body: { content } }),
};

// ─── WOW MAP API ────────────────────────────────────────────

export const wowMapApi = {
  list: () => apiFetch<{ maps: WoWMapAdmin[] }>('/api/admin/wow-maps'),
  create: (data: Record<string, unknown>) =>
    apiFetch<WoWMapAdmin>('/api/admin/wow-maps', { method: 'POST', body: data }),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<WoWMapAdmin>(`/api/admin/wow-maps/${id}`, { method: 'PUT', body: data }),
  remove: (id: string) =>
    apiFetch<{ deleted?: boolean; deactivated?: boolean }>(`/api/admin/wow-maps/${id}`, { method: 'DELETE' }),
};
