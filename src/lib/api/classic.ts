import { apiFetch } from './base';

export interface ClassicTournamentListItem {
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
  createdAt?: string;
  registeredPlayers: number;
}

export interface ClassicTournamentDetailResponse {
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
  createdAt: string;
  _count: { registrations: number };
  myRegistration: {
    id: string;
    pubgIds: string[];
    place: number | null;
    prizeAmount: number;
    createdAt: string;
  } | null;
}

export interface ClassicRegistrationResponse {
  registered: boolean;
  registrationId: string;
}

export interface ClassicMyActiveItem {
  registrationId: string;
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
  registeredPlayers: number;
  winnerCount: number;
  prize1: number;
  prize2: number;
  prize3: number;
  status: string;
  pubgIds: string[];
}

export interface ClassicMyHistoryItem {
  registrationId: string;
  id: string;
  title: string | null;
  map: string;
  mapImage: string | null;
  mode: string;
  server: string;
  entryFee: number;
  prizePool: number;
  status: string;
  completedAt: string | null;
  place: number | null;
  prizeAmount: number;
  result: 'win' | 'loss' | 'cancelled';
}

export interface ClassicChatListItem {
  registrationId: string;
  createdAt: string;
  tournament: { id: string; title: string | null; map: string; mode: string; status: string };
  messageCount: number;
  unreadCount: number;
  lastMessage: { content: string; createdAt: string; isAdmin: boolean } | null;
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

export const classicApi = {
  list: () =>
    apiFetch<{ tournaments: ClassicTournamentListItem[] }>('/api/classic'),

  listAll: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return apiFetch<{ tournaments: ClassicTournamentListItem[]; total: number }>(`/api/classic/all${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) =>
    apiFetch<ClassicTournamentDetailResponse>(`/api/classic/${id}`),

  register: (id: string, pubgIds: string[]) =>
    apiFetch<ClassicRegistrationResponse>(`/api/classic/${id}/register`, { method: 'POST', body: { pubgIds } }),

  myActive: () =>
    apiFetch<{ tournaments: ClassicMyActiveItem[] }>('/api/classic/my/active'),

  myHistory: () =>
    apiFetch<{ tournaments: ClassicMyHistoryItem[] }>('/api/classic/my/history'),

  myChats: () =>
    apiFetch<{ chats: ClassicChatListItem[] }>('/api/classic/my/chats'),

  getMessages: (regId: string) =>
    apiFetch<{ messages: ClassicMessageItem[] }>(`/api/classic/registrations/${regId}/messages`),

  sendMessage: (regId: string, content: string) =>
    apiFetch<ClassicMessageItem>(`/api/classic/registrations/${regId}/messages`, { method: 'POST', body: { content } }),
};
