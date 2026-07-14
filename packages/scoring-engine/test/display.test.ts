import { describe, expect, it } from 'vitest';
import { currentPointLabels, padelPresets, setScorelines } from '../src/index.js';
import { gameWins, play, pts, rally } from './helpers.js';

const { padelGoldenPointSuperTB, padelAdvantageFull } = padelPresets;

describe('currentPointLabels', () => {
  it('shows ladder values below deuce', () => {
    const { state } = play(padelGoldenPointSuperTB, [...pts(0, 2), ...pts(1, 1)]);
    expect(currentPointLabels(state, padelGoldenPointSuperTB)).toEqual(['30', '15']);
  });

  it('shows 40–40 (iguales) at deuce', () => {
    const { state } = play(padelAdvantageFull, rally('010101'));
    expect(currentPointLabels(state, padelAdvantageFull)).toEqual(['40', '40']);
  });

  it('shows advantage', () => {
    const { state } = play(padelAdvantageFull, rally('010101' + '0'));
    expect(currentPointLabels(state, padelAdvantageFull)).toEqual(['AD', '40']);
  });

  it('shows advantage for the other side', () => {
    const { state } = play(padelAdvantageFull, rally('010101' + '1'));
    expect(currentPointLabels(state, padelAdvantageFull)).toEqual(['40', 'AD']);
  });

  it('shows deuce again after a returned advantage (above the ladder)', () => {
    const { state } = play(padelAdvantageFull, rally('010101' + '01'));
    expect(state.currentGame.points).toEqual([4, 4]);
    expect(currentPointLabels(state, padelAdvantageFull)).toEqual(['40', '40']);
  });

  it('shows raw tiebreak counts', () => {
    const { state } = play(padelGoldenPointSuperTB, [...gameWins('010101010101'), ...pts(0, 3), ...pts(1, 1)]);
    expect(currentPointLabels(state, padelGoldenPointSuperTB)).toEqual(['3', '1']);
  });
});

describe('setScorelines', () => {
  it('returns games per set as pairs', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('000000'));
    expect(setScorelines(state)[0]).toEqual([6, 0]);
  });
});
