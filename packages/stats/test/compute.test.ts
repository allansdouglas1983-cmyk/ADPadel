import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../src/index.js';
import { headToHead, partnerChemistry, playerStats, seasonWrapped, venueBreakdown } from '../src/index.js';

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
  });
});
