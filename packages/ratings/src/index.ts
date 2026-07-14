export type {
  Side,
  Discipline,
  PlayerRating,
  RatingHistoryEntry,
  MatchResultInput,
  RatingUpdate,
} from './types.js';

export {
  BASE_ELO,
  teamElo,
  expectedScore,
  kFactor,
  marginMultiplier,
  toDisplayScale,
} from './elo.js';

export { updateRatings, initialRating } from './update.js';
