import { describe, expect, it } from 'vitest';
import { padelPresets } from '../src/index.js';
import { play, pts, winGame, PLAYERS_DOUBLES, PLAYERS_SINGLES } from './helpers.js';

const { padelGoldenPointSuperTB, padelSinglesGolden } = padelPresets;

describe('doubles serve rotation across games', () => {
  it('rotates A1 → B1 → A2 → B2 → A1', () => {
    const slots: number[] = [];
    const cfg = padelGoldenPointSuperTB;
    let actions = [] as ReturnType<typeof winGame>;
    for (let g = 0; g < 5; g++) {
      const { state } = play(cfg, actions, PLAYERS_DOUBLES);
      slots.push(state.server.serverSlot);
      actions = [...actions, ...winGame(0)];
    }
    expect(slots).toEqual([0, 1, 2, 3, 0]);
  });

  it('does not change server mid-game', () => {
    const before = play(padelGoldenPointSuperTB, pts(0, 1), PLAYERS_DOUBLES);
    const after = play(padelGoldenPointSuperTB, pts(0, 2), PLAYERS_DOUBLES);
    expect(before.state.server.serverSlot).toBe(after.state.server.serverSlot);
    expect(before.state.server.serverSlot).toBe(0);
  });

  it('reports the serving side from the slot', () => {
    const { state } = play(padelGoldenPointSuperTB, winGame(0), PLAYERS_DOUBLES);
    // game 2 server = slot 1 = side 1
    expect(state.server).toEqual({ serverSlot: 1, servingSide: 1 });
  });
});

describe('singles serve rotation', () => {
  it('alternates P0 and P1 each game', () => {
    const g1 = play(padelSinglesGolden, [], PLAYERS_SINGLES);
    const g2 = play(padelSinglesGolden, winGame(0), PLAYERS_SINGLES);
    expect(g1.state.server.serverSlot).toBe(0);
    expect(g2.state.server.serverSlot).toBe(1);
  });
});
