import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../src/index.js';
import { archetypeFor, partnerChemistry, playerStats } from '../src/index.js';

describe('teamB-side player', () => {
  const recs: MatchRecord[] = [
    { matchId: '1', teamA: ['a', 'b'], teamB: ['me', 'p'], winner: 1, gamesWon: [4, 6], startedAtIso: '2026-01-01' },
    { matchId: '2', teamA: ['a', 'b'], teamB: ['me', 'p'], winner: 0, gamesWon: [6, 1], startedAtIso: '2026-01-02' },
  ];
  it('computes stats when the player is on side B', () => {
    const s = playerStats(recs, 'me');
    expect(s.matches).toBe(2);
    expect(s.wins).toBe(1);
    expect(s.gamesWon).toBe(6 + 1); // side 1 games
  });
  it('resolves the partner on side B', () => {
    const chem = partnerChemistry(recs, 'me');
    expect(chem[0]!.partnerId).toBe('p');
  });
});

describe('singles record (no partner)', () => {
  const recs: MatchRecord[] = [
    { matchId: 's', teamA: ['me'], teamB: ['opp'], winner: 0, gamesWon: [6, 3], startedAtIso: '2026-03-01' },
  ];
  it('produces no partner chemistry', () => {
    expect(partnerChemistry(recs, 'me')).toHaveLength(0);
  });
  it('still counts the win', () => {
    expect(playerStats(recs, 'me').wins).toBe(1);
  });
});

describe('losing streak sign', () => {
  const recs: MatchRecord[] = [
    { matchId: '1', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 0, gamesWon: [6, 0], startedAtIso: '2026-01-01' },
    { matchId: '2', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 1, gamesWon: [0, 6], startedAtIso: '2026-01-02' },
    { matchId: '3', teamA: ['me', 'x'], teamB: ['a', 'b'], winner: 1, gamesWon: [2, 6], startedAtIso: '2026-01-03' },
  ];
  it('reports a negative current streak on a losing run', () => {
    expect(playerStats(recs, 'me').currentStreak).toBe(-2);
  });
});

describe('archetypeFor covers every branch', () => {
  it('golden-point closer', () => expect(archetypeFor(0.5, 0.7, 0)).toBe('The Golden-Point Closer'));
  it('comeback kid', () => expect(archetypeFor(0.5, 0.2, 3)).toBe('The Comeback Kid'));
  it('metronome', () => expect(archetypeFor(0.7, 0.2, 0)).toBe('The Metronome'));
  it('grinder', () => expect(archetypeFor(0.3, null, 0)).toBe('The Grinder'));
  it('all-rounder', () => expect(archetypeFor(0.5, null, 0)).toBe('The All-Rounder'));
});
