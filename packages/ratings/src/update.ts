import type {
  Discipline,
  MatchResultInput,
  PlayerRating,
  RatingHistoryEntry,
  RatingParams,
  RatingUpdate,
} from './types.js';
import { DEFAULT_RATING_PARAMS, expectedScore, kFactor, marginMultiplier, teamElo } from './elo.js';

/** A fresh, provisional rating for a player in a discipline. */
export function initialRating(
  playerId: string,
  discipline: Discipline,
  params: RatingParams = DEFAULT_RATING_PARAMS,
): PlayerRating {
  return { playerId, discipline, elo: params.baseElo, matchesPlayed: 0, lastMatchId: null };
}

/**
 * Update every player's rating from one completed match.
 *
 * Uses performance-vs-expectation (DUPR philosophy): the rating change scales
 * with how far the result diverged from the expected margin. Idempotent — a
 * player whose `lastMatchId` already equals this match is left untouched, so
 * replaying the same completed match never double-counts.
 */
export function updateRatings(
  input: MatchResultInput,
  params: RatingParams = DEFAULT_RATING_PARAMS,
): RatingUpdate {
  const rA = teamElo(input.sideA);
  const rB = teamElo(input.sideB);
  const expectedA = expectedScore(rA, rB, params);
  const actualA = input.winner === 0 ? 1 : 0;
  const mult = marginMultiplier(input.gamesWon, input.pointsWon);

  const updated: PlayerRating[] = [];
  const history: RatingHistoryEntry[] = [];

  const applySide = (players: readonly PlayerRating[], expectedForSide: number, actualForSide: number): void => {
    for (const p of players) {
      if (p.lastMatchId === input.matchId) {
        updated.push(p); // already applied — idempotent no-op
        continue;
      }
      const k = kFactor(p.matchesPlayed, params);
      const delta = k * mult * (actualForSide - expectedForSide);
      const after = p.elo + delta;
      updated.push({
        ...p,
        elo: after,
        matchesPlayed: p.matchesPlayed + 1,
        lastMatchId: input.matchId,
      });
      history.push({
        matchId: input.matchId,
        playerId: p.playerId,
        discipline: p.discipline,
        before: p.elo,
        after,
        delta,
        expected: expectedForSide,
        actual: actualForSide,
        k,
        atIso: input.atIso,
      });
    }
  };

  applySide(input.sideA, expectedA, actualA);
  applySide(input.sideB, 1 - expectedA, 1 - actualA);

  return { updated, history };
}
