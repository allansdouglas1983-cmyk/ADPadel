import { describe, expect, it } from 'vitest';
import type { RuleSetConfig } from '../src/index.js';
import { padelPresets } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const { padelGoldenPointSuperTB } = padelPresets;
const set = (side: 0 | 1) => gameWins(String(side).repeat(6));

describe('playOutAfterMatchPoint = false (default)', () => {
  it('freezes the match at match point — extra points are ignored', () => {
    const finish = [...set(0), ...set(0)];
    const { state: frozen } = play(padelGoldenPointSuperTB, finish);
    const { state: pushed } = play(padelGoldenPointSuperTB, [...finish, ...pts(1, 5)]);
    expect(pushed.complete).toBe(true);
    expect(pushed.outcome).toEqual({ type: 'completed', winner: 0 });
    // State is unchanged apart from the seq counter advancing.
    expect({ ...pushed, seq: 0 }).toEqual({ ...frozen, seq: 0 });
  });
});

describe('playOutAfterMatchPoint = true', () => {
  const playOut: RuleSetConfig = {
    ...padelGoldenPointSuperTB,
    id: 'padel.golden.bo3.superTB.playout',
    match: { ...padelGoldenPointSuperTB.match, playOutAfterMatchPoint: true },
  };

  it('keeps the winner stable while still accepting points', () => {
    const finish = [...set(0), ...set(0)];
    const { state } = play(playOut, [...finish, ...pts(1, 3)]);
    expect(state.complete).toBe(true);
    expect(state.outcome).toEqual({ type: 'completed', winner: 0 });
    // The extra points were accepted (recorded), unlike the frozen case.
    const { state: frozenLike } = play(playOut, finish);
    expect(state.seq).toBeGreaterThan(frozenLike.seq);
  });
});
