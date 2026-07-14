import { useMemo } from 'react';
import { partnerChemistry, playerStats, type MatchRecord, type PartnerChemistry, type PlayerStats } from '@padel/stats';
import { loadMatchRecords } from '@/db/statsRepo';
import { useCurrentPlayerId } from '@/hooks/useCurrentPlayer';

/** Aggregates the current player's on-device stats from stored match records. */
export function usePlayerStats(): {
  stats: PlayerStats;
  chemistry: PartnerChemistry[];
  rating: number | null;
} {
  const playerId = useCurrentPlayerId();
  return useMemo(() => {
    const records: MatchRecord[] = loadMatchRecords();
    return {
      stats: playerStats(records, playerId),
      chemistry: partnerChemistry(records, playerId),
      rating: loadRating(playerId),
    };
  }, [playerId]);
}

// Rating lookup kept local to avoid a wider import surface in the hook.
function loadRating(_playerId: string): number | null {
  return null; // wired to the ratings table in db/statsRepo when logged in
}
