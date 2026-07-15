import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../src/index.js';
import {
  biggestComeback,
  formLastN,
  headToHead,
  partnerChemistry,
  playerStats,
  seasonWrapped,
  venueBreakdown,
} from '../src/index.js';

const m = (over: Partial<MatchRecord> & Pick<MatchRecord, 'matchId' | 'teamA' | 'teamB' | 'winner' | 'startedAtIso'>): MatchRecord => ({
  gamesWon: [6, 3],
  ...over,
});

// A small season for player 'me'.
const season: MatchRecord[] = [
  m({ matchId: '1', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, gamesWon: [6, 2], startedAtIso: '2026-01-01', venue: 'Club A' }),
  m({ matchId: '2', teamA: ['me', 'al'], teamB: ['x', 'z'], winner: 0, gamesWon: [6, 4], startedAtIso: '2026-01-02', venue: 'Club A' }),
  m({ matchId: '3', teamA: ['me', 'bo'], teamB: ['x', 'y'], winner: 1, gamesWon: [3, 6], startedAtIso: '2026-01-03', venue: 'Club B', wasComeback: false }),
  m({ matchId: '4', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, gamesWon: [7, 5], startedAtIso: '2026-01-04', venue: 'Club A', wasComeback: true }),
];

describe('playerStats', () => {
  const s = playerStats(season, 'me');
  it('counts matches, wins, losses and win-rate', () => {
    expect(s.matches).toBe(4);
    expect(s.wins).toBe(3);
    expect(s.losses).toBe(1);
    expect(s.winRate).toBeCloseTo(0.75, 5);
  });
  it('tracks the current streak (recent-first)', () => {
    // last match (4) was a win, preceded by a loss (3) → streak +1
    expect(s.currentStreak).toBe(1);
  });
  it('tracks the longest win streak', () => {
    expect(s.longestWinStreak).toBe(2); // matches 1 & 2
  });
  it('computes game win-rate', () => {
    // won 6+6+3+7 = 22, lost 2+4+6+5 = 17
    expect(s.gameWinRate).toBeCloseTo(22 / 39, 5);
  });
  it('counts comebacks', () => {
    expect(s.comebacks).toBe(1);
  });
  it('form is recent-first', () => {
    expect(s.form).toEqual(['W', 'L', 'W', 'W']);
  });
  it('service/decider rates are null without per-point data', () => {
    expect(s.serviceHoldRate).toBeNull();
    expect(s.deciderWinRate).toBeNull();
  });
});

describe('service and decider rates with data', () => {
  const withData: MatchRecord[] = [
    m({
      matchId: 's1',
      teamA: ['me', 'al'],
      teamB: ['x', 'y'],
      winner: 0,
      startedAtIso: '2026-02-01',
      serviceWon: { me: [8, 10] },
      deciderWon: { me: [2, 3] },
    }),
  ];
  it('computes hold and decider rates', () => {
    const s = playerStats(withData, 'me');
    expect(s.serviceHoldRate).toBeCloseTo(0.8, 5);
    expect(s.deciderWinRate).toBeCloseTo(2 / 3, 5);
  });
});

describe('formLastN', () => {
  // season form is recent-first: ['W', 'L', 'W', 'W'] (matches 4,3,2,1).
  it('caps the form at the last N matches, recent-first', () => {
    expect(formLastN(season, 'me', 2)).toEqual(['W', 'L']);
    expect(formLastN(season, 'me', 3)).toEqual(['W', 'L', 'W']);
  });
  it('returns the full recent-first history when N exceeds it', () => {
    expect(formLastN(season, 'me', 99)).toEqual(['W', 'L', 'W', 'W']);
    expect(formLastN(season, 'me', 99)).toEqual(playerStats(season, 'me').form);
  });
  it('returns an empty array for N <= 0', () => {
    expect(formLastN(season, 'me', 0)).toEqual([]);
    expect(formLastN(season, 'me', -3)).toEqual([]);
  });
  it('is empty for a player with no matches', () => {
    expect(formLastN(season, 'nobody', 5)).toEqual([]);
  });
  it('reads form correctly for a side-B player', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'b1', teamA: ['a', 'b'], teamB: ['me', 'p'], winner: 0, startedAtIso: '2026-05-01' }),
      m({ matchId: 'b2', teamA: ['a', 'b'], teamB: ['me', 'p'], winner: 1, startedAtIso: '2026-05-02' }),
    ];
    expect(formLastN(recs, 'me', 5)).toEqual(['W', 'L']);
  });
});

