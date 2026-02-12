/**
 * Game entity types
 * Core game-related types that are game-agnostic
 */

export interface Game {
  id: string;
  name: string;
  image: string;
  online: number;
  color: string;
}

export type GameMode = 'tdm' | 'wow' | 'classic';
export type TeamMode = 'solo' | 'duo';
export type ServerRegion = 'europe' | 'na' | 'asia' | 'me' | 'sa';
