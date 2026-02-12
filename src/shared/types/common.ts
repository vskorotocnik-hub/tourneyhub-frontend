/**
 * Common shared types used across the application
 */

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: string;
}

export interface Deposit {
  id: string;
  username: string;
  avatar: string;
  amount: number;
  currency: string;
  item?: string;
  timestamp: Date;
}

export interface Task {
  id: string;
  type: 'social' | 'game' | 'daily' | 'special';
  title: string;
  description: string;
  reward: number;
  currency: string;
  icon: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt?: Date;
}

export interface TaskStats {
  totalEarned: number;
  currency: string;
  completedTasks: number;
  availableTasks: number;
}

export interface Referral {
  id: string;
  username: string;
  avatar: string;
  joinedAt: Date;
  gamesPlayed: number;
  maxGames: number;
  totalEarned: number;
  currency: string;
  isActive: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  currency: string;
  pendingEarnings: number;
}

export interface ReferralLink {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number | null;
  createdAt: Date;
}
