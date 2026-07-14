import { describe, expect, it } from 'vitest';
import type { EventSessionConfig } from '../src/index.js';
import {
  createEventSession,
  createKingOfCourt,
  currentRound,
  kingScore,
  kingStandings,
  mixedAmericanoRound,
  teamAmericanoRound,
} from '../src/index.js';

describe('teamAmericanoRound', () => {
  const pairs: [string, string][] = [
    ['a1', 'a2'],
    ['b1', 'b2'],
    ['c1', 'c2'],
    ['d1', 'd2'],
  ];

  it('keeps partnerships fixed and schedules pair vs pair', () => {
    const round = teamAmericanoRound(pairs, 0, 2);
    expect(round.courts).toHaveLength(2);
    // Every court is one whole pair vs another whole pair.
    for (const c of round.courts) {
      const isAPair = pairs.some((p) => p[0] === c.teamA[0] && p[1] === c.teamA[1]);
      expect(isAPair).toBe(true);
    }
  });

  it('rotates the round-robin so pairings change across rounds', () => {
    const r0 = teamAmericanoRound(pairs, 0, 1).courts[0]!;
    const r1 = teamAmericanoRound(pairs, 1, 1).courts[0]!;
    expect([r0.teamA, r0.teamB]).not.toEqual([r1.teamA, r1.teamB]);
  });

  it('every team plays every other over the full schedule', () => {
    const seen = new Set<string>();
    for (let r = 0; r < 3; r++) {
      const round = teamAmericanoRound(pairs, r, 2);
      for (const c of round.courts) seen.add([c.teamA[0], c.teamB[0]].sort().join('|'));
    }
    expect(seen.size).toBe(6); // C(4,2)
  });
});

describe('mixedAmericanoRound', () => {
  const men = ['m1', 'm2', 'm3', 'm4'];
  const women = ['w1', 'w2', 'w3', 'w4'];

  it('forms every team as one man + one woman', () => {
    const round = mixedAmericanoRound(men, women, 1, 2);
    for (const c of round.courts) {
      for (const team of [c.teamA, c.teamB]) {
        const menCount = team.filter((p) => p.startsWith('m')).length;
        const womenCount = team.filter((p) => p.startsWith('w')).length;
        expect(menCount).toBe(1);
        expect(womenCount).toBe(1);
      }
    }
  });

  it('varies partnerships across rounds', () => {
    const r0 = mixedAmericanoRound(men, women, 0, 2);
    const r1 = mixedAmericanoRound(men, women, 1, 2);
    expect(JSON.stringify(r0.courts)).not.toEqual(JSON.stringify(r1.courts));
  });
});

describe('EventSession with team & mixed formats', () => {
  it('drives a teamAmericano through the session orchestrator', () => {
    const config: EventSessionConfig = {
      format: 'teamAmericano',
      players: ['a1', 'a2', 'b1', 'b2'],
      pairs: [['a1', 'a2'], ['b1', 'b2']],
      courts: 1,
      pointsPerMatch: 24,
      totalRounds: 1,
    };
    const s = createEventSession(config);
    expect(currentRound(s).courts).toHaveLength(1);
  });

  it('drives a mixedAmericano through the orchestrator', () => {
    const config: EventSessionConfig = {
      format: 'mixedAmericano',
      players: ['m1', 'w1', 'm2', 'w2'],
      men: ['m1', 'm2'],
      women: ['w1', 'w2'],
      courts: 1,
      pointsPerMatch: 24,
      totalRounds: 2,
    };
    const s = createEventSession(config);
    const court = currentRound(s).courts[0]!;
    expect(court.teamA).toHaveLength(2);
  });
});

describe('King of the Court', () => {
  const pairs: [string, string][] = [
    ['a1', 'a2'],
    ['b1', 'b2'],
    ['c1', 'c2'],
  ];

  it('seats two pairs and queues the rest', () => {
    const s = createKingOfCourt(pairs, 1, 24);
    expect(s.courts[0]!.a).not.toBeNull();
    expect(s.courts[0]!.b).not.toBeNull();
    expect(s.queue).toHaveLength(1);
  });

  it('keeps the winner on and rotates the loser to the queue', () => {
    let s = createKingOfCourt(pairs, 1, 4);
    const winnerPair = s.courts[0]!.a!;
    const loserPair = s.courts[0]!.b!;
    const challenger = s.queue[0]!;
    // Team A wins 4-0.
    for (let i = 0; i < 4; i++) s = kingScore(s, 0, 0);
    expect(s.courts[0]!.a).toEqual(winnerPair); // winner stays
    expect(s.courts[0]!.b).toEqual(challenger); // challenger comes on
    expect(s.queue[s.queue.length - 1]).toEqual(loserPair); // loser to the back
    expect(s.history).toHaveLength(1);
  });

  it('produces a leaderboard from match history', () => {
    let s = createKingOfCourt(pairs, 1, 4);
    for (let i = 0; i < 4; i++) s = kingScore(s, 0, 0);
    const board = kingStandings(s);
    expect(board.length).toBeGreaterThan(0);
    expect(board[0]!.pointsFor).toBeGreaterThanOrEqual(0);
  });

  it('replays the two pairs when the queue is empty', () => {
    let s = createKingOfCourt([['a1', 'a2'], ['b1', 'b2']], 1, 4); // no queue
    for (let i = 0; i < 4; i++) s = kingScore(s, 0, 0);
    expect(s.courts[0]!.a).not.toBeNull();
    expect(s.courts[0]!.b).not.toBeNull();
    expect(s.courts[0]!.pointsA).toBe(0); // reset for the rematch
  });

  it('handles team B winning (challenger becomes the new king)', () => {
    let s = createKingOfCourt(pairs, 1, 4);
    const bPair = s.courts[0]!.b!;
    for (let i = 0; i < 4; i++) s = kingScore(s, 0, 1); // B wins 4-0
    expect(s.courts[0]!.a).toEqual(bPair); // winner (was B) now sits in slot A
  });

  it('is a no-op on an unfilled court or a bad index', () => {
    const s = createKingOfCourt([['a1', 'a2']], 1, 4); // only pair A, slot B empty
    expect(kingScore(s, 0, 0)).toBe(s); // court has no B → no-op
    expect(kingScore(s, 9, 0)).toBe(s); // out-of-range → no-op
  });
});
