import { describe, expect, it } from 'vitest';
import {
  BASE_ELO,
  expectedScore,
  initialRating,
  kFactor,
  marginMultiplier,
  teamElo,
  toDisplayScale,
} from '../src/index.js';

describe('expectedScore', () => {
  it('is 0.5 for equal ratings', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 6);
  });
  it('favours the higher-rated side', () => {
    expect(expectedScore(1400, 1200)).toBeGreaterThan(0.5);
    expect(expectedScore(1000, 1200)).toBeLessThan(0.5);
  });
  it('the two sides sum to 1', () => {
    const a = expectedScore(1350, 1180);
    const b = expectedScore(1180, 1350);
    expect(a + b).toBeCloseTo(1, 6);
  });
});

describe('teamElo', () => {
  it('is the mean of the pair', () => {
    expect(teamElo([initialRating('a', 'doubles'), { ...initialRating('b', 'doubles'), elo: 1400 }])).toBe(1300);
  });
  it('falls back to base for an empty side', () => {
    expect(teamElo([])).toBe(BASE_ELO);
  });
});

describe('kFactor', () => {
  it('starts high and decays to a floor', () => {
    expect(kFactor(0)).toBe(64);
    expect(kFactor(20)).toBe(16);
    expect(kFactor(100)).toBe(16);
  });
  it('is monotonically non-increasing', () => {
    for (let n = 1; n <= 25; n++) expect(kFactor(n)).toBeLessThanOrEqual(kFactor(n - 1));
  });
  it('clamps negative inputs', () => {
    expect(kFactor(-5)).toBe(64);
  });
});

describe('marginMultiplier', () => {
  it('is larger for a blow-out than a squeaker', () => {
    expect(marginMultiplier([6, 0])).toBeGreaterThan(marginMultiplier([6, 5]));
  });
  it('handles a zero-game input without dividing by zero', () => {
    expect(Number.isFinite(marginMultiplier([0, 0]))).toBe(true);
  });
  it('applies the points nudge when provided', () => {
    const withPoints = marginMultiplier([6, 4], [60, 30]);
    const withoutPoints = marginMultiplier([6, 4]);
    expect(withPoints).not.toBe(withoutPoints);
  });
  it('handles zero total points', () => {
    expect(Number.isFinite(marginMultiplier([6, 4], [0, 0]))).toBe(true);
  });
});

describe('toDisplayScale', () => {
  it('maps the base rating to ~3.5', () => {
    expect(toDisplayScale(BASE_ELO)).toBeCloseTo(3.5, 2);
  });
  it('clamps to the 1–7 range', () => {
    expect(toDisplayScale(100)).toBe(1);
    expect(toDisplayScale(9999)).toBe(7);
  });
});
