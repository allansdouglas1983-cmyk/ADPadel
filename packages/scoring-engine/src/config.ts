/**
 * RuleSetConfig — the scoring rules expressed entirely as DATA.
 *
 * The reducer in `engine.ts` and the helpers in `rules/*` read this config and
 * contain NO sport-specific literals. Padel, tennis and pickleball are all just
 * different `RuleSetConfig` values (see `presets/`). This is the strategic moat:
 * padel ships perfect now, other sports drop in later as config, never code.
 */

/** Which team. 0 = side A, 1 = side B. */
export type Side = 0 | 1;

export type DeuceMode =
  | 'advantage' // must win by `pointMargin`, unbounded (classic ventaja)
  | 'golden' // at deuce the next point wins (punto de oro / sudden death)
  | 'star'; // up to N advantages, then a single decider point (punto estrella)

export type Format = 'singles' | 'doubles';

export type FinalSetKind = 'full' | 'superTiebreak' | 'miniSet';

export interface PointConfig {
  /** Display ladder, e.g. ['0','15','30','40']. Length is informational. */
  readonly ladder: readonly string[];
  /** Raw point count at which a side may win the game (one past the ladder). */
  readonly winAtIndex: number;
  /** Points a side must lead by to win the game (2 for padel/tennis). */
  readonly pointMargin: number;
  readonly deuce: DeuceMode;
  /**
   * For `deuce: 'star'` — how many advantages are played before the decider.
   * (golden is equivalent to star with 0.) Ignored for 'advantage'.
   */
  readonly starMaxAdvantages?: number;
}

export interface TiebreakConfig {
  readonly targetPoints: number; // 7 (set TB) or 10 (super TB)
  readonly pointMargin: number; // 2
  readonly firstServerPoints: number; // 1 — opener serves this many, then rotate
  readonly serveEvery: number; // 2 — serve changes every N points thereafter
  readonly changeEndsEvery: number; // 6 — cosmetic ends-change cadence (0 = never)
}

export interface SetConfig {
  readonly gamesToWin: number; // 6 (standard) or 4 (mini-set)
  readonly gameMargin: number; // 2
  /** Games at which a tiebreak triggers (6 → TB at 6–6). 0 → start in TB. */
  readonly tiebreakAtGames?: number;
  readonly tiebreak?: TiebreakConfig;
  /** Optional hard cap so an advantage set can't run forever. */
  readonly maxGames?: number;
}

export interface FinalSetConfig {
  readonly kind: FinalSetKind;
  /** For 'full' and 'miniSet'. */
  readonly set?: SetConfig;
  /** For 'superTiebreak' (target 10, margin 2). */
  readonly superTiebreak?: TiebreakConfig;
}

export interface MatchConfig {
  readonly bestOf: number; // 1 or 3 → sets needed = ceil(bestOf/2)
  readonly regularSet: SetConfig;
  readonly finalSet: FinalSetConfig;
  /** If false (default), the match freezes the instant match point converts. */
  readonly playOutAfterMatchPoint: boolean;
}

export interface ServeConfig {
  readonly format: Format;
  /**
   * Game-to-game server rotation as player-slot indices.
   * Doubles padel [A1,B1,A2,B2] → [0,1,2,3]; singles → [0,1].
   */
  readonly gameServeCycle: readonly number[];
  /** Side that each player slot belongs to, e.g. [0,1,0,1]. */
  readonly slotSide: readonly Side[];
}

export interface RuleSetConfig {
  readonly id: string; // e.g. 'padel.standard.bo3.superTB'
  readonly version: number; // bump on any semantic change
  readonly point: PointConfig;
  readonly match: MatchConfig;
  readonly serve: ServeConfig;
  /**
   * Non-scoring metadata for the UI layer (never read by the reducer). E.g. the
   * star-point mixed-doubles rule flag: the decisive point must be man-on-man
   * or woman-on-woman — a prompting concern, not a scoring one.
   */
  readonly meta?: Readonly<Record<string, unknown>>;
}
