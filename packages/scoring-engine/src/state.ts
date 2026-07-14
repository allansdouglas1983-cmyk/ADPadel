import type { Side } from './config.js';

/** A single game's raw point counts. Deuce/advantage/decider are DERIVED from
 * these counts (never stored) so folding the action log is fully deterministic. */
export interface GameScore {
  readonly points: readonly [number, number];
  readonly winner: Side | null;
}

export interface TiebreakScore {
  readonly points: readonly [number, number];
  readonly winner: Side | null;
}

export interface SetScore {
  readonly games: readonly [number, number];
  readonly tiebreak: TiebreakScore | null;
  readonly isTiebreak: boolean;
  readonly winner: Side | null;
  /** Which config governs this set. */
  readonly kind: 'regular' | 'final';
}

export interface ServerState {
  /** Player-slot index currently serving. */
  readonly serverSlot: number;
  readonly servingSide: Side;
}

export type MatchOutcome =
  | { readonly type: 'inProgress' }
  | { readonly type: 'completed'; readonly winner: Side }
  | { readonly type: 'retired'; readonly winner: Side; readonly retiree: Side };

export interface MatchState {
  readonly configId: string;
  readonly configVersion: number;
  readonly players: readonly string[]; // 2 (singles) or 4 (doubles)
  readonly sets: readonly SetScore[];
  readonly setsWon: readonly [number, number];
  readonly currentSetIndex: number;
  readonly currentGame: GameScore;
  /** Total games (and set-deciding tiebreaks) completed — drives serve rotation. */
  readonly gamesStartedTotal: number;
  readonly server: ServerState;
  readonly outcome: MatchOutcome;
  readonly complete: boolean;
  /** Monotonic count of applied actions. */
  readonly seq: number;
}
