// Generates the canonical golden-vector fixture from the built engine. The
// native watch engines (Swift/Kotlin) load the SAME JSON and assert byte-for-
// byte agreement — making phone/watch parity an enforceable contract.
//
// Usage: pnpm --filter @padel/scoring-engine build && node scripts/generate-fixtures.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initialState, reduce, padelPresets } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'fixtures');

/** Compact, cross-language snapshot of the state a native port must reproduce. */
function snap(s) {
  return {
    points: [s.currentGame.points[0], s.currentGame.points[1]],
    tiebreak: s.sets[s.currentSetIndex]?.tiebreak
      ? [s.sets[s.currentSetIndex].tiebreak.points[0], s.sets[s.currentSetIndex].tiebreak.points[1]]
      : null,
    sets: s.sets.map((set) => [set.games[0], set.games[1]]),
    setsWon: [s.setsWon[0], s.setsWon[1]],
    serverSlot: s.server.serverSlot,
    complete: s.complete,
    winner: s.outcome.type === 'inProgress' ? null : s.outcome.winner,
  };
}

const P4 = ['A1', 'B1', 'A2', 'B2'];
const P2 = ['P0', 'P1'];
const pt = (side) => ({ type: 'POINT_TO', side });
const seq = (str) => [...str].map((c) => pt(Number(c)));
const nOf = (side, n) => Array.from({ length: n }, () => pt(side));
const gameWins = (str) => [...str].flatMap((c) => nOf(Number(c), 4));

function vector(name, cfg, players, actions) {
  let state = initialState(cfg, players);
  const steps = [snap(state)];
  for (const a of actions) {
    state = reduce(state, a, cfg);
    steps.push(snap(state));
  }
  return { name, configId: cfg.id, config: cfg, players, actions, steps };
}

const P = padelPresets;

const vectors = [
  vector('golden: straight sets 6-0 6-0', P.padelGoldenPointSuperTB, P4, gameWins('000000' + '000000')),
  vector('golden: sudden death at deuce', P.padelGoldenPointSuperTB, P4, seq('0101010')),
  vector('advantage: long deuce battle', P.padelAdvantageFull, P4, seq('010101' + '0' + '1' + '1' + '1' + '1')),
  vector('star: two advantages then decider', P.padelStarPointSuperTB, P4, seq('010101' + '0' + '1' + '1' + '0')),
  vector('silver: one advantage then decider', P.padelSilverPointSuperTB, P4, seq('010101' + '0' + '1' + '0')),
  vector(
    'tiebreak: set decided 7-6 (7-5 breaker)',
    P.padelGoldenPointSuperTB,
    P4,
    [...gameWins('010101010101'), ...nOf(0, 5), ...nOf(1, 5), ...nOf(0, 2)],
  ),
  vector(
    'super-tiebreak decider 10-8',
    P.padelGoldenPointSuperTB,
    P4,
    [...gameWins('000000'), ...gameWins('111111'), ...nOf(0, 8), ...nOf(1, 8), ...nOf(0, 2)],
  ),
  vector('mini-set 4-0 4-0', P.padelMiniSet, P4, gameWins('0000' + '0000')),
  vector('singles serve rotation', P.padelSinglesGolden, P2, gameWins('0101010')),
  vector('doubles serve rotation A1,B1,A2,B2', P.padelGoldenPointSuperTB, P4, gameWins('00000')),
  vector('penalty point converts a game', P.padelGoldenPointSuperTB, P4, [
    ...nOf(0, 3),
    { type: 'PENALTY', side: 1, unit: 'point' },
  ]),
  vector('retire preserves partial score', P.padelGoldenPointSuperTB, P4, [
    ...gameWins('000'),
    ...nOf(0, 2),
    { type: 'RETIRE', side: 1 },
  ]),
];

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'golden-vectors.json'), JSON.stringify({ version: 1, vectors }, null, 2) + '\n');
console.log(`Wrote ${vectors.length} golden vectors.`);
