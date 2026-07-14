import { useMemo } from 'react';
import {
  dayOfWeekPattern,
  headToHead,
  partnerChemistry,
  playerStats,
  timeOfDayPattern,
  venueBreakdown,
  type Bucket,
  type HeadToHead,
  type MatchRecord,
  type PartnerChemistry,
  type PlayerStats,
  type TimeBucket,
  type VenueBreakdown,
  type Weekday,
} from '@padel/stats';
import { formRating, toDisplayScale } from '@padel/ratings';
import { loadMatchRecords } from '@/db/statsRepo';
import { getRatingHistoryValues, loadRating } from '@/db/ratingsRepo';
import { useCurrentPlayerId } from '@/hooks/useCurrentPlayer';

export interface FullStats {
  stats: PlayerStats;
  chemistry: PartnerChemistry[];
  headToHead: HeadToHead[];
  venues: VenueBreakdown[];
  timeOfDay: Bucket<TimeBucket>[];
  dayOfWeek: Bucket<Weekday>[];
  ratingDisplay: number | null;
  formDisplay: number | null;
  ratingJourney: number[]; // display-scale values
}

/** Aggregates the current player's complete on-device stat picture. */
export function usePlayerStats(): FullStats {
  const playerId = useCurrentPlayerId();
  return useMemo(() => {
    const records: MatchRecord[] = loadMatchRecords();
    const history = getRatingHistoryValues(playerId, 'doubles');
    const currentElo = loadRating(playerId, 'doubles').elo;
    return {
      stats: playerStats(records, playerId),
      chemistry: partnerChemistry(records, playerId),
      headToHead: headToHead(records, playerId),
      venues: venueBreakdown(records, playerId),
      timeOfDay: timeOfDayPattern(records, playerId),
      dayOfWeek: dayOfWeekPattern(records, playerId),
      ratingDisplay: history.length ? toDisplayScale(currentElo) : null,
      formDisplay: history.length ? toDisplayScale(formRating(history)) : null,
      ratingJourney: history.map(toDisplayScale),
    };
  }, [playerId]);
}
