import { describe, expect, it } from 'vitest';
import { asMatchId, asPlayerId, asSessionId, asUserId, makeId } from '../src/index.js';

describe('branded id constructors', () => {
  it('accept non-empty strings', () => {
    expect(asPlayerId('p1')).toBe('p1');
    expect(asMatchId('m1')).toBe('m1');
    expect(asSessionId('s1')).toBe('s1');
    expect(asUserId('u1')).toBe('u1');
  });

  it('reject empty or whitespace strings', () => {
    expect(() => asPlayerId('')).toThrow();
    expect(() => asMatchId('   ')).toThrow();
  });
});

describe('makeId', () => {
  it('prefixes a unique token', () => {
    expect(makeId('match', 'abc')).toBe('match_abc');
  });
  it('rejects an empty token', () => {
    expect(() => makeId('match', '')).toThrow();
  });
});
