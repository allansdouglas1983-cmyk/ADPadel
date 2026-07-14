import { describe, expect, it } from 'vitest';
import type { PointConfig, TiebreakConfig } from '../src/index.js';
import { deciderThreshold, resolveGamePoint, tiebreakWinner } from '../src/index.js';

describe('deciderThreshold', () => {
  const base = { ladder: ['0', '15', '30', '40'], winAtIndex: 4, pointMargin: 2 } as const;

  it('advantage never enters a decider', () => {
    expect(deciderThreshold({ ...base, deuce: 'advantage' })).toBe(Number.POSITIVE_INFINITY);
  });

  it('golden enters a decider at the first deuce', () => {
    expect(deciderThreshold({ ...base, deuce: 'golden' })).toBe(3);
  });

  it('star defaults a missing starMaxAdvantages to 0', () => {
    // Missing starMaxAdvantages → behaves like golden (decider at first deuce).
    const cfg: PointConfig = { ...base, deuce: 'star' };
    expect(deciderThreshold(cfg)).toBe(3);
  });

  it('star with 2 advantages defers the decider', () => {
    expect(deciderThreshold({ ...base, deuce: 'star', starMaxAdvantages: 2 })).toBe(5);
  });
});

describe('resolveGamePoint edge cases', () => {
  const golden: PointConfig = { ladder: ['0', '15', '30', '40'], winAtIndex: 4, pointMargin: 2, deuce: 'golden' };
  it('no winner before enough points', () => {
    expect(resolveGamePoint([2, 1], golden)).toBeNull();
  });
  it('side 1 can win', () => {
    expect(resolveGamePoint([1, 4], golden)).toBe(1);
  });
});

describe('tiebreakWinner', () => {
  const tb: TiebreakConfig = { targetPoints: 7, pointMargin: 2, firstServerPoints: 1, serveEvery: 2, changeEndsEvery: 6 };
  it('side 0 wins', () => expect(tiebreakWinner([7, 5], tb)).toBe(0));
  it('side 1 wins', () => expect(tiebreakWinner([5, 7], tb)).toBe(1));
  it('no winner without margin', () => expect(tiebreakWinner([7, 6], tb)).toBeNull());
});
