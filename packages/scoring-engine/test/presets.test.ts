import { describe, expect, it } from 'vitest';
import { padelPresetCatalog, padelPresets } from '../src/index.js';
import { play, rally } from './helpers.js';

describe('Silver Point (one advantage, then a decider)', () => {
  const cfg = padelPresets.padelSilverPointSuperTB;

  it('plays exactly one advantage before the decider', () => {
    // 3-3 deuce#1; advA(4-3); deuce#2(4-4) -> decider now (1 advantage spent)
    const toDecider = rally('010101' + '0' + '1');
    const { state } = play(cfg, [...toDecider, { type: 'POINT_TO', side: 0 }]);
    // At 4-4 it's a decider; next point (side 0 -> 5-4) wins the game.
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });

  it('still lets a side win the single advantage outright', () => {
    // 3-3, advA(4-3), A wins(5-3)
    const { state } = play(cfg, rally('010101' + '00'));
    expect(state.sets[0]!.games).toEqual([1, 0]);
  });
});

describe('preset catalog', () => {
  it('every catalog entry maps to a real preset', () => {
    for (const entry of padelPresetCatalog) {
      expect(padelPresets[entry.key as keyof typeof padelPresets]).toBeDefined();
    }
  });

  it('exposes all recognised deuce modes', () => {
    const deuces = new Set(padelPresetCatalog.map((e) => e.deuce));
    expect(deuces).toEqual(new Set(['golden', 'advantage', 'silver', 'star']));
  });

  it('every preset has a unique id', () => {
    const ids = Object.values(padelPresets).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
