import { describe, expect, it } from 'vitest';
import { padelPresets } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const { padelGoldenPointSuperTB } = padelPresets;

/** Win one full set for `side` (6–0) to reach one-set-all quickly. */
const set60 = (side: 0 | 1) => gameWins(String(side).repeat(6));

describe('super-tiebreak final set (to 10)', () => {
  it('the deciding set starts directly in a tiebreak', () => {
    const { state } = play(padelGoldenPointSuperTB, [...set60(0), ...set60(1)]);
    expect(state.setsWon).toEqual([1, 1]);
    expect(state.currentSetIndex).toBe(2);
    expect(state.sets[2]!.kind).toBe('final');
    expect(state.sets[2]!.isTiebreak).toBe(true);
  });

  it('wins the match on a 10–8 super-tiebreak', () => {
    const actions = [...set60(0), ...set60(1), ...pts(0, 8), ...pts(1, 8), ...pts(0, 2)];
    const { state } = play(padelGoldenPointSuperTB, actions);
    expect(state.complete).toBe(true);
    expect(state.outcome).toEqual({ type: 'completed', winner: 0 });
    expect(state.sets[2]!.tiebreak!.points).toEqual([10, 8]);
  });

  it('10–9 does not win; 12–10 does', () => {
    const base = [...set60(0), ...set60(1), ...pts(0, 9), ...pts(1, 9)]; // 9–9
    let { state } = play(padelGoldenPointSuperTB, [...base, ...pts(0, 1)]); // 10–9
    expect(state.complete).toBe(false);
    ({ state } = play(padelGoldenPointSuperTB, [...base, ...pts(0, 1), ...pts(1, 1), ...pts(0, 2)])); // 12–10
    expect(state.complete).toBe(true);
    expect(state.sets[2]!.tiebreak!.points).toEqual([12, 10]);
  });
});
