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

/**
 * Silver Point — the middle option (one advantage, then a decider). Exposed by
 * some apps (e.g. Padelio); modelled as a star point with a single advantage.
 */
export const padelSilverPointSuperTB: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.silver.bo3.superTB',
  point: point('star', 1),
  meta: { mixedDoublesDecisivePointSameGender: true },
};

/** Star Point with three full tiebreak sets (advantage-set decider). */
export const padelStarPointFull: RuleSetConfig = {
  ...padelStarPointSuperTB,
  id: 'padel.star.bo3.full',
  match: {
    ...padelStarPointSuperTB.match,
    finalSet: { kind: 'full', set: { gamesToWin: 6, gameMargin: 2, tiebreakAtGames: 6, tiebreak: setTiebreak } },
  },
};

/** Golden point, three full tiebreak sets (no super-tiebreak decider). */
export const padelGoldenPointFull: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.golden.bo3.full',
  match: {
    ...padelGoldenPointSuperTB.match,
    finalSet: { kind: 'full', set: { gamesToWin: 6, gameMargin: 2, tiebreakAtGames: 6, tiebreak: setTiebreak } },
  },
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

/** Singles, classic advantage, three full sets. */
export const padelSinglesAdvantage: RuleSetConfig = {
  ...padelAdvantageFull,
  id: 'padel.advantage.bo3.full.singles',
  serve: singlesServe,
};

/** Best-of-1 super-tiebreak — a fast social format (a single 10-point breaker). */
export const padelSingleSuperTiebreak: RuleSetConfig = {
  ...padelGoldenPointSuperTB,
  id: 'padel.superTB.bo1',
  match: {
    bestOf: 1,
    regularSet: { gamesToWin: 6, gameMargin: 2, tiebreakAtGames: 6, tiebreak: setTiebreak },
    finalSet: { kind: 'superTiebreak', superTiebreak },
    playOutAfterMatchPoint: false,
  },
};

export const padelPresets = {
  padelGoldenPointSuperTB,
  padelGoldenPointFull,
  padelAdvantageFull,
  padelStarPointSuperTB,
  padelStarPointFull,
  padelSilverPointSuperTB,
  padelMiniSet,
  padelSinglesGolden,
  padelSinglesAdvantage,
  padelSingleSuperTiebreak,
} as const;

/** Metadata for the setup UI — every officially recognised configuration. */
export const padelPresetCatalog = [
  { key: 'padelGoldenPointSuperTB', label: 'Golden point · super tie-break', deuce: 'golden', format: 'doubles' },
  { key: 'padelGoldenPointFull', label: 'Golden point · 3 full sets', deuce: 'golden', format: 'doubles' },
  { key: 'padelAdvantageFull', label: 'Advantage · 3 full sets', deuce: 'advantage', format: 'doubles' },
  { key: 'padelSilverPointSuperTB', label: 'Silver point · super tie-break', deuce: 'silver', format: 'doubles' },
  { key: 'padelStarPointSuperTB', label: 'Star point · super tie-break', deuce: 'star', format: 'doubles' },
  { key: 'padelStarPointFull', label: 'Star point · 3 full sets', deuce: 'star', format: 'doubles' },
  { key: 'padelMiniSet', label: 'Mini-sets (first to 4)', deuce: 'golden', format: 'doubles' },
  { key: 'padelSingleSuperTiebreak', label: 'Single super tie-break', deuce: 'golden', format: 'doubles' },
  { key: 'padelSinglesGolden', label: 'Singles · golden point', deuce: 'golden', format: 'singles' },
  { key: 'padelSinglesAdvantage', label: 'Singles · advantage', deuce: 'advantage', format: 'singles' },
] as const;
