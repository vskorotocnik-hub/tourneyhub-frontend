/**
 * Pure functions: bracket generation and rating math.
 * No DB access — safe to import anywhere.
 */

export interface BracketMatch {
  round: number;
  matchOrder: number;
  teamASlot?: number;
  teamBSlot?: number;
  isBye?: boolean;
}

export function generateBracket(teamCount: number): BracketMatch[] {
  const matches: BracketMatch[] = [];

  if (teamCount === 2) {
    // 1 match: team1 vs team2 (final)
    matches.push({ round: 1, matchOrder: 1, teamASlot: 1, teamBSlot: 2 });
  } else if (teamCount === 3) {
    // Round 1: team1 vs team2, Round 2: winner vs team3 (team3 gets bye)
    matches.push({ round: 1, matchOrder: 1, teamASlot: 1, teamBSlot: 2 });
    matches.push({ round: 2, matchOrder: 1, teamASlot: undefined, teamBSlot: 3 }); // teamA = winner of R1M1
  } else if (teamCount === 4) {
    // Semi-finals: team1 vs team2, team3 vs team4
    matches.push({ round: 1, matchOrder: 1, teamASlot: 1, teamBSlot: 2 });
    matches.push({ round: 1, matchOrder: 2, teamASlot: 3, teamBSlot: 4 });
    // Final: winner of M1 vs winner of M2
    matches.push({ round: 2, matchOrder: 1 });
  }

  return matches;
}

export function calculateRatingChange(bet: number, teamCount: number, isWin: boolean): number {
  const teamMultiplier = teamCount === 2 ? 1 : teamCount === 3 ? 1.5 : 2;
  if (isWin) return Math.round((10 + bet * 0.5) * teamMultiplier);
  return -Math.round((5 + bet * 0.3) * teamMultiplier);
}
