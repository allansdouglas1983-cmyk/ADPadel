import { describe, expect, it } from 'vitest';
import { padelPresets } from '../src/index.js';
import { gameWins, play } from './helpers.js';

const { padelGoldenPointSuperTB, padelMiniSet } = padelPresets;

describe('games → set', () => {
  it('wins a set 6–0', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('000000'));
    expect(state.sets[0]!.games).toEqual([6, 0]);
    expect(state.sets[0]!.winner).toBe(0);
    expect(state.setsWon).toEqual([1, 0]);
  });

  it('wins a set 6–4', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('0101' + '00' + '00'));
    // 2-2, then 0 wins four: 6-2? recount: '0101'=2-2, '00'=4-2, '00'=6-2
    expect(state.sets[0]!.games).toEqual([6, 2]);
    expect(state.setsWon).toEqual([1, 0]);
  });

  it('wins a set 7–5 (two-game margin required)', () => {
    // 5-5 then side 0 wins two games
    const { state } = play(padelGoldenPointSuperTB, gameWins('0101010101' + '00'));
    expect(state.sets[0]!.games).toEqual([7, 5]);
    expect(state.sets[0]!.winner).toBe(0);
  });

  it('does NOT end the set at 6–5', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('0101010101' + '0'));
    expect(state.sets[0]!.games).toEqual([6, 5]);
    expect(state.sets[0]!.winner).toBeNull();
  });
});

describe('mini-set (first to 4)', () => {
  it('wins 4–0', () => {
    const { state } = play(padelMiniSet, gameWins('0000'));
    expect(state.sets[0]!.games).toEqual([4, 0]);
    expect(state.setsWon).toEqual([1, 0]);
  });

  it('triggers a tiebreak at 4–4', () => {
    const { state } = play(padelMiniSet, gameWins('01010101'));
    expect(state.sets[0]!.isTiebreak).toBe(true);
    expect(state.sets[0]!.games).toEqual([4, 4]);
  });
});
