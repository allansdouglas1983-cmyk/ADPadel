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
  /**
   * The magnitude of the largest deficit the eventual winner overcame in this
   * match — e.g. games (or sets) behind at the low point. Optional: the app
   * populates it when the score log carries enough detail. When present it lets
   * Wrapped surface the single biggest comeback; when absent, a `wasComeback`
   * win still counts but its magnitude is treated as unknown (0).
   */
  readonly comebackDeficit?: number;
  /** Match duration in seconds, if recorded (for "hours on court"). */
  readonly durationSec?: number;
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

/** The single biggest comeback win and the deficit it overcame. */
export interface BiggestComeback {
  readonly matchId: string;
  /** Largest deficit overcome (0 when the match logged no magnitude). */
  readonly deficit: number;
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
