import type { MatchRecord } from './types.js';
import { headToHead, partnerChemistry, playerStats } from './compute.js';

export interface WrappedSummary {
  readonly playerId: string;
  readonly totalMatches: number;
  readonly winRate: number;
  readonly favouritePartner: { partnerId: string; winRate: number; matches: number } | null;
  readonly toughestOpponent: { opponentId: string; winRate: number; matches: number } | null;
  readonly longestWinStreak: number;
  readonly comebacks: number;
  readonly mostPlayedVenue: string | null;
  readonly archetype: string;
}

/** A light, on-device "player archetype" from the shape of the season. */
export function archetypeFor(winRate: number, deciderWinRate: number | null, comebacks: number): string {
  if (deciderWinRate != null && deciderWinRate >= 0.65) return 'The Golden-Point Closer';
  if (comebacks >= 3) return 'The Comeback Kid';
  if (winRate >= 0.6) return 'The Metronome';
  if (winRate <= 0.4) return 'The Grinder';
  return 'The All-Rounder';
}

/** Generate a Season Wrapped summary — computable any time, fully on-device. */
export function seasonWrapped(records: readonly MatchRecord[], playerId: string): WrappedSummary {
  const stats = playerStats(records, playerId);
  const partners = partnerChemistry(records, playerId).filter((p) => p.matches >= 2);
  const opponents = headToHead(records, playerId).filter((o) => o.matches >= 2);

  const favouritePartner = partners.length
    ? { partnerId: partners[0]!.partnerId, winRate: partners[0]!.winRate, matches: partners[0]!.matches }
    : null;

  // Toughest = opponent against whom win-rate is lowest (min matches met above).
  const toughest = [...opponents].sort((a, b) => a.winRate - b.winRate)[0];
  const toughestOpponent = toughest
    ? { opponentId: toughest.opponentId, winRate: toughest.winRate, matches: toughest.matches }
    : null;

  const venueCounts = new Map<string, number>();
  for (const r of records) {
    if (r.venue && (r.teamA.includes(playerId) || r.teamB.includes(playerId))) {
      venueCounts.set(r.venue, (venueCounts.get(r.venue) ?? 0) + 1);
    }
  }
  const mostPlayedVenue = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    playerId,
    totalMatches: stats.matches,
    winRate: stats.winRate,
    favouritePartner,
    toughestOpponent,
    longestWinStreak: stats.longestWinStreak,
    comebacks: stats.comebacks,
    mostPlayedVenue,
    archetype: archetypeFor(stats.winRate, stats.deciderWinRate, stats.comebacks),
  };
}
