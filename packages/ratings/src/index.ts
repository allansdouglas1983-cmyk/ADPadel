export type {
  Side,
  Discipline,
  PlayerRating,
  RatingHistoryEntry,
  MatchResultInput,
  RatingUpdate,
  RatingParams,
} from './types.js';

export {
  BASE_ELO,
  DEFAULT_RATING_PARAMS,
  teamElo,
  expectedScore,
  kFactor,
  marginMultiplier,
  formRating,
  toDisplayScale,
} from './elo.js';

export { updateRatings, initialRating } from './update.js';
