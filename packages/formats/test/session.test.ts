import { describe, expect, it } from 'vitest';
import type { EventSession, EventSessionConfig, Side } from '../src/index.js';
import {
  addPoint,
  advanceRound,
  canAdvance,
  courtIsComplete,
  createEventSession,
  currentRound,
  endRound,
  isEventComplete,
  isRoundComplete,
  leaderboard,
  roundIsComplete,
  setCourtResult,
  setRoundElapsed,
  undoPoint,
} from '../src/index.js';

const players = (n: number) => Array.from({ length: n }, (_, i) => `P${i}`);

const baseConfig = (over: Partial<EventSessionConfig> = {}): EventSessionConfig => ({
  format: 'americano',
  players: players(8),
  courts: 2,
  pointsPerMatch: 24,
  totalRounds: 3,
  ...over,
});

/** Fill every court of the current round with a decisive result. */
function finishRound(session: EventSession, aPoints = 16): EventSession {
  let s = session;
  const cap = s.config.pointsPerMatch;
  currentRound(s).courts.forEach((_, courtIndex) => {
    s = setCourtResult(s, courtIndex, aPoints, cap - aPoints);
  });
  return s;
}

describe('createEventSession', () => {
  it('generates the first round on creation', () => {
    const s = createEventSession(baseConfig());
    expect(s.rounds).toHaveLength(1);
    expect(s.currentRoundIndex).toBe(0);
    expect(currentRound(s).courts).toHaveLength(2);
    expect(s.status).toBe('active');
  });
});

describe('court scoring', () => {
  it('accumulates rally points and completes at the target total', () => {
    let s = createEventSession(baseConfig({ pointsPerMatch: 4, courts: 1, players: players(4) }));
    for (let i = 0; i < 3; i++) s = addPoint(s, 0, 0);
    s = addPoint(s, 0, 1); // sum = 4 → complete
    const court = currentRound(s).courts[0]!;
    expect(court.pointsA).toBe(3);
    expect(court.pointsB).toBe(1);
    expect(courtIsComplete(court, 4)).toBe(true);
  });

  it('ignores points once a court is full', () => {
    let s = createEventSession(baseConfig({ pointsPerMatch: 2, courts: 1, players: players(4) }));
    s = addPoint(s, 0, 0);
    s = addPoint(s, 0, 0); // sum = 2 → complete
    s = addPoint(s, 0, 1); // ignored
    expect(currentRound(s).courts[0]!.pointsB).toBe(0);
  });

  it('undoes a point (floored at zero)', () => {
    let s = createEventSession(baseConfig({ pointsPerMatch: 24, courts: 1, players: players(4) }));
    s = addPoint(s, 0, 0);
    s = undoPoint(s, 0, 0);
    s = undoPoint(s, 0, 0); // no negative
    expect(currentRound(s).courts[0]!.pointsA).toBe(0);
  });
});

describe('round advancement', () => {
  it('cannot advance until every court is complete', () => {
    const s = createEventSession(baseConfig());
    expect(canAdvance(s)).toBe(false);
    expect(advanceRound(s)).toBe(s); // no-op
  });

  it('advances to a fresh next round when complete', () => {
    let s = createEventSession(baseConfig());
    s = finishRound(s);
    expect(roundIsComplete(currentRound(s), 24)).toBe(true);
    expect(canAdvance(s)).toBe(true);
    s = advanceRound(s);
    expect(s.currentRoundIndex).toBe(1);
    expect(s.rounds).toHaveLength(2);
    expect(currentRound(s).courts.every((c) => c.pointsA === 0 && c.pointsB === 0)).toBe(true);
  });

  it('completes the event after the configured number of rounds', () => {
    let s = createEventSession(baseConfig({ totalRounds: 2 }));
    s = advanceRound(finishRound(s)); // round 1
    s = advanceRound(finishRound(s)); // would be round 2 → complete
    expect(isEventComplete(s)).toBe(true);
    expect(s.status).toBe('complete');
  });
});

describe('leaderboard', () => {
  it('lists every player, including those yet to play', () => {
    const s = createEventSession(baseConfig());
    const board = leaderboard(s);
    expect(board).toHaveLength(8);
    expect(board.every((r) => r.played === 0)).toBe(true);
  });

  it('ranks players by banked points as results come in', () => {
    let s = createEventSession(baseConfig({ courts: 1, players: players(4), pointsPerMatch: 24 }));
    // Court 0: teamA wins 20-4 → both teamA players lead.
    s = setCourtResult(s, 0, 20, 4);
    const board = leaderboard(s);
    const top = board[0]!;
    const winners = currentRound(s).courts[0]!.teamA;
    expect(winners).toContain(top.playerId);
    expect(top.pointsFor).toBe(20);
  });
});

describe('mexicano', () => {
  it("round 1 pairs by the leaderboard (1&4 vs 2&3)", () => {
    let s = createEventSession(baseConfig({ format: 'mexicano', courts: 1, players: players(4), totalRounds: 3 }));
    // Give a clear ranking in round 0.
    s = setCourtResult(s, 0, 24, 0);
    s = advanceRound(s);
    expect(s.currentRoundIndex).toBe(1);
    // The next round exists and is a valid 2v2.
    const court = currentRound(s).courts[0]!;
    expect(court.teamA).toHaveLength(2);
    expect(court.teamB).toHaveLength(2);
  });
});

