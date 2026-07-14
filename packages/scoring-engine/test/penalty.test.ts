import { describe, expect, it } from 'vitest';
import type { Action } from '../src/index.js';
import { padelPresets } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const { padelGoldenPointSuperTB } = padelPresets;

describe('PENALTY point', () => {
  it('awards a point to the opponent of the penalised side', () => {
    // Penalise side 1 → side 0 gains a point.
    const { state } = play(padelGoldenPointSuperTB, [{ type: 'PENALTY', side: 1, unit: 'point' }]);
    expect(state.currentGame.points).toEqual([1, 0]);
  });

  it('can convert a game via a point penalty at game point', () => {
    // Side 0 at 40–0, penalise side 1 → side 0 wins the game.
    const actions: Action[] = [...pts(0, 3), { type: 'PENALTY', side: 1, unit: 'point' }];
    const { state } = play(padelGoldenPointSuperTB, actions);
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });
});

describe('PENALTY game', () => {
  it('awards a whole game to the opponent', () => {
    const { state } = play(padelGoldenPointSuperTB, [{ type: 'PENALTY', side: 1, unit: 'game' }]);
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('can convert a set via a game penalty at set point', () => {
    // Side 0 leads 5–0, penalise side 1 for a game → 6–0 set.
    const { state } = play(padelGoldenPointSuperTB, [
      ...gameWins('00000'),
      { type: 'PENALTY', side: 1, unit: 'game' },
    ]);
    expect(state.sets[0]!.winner).toBe(0);
    expect(state.setsWon).toEqual([1, 0]);
  });

  it('degrades a game penalty to a point during a tiebreak', () => {
    const { state } = play(padelGoldenPointSuperTB, [
      ...gameWins('010101010101'), // 6–6 tiebreak
      { type: 'PENALTY', side: 1, unit: 'game' },
    ]);
    expect(state.sets[0]!.tiebreak!.points).toEqual([1, 0]);
  });
});
