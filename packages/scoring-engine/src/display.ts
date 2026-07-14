import type { RuleSetConfig } from './config.js';
import type { MatchState } from './state.js';

/**
 * Human-readable current-point labels for the scoreboard, e.g. ['40', 'AD'] or
 * ['0', '15']. In a tiebreak these are the raw tiebreak point counts. This is a
 * pure view helper — it never affects scoring.
 *
 * Above the final ladder rung a game is always either at deuce (equal) or at
 * advantage (lead of 1): any two-point lead has already won the game, and a
 * decider point resolves on the very next point, so those are the only two
 * ongoing states we ever render.
 */
export function currentPointLabels(state: MatchState, cfg: RuleSetConfig): [string, string] {
  const set = state.sets[state.currentSetIndex];
  if (set?.isTiebreak && set.tiebreak) {
    return [String(set.tiebreak.points[0]), String(set.tiebreak.points[1])];
  }

  const [a, b] = state.currentGame.points;
  const ladder = cfg.point.ladder;
  const lastRung = ladder[ladder.length - 1] ?? '';
  const hi = Math.max(a, b);

  if (hi < ladder.length) {
    return [ladder[a] ?? lastRung, ladder[b] ?? lastRung];
  }
  if (a === b) {
    return [lastRung, lastRung]; // iguales / deuce
  }
  return a > b ? ['AD', lastRung] : [lastRung, 'AD']; // ventaja / advantage
}

/** Games in each set, as pairs, for a compact scoreline like 6–4 7–5. */
export function setScorelines(state: MatchState): Array<[number, number]> {
  return state.sets.map((s) => [s.games[0], s.games[1]]);
}
