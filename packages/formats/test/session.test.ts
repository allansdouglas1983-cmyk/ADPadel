import { describe, expect, it } from 'vitest';
import type { EventSession, EventSessionConfig, Side } from '../src/index.js';
import {
  addPoint,
  advanceRound,
  canAdvance,
  courtIsComplete,
  createEventSession,
  currentRound,
  isEventComplete,
  leaderboard,
  roundIsComplete,
  setCourtResult,
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

describe('serialization / resume', () => {
  it('an event round-trips through JSON byte-identically', () => {
    let s = createEventSession(baseConfig());
    s = addPoint(s, 0, 0 as Side);
    const restored = JSON.parse(JSON.stringify(s));
    expect(restored).toEqual(s);
  });
});
