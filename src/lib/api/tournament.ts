import { apiFetch } from './base';

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
  gameType: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  createdAt: string;
  wowMap?: { id: string; mapId: string; name: string; image: string; format: string; teamCount: number; playersPerTeam: number; rounds: number; rules: string | null; rating: number; gamesPlayed: number; prizeDistribution: string | null } | null;
}

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

  fileDispute: (tournamentId: string, reason: string, videoUrl?: string, targetTeamId?: string) =>
    apiFetch<Dispute>(`/api/tournaments/${tournamentId}/disputes`, { method: 'POST', body: { reason, videoUrl, targetTeamId } }),

  cancelDispute: (tournamentId: string, disputeId: string) =>
    apiFetch<{ cancelled: boolean }>(`/api/tournaments/${tournamentId}/disputes/${disputeId}`, { method: 'DELETE' }),

  respondToDispute: (tournamentId: string, disputeId: string, response: string) =>
    apiFetch<Dispute>(`/api/tournaments/${tournamentId}/disputes/${disputeId}/respond`, { method: 'POST', body: { response } }),

  getDisputes: (tournamentId: string) =>
    apiFetch<{ disputes: Dispute[] }>(`/api/tournaments/${tournamentId}/disputes`),

  sendImageMessage: (tournamentId: string, imageUrl: string, content?: string) =>
    apiFetch<TournamentMessage>(`/api/tournaments/${tournamentId}/messages/image`, { method: 'POST', body: { imageUrl, content: content || '' } }),

  myHistory: () =>
    apiFetch<{ tournaments: TournamentHistoryItem[] }>('/api/tournaments/my/history'),

  markRead: (tournamentId: string) =>
    apiFetch<{ ok: boolean }>(`/api/tournaments/${tournamentId}/read`, { method: 'POST' }),

  unreadCount: () =>
    apiFetch<{ unreadCount: number }>('/api/tournaments/my/unread-count'),
};