describe('biggestComeback', () => {
  it('picks the winning comeback with the largest deficit', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'c1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-01', wasComeback: true, comebackDeficit: 3 }),
      m({ matchId: 'c2', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-02', wasComeback: true, comebackDeficit: 5 }),
      m({ matchId: 'c3', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-03', wasComeback: true, comebackDeficit: 2 }),
    ];
    expect(biggestComeback(recs, 'me')).toEqual({ matchId: 'c2', deficit: 5 });
  });
  it('ignores comeback deficits from matches the player lost', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'l1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 1, startedAtIso: '2026-01-01', wasComeback: true, comebackDeficit: 9 }),
      m({ matchId: 'w1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-02', comebackDeficit: 4 }),
    ];
    expect(biggestComeback(recs, 'me')).toEqual({ matchId: 'w1', deficit: 4 });
  });
  it('treats a wasComeback win without a logged magnitude as deficit 0', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'u1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-01', wasComeback: true }),
    ];
    expect(biggestComeback(recs, 'me')).toEqual({ matchId: 'u1', deficit: 0 });
  });
  it('keeps the earliest match on a deficit tie', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'e1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-01', comebackDeficit: 4 }),
      m({ matchId: 'e2', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-02', comebackDeficit: 4 }),
    ];
    expect(biggestComeback(recs, 'me')).toEqual({ matchId: 'e1', deficit: 4 });
  });
  it('returns null when there are no comeback wins', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'n1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, startedAtIso: '2026-01-01' }),
    ];
    expect(biggestComeback(recs, 'me')).toBeNull();
    expect(biggestComeback([], 'me')).toBeNull();
  });
});

describe('partnerChemistry', () => {
  it('ranks partners by win-rate', () => {
    const chem = partnerChemistry(season, 'me');
    const al = chem.find((c) => c.partnerId === 'al')!;
    const bo = chem.find((c) => c.partnerId === 'bo')!;
    expect(al.winRate).toBe(1); // 3-0 with al
    expect(bo.winRate).toBe(0); // 0-1 with bo
    expect(chem[0]!.partnerId).toBe('al');
  });
});

describe('headToHead', () => {
  it('aggregates records against each opponent', () => {
    const h2h = headToHead(season, 'me');
    const x = h2h.find((o) => o.opponentId === 'x')!;
    expect(x.matches).toBe(4); // x appears in all four
    expect(x.wins).toBe(3);
  });
});

describe('venueBreakdown', () => {
  it('splits results by venue', () => {
    const v = venueBreakdown(season, 'me');
    const clubA = v.find((x) => x.venue === 'Club A')!;
    expect(clubA.matches).toBe(3);
    expect(clubA.winRate).toBe(1);
  });
});

describe('seasonWrapped', () => {
  it('summarises the season with an archetype', () => {
    const w = seasonWrapped(season, 'me');
    expect(w.totalMatches).toBe(4);
    expect(w.favouritePartner?.partnerId).toBe('al');
    expect(w.mostPlayedVenue).toBe('Club A');
    expect(typeof w.archetype).toBe('string');
  });
  it('handles an empty season gracefully', () => {
    const w = seasonWrapped([], 'nobody');
    expect(w.totalMatches).toBe(0);
    expect(w.favouritePartner).toBeNull();
    expect(w.toughestOpponent).toBeNull();
    expect(w.mostPlayedVenue).toBeNull();
    expect(w.hoursOnCourt).toBe(0);
  });

  it('sums hours on court and decider points from records', () => {
    const withMeta: MatchRecord[] = [
      m({ matchId: 'h1', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, startedAtIso: '2026-01-01', durationSec: 3600, deciderWon: { me: [2, 3] } }),
      m({ matchId: 'h2', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, startedAtIso: '2026-01-02', durationSec: 1800, deciderWon: { me: [1, 2] } }),
    ];
    const w = seasonWrapped(withMeta, 'me');
    expect(w.hoursOnCourt).toBe(1.5);
    expect(w.deciderPointsWon).toBe(3);
  });

  it('carries the supplied rating journey verbatim', () => {
    const journey = [1500, 1512, 1498, 1530];
    const w = seasonWrapped(season, 'me', { ratingHistory: journey });
    expect(w.ratingJourney).toEqual(journey);
    // Defensive copy: mutating the source must not affect the summary.
    journey.push(9999);
    expect(w.ratingJourney).toEqual([1500, 1512, 1498, 1530]);
  });

  it('defaults the rating journey to an empty array when none is given', () => {
    expect(seasonWrapped(season, 'me').ratingJourney).toEqual([]);
    expect(seasonWrapped([], 'nobody').ratingJourney).toEqual([]);
  });

  it('surfaces the single biggest comeback of the season', () => {
    const recs: MatchRecord[] = [
      m({ matchId: 'g1', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, startedAtIso: '2026-01-01', wasComeback: true, comebackDeficit: 2 }),
      m({ matchId: 'g2', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, startedAtIso: '2026-01-02', wasComeback: true, comebackDeficit: 6 }),
    ];
    const w = seasonWrapped(recs, 'me');
    expect(w.biggestComeback).toEqual({ matchId: 'g2', deficit: 6 });
  });

  it('reports a null biggest comeback when there are none', () => {
    const noComebacks: MatchRecord[] = [
      m({ matchId: 'p1', teamA: ['me', 'al'], teamB: ['x', 'y'], winner: 0, startedAtIso: '2026-01-01' }),
    ];
    expect(seasonWrapped(noComebacks, 'me').biggestComeback).toBeNull();
    expect(seasonWrapped([], 'nobody').biggestComeback).toBeNull();
  });
});
