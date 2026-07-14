import { describe, expect, it } from 'vitest';
import type { Action } from '../src/index.js';
import { applyAction, foldLog, newSnapshot, padelPresets } from '../src/index.js';
import { gameWins, play } from './helpers.js';

const cfg = padelPresets.padelGoldenPointSuperTB;

describe('UNDO', () => {
  it('reverses a POINT_TO exactly (state equals the pre-point state)', () => {
    const before = play(cfg, gameWins('01') /* 1-1 */);
    const afterPoint = applyAction(before.snapshot, { type: 'POINT_TO', side: 0 }, cfg);
    const undone = applyAction(afterPoint.snapshot, { type: 'UNDO' }, cfg);
    expect(undone.state).toEqual(before.state);
    expect(undone.snapshot.log).toEqual(before.snapshot.log);
  });

  it('is multi-level', () => {
    let snap = newSnapshot(cfg, ['A1', 'B1', 'A2', 'B2']);
    const seq: Action[] = [
      { type: 'POINT_TO', side: 0 },
      { type: 'POINT_TO', side: 0 },
      { type: 'POINT_TO', side: 1 },
    ];
    for (const a of seq) snap = applyAction(snap, a, cfg).snapshot;
    // Undo all three
    for (let i = 0; i < 3; i++) snap = applyAction(snap, { type: 'UNDO' }, cfg).snapshot;
    expect(snap.log).toHaveLength(0);
    expect(foldLog(snap, cfg).currentGame.points).toEqual([0, 0]);
  });

  it('undoing past the start is a no-op', () => {
    let snap = newSnapshot(cfg, ['A1', 'B1', 'A2', 'B2']);
    snap = applyAction(snap, { type: 'UNDO' }, cfg).snapshot;
    expect(snap.log).toHaveLength(0);
  });

  it('undo then re-apply reproduces identical state', () => {
    const a = play(cfg, gameWins('0101'));
    const afterPoint = applyAction(a.snapshot, { type: 'POINT_TO', side: 1 }, cfg);
    const undone = applyAction(afterPoint.snapshot, { type: 'UNDO' }, cfg);
    const redo = applyAction(undone.snapshot, { type: 'POINT_TO', side: 1 }, cfg);
    expect(redo.state).toEqual(afterPoint.state);
  });
});
