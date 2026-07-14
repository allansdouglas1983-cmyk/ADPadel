import { describe, expect, it } from 'vitest';
import { applyAction, newSnapshot, padelPresets } from '@padel/scoring-engine';
import {
  ConfigMismatchError,
  canonicalJson,
  configHash,
  deserialize,
  resume,
  serialize,
} from '../src/index.js';

const cfg = padelPresets.padelGoldenPointSuperTB;
const AT = '2026-07-14T10:00:00.000Z';

function midMatchSnapshot() {
  let snap = newSnapshot(cfg, ['A1', 'B1', 'A2', 'B2']);
  for (let i = 0; i < 10; i++) snap = applyAction(snap, { type: 'POINT_TO', side: (i % 2) as 0 | 1 }, cfg).snapshot;
  return snap;
}

describe('canonicalJson', () => {
  it('is key-order independent', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });
  it('handles nested arrays and objects', () => {
    expect(canonicalJson({ x: [{ b: 1, a: 2 }] })).toBe('{"x":[{"a":2,"b":1}]}');
  });
});

describe('configHash', () => {
  it('is stable for the same config', () => {
    expect(configHash(cfg)).toBe(configHash(cfg));
  });
  it('differs for different configs', () => {
    expect(configHash(cfg)).not.toBe(configHash(padelPresets.padelAdvantageFull));
  });
});

describe('serialize / deserialize round-trip', () => {
  it('restores an identical snapshot', () => {
    const snap = midMatchSnapshot();
    const persisted = serialize(snap, cfg, AT);
    const restored = deserialize(persisted, cfg);
    expect(restored.log).toEqual(snap.log);
    expect(restored.players).toEqual(snap.players);
  });

  it('survives a JSON round-trip byte-for-byte', () => {
    const persisted = serialize(midMatchSnapshot(), cfg, AT);
    expect(JSON.parse(JSON.stringify(persisted))).toEqual(persisted);
  });

  it('resume() re-derives the live match state', () => {
    const snap = midMatchSnapshot();
    const live = applyAction(snap, { type: 'REPLAY' }, cfg); // no-op to get a state
    const persisted = serialize(snap, cfg, AT);
    const resumed = resume(persisted, cfg);
    expect(resumed.currentGame.points).toEqual(live.state.currentGame.points);
  });

  it('throws ConfigMismatchError when the config no longer matches', () => {
    const persisted = { ...serialize(midMatchSnapshot(), cfg, AT), configHash: 'deadbeef' };
    expect(() => deserialize(persisted, cfg)).toThrow(ConfigMismatchError);
  });
});
