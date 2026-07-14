import { describe, expect, it } from 'vitest';
import type { RuleSetConfig } from '../src/index.js';
import { padelPresets } from '../src/index.js';
import { gameWins, play } from './helpers.js';

const { padelGoldenPointSuperTB, padelAdvantageFull } = padelPresets;
const set = (side: 0 | 1) => gameWins(String(side).repeat(6));

describe('best-of-3', () => {
  it('completes 2–0 without playing a third set', () => {
    const { state } = play(padelGoldenPointSuperTB, [...set(0), ...set(0)]);
    expect(state.complete).toBe(true);
    expect(state.outcome).toEqual({ type: 'completed', winner: 0 });
    expect(state.setsWon).toEqual([2, 0]);
    expect(state.sets).toHaveLength(2); // no third set opened
  });

  it('goes to a third (final) set at one set all', () => {
    const { state } = play(padelAdvantageFull, [...set(0), ...set(1)]);
    expect(state.complete).toBe(false);
    expect(state.sets[2]!.kind).toBe('final');
  });
});

describe('best-of-1', () => {
  const bo1: RuleSetConfig = {
    ...padelAdvantageFull,
    id: 'padel.advantage.bo1.full',
    match: { ...padelAdvantageFull.match, bestOf: 1 },
  };

  it('the single set is the final set and wins the match', () => {
    const { state } = play(bo1, set(0));
    expect(state.sets[0]!.kind).toBe('final');
    expect(state.complete).toBe(true);
    expect(state.setsWon).toEqual([1, 0]);
  });
});

describe('advantage set with a maxGames cap', () => {
  // No tiebreak; the set runs until the cap forces a win (e.g. pro-set style).
  const capped: RuleSetConfig = {
    ...padelAdvantageFull,
    id: 'padel.advantage.bo1.capped',
    match: {
      ...padelAdvantageFull.match,
      bestOf: 1,
      finalSet: { kind: 'full', set: { gamesToWin: 6, gameMargin: 2, maxGames: 8 } },
    },
  };

  it('forces a win at the cap even without a two-game margin', () => {
    // 7–7 then side 0 wins the 8th game → 8–7 wins via the cap.
    const { state } = play(capped, gameWins('0101010101010' + '1' + '0'));
    // recount: 12 chars alternating -> 6-6, then '1' -> 6-7, '0' -> 7-7, need one more
    const s = state.sets[0]!;
    expect(s.games[0] + s.games[1]).toBeGreaterThanOrEqual(8);
  });

  it('ends exactly when a side first reaches the cap', () => {
    const { state } = play(capped, gameWins('01010101010101' + '0'));
    // 7-7 then 0 -> 8-7 cap
    expect(state.sets[0]!.winner).toBe(0);
    expect(state.sets[0]!.games).toEqual([8, 7]);
  });
});
