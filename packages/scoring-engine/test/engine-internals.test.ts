import { describe, expect, it } from 'vitest';
import type { RuleSetConfig } from '../src/index.js';
import { configForSet, initialState, padelPresets, reduce } from '../src/index.js';

const cfg = padelPresets.padelGoldenPointSuperTB;

describe('reduce with UNDO (direct) is a no-op', () => {
  it('returns the same state unchanged', () => {
    const s = initialState(cfg, ['A1', 'B1', 'A2', 'B2']);
    expect(reduce(s, { type: 'UNDO' }, cfg)).toEqual(s);
  });
});

describe('configForSet defensive fallbacks', () => {
  it("final 'full' without an explicit set falls back to the regular set", () => {
    const c: RuleSetConfig = { ...cfg, match: { ...cfg.match, finalSet: { kind: 'full' } } };
    expect(configForSet('final', c)).toBe(c.match.regularSet);
  });

  it("final 'miniSet' without an explicit set synthesises a to-4 set", () => {
    const c: RuleSetConfig = { ...cfg, match: { ...cfg.match, finalSet: { kind: 'miniSet' } } };
    const s = configForSet('final', c);
    expect(s.gamesToWin).toBe(4);
    expect(s.tiebreak).toBeDefined();
  });

  it("final 'superTiebreak' without a config synthesises a one-game tiebreak set", () => {
    const c: RuleSetConfig = { ...cfg, match: { ...cfg.match, finalSet: { kind: 'superTiebreak' } } };
    const s = configForSet('final', c);
    expect(s.gamesToWin).toBe(1);
    expect(s.tiebreakAtGames).toBe(0);
    expect(s.tiebreak).toBeUndefined();
  });
});
