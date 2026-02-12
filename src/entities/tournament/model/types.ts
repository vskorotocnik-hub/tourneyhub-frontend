/**
 * Tournament entity types
 */

export interface Tournament {
  id: string;
  gameId: string;
  title: string;
  prizePool: number;
  currency: string;
  format: string;
  maxPlayers: number;
  currentPlayers: number;
  startDate: Date;
  status: 'upcoming' | 'live' | 'finished';
  entryFee: number;
}

export interface TournamentLeader {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  wins: number;
  earnings: number;
}

export interface ActiveTournament {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  bet: number;
  teamMode: 'solo' | 'duo';
  teamCount: number;
  server: 'europe' | 'na' | 'asia' | 'me' | 'sa';
  playersJoined: number;
  playersNeeded: number;
  createdAt: Date;
  status: 'searching' | 'ready' | 'playing';
}

export interface SearchingTeam {
  teamId: string;
  playerId: string;
  playerName: string;
  partnerId?: string;
  partnerName?: string;
  opponentId?: string;
  opponentName?: string;
}

export interface TournamentPrize {
  place: number;
  amount: number;
  label: string;
}

export interface TournamentInfo {
  id: string;
  gameName: string;
  gameImage: string;
  format: string;
  prize: number;
  currency: string;
  rules: string[];
  opponent?: {
    id: string;
    username: string;
    avatar: string;
  };
}
