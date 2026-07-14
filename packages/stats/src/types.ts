/**
 * A completed match, flattened to just what the stats engine needs. The app
 * builds these from its SQLite rows; the engine here stays pure and DB-free.
 */
export interface MatchRecord {
  readonly matchId: string;
  /** The two players (or the single player twice) on each side. */
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly winner: 0 | 1;
  readonly gamesWon: readonly [number, number];
  readonly setsWon?: readonly [number, number];
  readonly pointsWon?: readonly [number, number];
  /** Service points won/played by each player, if per-point logging was on. */
  readonly serviceWon?: Readonly<Record<string, [won: number, played: number]>>;
  /** Golden/star points won/played by each player. */
  readonly deciderWon?: Readonly<Record<string, [won: number, played: number]>>;
  readonly venue?: string;
  /** ISO timestamp the match started. */
  readonly startedAtIso: string;
  readonly wasComeback?: boolean;
  /** Match duration in seconds, if recorded (for "hours on court"). */
  readonly durationSec?: number;
  /** Golden/star (decider) points won by each player, if logged. */
}

export interface PlayerStats {
  readonly playerId: string;
  readonly matches: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number; // 0..1
  readonly currentStreak: number; // + for wins, - for losses
  readonly longestWinStreak: number;
  readonly gamesWon: number;
  readonly gamesLost: number;
  readonly gameWinRate: number;
  readonly setsWon: number;
  readonly setsLost: number;
  readonly setWinRate: number;
  /** Share of total points won across matches that logged points (else null). */
  readonly pointsWinRate: number | null;
  readonly serviceHoldRate: number | null;
  readonly deciderWinRate: number | null;
  readonly comebacks: number;
  /** Most recent-first W/L flags for a form sparkline. */
  readonly form: readonly ('W' | 'L')[];
}

export interface PartnerChemistry {
  readonly partnerId: string;
  readonly matches: number;
  readonly wins: number;
  readonly winRate: number;
}

export interface HeadToHead {
  readonly opponentId: string;
  readonly matches: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
}

export interface VenueBreakdown {
  readonly venue: string;
  readonly matches: number;
  readonly wins: number;
  readonly winRate: number;
}
