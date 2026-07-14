import type { PlayerRating } from './types.js';

/** Base rating for a brand-new player (~3.5 on the 1–7 display scale). */
export const BASE_ELO = 1200;

/** Team rating = mean of the pair's Elo. */
export function teamElo(players: readonly PlayerRating[]): number {
  if (players.length === 0) return BASE_ELO;
  return players.reduce((sum, p) => sum + p.elo, 0) / players.length;
}

/** Logistic expected score (0..1) for `ratingFor` against `ratingAgainst`. */
export function expectedScore(ratingFor: number, ratingAgainst: number): number {
  return 1 / (1 + Math.pow(10, (ratingAgainst - ratingFor) / 400));
}

/**
 * Provisional K-factor: high while a rating is new, decaying to a stable floor.
 * 64 → 16 across the first 20 matches, then constant.
 */
export function kFactor(matchesPlayed: number): number {
  const K0 = 64;
  const KMIN = 16;
  const N = 20;
  const clamped = Math.min(Math.max(matchesPlayed, 0), N);
  return K0 - (K0 - KMIN) * (clamped / N);
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
