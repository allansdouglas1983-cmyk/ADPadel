import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Action, MatchState, RuleSetConfig } from '../src/index.js';
import { initialState, reduce } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(here, '..', 'fixtures', 'golden-vectors.json'), 'utf8'),
) as {
  version: number;
  vectors: Array<{
    name: string;
    config: RuleSetConfig;
    players: string[];
    actions: Action[];
    steps: Array<{
      points: [number, number];
      tiebreak: [number, number] | null;
      sets: [number, number][];
      setsWon: [number, number];
      serverSlot: number;
      complete: boolean;
      winner: number | null;
    }>;
  }>;
};

function snap(s: MatchState) {
  const set = s.sets[s.currentSetIndex];
  return {
    points: [s.currentGame.points[0], s.currentGame.points[1]],
    tiebreak: set?.tiebreak ? [set.tiebreak.points[0], set.tiebreak.points[1]] : null,
    sets: s.sets.map((x) => [x.games[0], x.games[1]]),
    setsWon: [s.setsWon[0], s.setsWon[1]],
    serverSlot: s.server.serverSlot,
    complete: s.complete,
    winner: s.outcome.type === 'inProgress' ? null : s.outcome.winner,
  };
}

describe('golden-vector fixture (the phone/watch parity contract)', () => {
  it('contains vectors', () => {
    expect(fixture.vectors.length).toBeGreaterThanOrEqual(12);
  });

  for (const v of fixture.vectors) {
    it(`fixture matches the engine: ${v.name}`, () => {
      let state = initialState(v.config, v.players);
      expect(snap(state)).toEqual(v.steps[0]);
      v.actions.forEach((action, i) => {
        state = reduce(state, action, v.config);
        expect(snap(state)).toEqual(v.steps[i + 1]);
      });
    });
  }
});
