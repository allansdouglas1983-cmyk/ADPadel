import type { PlayedCourt } from './standings.js';
import type { Side, Standing } from './types.js';
import { americanoRound } from './americano.js';
import { mexicanoRound } from './mexicano.js';
import { mixedAmericanoRound, teamAmericanoRound } from './teamFormats.js';
import { rankStandings, tallyStandings } from './standings.js';

/**
 * EventSession — the pure orchestrator that turns round generation + standings
 * into a runnable Americano/Mexicano event. It owns the whole event lifecycle
 * as one serializable value (so an event resumes exactly like a match), while
 * the round-pairing and standings maths stay in their own modules.
 *
 * A round completes in one of two configurable modes:
 *  - `'points'` (default): point-per-rally scoring to a fixed total (16/24/32).
 *    Every rally is a point, both players on a team bank the team's points
 *    individually, and a court is done when the two teams' points sum to the
 *    target `pointsPerMatch`.
 *  - `'time'`: every court in the round plays for a fixed `roundDurationSec`;
 *    whatever points are banked when time expires stand. The engine never reads
 *    the clock — elapsed seconds are passed IN via `setRoundElapsed`/`endRound`.
 */

export type EventFormat = 'americano' | 'mexicano' | 'teamAmericano' | 'mixedAmericano';

/** How a round/court is considered finished. */
export type CompletionMode = 'points' | 'time';

export interface EventSessionConfig {
  readonly format: EventFormat;
  readonly players: readonly string[];
  readonly courts: number;
  /** Points contested per court match (sum of both teams). Used in `'points'` mode. */
  readonly pointsPerMatch: number;
  readonly totalRounds: number;
  /** Completion mode; omitted/`'points'` behaves exactly as before. */
  readonly mode?: CompletionMode;
  /** Seconds each round runs for in `'time'` mode. */
  readonly roundDurationSec?: number;
  /** Fixed partnerships for `teamAmericano` (each an [a, b] pair). */
  readonly pairs?: readonly (readonly [string, string])[];
  /** Player pools for `mixedAmericano` (every team is one of each). */
  readonly men?: readonly string[];
  readonly women?: readonly string[];
}

/** A court within a round, with its live/accumulated score. */
export interface CourtProgress {
  readonly court: number;
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly pointsA: number;
  readonly pointsB: number;
}

export interface EventRound {
  readonly index: number;
  readonly courts: readonly CourtProgress[];
  readonly sittingOut: readonly string[];
  /** Seconds elapsed for this round in `'time'` mode (passed in, never read). */
  readonly elapsedSec?: number;
}

