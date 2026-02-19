/**
 * Strategy registry — maps gameType string to its strategy implementation.
 */

import type { GameTypeStrategy } from '../types';
import { TdmStrategy } from './tdm.strategy';
import { WowStrategy } from './wow.strategy';
import { ClassicStrategy } from './classic.strategy';

const strategies: Record<string, GameTypeStrategy> = {
  TDM: TdmStrategy,
  WOW: WowStrategy,
  CLASSIC: ClassicStrategy,
};

/**
 * Returns the strategy for a given gameType.
 * Falls back to TDM if unknown (backward compat for tournaments without gameType).
 */
export function getStrategy(gameType?: string | null): GameTypeStrategy {
  return strategies[gameType || 'TDM'] || TdmStrategy;
}

export { TdmStrategy, WowStrategy, ClassicStrategy };
