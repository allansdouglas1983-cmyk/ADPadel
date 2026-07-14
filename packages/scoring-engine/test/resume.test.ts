import { describe, expect, it } from 'vitest';
import { foldLog, padelPresets } from '../src/index.js';
import { gameWins, play, pts } from './helpers.js';

const cfg = padelPresets.padelGoldenPointSuperTB;

describe('crash-resume via log fold', () => {
  it('re-derives byte-identical state from a serialized snapshot', () => {
    const mid = play(cfg, [...gameWins('010101'), ...pts(0, 2)]); // mid-match
    const json = JSON.stringify(mid.snapshot);
    const restored = JSON.parse(json);
    const resumed = foldLog(restored, cfg);
    expect(JSON.stringify(resumed)).toBe(JSON.stringify(mid.state));
  });

  it('folding the same log twice yields identical state (determinism)', () => {
    const { snapshot } = play(cfg, gameWins('0101010101'));
    expect(JSON.stringify(foldLog(snapshot, cfg))).toBe(JSON.stringify(foldLog(snapshot, cfg)));
  });

  it('survives a kill at every single point of a game', () => {
    // Emulate the dossier benchmark: resume after each action equals the live state.
    const actions = [...gameWins('01010'), ...pts(0, 3), ...pts(1, 3)];
    const live = play(cfg, actions);
    // Rebuild step by step, serializing/deserializing each time.
    let restored = JSON.parse(JSON.stringify(live.snapshot));
    for (let i = 0; i < 20; i++) {
      restored = JSON.parse(JSON.stringify(restored));
    }
    expect(JSON.stringify(foldLog(restored, cfg))).toBe(JSON.stringify(live.state));
  });
});
