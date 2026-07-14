import { describe, expect, it } from 'vitest';
import { americanoRound, americanoSchedule } from '../src/index.js';

const players = (n: number) => Array.from({ length: n }, (_, i) => `P${i}`);

function allInRound(round: ReturnType<typeof americanoRound>): string[] {
  const playing = round.courts.flatMap((c) => [...c.teamA, ...c.teamB]);
  return [...playing, ...round.sittingOut];
}

describe('americanoRound structure', () => {
  it('places every player exactly once (playing or resting)', () => {
    for (const n of [4, 5, 6, 8, 10, 12]) {
      const courts = Math.floor(n / 4);
      const round = americanoRound(players(n), 0, courts);
      const everyone = allInRound(round).sort();
      expect(everyone).toEqual(players(n).sort());
    }
  });

  it('forms courts of exactly 2v2', () => {
    const round = americanoRound(players(8), 1, 2);
    for (const c of round.courts) {
      expect(c.teamA).toHaveLength(2);
      expect(c.teamB).toHaveLength(2);
    }
    expect(round.courts).toHaveLength(2);
  });

  it('never puts a player on both teams of a court', () => {
    const round = americanoRound(players(8), 3, 2);
    for (const c of round.courts) {
      const both = new Set([...c.teamA, ...c.teamB]);
      expect(both.size).toBe(4);
    }
  });
});

describe('sit-out fairness', () => {
  it('shares rest evenly across a full schedule (counts differ by ≤1)', () => {
    const n = 6; // 1 court, 2 rest each round
    const schedule = americanoSchedule(players(n), 12, 1);
    const restCount = new Map<string, number>();
    for (const round of schedule) {
      for (const p of round.sittingOut) restCount.set(p, (restCount.get(p) ?? 0) + 1);
    }
    const counts = players(n).map((p) => restCount.get(p) ?? 0);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('nobody rests when the count is divisible by four', () => {
    const round = americanoRound(players(8), 5, 2);
    expect(round.sittingOut).toHaveLength(0);
  });
});

describe('partner variety', () => {
  it('a foursome cycles through all three partnerships over three rounds', () => {
    const partners = new Set<string>();
    for (let r = 0; r < 3; r++) {
      const round = americanoRound(players(4), r, 1);
      const c = round.courts[0]!;
      partners.add([...c.teamA].sort().join('-'));
    }
    expect(partners.size).toBe(3);
  });
});
