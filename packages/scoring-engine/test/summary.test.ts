import { describe, expect, it } from 'vitest';
import { padelPresets, resultDescriptor, summarizeMatch } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const { padelGoldenPointSuperTB, padelAdvantageFull } = padelPresets;
const set = (side: 0 | 1) => gameWins(String(side).repeat(6));

describe('summarizeMatch', () => {
  it('summarises a straight-sets win', () => {
    const { state } = play(padelGoldenPointSuperTB, [...set(0), ...set(0)]);
    const s = summarizeMatch(state);
    expect(s.complete).toBe(true);
    expect(s.retired).toBe(false);
    expect(s.winner).toBe(0);
    expect(s.setsWon).toEqual([2, 0]);
    expect(s.sets).toHaveLength(2);
    expect(s.sets[0]!.games).toEqual([6, 0]);
    expect(s.totalGames).toEqual([12, 0]);
    expect(s.wasComeback).toBe(false);
  });

  it('captures a tiebreak scoreline', () => {
    const actions = [...gameWins('010101010101'), ...pts(0, 5), ...pts(1, 5), ...pts(0, 2), ...set(0)];
    const { state } = play(padelGoldenPointSuperTB, actions);
    const s = summarizeMatch(state);
    expect(s.sets[0]!.tiebreak).toEqual([7, 5]);
  });

  it('flags a comeback when the winner dropped the first set', () => {
    // Side 1 wins set 1, side 0 wins sets 2 & 3 (super-tiebreak).
    const actions = [...set(1), ...set(0), ...pts(0, 10), ...pts(1, 2)];
    const { state } = play(padelGoldenPointSuperTB, actions);
    const s = summarizeMatch(state);
    expect(s.winner).toBe(0);
    expect(s.wasComeback).toBe(true);
  });

  it('handles a retirement, preserving completed sets only', () => {
    const { state } = play(padelAdvantageFull, [...set(0), ...gameWins('00'), { type: 'RETIRE', side: 1 }]);
    const s = summarizeMatch(state);
    expect(s.retired).toBe(true);
    expect(s.winner).toBe(0);
    // Only the one completed set counts in `sets`; the in-progress set is excluded.
    expect(s.sets).toHaveLength(1);
  });

  it('reports no winner for a match still in progress', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('00'));
    const s = summarizeMatch(state);
    expect(s.complete).toBe(false);
    expect(s.winner).toBeNull();
    expect(s.wasComeback).toBe(false);
  });
});

describe('resultDescriptor', () => {
  it('describes a straight-sets golden-point win with a gold flourish', () => {
    const { state } = play(padelGoldenPointSuperTB, [...set(0), ...set(0)]);
    const d = resultDescriptor(summarizeMatch(state), padelGoldenPointSuperTB.point.deuce);
    expect(d.kind).toBe('straightSets');
    expect(d.goldFlourish).toBe(true);
    expect(d.scoreline).toBe('6–0  6–0');
  });

  it('flags a comeback', () => {
    const actions = [...set(1), ...set(0), ...pts(0, 10), ...pts(1, 2)];
    const { state } = play(padelGoldenPointSuperTB, actions);
    expect(resultDescriptor(summarizeMatch(state), 'golden').kind).toBe('comeback');
  });

  it('no gold flourish for advantage scoring', () => {
    const { state } = play(padelAdvantageFull, [...set(0), ...set(0)]);
    expect(resultDescriptor(summarizeMatch(state), 'advantage').goldFlourish).toBe(false);
  });

  it('reports inProgress before completion', () => {
    const { state } = play(padelGoldenPointSuperTB, gameWins('00'));
    expect(resultDescriptor(summarizeMatch(state), 'golden').kind).toBe('inProgress');
  });
});
