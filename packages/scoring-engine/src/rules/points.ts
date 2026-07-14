import type { PointConfig, Side } from '../config.js';

/**
 * The raw min point count at/above which the game enters "decider" mode, where
 * a single point (margin 1) wins. Unifies all three deuce modes:
 *   advantage → never a decider (threshold = +Infinity)
 *   golden    → decider from the first deuce (starMaxAdvantages effectively 0)
 *   star      → decider after `starMaxAdvantages` advantages have been played
 *
 * A "deuce" is reached whenever both sides hold `winAtIndex - 1` or more equal
 * points. Because raw counts only ever increase within a game, `min(a, b)`
 * encodes exactly how many deuces have occurred — no hidden history needed.
 */
export function deciderThreshold(cfg: PointConfig): number {
  switch (cfg.deuce) {
    case 'advantage':
      return Number.POSITIVE_INFINITY;
    case 'golden':
      return cfg.winAtIndex - 1;
    case 'star':
      return cfg.winAtIndex - 1 + (cfg.starMaxAdvantages ?? 0);
  }
}

/**
 * Given the post-increment raw point counts, return the game winner or null.
 * Pure and deterministic — no I/O, no sport literals.
 */
export function resolveGamePoint(
  points: readonly [number, number],
  cfg: PointConfig,
): Side | null {
  const [a, b] = points;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  const lead = hi - lo;
  const leader: Side = a > b ? 0 : 1;

  const isDecider = lo >= deciderThreshold(cfg);
  if (isDecider) {
    return lead >= 1 ? leader : null;
  }
  if (hi >= cfg.winAtIndex && lead >= cfg.pointMargin) {
    return leader;
  }
  return null;
}
