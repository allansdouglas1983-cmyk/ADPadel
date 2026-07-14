export type {
  RuleSetConfig,
  PointConfig,
  TiebreakConfig,
  SetConfig,
  FinalSetConfig,
  MatchConfig,
  ServeConfig,
  DeuceMode,
  Format,
  FinalSetKind,
  Side,
} from './config.js';

export type {
  MatchState,
  GameScore,
  SetScore,
  TiebreakScore,
  ServerState,
  MatchOutcome,
} from './state.js';

export type { Action, LoggedAction, EngineSnapshot } from './actions.js';

export {
  initialState,
  reduce,
  foldLog,
  applyAction,
  newSnapshot,
  configForSet,
} from './engine.js';

export { resolveGamePoint, deciderThreshold } from './rules/points.js';
export { tiebreakWinner, tiebreakServeCursor } from './rules/tiebreak.js';
export { currentPointLabels, setScorelines } from './display.js';

export { padelPresets } from './presets/padel.js';
