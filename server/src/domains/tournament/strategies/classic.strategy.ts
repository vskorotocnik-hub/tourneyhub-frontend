/**
 * Classic strategy — stub for future implementation.
 * Classic mode: large lobbies, point-based scoring, no bracket.
 */

import type { GameTypeStrategy, PrizeResult } from '../types';

export const ClassicStrategy: GameTypeStrategy = {
  gameType: 'CLASSIC',

  calculatePrizes(bet: number, teamCount: number): PrizeResult {
    const totalPool = bet * teamCount;
    const platformFee = totalPool * 0.1;
    const netPool = totalPool - platformFee;
    // Placeholder distribution — will be refined when Classic mode is built
    const dist = [0.5, 0.3, 0.2, ...Array(Math.max(0, teamCount - 3)).fill(0)];
    return { totalPool, platformFee, netPool, dist };
  },

  async startTournament(): Promise<void> {
    throw new Error('Classic mode is not yet implemented');
  },
};
