/**
 * Shared types for Tournament Engine strategies.
 */

export interface PrizeResult {
  totalPool: number;
  platformFee: number;
  netPool: number;
  dist: number[];
}

/**
 * Each game type (TDM, WoW, Classic, …) implements this interface.
 * Routes delegate game-specific behaviour here; shared logic
 * (resolve, complete, bracket advance) lives in tournament.service.
 */
export interface GameTypeStrategy {
  /** Discriminator stored in Tournament.gameType */
  readonly gameType: string;

  /** Calculate prize pool, fee, and distribution for a given bet + teamCount */
  calculatePrizes(bet: number, teamCount: number, config?: any): PrizeResult;

  /**
   * Called inside the Serializable tx when the last team joins.
   * Must set status → IN_PROGRESS, assign matches, create system messages.
   */
  startTournament(
    tx: any,
    tournamentId: string,
    teamCount: number,
    userId: string,
    config?: any,
  ): Promise<void>;
}
