import type { Side } from './config.js';

/**
 * Every way a match's score can change. Actions are the canonical record of
 * intent; state is a pure fold of the action log (see engine.ts).
 */
export type Action =
  | { readonly type: 'POINT_TO'; readonly side: Side }
  | { readonly type: 'REPLAY' } // a let — replay the point, no score change
  | { readonly type: 'PENALTY'; readonly side: Side; readonly unit: 'point' | 'game' }
  | { readonly type: 'RETIRE'; readonly side: Side } // `side` = the retiring side
  | { readonly type: 'UNDO' };

/** Everything except UNDO is stored in the log. UNDO pops the last entry. */
export type LoggedAction = Exclude<Action, { type: 'UNDO' }>;

/** The minimal, serializable record from which any MatchState is re-derived. */
export interface EngineSnapshot {
  readonly configId: string;
  readonly configVersion: number;
  readonly players: readonly string[];
  readonly log: readonly LoggedAction[];
}
