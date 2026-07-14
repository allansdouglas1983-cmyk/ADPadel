import type { PointConfig, RuleSetConfig, ServeConfig, TiebreakConfig } from '../config.js';

/**
 * THE ONLY FILE with padel-specific numbers. The engine and rules read these as
 * data. Tennis/pickleball would live in sibling preset files — never in code.
 */

const LADDER = ['0', '15', '30', '40'] as const;

const setTiebreak: TiebreakConfig = {
  targetPoints: 7,
  pointMargin: 2,
  firstServerPoints: 1,
  serveEvery: 2,
  changeEndsEvery: 6,
};

const superTiebreak: TiebreakConfig = {
  targetPoints: 10,
  pointMargin: 2,
  firstServerPoints: 1,
  serveEvery: 2,
  changeEndsEvery: 6,
};

const doublesServe: ServeConfig = {
  format: 'doubles',
  gameServeCycle: [0, 1, 2, 3], // A1, B1, A2, B2
  slotSide: [0, 1, 0, 1],
};

const singlesServe: ServeConfig = {
  format: 'singles',
  gameServeCycle: [0, 1],
  slotSide: [0, 1],
};

function point(deuce: PointConfig['deuce'], starMaxAdvantages?: number): PointConfig {
  return {
    ladder: [...LADDER],
    winAtIndex: 4,
    pointMargin: 2,
    deuce,
    ...(starMaxAdvantages != null ? { starMaxAdvantages } : {}),
  };
}

/** Best-of-3, tiebreak sets, super-tiebreak decider — the recreational default. */
export const padelGoldenPointSuperTB: RuleSetConfig = {
  id: 'padel.golden.bo3.superTB',
  version: 1,
  point: point('golden'),
  match: {
    bestOf: 3,
    regularSet: { gamesToWin: 6, gameMargin: 2, tiebreakAtGames: 6, tiebreak: setTiebreak },
    finalSet: { kind: 'superTiebreak', superTiebreak },
    playOutAfterMatchPoint: false,
  },
  serve: doublesServe,
};

/** Classic advantage scoring, three full tiebreak sets. */
export const padelAdvantageFull: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.advantage.bo3.full',
  point: point('advantage'),
  match: {
    ...padelGoldenPointSuperTB.match,
    finalSet: { kind: 'full', set: { gamesToWin: 6, gameMargin: 2, tiebreakAtGames: 6, tiebreak: setTiebreak } },
  },
};

/** 2026 FIP Star Point: up to two advantages, then a decider. */
export const padelStarPointSuperTB: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.star.bo3.superTB',
  point: point('star', 2),
  meta: { mixedDoublesDecisivePointSameGender: true },
};

/** Mini-set format (first to 4 games) — a recognised FIP alternative. */
export const padelMiniSet: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.golden.bo3.mini',
  match: {
    bestOf: 3,
    regularSet: { gamesToWin: 4, gameMargin: 2, tiebreakAtGames: 4, tiebreak: setTiebreak },
    finalSet: { kind: 'miniSet', set: { gamesToWin: 4, gameMargin: 2, tiebreakAtGames: 4, tiebreak: setTiebreak } },
    playOutAfterMatchPoint: false,
  },
};

/** Singles variant of the golden-point default. */
export const padelSinglesGolden: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.golden.bo3.superTB.singles',
  serve: singlesServe,
};

export const padelPresets = {
  padelGoldenPointSuperTB,
  padelAdvantageFull,
  padelStarPointSuperTB,
  padelMiniSet,
  padelSinglesGolden,
} as const;
