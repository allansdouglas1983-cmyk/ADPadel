import { describe, expect, it } from 'vitest';
import { padelPresets, tiebreakServeCursor } from '../src/index.js';
import { gameWins, play, pts, PLAYERS_DOUBLES } from './helpers.js';

const { padelGoldenPointSuperTB } = padelPresets;
const to66 = gameWins('010101010101'); // 6–6 → tiebreak

describe('set tiebreak at 6–6', () => {
  it('enters a tiebreak', () => {
    const { state } = play(padelGoldenPointSuperTB, to66);
    expect(state.sets[0]!.isTiebreak).toBe(true);
    expect(state.sets[0]!.tiebreak).toEqual({ points: [0, 0], winner: null });
  });

  it('wins the set 7–6 via a 7–5 tiebreak', () => {
    const actions = [...to66, ...pts(0, 5), ...pts(1, 5), ...pts(0, 2)]; // 7–5
    const { state } = play(padelGoldenPointSuperTB, actions);
    expect(state.sets[0]!.winner).toBe(0);
    expect(state.sets[0]!.games).toEqual([7, 6]);
    expect(state.sets[0]!.tiebreak!.points).toEqual([7, 5]);
    expect(state.setsWon).toEqual([1, 0]);
  });

  it('requires a two-point margin (7–6 does not win)', () => {
    const actions = [...to66, ...pts(0, 6), ...pts(1, 6)]; // 6–6 in the tiebreak
    let { state } = play(padelGoldenPointSuperTB, actions);
    expect(state.sets[0]!.winner).toBeNull();
    // 7–6 still not enough
    ({ state } = play(padelGoldenPointSuperTB, [...actions, ...pts(0, 1)]));
    expect(state.sets[0]!.winner).toBeNull();
    // 8–6 wins
    ({ state } = play(padelGoldenPointSuperTB, [...actions, ...pts(0, 2)]));
    expect(state.sets[0]!.winner).toBe(0);
    expect(state.sets[0]!.tiebreak!.points).toEqual([8, 6]);
  });
});

describe('tiebreak serve rotation (1 then every 2)', () => {
  it('follows the classic pattern for the first several points', () => {
    // opener cursor 0, doubles cycle length 4
    const cfg = { targetPoints: 7, pointMargin: 2, firstServerPoints: 1, serveEvery: 2, changeEndsEvery: 6 };
    const seq = Array.from({ length: 9 }, (_, played) => tiebreakServeCursor(0, played, cfg, 4));
    // point1: opener(0); pts2-3: 1; pts4-5: 2; pts6-7: 3; pts8-9: 0
    expect(seq).toEqual([0, 1, 1, 2, 2, 3, 3, 0, 0]);
  });

  it('assigns the correct serving player during a live tiebreak', () => {
    // At 6–6, 12 games played → opener cursor = 12 % 4 = 0 → player A1 (slot 0).
    const { state } = play(padelGoldenPointSuperTB, to66, PLAYERS_DOUBLES);
    expect(state.server.serverSlot).toBe(0); // A1 serves point 1
    // After one tiebreak point, serve passes to slot 1 (B1).
    const after1 = play(padelGoldenPointSuperTB, [...to66, ...pts(0, 1)], PLAYERS_DOUBLES);
    expect(after1.state.server.serverSlot).toBe(1);
  });
});
