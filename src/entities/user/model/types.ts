/**
 * User entity types
 */

export interface User {
  id: string;
  telegramId: number;
  username: string;
  avatar: string;
  balance: number;
  wins: number;
  tournaments: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  registeredAt: Date;
  balance: number;
  currency: string;
  rating: number;
}

export interface UserMatch {
  id: string;
  gameName: string;
  gameImage: string;
  format: string;
  opponent: {
    username: string;
    avatar: string;
  };
  prize: number;
  currency: string;
  scheduledAt?: Date;
  completedAt?: Date;
  result?: 'win' | 'lose' | 'dispute';
  status: 'upcoming' | 'completed';
}
