import { describe, expect, it } from 'vitest';
import { nextPowerOfTwo, roundRobinRounds, seedBracket } from '../src/index.js';

describe('roundRobinRounds', () => {
  it('every team plays every other exactly once', () => {
    const teams = ['t1', 't2', 't3', 't4'];
    const rounds = roundRobinRounds(teams);
    const seen = new Set<string>();
    for (const round of rounds) {
      for (const f of round) seen.add([f.teamA, f.teamB].sort().join('-'));
    }
    expect(seen.size).toBe(6); // C(4,2)
    expect(rounds).toHaveLength(3);
  });

  it('handles an odd number of teams with byes', () => {
    const rounds = roundRobinRounds(['t1', 't2', 't3']);
    // 3 teams → 3 rounds, one team rests each round
    expect(rounds).toHaveLength(3);
    for (const round of rounds) expect(round.length).toBeLessThanOrEqual(1);
  });
});

describe('knockout bracket', () => {
  it('rounds up to a power of two', () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(1)).toBe(1);
  });

  it('seeds top vs bottom and byes the empty slots', () => {
    const first = seedBracket(['s1', 's2', 's3', 's4', 's5', 's6']);
    expect(first).toHaveLength(4); // bracket of 8
    // Top seed s1 should face a bye (only 6 of 8 filled → seeds 7,8 empty)
    const s1Match = first.find((m) => m.a === 's1' || m.b === 's1')!;
    expect(s1Match.a === null || s1Match.b === null).toBe(true);
  });
});
