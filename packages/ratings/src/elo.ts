import type { PlayerRating, RatingParams } from './types.js';

/** Base rating for a brand-new player (~3.5 on the 1–7 display scale). */
export const BASE_ELO = 1200;

/** Default, well-tuned parameters. Every value is overridable per deployment. */
export const DEFAULT_RATING_PARAMS: RatingParams = {
  baseElo: BASE_ELO,
  kInitial: 64,
  kFloor: 16,
  kDecayMatches: 20,
  dParameter: 400,
  formHalfLifeMatches: 5,
};

/** Team rating = mean of the pair's Elo. */
export function teamElo(players: readonly PlayerRating[]): number {
  if (players.length === 0) return BASE_ELO;
  return players.reduce((sum, p) => sum + p.elo, 0) / players.length;
}

/** Logistic expected score (0..1) for `ratingFor` against `ratingAgainst`. */
export function expectedScore(
  ratingFor: number,
  ratingAgainst: number,
  params: RatingParams = DEFAULT_RATING_PARAMS,
): number {
  return 1 / (1 + Math.pow(10, (ratingAgainst - ratingFor) / params.dParameter));
}

/**
 * Provisional K-factor: high while a rating is new, decaying linearly to a
 * stable floor over `kDecayMatches`, then constant. This damps early volatility.
 */
export function kFactor(matchesPlayed: number, params: RatingParams = DEFAULT_RATING_PARAMS): number {
  const clamped = Math.min(Math.max(matchesPlayed, 0), params.kDecayMatches);
  return params.kInitial - (params.kInitial - params.kFloor) * (clamped / params.kDecayMatches);
}

/**
 * Recency-weighted "form" rating: a weighted average of the player's post-match
 * rating values that weights recent matches more (exponential decay by a
 * half-life in matches). `values` are chronological (oldest → newest). This is
 * the explicit "weight recent matches more" signal used for the Wrapped rating
 * journey and a current-form indicator, distinct from the canonical Elo.
 */
export function formRating(
  values: readonly number[],
  params: RatingParams = DEFAULT_RATING_PARAMS,
): number {
  if (values.length === 0) return params.baseElo;
  const decay = Math.pow(0.5, 1 / Math.max(1, params.formHalfLifeMatches));
  let weightedSum = 0;
  let weightTotal = 0;
  const n = values.length;
  for (let i = 0; i < n; i++) {
    // Newest (i = n-1) gets weight 1; older values decay.
    const weight = Math.pow(decay, n - 1 - i);
    weightedSum += weight * values[i]!;
    weightTotal += weight;
  }
  return weightedSum / weightTotal;
}

/**
 * Margin multiplier: a blow-out moves ratings more than a squeaker, capped.
 * Games contribute the bulk; points (if provided) nudge it finer.
 */
export function marginMultiplier(
  gamesWon: readonly [number, number],
  pointsWon?: readonly [number, number],
): number {
  const [ga, gb] = gamesWon;
  const gTotal = ga + gb || 1;
  const gShare = Math.abs(ga - gb) / gTotal; // 0..1
  const base = 0.75 + 0.5 * gShare; // 0.75..1.25

  if (!pointsWon) return base;
  const [pa, pb] = pointsWon;
  const pTotal = pa + pb || 1;
  const pShare = Math.abs(pa - pb) / pTotal;
  return base * (0.9 + 0.2 * pShare); // 0.9..1.1 fine adjustment
}

/**
 * Project a hidden Elo onto the friendly 1–7 display scale (clamped).
 * Calibrated so the BASE_ELO of 1200 reads as 3.5, each 100 Elo ≈ 1.0 point.
 */
export function toDisplayScale(elo: number): number {
  const value = 1 + (elo - 950) / 100;
  return Math.min(7, Math.max(1, Math.round(value * 100) / 100));
}
