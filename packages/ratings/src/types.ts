/** 0 = side A, 1 = side B — kept local so ratings has zero dependencies. */
export type Side = 0 | 1;

export type Discipline = 'singles' | 'doubles';

export interface PlayerRating {
  readonly playerId: string;
  readonly discipline: Discipline;
  /** Hidden Elo-style value, base 1200. */
  readonly elo: number;
  /** Per-discipline match count — drives provisional K-factor decay. */
  readonly matchesPlayed: number;
  /** Idempotency guard: the last match id applied to this rating. */
  readonly lastMatchId: string | null;
}

export interface RatingHistoryEntry {
  readonly matchId: string;
  readonly playerId: string;
  readonly discipline: Discipline;
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  /** Expected score (0..1) for the player's side, from the rating gap. */
  readonly expected: number;
  /** Realized score (0 or 1) for the player's side. */
  readonly actual: number;
  readonly k: number;
  readonly atIso: string;
}

export interface MatchResultInput {
  readonly matchId: string;
  readonly discipline: Discipline;
  readonly sideA: readonly PlayerRating[]; // 1 (singles) or 2 (doubles)
  readonly sideB: readonly PlayerRating[];
  /** Games won by each side — the margin signal. */
  readonly gamesWon: readonly [number, number];
  /** Optional finer margin signal. */
  readonly pointsWon?: readonly [number, number];
  readonly winner: Side;
  readonly atIso: string;
}

export interface RatingUpdate {
  readonly updated: readonly PlayerRating[];
  readonly history: readonly RatingHistoryEntry[];
}
