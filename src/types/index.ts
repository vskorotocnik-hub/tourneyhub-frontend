/**
 * Legacy types file - Re-exports from new architecture
 * This file maintains backward compatibility with existing code
 * while using the new entity-based structure
 */

// Game entity
export * from '@/entities/game';

// User entity
export * from '@/entities/user';

// Tournament entity
export * from '@/entities/tournament';

// Chat entity
export * from '@/entities/chat';

// Shared common types
export * from '@/shared/types/common';

// PUBG Mobile specific types (WoW)
export interface WoWMap {
  id: string;
  mapId: string;
  name: string;
  image: string;
  format: string;
  teamCount: number;
  playersPerTeam: number;
  rounds: number;
  rules?: string;
}

export interface WoWMatch {
  id: string;
  map: WoWMap;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  bet: number;
  server: 'europe' | 'na' | 'asia' | 'me' | 'sa';
  teamsJoined: number;
  teamsNeeded: number;
  createdAt: Date;
  searchTime: number;
  status: 'searching' | 'ready' | 'playing';
}
