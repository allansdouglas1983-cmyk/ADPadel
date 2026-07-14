import type { Side, TiebreakConfig } from '../config.js';

/** Tiebreak winner from post-increment point counts, or null if unfinished. */
export function tiebreakWinner(
  points: readonly [number, number],
  cfg: TiebreakConfig,
): Side | null {
  const [a, b] = points;
  const hi = Math.max(a, b);
  const lead = Math.abs(a - b);
  if (hi >= cfg.targetPoints && lead >= cfg.pointMargin) {
    return a > b ? 0 : 1;
  }
  return null;
}

/**
 * Which step of the serve cycle serves the upcoming tiebreak point.
 * The opener serves `firstServerPoints`, then serve rotates every `serveEvery`.
 * With (1, 2) this yields the familiar 1-then-2 pattern.
 */
export function tiebreakServeCursor(
  openerCursor: number,
  pointsPlayed: number,
  cfg: TiebreakConfig,
  cycleLength: number,
): number {
  if (pointsPlayed < cfg.firstServerPoints) {
    return openerCursor % cycleLength;
  }
  const swaps = Math.floor((pointsPlayed - cfg.firstServerPoints) / cfg.serveEvery) + 1;
  return (openerCursor + swaps) % cycleLength;
}