export interface EventSession {
  readonly config: EventSessionConfig;
  readonly rounds: readonly EventRound[];
  readonly currentRoundIndex: number;
  readonly status: 'active' | 'complete';
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

/** A court is finished once the two teams' points reach the target total. */
export function courtIsComplete(court: CourtProgress, pointsPerMatch: number): boolean {
  return court.pointsA + court.pointsB >= pointsPerMatch;
}

export function roundIsComplete(round: EventRound, pointsPerMatch: number): boolean {
  return round.courts.every((c) => courtIsComplete(c, pointsPerMatch));
}

/**
 * Mode-aware round completion. In `'points'` mode every court must reach the
 * target total; in `'time'` mode the round is done once its elapsed seconds
 * reach the configured duration (all courts finish together).
 */
export function isRoundComplete(session: EventSession, round: EventRound = currentRound(session)): boolean {
  if (session.config.mode === 'time') {
    const duration = session.config.roundDurationSec ?? Infinity;
    return (round.elapsedSec ?? 0) >= duration;
  }
  return roundIsComplete(round, session.config.pointsPerMatch);
}

export function currentRound(session: EventSession): EventRound {
  return session.rounds[session.currentRoundIndex]!;
}

export function isEventComplete(session: EventSession): boolean {
  return session.status === 'complete';
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

function toProgress(
  courts: readonly { readonly court: number; readonly teamA: readonly string[]; readonly teamB: readonly string[] }[],
): CourtProgress[] {
  return courts.map((c) => ({ court: c.court, teamA: c.teamA, teamB: c.teamB, pointsA: 0, pointsB: 0 }));
}

/** Generate a round for the configured format. Mexicano only diverges from R1. */
function generateRound(session: EventSession, index: number): EventRound {
  const { config } = session;
  const { courts } = config;

  switch (config.format) {
    case 'teamAmericano': {
      const r = teamAmericanoRound(config.pairs ?? [], index, courts);
      return { index, courts: toProgress(r.courts), sittingOut: r.sittingOut };
    }
    case 'mixedAmericano': {
      const r = mixedAmericanoRound(config.men ?? [], config.women ?? [], index, courts);
      return { index, courts: toProgress(r.courts), sittingOut: r.sittingOut };
    }
    case 'mexicano': {
      if (index > 0) {
        const { standings, headToHead } = standingsOf(session);
        const r = mexicanoRound(config.players, index, courts, standings, headToHead);
        return { index, courts: toProgress(r.courts), sittingOut: r.sittingOut };
      }
      const r = americanoRound(config.players, index, courts);
      return { index, courts: toProgress(r.courts), sittingOut: r.sittingOut };
    }
    default: {
      const r = americanoRound(config.players, index, courts);
      return { index, courts: toProgress(r.courts), sittingOut: r.sittingOut };
    }
  }
}

export function createEventSession(config: EventSessionConfig): EventSession {
  const seed: EventSession = { config, rounds: [], currentRoundIndex: 0, status: 'active' };
  const round0 = generateRound(seed, 0);
  return { ...seed, rounds: [round0] };
}

// ---------------------------------------------------------------------------
// Scoring a court
// ---------------------------------------------------------------------------

function updateCourt(session: EventSession, courtIndex: number, fn: (c: CourtProgress) => CourtProgress): EventSession {
  const round = currentRound(session);
  const courts = round.courts.map((c, i) => (i === courtIndex ? fn(c) : c));
  const rounds = session.rounds.map((r, i) =>
    i === session.currentRoundIndex ? { ...r, courts } : r,
  );
  return { ...session, rounds };
}

/**
 * Award one rally point to a side on a court. No-op once the round is over: in
 * `'points'` mode that's when this court hits its target; in `'time'` mode when
 * the round's timer has expired (there is no per-court points cap).
 */
export function addPoint(session: EventSession, courtIndex: number, side: Side): EventSession {
  const round = currentRound(session);
  const court = round.courts[courtIndex];
  if (!court) return session;
  const blocked =
    session.config.mode === 'time'
      ? isRoundComplete(session, round)
      : courtIsComplete(court, session.config.pointsPerMatch);
  if (blocked) return session;
  return updateCourt(session, courtIndex, (c) =>
    side === 0 ? { ...c, pointsA: c.pointsA + 1 } : { ...c, pointsB: c.pointsB + 1 },
  );
}

/**
 * Report elapsed seconds for the current round (`'time'` mode). Time is supplied
 * by the caller so the engine stays pure and deterministic. Monotonic: elapsed
 * never moves backwards, so a completed round can't be re-opened by a stale tick.
 */
export function setRoundElapsed(session: EventSession, elapsedSec: number): EventSession {
  const round = currentRound(session);
  const next = Math.max(round.elapsedSec ?? 0, Math.max(0, elapsedSec));
  const rounds = session.rounds.map((r, i) =>
    i === session.currentRoundIndex ? { ...r, elapsedSec: next } : r,
  );
  return { ...session, rounds };
}

/** Mark the current round's timer as fully expired (`'time'` mode convenience). */
export function endRound(session: EventSession): EventSession {
  return setRoundElapsed(session, session.config.roundDurationSec ?? 0);
}

/** Undo a rally point on a side (floored at zero). */
export function undoPoint(session: EventSession, courtIndex: number, side: Side): EventSession {
  return updateCourt(session, courtIndex, (c) =>
    side === 0
      ? { ...c, pointsA: Math.max(0, c.pointsA - 1) }
      : { ...c, pointsB: Math.max(0, c.pointsB - 1) },
  );
}

/** Set a court's final score directly (fast entry for a court reported verbally). */
export function setCourtResult(session: EventSession, courtIndex: number, pointsA: number, pointsB: number): EventSession {
  return updateCourt(session, courtIndex, (c) => ({ ...c, pointsA, pointsB }));
}

// ---------------------------------------------------------------------------
// Standings
// ---------------------------------------------------------------------------

function playedCourts(session: EventSession): PlayedCourt[] {
  const out: PlayedCourt[] = [];
  for (const round of session.rounds) {
    // In time mode a court's banked score counts once its round's timer is up;
    // in points mode each court counts as soon as it reaches the target total.
    const roundDone = session.config.mode === 'time' ? isRoundComplete(session, round) : false;
    for (const c of round.courts) {
      if (roundDone || courtIsComplete(c, session.config.pointsPerMatch)) {
        out.push({ teamA: c.teamA, teamB: c.teamB, pointsA: c.pointsA, pointsB: c.pointsB });
      }
    }
  }
  return out;
}

function standingsOf(session: EventSession): {
  standings: Standing[];
  headToHead: Map<string, Map<string, number>>;
} {
  return tallyStandings(playedCourts(session));
}

/** The live leaderboard, ranked with the standard tie-breakers. */
export function leaderboard(session: EventSession): Standing[] {
  const { standings, headToHead } = standingsOf(session);
  // Ensure every player appears, even before they've played.
  const seen = new Set(standings.map((s) => s.playerId));
  const zeros: Standing[] = session.config.players
    .filter((p) => !seen.has(p))
    .map((playerId) => ({ playerId, pointsFor: 0, pointsAgainst: 0, played: 0, wins: 0 }));
  return rankStandings([...standings, ...zeros], headToHead);
}

// ---------------------------------------------------------------------------
// Advancing
// ---------------------------------------------------------------------------

export function canAdvance(session: EventSession): boolean {
  return session.status === 'active' && isRoundComplete(session);
}

/**
 * Advance to the next round once the current one is complete. If the configured
 * round total is reached, the event completes instead. No-op if the current
 * round is unfinished.
 */
export function advanceRound(session: EventSession): EventSession {
  if (!canAdvance(session)) return session;
  const nextIndex = session.currentRoundIndex + 1;
  if (nextIndex >= session.config.totalRounds) {
    return { ...session, status: 'complete' };
  }
  const nextRound = generateRound(session, nextIndex);
  return { ...session, rounds: [...session.rounds, nextRound], currentRoundIndex: nextIndex };
}
