import { apiFetch } from './base';

export interface WoWMapItem {
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
  prizeDistribution: string | null;
}

export interface WoWTournamentListItem {
  id: string;
  status: string;
  teamMode: string;
  teamCount: number;
  bet: number;
  server: string;
  teamsJoined: number;
  createdAt: string;
  creator: { username: string; avatar: string | null } | null;
  wowMap: WoWMapItem | null;
}

export const wowApi = {
  getMaps: () =>
    apiFetch<{ maps: WoWMapItem[] }>('/api/wow/maps'),

  getOpen: (mapId?: string) => {
    const qs = mapId ? `?mapId=${mapId}` : '';
    return apiFetch<{ tournaments: WoWTournamentListItem[] }>(`/api/wow/open${qs}`);
  },

  create: (data: {
    mapId: string;
    bet: number;
    server: string;
    playerId: string;
    extraIds?: string[];
  }) => apiFetch<{ id: string; status: string; matched: boolean; tournamentStarted: boolean }>(
    '/api/wow', { method: 'POST', body: data }
  ),

  join: (id: string, data: { playerId: string; extraIds?: string[] }) =>
    apiFetch<{ joined: boolean; slot: number; tournamentStarted: boolean }>(
      `/api/wow/${id}/join`, { method: 'POST', body: data }
    ),
};
