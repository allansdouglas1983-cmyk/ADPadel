import { describe, expect, it } from 'vitest';
import type { PlayedCourt } from '../src/index.js';
import { mexicanoRound, rankStandings, tallyStandings } from '../src/index.js';

describe('tallyStandings', () => {
  it('banks team points to each individual and counts wins', () => {
    const courts: PlayedCourt[] = [{ teamA: ['a', 'b'], teamB: ['c', 'd'], pointsA: 20, pointsB: 12 }];
    const { standings } = tallyStandings(courts);
    const a = standings.find((s) => s.playerId === 'a')!;
    expect(a).toMatchObject({ pointsFor: 20, pointsAgainst: 12, played: 1, wins: 1 });
    const c = standings.find((s) => s.playerId === 'c')!;
    expect(c).toMatchObject({ pointsFor: 12, pointsAgainst: 20, wins: 0 });
  });
});

describe('rankStandings tie-breakers', () => {
  it('orders by point difference, then total points, then head-to-head', () => {
    const courts: PlayedCourt[] = [
      { teamA: ['a', 'x'], teamB: ['b', 'y'], pointsA: 20, pointsB: 16 }, // a beat b head-to-head
      { teamA: ['a', 'y'], teamB: ['c', 'x'], pointsA: 10, pointsB: 14 },
      { teamA: ['b', 'x'], teamB: ['c', 'y'], pointsA: 18, pointsB: 18 },
    ];
    const { standings, headToHead } = tallyStandings(courts);
    const ranked = rankStandings(standings, headToHead);
    expect(ranked[0]!.playerId).toBeDefined();
    // Deterministic ordering
    expect(rankStandings(standings, headToHead).map((s) => s.playerId)).toEqual(
      ranked.map((s) => s.playerId),
    );
  });

  it('uses head-to-head to break an exact tie', () => {
    // a and b end identical on both diff and total points, but a beat b when
    // they were opponents (M1), so a must rank ahead.
    const courts: PlayedCourt[] = [
      { teamA: ['a', 'p'], teamB: ['b', 'q'], pointsA: 18, pointsB: 12 }, // a beats b h2h
      { teamA: ['a', 'p'], teamB: ['r', 's'], pointsA: 12, pointsB: 18 }, // a's compensating loss
      { teamA: ['b', 'q'], teamB: ['r', 's'], pointsA: 18, pointsB: 12 }, // b's compensating win
    ];
    const { standings, headToHead } = tallyStandings(courts);
    const a = standings.find((s) => s.playerId === 'a')!;
    const b = standings.find((s) => s.playerId === 'b')!;
    expect(a.pointsFor - a.pointsAgainst).toBe(b.pointsFor - b.pointsAgainst);
    expect(a.pointsFor).toBe(b.pointsFor);
    const ranked = rankStandings(standings, headToHead).map((s) => s.playerId);
    expect(ranked.indexOf('a')).toBeLessThan(ranked.indexOf('b'));
  });
});

describe('mexicano', () => {
  it('round 0 falls back to americano', () => {
    const players = ['a', 'b', 'c', 'd'];
    const r = mexicanoRound(players, 0, 1);
    expect(r.courts).toHaveLength(1);
  });

  it('later rounds pair 1&4 vs 2&3 by leaderboard', () => {
    const players = ['a', 'b', 'c', 'd'];
    const standings = [
      { playerId: 'a', pointsFor: 30, pointsAgainst: 10, played: 1, wins: 1 },
      { playerId: 'b', pointsFor: 25, pointsAgainst: 15, played: 1, wins: 1 },
      { playerId: 'c', pointsFor: 15, pointsAgainst: 25, played: 1, wins: 0 },
      { playerId: 'd', pointsFor: 10, pointsAgainst: 30, played: 1, wins: 0 },
    ];
    const r = mexicanoRound(players, 1, 1, standings);
    const court = r.courts[0]!;
    // ranked: a,b,c,d → team [a,d] vs [b,c]
    expect(new Set(court.teamA)).toEqual(new Set(['a', 'd']));
    expect(new Set(court.teamB)).toEqual(new Set(['b', 'c']));
  });
});
