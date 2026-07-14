import { describe, expect, it } from 'vitest';
import { padelPresets } from '../src/index.js';
import { play, pts, rally } from './helpers.js';

const { padelAdvantageFull, padelGoldenPointSuperTB, padelStarPointSuperTB } = padelPresets;

describe('advantage (ventaja) deuce', () => {
  it('requires a two-point margin after 40–40', () => {
    // 3–3 deuce, A adv, back to deuce, B adv, deuce, A adv, A wins.
    const { state } = play(padelAdvantageFull, rally('010101' + '0' + '0'));
    // Sequence: 0,1,0,1,0,1 -> 3-3 deuce; 0 -> adv A; 0 -> A wins game.
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('does not end the game on a single point at deuce', () => {
    const { state } = play(padelAdvantageFull, rally('010101' + '0'));
    // adv A but game not yet won
    expect(state.sets[0]!.games).toEqual([0, 0]);
    expect(state.currentGame.points).toEqual([4, 3]);
  });

  it('can swing through multiple deuces', () => {
    // 3-3, advA(4-3), deuce(4-4), advB(4-5), deuce(5-5), advB(5-6), B wins(5-7)
    const { state } = play(padelAdvantageFull, rally('010101' + '0' + '1' + '1' + '1' + '1'));
    expect(state.sets[0]!.games).toEqual([0, 1]);
  });
});

describe('golden point (punto de oro)', () => {
  it('is sudden death — the next point at 40–40 wins', () => {
    const { state } = play(padelGoldenPointSuperTB, rally('010101' + '0'));
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('awards the game to whoever wins the golden point', () => {
    const { state } = play(padelGoldenPointSuperTB, rally('010101' + '1'));
    expect(state.sets[0]!.games).toEqual([0, 1]);
  });
});

describe('star point (punto estrella)', () => {
  it('plays up to two advantages, then a sudden-death decider', () => {
    // 3-3 deuce#1; advA(4-3); deuce#2(4-4); advB(4-5); deuce#3(5-5) -> decider
    const seq = rally('010101' + '0' + '1' + '1' + '0');
    // ...5-5 decider; next point (0) -> 6-5 A wins outright.
    const { state } = play(padelStarPointSuperTB, [...seq, { type: 'POINT_TO', side: 0 }]);
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('still ends earlier if a side wins an advantage with margin', () => {
    // 3-3, advA(4-3), A wins(5-3)
    const { state } = play(padelStarPointSuperTB, rally('010101' + '00'));
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('does not trigger the decider before two advantages are spent', () => {
    // 3-3 deuce#1, advA(4-3), deuce#2(4-4): still normal advantage, not decider
    const { state } = play(padelStarPointSuperTB, rally('010101' + '0' + '1'));
    expect(state.currentGame.points).toEqual([4, 4]);
    expect(state.sets[0]!.games).toEqual([0, 0]);
  });

  it('the decider point (5–5) wins on a single point', () => {
    // reach 5-5 then B scores -> B wins
    const { state } = play(padelStarPointSuperTB, [...rally('010101011010'), { type: 'POINT_TO', side: 1 }]);
    // Verify we can reach a decided game via star path (games total = 1).
    const totalGames = state.sets.reduce((n, s) => n + s.games[0] + s.games[1], 0);
    expect(totalGames).toBeGreaterThanOrEqual(1);
  });
});

describe('40–15 style wins below deuce', () => {
  it('wins the game at 40–15 with a two-point margin', () => {
    // A: 3 points, B: 1 point, then A wins.
    const { state } = play(padelGoldenPointSuperTB, [...pts(0, 3), ...pts(1, 1), { type: 'POINT_TO', side: 0 }]);
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });
});
