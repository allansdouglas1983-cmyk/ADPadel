import { describe, expect, it } from 'vitest';
import type { RatingParams } from '../src/index.js';
import { DEFAULT_RATING_PARAMS, formRating, kFactor, expectedScore, initialRating, updateRatings } from '../src/index.js';

describe('formRating (weights recent matches more)', () => {
  it('returns the base rating for an empty history', () => {
    expect(formRating([])).toBe(DEFAULT_RATING_PARAMS.baseElo);
  });

  it('is the value itself for a single match', () => {
    expect(formRating([1300])).toBeCloseTo(1300, 6);
  });

  it('weights the most recent value more than older ones', () => {
    // Oldest→newest: a long low run then a recent spike should pull form up
    // more than a plain average would.
    const values = [1100, 1100, 1100, 1100, 1400];
    const mean = values.reduce((a, b) => a + b, 0) / values.length; // 1180
    expect(formRating(values)).toBeGreaterThan(mean);
  });

  it('a shorter half-life reacts faster to recent form', () => {
    const values = [1100, 1100, 1100, 1100, 1400];
    const fast: RatingParams = { ...DEFAULT_RATING_PARAMS, formHalfLifeMatches: 1 };
    const slow: RatingParams = { ...DEFAULT_RATING_PARAMS, formHalfLifeMatches: 10 };
    expect(formRating(values, fast)).toBeGreaterThan(formRating(values, slow));
  });
});

describe('configurable rating params', () => {
  it('kFactor honours custom initial/floor/decay', () => {
    const params: RatingParams = { ...DEFAULT_RATING_PARAMS, kInitial: 40, kFloor: 10, kDecayMatches: 10 };
    expect(kFactor(0, params)).toBe(40);
    expect(kFactor(10, params)).toBe(10);
    expect(kFactor(100, params)).toBe(10);
  });

  it('expectedScore honours a custom D parameter', () => {
    const narrow: RatingParams = { ...DEFAULT_RATING_PARAMS, dParameter: 200 };
    // A smaller D makes the same gap more decisive.
    expect(expectedScore(1300, 1200, narrow)).toBeGreaterThan(expectedScore(1300, 1200));
  });

  it('updateRatings threads params through (larger K → larger delta)', () => {
    const big: RatingParams = { ...DEFAULT_RATING_PARAMS, kInitial: 128 };
    const base = {
      matchId: 'm',
      discipline: 'doubles' as const,
      sideA: [initialRating('a1', 'doubles'), initialRating('a2', 'doubles')],
      sideB: [initialRating('b1', 'doubles'), initialRating('b2', 'doubles')],
      gamesWon: [6, 3] as [number, number],
      winner: 0 as const,
      atIso: '2026-07-14T00:00:00Z',
    };
    const normal = updateRatings(base).history[0]!.delta;
    const boosted = updateRatings(base, big).history[0]!.delta;
    expect(Math.abs(boosted)).toBeGreaterThan(Math.abs(normal));
  });
});