describe('time-per-round mode', () => {
  const timeConfig = (over: Partial<EventSessionConfig> = {}) =>
    baseConfig({ mode: 'time', roundDurationSec: 600, courts: 1, players: players(4), ...over });

  it('does not complete a round on points — only when the timer expires', () => {
    let s = createEventSession(timeConfig());
    // Bank plenty of points; there is no per-court points cap in time mode.
    for (let i = 0; i < 50; i++) s = addPoint(s, 0, 0);
    expect(currentRound(s).courts[0]!.pointsA).toBe(50);
    expect(isRoundComplete(s)).toBe(false);
    expect(canAdvance(s)).toBe(false);
  });

  it('completes the round once elapsed seconds reach the duration', () => {
    let s = createEventSession(timeConfig());
    s = addPoint(s, 0, 0);
    s = setRoundElapsed(s, 300); // half-time
    expect(isRoundComplete(s)).toBe(false);
    s = setRoundElapsed(s, 600); // time!
    expect(isRoundComplete(s)).toBe(true);
    expect(canAdvance(s)).toBe(true);
    expect(currentRound(s).elapsedSec).toBe(600);
  });

  it('endRound is a shortcut for reaching the full duration', () => {
    let s = createEventSession(timeConfig());
    s = endRound(s);
    expect(isRoundComplete(s)).toBe(true);
    expect(currentRound(s).elapsedSec).toBe(600);
  });

  it('elapsed time is monotonic — a stale tick cannot re-open a finished round', () => {
    let s = createEventSession(timeConfig());
    s = setRoundElapsed(s, 600);
    s = setRoundElapsed(s, 120); // late, out-of-order tick
    expect(currentRound(s).elapsedSec).toBe(600);
    expect(isRoundComplete(s)).toBe(true);
  });

  it('ignores rally points once the round timer has expired', () => {
    let s = createEventSession(timeConfig());
    s = addPoint(s, 0, 0);
    s = endRound(s);
    s = addPoint(s, 0, 0); // blocked — round is over
    expect(currentRound(s).courts[0]!.pointsA).toBe(1);
  });

  it('counts the banked score toward standings once time expires', () => {
    let s = createEventSession(timeConfig());
    s = addPoint(s, 0, 0);
    s = addPoint(s, 0, 0);
    s = addPoint(s, 0, 1);
    // Before time: nothing counted yet.
    expect(leaderboard(s).every((r) => r.played === 0)).toBe(true);
    s = endRound(s);
    const board = leaderboard(s);
    const winners = currentRound(s).courts[0]!.teamA;
    const top = board[0]!;
    expect(winners).toContain(top.playerId);
    expect(top.pointsFor).toBe(2);
    expect(board.every((r) => r.played === 1)).toBe(true);
  });

  it('advances through a full timed event to completion', () => {
    let s = createEventSession(timeConfig({ totalRounds: 2 }));
    s = addPoint(s, 0, 0);
    s = advanceRound(endRound(s)); // round 2
    expect(s.currentRoundIndex).toBe(1);
    expect(currentRound(s).elapsedSec).toBeUndefined(); // fresh round, timer reset
    s = advanceRound(endRound(s)); // event complete
    expect(isEventComplete(s)).toBe(true);
  });

  it('a timed mexicano re-seeds from the banked standings', () => {
    let s = createEventSession(timeConfig({ format: 'mexicano', totalRounds: 3 }));
    s = setCourtResult(s, 0, 21, 3);
    s = advanceRound(endRound(s));
    expect(s.currentRoundIndex).toBe(1);
    const court = currentRound(s).courts[0]!;
    expect(court.teamA).toHaveLength(2);
    expect(court.teamB).toHaveLength(2);
  });
});

describe('points mode is unaffected by the time additions', () => {
  it('still completes per-court on points when mode is omitted', () => {
    let s = createEventSession(baseConfig({ pointsPerMatch: 4, courts: 1, players: players(4) }));
    for (let i = 0; i < 4; i++) s = addPoint(s, 0, 0);
    expect(isRoundComplete(s)).toBe(true);
    expect(canAdvance(s)).toBe(true);
  });

  it('isRoundComplete matches the legacy points predicate in points mode', () => {
    let s = createEventSession(baseConfig());
    expect(isRoundComplete(s)).toBe(false);
    s = finishRound(s);
    expect(isRoundComplete(s)).toBe(roundIsComplete(currentRound(s), 24));
    expect(isRoundComplete(s)).toBe(true);
  });
});

describe('serialization / resume', () => {
  it('an event round-trips through JSON byte-identically', () => {
    let s = createEventSession(baseConfig());
    s = addPoint(s, 0, 0 as Side);
    const restored = JSON.parse(JSON.stringify(s));
    expect(restored).toEqual(s);
  });
});
