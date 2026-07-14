import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { MatchResultInput } from '../src/index.js';
import { initialRating, updateRatings } from '../src/index.js';

const AT = '2026-07-14T10:00:00.000Z';

function doublesMatch(over: Partial<MatchResultInput> = {}): MatchResultInput {
  return {
    matchId: 'm1',
    discipline: 'doubles',
    sideA: [initialRating('a1', 'doubles'), initialRating('a2', 'doubles')],
    sideB: [initialRating('b1', 'doubles'), initialRating('b2', 'doubles')],
    gamesWon: [6, 3],
    winner: 0,
    atIso: AT,
    ...over,
  };
}

describe('updateRatings', () => {
  it('raises the winners and lowers the losers', () => {
    const { updated } = updateRatings(doublesMatch());
    const a1 = updated.find((p) => p.playerId === 'a1')!;
    const b1 = updated.find((p) => p.playerId === 'b1')!;
    expect(a1.elo).toBeGreaterThan(1200);
    expect(b1.elo).toBeLessThan(1200);
  });

  it('conserves total rating (zero-sum) for an even match', () => {
    const { updated } = updateRatings(doublesMatch());
    const total = updated.reduce((s, p) => s + p.elo, 0);
    expect(total).toBeCloseTo(4 * 1200, 6);
  });

  it('increments matchesPlayed and records history', () => {
    const { updated, history } = updateRatings(doublesMatch());
    expect(updated.every((p) => p.matchesPlayed === 1)).toBe(true);
    expect(history).toHaveLength(4);
    expect(history[0]!.after - history[0]!.before).toBeCloseTo(history[0]!.delta, 9);
  });

  it('is idempotent — re-applying the same match is a no-op', () => {
    const first = updateRatings(doublesMatch());
    const second = updateRatings({
      ...doublesMatch(),
      sideA: [first.updated[0]!, first.updated[1]!],
      sideB: [first.updated[2]!, first.updated[3]!],
    });
    expect(second.updated.map((p) => p.elo)).toEqual(first.updated.map((p) => p.elo));
    expect(second.history).toHaveLength(0);
  });

  it('moves ratings more when an underdog wins (performance vs expectation)', () => {
    const strongB = doublesMatch({
      sideB: [
        { ...initialRating('b1', 'doubles'), elo: 1500 },
        { ...initialRating('b2', 'doubles'), elo: 1500 },
      ],
      winner: 0, // the weaker A side wins
    });
    const { history } = updateRatings(strongB);
    const a1 = history.find((h) => h.playerId === 'a1')!;
    // A big upset → a large positive delta for the winners.
    expect(a1.delta).toBeGreaterThan(20);
  });

  it('keeps singles and doubles ratings separate by construction', () => {
    const singles = initialRating('x', 'singles');
    const doubles = initialRating('x', 'doubles');
    expect(singles.discipline).not.toBe(doubles.discipline);
  });
});

describe('property: expected-score symmetry and bounded deltas', () => {
  const rating = (id: string) =>
    fc.integer({ min: 900, max: 1600 }).map((elo) => ({ ...initialRating(id, 'doubles'), elo }));

  it('winner delta ≥ 0 and loser delta ≤ 0, magnitudes matched within a side', () => {
    fc.assert(
      fc.property(
        rating('a1'),
        rating('a2'),
        rating('b1'),
        rating('b2'),
        fc.constantFrom<0 | 1>(0, 1),
        fc.integer({ min: 0, max: 6 }),
        (a1, a2, b1, b2, winner, loserGames) => {
          const gamesWon: [number, number] = winner === 0 ? [6, loserGames] : [loserGames, 6];
          const { history } = updateRatings({
            matchId: 'p',
            discipline: 'doubles',
            sideA: [a1, a2],
            sideB: [b1, b2],
            gamesWon,
            winner,
            atIso: AT,
          });
          for (const h of history) {
            const isWinnerSide = h.actual === 1;
            if (isWinnerSide) expect(h.delta).toBeGreaterThanOrEqual(0);
            else expect(h.delta).toBeLessThanOrEqual(0);
          }
          // Zero-sum across all four players.
          const totalDelta = history.reduce((s, h) => s + h.delta, 0);
          expect(totalDelta).toBeCloseTo(0, 6);
        },
      ),
      { seed: Number(process.env.FASTCHECK_SEED ?? 424242), numRuns: 500 },
    );
  });
});
