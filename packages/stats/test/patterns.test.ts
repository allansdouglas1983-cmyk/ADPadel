import { describe, expect, it } from 'vitest';
import type { MatchRecord } from '../src/index.js';
import {
  dayOfWeekPattern,
  isoParts,
  playerStats,
  timeBucketOf,
  timeOfDayPattern,
  weekdayOf,
} from '../src/index.js';

describe('pure date decomposition (timezone-independent)', () => {
  it('reads wall-clock parts straight from the ISO string', () => {
    expect(isoParts('2026-07-14T19:30:00Z')).toEqual({ year: 2026, month: 7, day: 14, hour: 19 });
  });

  it('computes the weekday with Zeller (no Date, no timezone)', () => {
    // 2026-07-14 is a Tuesday; 2026-01-01 is a Thursday.
    expect(weekdayOf('2026-07-14T10:00:00Z')).toBe('Tue');
    expect(weekdayOf('2026-01-01T10:00:00Z')).toBe('Thu');
    // A January date exercises the month<3 branch.
    expect(weekdayOf('2024-02-29T00:00:00Z')).toBe('Thu');
  });

  it('buckets hours into parts of day', () => {
    expect(timeBucketOf(8)).toBe('morning');
    expect(timeBucketOf(14)).toBe('afternoon');
    expect(timeBucketOf(20)).toBe('evening');
    expect(timeBucketOf(2)).toBe('night');
  });

  it('falls back gracefully on a malformed ISO string', () => {
    const parts = isoParts('garbage');
    expect(parts.month).toBe(1);
    expect(parts.day).toBe(1);
    expect(parts.hour).toBe(0);
  });

  it('reads a date-only ISO with no time component', () => {
    expect(isoParts('2026-07-14')).toEqual({ year: 2026, month: 7, day: 14, hour: 0 });
  });
});

const rec = (id: string, iso: string, winner: 0 | 1): MatchRecord => ({
  matchId: id,
  teamA: ['me', 'x'],
  teamB: ['a', 'b'],
  winner,
  gamesWon: winner === 0 ? [6, 3] : [3, 6],
  startedAtIso: iso,
});

describe('timeOfDayPattern', () => {
  it('aggregates win-rate by part of day', () => {
    const records = [
      rec('1', '2026-07-14T20:00:00', 0), // evening win
      rec('2', '2026-07-15T20:30:00', 1), // evening loss
      rec('3', '2026-07-16T09:00:00', 0), // morning win
    ];
    const p = timeOfDayPattern(records, 'me');
    const evening = p.find((b) => b.key === 'evening')!;
    const morning = p.find((b) => b.key === 'morning')!;
    expect(evening.matches).toBe(2);
    expect(evening.winRate).toBe(0.5);
    expect(morning.winRate).toBe(1);
  });

  it('ignores matches the player was not in', () => {
    const records = [
      rec('1', '2026-07-14T20:00:00', 0),
      { ...rec('2', '2026-07-14T20:00:00', 0), teamA: ['x', 'y'], teamB: ['a', 'b'] },
    ];
    const p = timeOfDayPattern(records, 'me');
    expect(p.find((b) => b.key === 'evening')!.matches).toBe(1);
  });
});

describe('dayOfWeekPattern', () => {
  it('aggregates win-rate by weekday', () => {
    const records = [rec('1', '2026-07-14T20:00:00', 0), rec('2', '2026-07-21T20:00:00', 1)]; // both Tuesdays
    const p = dayOfWeekPattern(records, 'me');
    const tue = p.find((b) => b.key === 'Tue')!;
    expect(tue.matches).toBe(2);
    expect(tue.winRate).toBe(0.5);
  });
});

describe('set and points win-rates', () => {
  it('computes set win-rate and points win-rate when present', () => {
    const records: MatchRecord[] = [
      {
        matchId: '1',
        teamA: ['me', 'x'],
        teamB: ['a', 'b'],
        winner: 0,
        gamesWon: [12, 7],
        setsWon: [2, 1],
        pointsWon: [70, 55],
        startedAtIso: '2026-07-14T20:00:00',
      },
    ];
    const s = playerStats(records, 'me');
    expect(s.setWinRate).toBeCloseTo(2 / 3, 5);
    expect(s.pointsWinRate).toBeCloseTo(70 / 125, 5);
  });

  it('points win-rate is null without points data', () => {
    const s = playerStats([rec('1', '2026-07-14T20:00:00', 0)], 'me');
    expect(s.pointsWinRate).toBeNull();
    expect(s.setWinRate).toBe(0); // no sets data → 0/0 → 0
  });
});
