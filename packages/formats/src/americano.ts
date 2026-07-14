import type { CourtPairing, Round } from './types.js';
import { activeCount, restingIndices, rotateKeepingFirst, splitFoursome } from './rotation.js';

/**
 * Generate one Americano round: rotating-partner, score-as-an-individual.
 *
 * Partners vary within each foursome across the three combinations, court
 * membership rotates via the circle method, and sit-outs (for player counts not
 * divisible by four) rotate fairly. Perfect all-play-all partner coverage for
 * arbitrary sizes is the social-golfer problem; this gives strong, deterministic
 * variety without it.
 */
export function americanoRound(
  players: readonly string[],
  roundIndex: number,
  courts: number,
): Round {
  const n = players.length;
  const active = activeCount(n, courts);
  const sitCount = n - active;
  const resting = restingIndices(n, roundIndex, sitCount);
  const restingSet = new Set(resting);

  const activePlayers = players.filter((_, i) => !restingSet.has(i));
  const rotated = rotateKeepingFirst(activePlayers, roundIndex);

  const courtsOut: CourtPairing[] = [];
  const usableCourts = Math.floor(active / 4);
  for (let c = 0; c < usableCourts; c++) {
    const group = rotated.slice(c * 4, c * 4 + 4);
    const [teamA, teamB] = splitFoursome(group, roundIndex + c);
    courtsOut.push({ court: c, teamA, teamB });
  }

  return { index: roundIndex, courts: courtsOut, sittingOut: resting.map((i) => players[i]!) };
}

/** Generate a full Americano schedule of `numRounds` rounds. */
export function americanoSchedule(
  players: readonly string[],
  numRounds: number,
  courts: number,
): Round[] {
  return Array.from({ length: numRounds }, (_, r) => americanoRound(players, r, courts));
}
