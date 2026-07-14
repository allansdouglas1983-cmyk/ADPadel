import { describe, expect, it } from 'vitest';
import { padelPresets } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const { padelGoldenPointSuperTB } = padelPresets;

describe('RETIRE / walkover', () => {
  it('records the opponent as winner and preserves partial score', () => {
    const { state } = play(padelGoldenPointSuperTB, [
      ...gameWins('000'), // 3–0
      ...pts(0, 2), // 30–0 in game 4
      { type: 'RETIRE', side: 1 },
    ]);
    expect(state.complete).toBe(true);
    expect(state.outcome).toEqual({ type: 'retired', winner: 0, retiree: 1 });
    expect(state.sets[0]!.games).toEqual([3, 0]);
    expect(state.currentGame.points).toEqual([2, 0]); // partial game preserved
  });

  it('ignores further scoring after retirement', () => {
    const { state } = play(padelGoldenPointSuperTB, [
      { type: 'RETIRE', side: 1 },
      ...pts(0, 4),
    ]);
    expect(state.sets[0]!.games).toEqual([0, 0]);
    expect(state.outcome.type).toBe('retired');
  });

  it('a second retire is a no-op once the match is over', () => {
    const { state } = play(padelGoldenPointSuperTB, [
      { type: 'RETIRE', side: 1 },
      { type: 'RETIRE', side: 0 },
    ]);
    expect(state.outcome).toEqual({ type: 'retired', winner: 0, retiree: 1 });
  });
});
