import type { CourtPairing, Round, Standing } from './types.js';
import { activeCount, restingIndices } from './rotation.js';
import { americanoRound } from './americano.js';
import { rankStandings } from './standings.js';

/**
 * Generate one Mexicano round. Round 0 is a random-but-deterministic Americano
 * round; every later round is generated from the live leaderboard so games stay
 * competitively even. Within each court the top and bottom of the four are
 * paired against the middle two (1&4 vs 2&3).
 */
export function mexicanoRound(
  players: readonly string[],
  roundIndex: number,
  courts: number,
  standings?: readonly Standing[],
  headToHead?: Map<string, Map<string, number>>,
): Round {
  if (roundIndex === 0 || !standings || standings.length === 0) {
    return americanoRound(players, roundIndex, courts);
  }

  const ranked = rankStandings(standings, headToHead).map((s) => s.playerId);
  // Include any players missing from standings (e.g. not yet played) at the end.
  const seen = new Set(ranked);
  const order = [...ranked, ...players.filter((p) => !seen.has(p))];

  const n = order.length;
  const active = activeCount(n, courts);
  const sitCount = n - active;
  // Rotate the rest set fairly across the ranked order (not always the weakest).
  const resting = restingIndices(n, roundIndex, sitCount);
  const restingSet = new Set(resting.map((i) => order[i]!));
  const activeOrder = order.filter((p) => !restingSet.has(p));

  const courtsOut: CourtPairing[] = [];
  const usableCourts = Math.floor(active / 4);
  for (let c = 0; c < usableCourts; c++) {
    const [p1, p2, p3, p4] = activeOrder.slice(c * 4, c * 4 + 4);
    courtsOut.push({ court: c, teamA: [p1!, p4!], teamB: [p2!, p3!] });
  }

  return { index: roundIndex, courts: courtsOut, sittingOut: [...restingSet] };
}
