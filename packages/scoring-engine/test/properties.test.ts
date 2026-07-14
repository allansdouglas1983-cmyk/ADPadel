import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Action, MatchState, RuleSetConfig } from '../src/index.js';
import { applyAction, foldLog, newSnapshot, padelPresets, reduce, initialState } from '../src/index.js';

const CONFIGS: RuleSetConfig[] = [
  padelPresets.padelGoldenPointSuperTB,
  padelPresets.padelAdvantageFull,
  padelPresets.padelStarPointSuperTB,
  padelPresets.padelMiniSet,
  padelPresets.padelSinglesGolden,
];

const SEED = Number(process.env.FASTCHECK_SEED ?? 424242);
const RUNS = Number(process.env.FASTCHECK_RUNS ?? 400);
const opts = { seed: SEED, numRuns: RUNS } as const;

const playersFor = (cfg: RuleSetConfig): string[] =>
  cfg.serve.format === 'singles' ? ['P0', 'P1'] : ['A1', 'B1', 'A2', 'B2'];

/** A stream of mostly points with occasional lets/penalties. */
const scoringActions = fc.array(
  fc.oneof(
    { weight: 8, arbitrary: fc.constant<Action>({ type: 'POINT_TO', side: 0 }) },
    { weight: 8, arbitrary: fc.constant<Action>({ type: 'POINT_TO', side: 1 }) },
    { weight: 1, arbitrary: fc.constant<Action>({ type: 'REPLAY' }) },
    { weight: 1, arbitrary: fc.constant<Action>({ type: 'PENALTY', side: 0, unit: 'point' }) },
    { weight: 1, arbitrary: fc.constant<Action>({ type: 'PENALTY', side: 1, unit: 'point' }) },
  ),
  { minLength: 0, maxLength: 400 },
);

const configArb = fc.constantFrom(...CONFIGS);

function invariantsHold(state: MatchState, cfg: RuleSetConfig): void {
  // setsWon never exceeds what is needed to win, +/- the playout allowance.
  const needed = Math.ceil(cfg.match.bestOf / 2);
  expect(state.setsWon[0]).toBeLessThanOrEqual(needed);
  expect(state.setsWon[1]).toBeLessThanOrEqual(needed);

  // Exactly one winner when complete, and it matches setsWon (unless retired).
  if (state.complete && state.outcome.type === 'completed') {
    const w = state.outcome.winner;
    expect(state.setsWon[w]).toBe(needed);
    expect(state.setsWon[w === 0 ? 1 : 0]).toBeLessThan(needed);
  }

  // Server slot is always a valid player index on the correct side.
  expect(state.server.serverSlot).toBeGreaterThanOrEqual(0);
  expect(state.server.serverSlot).toBeLessThan(state.players.length);
  expect(cfg.serve.slotSide[state.server.serverSlot]).toBe(state.server.servingSide);

  // Point/game counts are non-negative.
  for (const s of state.sets) {
    expect(s.games[0]).toBeGreaterThanOrEqual(0);
    expect(s.games[1]).toBeGreaterThanOrEqual(0);
  }
}

describe('property: invariants over random action streams', () => {
  it('holds structural invariants at every step', () => {
    fc.assert(
      fc.property(configArb, scoringActions, (cfg, actions) => {
        let state = initialState(cfg, playersFor(cfg));
        invariantsHold(state, cfg);
        for (const a of actions) {
          state = reduce(state, a, cfg);
          invariantsHold(state, cfg);
        }
      }),
      opts,
    );
  });
});

describe('property: determinism', () => {
  it('folding the same log twice yields identical state', () => {
    fc.assert(
      fc.property(configArb, scoringActions, (cfg, actions) => {
        let snap = newSnapshot(cfg, playersFor(cfg));
        for (const a of actions) snap = applyAction(snap, a, cfg).snapshot;
        expect(JSON.stringify(foldLog(snap, cfg))).toBe(JSON.stringify(foldLog(snap, cfg)));
      }),
      opts,
    );
  });
});

describe('property: undo perfectly reverses a POINT_TO', () => {
  it('applying then undoing a point returns to the prior state', () => {
    fc.assert(
      fc.property(configArb, scoringActions, fc.constantFrom<0 | 1>(0, 1), (cfg, actions, side) => {
        let snap = newSnapshot(cfg, playersFor(cfg));
        for (const a of actions) snap = applyAction(snap, a, cfg).snapshot;
        const before = foldLog(snap, cfg);
        const afterPoint = applyAction(snap, { type: 'POINT_TO', side }, cfg);
        const undone = applyAction(afterPoint.snapshot, { type: 'UNDO' }, cfg);
        expect(JSON.stringify(undone.state)).toBe(JSON.stringify(before));
      }),
      opts,
    );
  });
});

describe('property: monotonicity of decided outcomes', () => {
  it('a completed match never reverts to in-progress under more points once frozen', () => {
    fc.assert(
      fc.property(configArb, scoringActions, (cfg, actions) => {
        // Only meaningful for the default (non-playout) configs.
        if (cfg.match.playOutAfterMatchPoint) return;
        let snap = newSnapshot(cfg, playersFor(cfg));
        let sawComplete = false;
        for (const a of actions) {
          snap = applyAction(snap, a, cfg).snapshot;
          const st = foldLog(snap, cfg);
          if (st.complete) sawComplete = true;
          if (sawComplete) expect(st.complete).toBe(true);
        }
      }),
      opts,
    );
  });
});
