import type { Side } from './config.js';
import type { MatchState } from './state.js';

/** A completed set's line: games each side, plus tiebreak points if one was played. */
export interface SetSummary {
  readonly games: readonly [number, number];
  readonly tiebreak: readonly [number, number] | null;
}

/** A derived, DB- and ratings-ready summary of a finished match. Pure. */
export interface MatchSummary {
  readonly complete: boolean;
  readonly retired: boolean;
  readonly winner: Side | null;
  readonly sets: readonly SetSummary[];
  readonly setsWon: readonly [number, number];
  readonly totalGames: readonly [number, number];
  /** The winner dropped the first set — used for the "comeback" stat. */
  readonly wasComeback: boolean;
}

/**
 * Summarize a MatchState into a flat, persistence- and ratings-ready shape.
 * Pure and deterministic — the single source for writing `sets` rows, building
 * the ratings input, and the share-card scoreline. Only decided sets count
 * toward totals (a live final set in progress is ignored).
 */
export function summarizeMatch(state: MatchState): MatchSummary {
  const decidedSets = state.sets.filter((s) => s.winner !== null);
  const sets: SetSummary[] = decidedSets.map((s) => ({
    games: [s.games[0], s.games[1]],
    tiebreak: s.tiebreak ? [s.tiebreak.points[0], s.tiebreak.points[1]] : null,
  }));

  const totalGames: [number, number] = decidedSets.reduce<[number, number]>(
    (acc, s) => [acc[0] + s.games[0], acc[1] + s.games[1]],
    [0, 0],
  );

  const winner =
    state.outcome.type === 'completed' || state.outcome.type === 'retired' ? state.outcome.winner : null;

  const firstSetWinner = decidedSets[0]?.winner ?? null;
  const wasComeback = winner !== null && firstSetWinner !== null && firstSetWinner !== winner;

  return {
    complete: state.complete,
    retired: state.outcome.type === 'retired',
    winner,
    sets,
    setsWon: [state.setsWon[0], state.setsWon[1]],
    totalGames,
    wasComeback,
  };
}
