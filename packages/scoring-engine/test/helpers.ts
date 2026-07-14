import type { Action, EngineSnapshot, MatchState, RuleSetConfig, Side } from '../src/index.js';
import { applyAction, foldLog, newSnapshot } from '../src/index.js';

export const PLAYERS_DOUBLES = ['A1', 'B1', 'A2', 'B2'];
export const PLAYERS_SINGLES = ['P0', 'P1'];

/** Apply a list of actions to a fresh match, returning the final snapshot+state. */
export function play(
  cfg: RuleSetConfig,
  actions: readonly Action[],
  players: readonly string[] = PLAYERS_DOUBLES,
): { snapshot: EngineSnapshot; state: MatchState } {
  let snapshot = newSnapshot(cfg, players);
  let state: MatchState = foldLog(snapshot, cfg);
  for (const action of actions) {
    const r = applyAction(snapshot, action, cfg);
    snapshot = r.snapshot;
    state = r.state;
  }
  return { snapshot, state };
}

/** N points to a side. */
export function pts(side: Side, n: number): Action[] {
  return Array.from({ length: n }, () => ({ type: 'POINT_TO', side }) as Action);
}

/** Alternating points, `a` to side 0 then `b` to side 1, interleaved. */
export function rally(seq: string): Action[] {
  // e.g. "0011" → point 0,0,1,1
  return [...seq].map((c) => ({ type: 'POINT_TO', side: Number(c) as Side }) as Action);
}

/** Win an entire game for `side` from 0–0 (4 straight points wins any game). */
export function winGame(side: Side): Action[] {
  return pts(side, 4);
}

/**
 * Win a sequence of complete games. Each char is the winning side of one game,
 * e.g. gameWins('010101010101') plays out a 6–6 set (then a tiebreak triggers).
 */
export function gameWins(seq: string): Action[] {
  return [...seq].flatMap((c) => winGame(Number(c) as Side));
}
