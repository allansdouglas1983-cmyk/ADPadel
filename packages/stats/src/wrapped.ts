import type { BiggestComeback, MatchRecord } from './types.js';
import { biggestComeback, headToHead, partnerChemistry, playerStats } from './compute.js';

export interface WrappedSummary {
  readonly playerId: string;
  readonly totalMatches: number;
  readonly winRate: number;
  readonly hoursOnCourt: number;
  readonly favouritePartner: { partnerId: string; winRate: number; matches: number } | null;
  readonly toughestOpponent: { opponentId: string; winRate: number; matches: number } | null;
  readonly longestWinStreak: number;
  readonly comebacks: number;
  /** The single biggest comeback win of the season, or null if none. */
  readonly biggestComeback: BiggestComeback | null;
  readonly deciderPointsWon: number;
  readonly mostPlayedVenue: string | null;
  /**
   * The player's rating over the season, oldest→newest, for the "journey"
   * sparkline. Empty unless a series is supplied via {@link SeasonWrappedOptions}.
   * Values are passed through verbatim (already in whatever scale the caller
   * chose) so this package stays free of @padel/ratings and fully deterministic.
   */
  readonly ratingJourney: readonly number[];
  readonly archetype: string;
}

/** Optional, DB-free inputs the caller can feed into {@link seasonWrapped}. */
export interface SeasonWrappedOptions {
  /**
   * The player's rating history, oldest→newest, already resolved by the caller
   * (e.g. from @padel/ratings). Kept as an argument rather than an import so the
   * stats package stays pure and testable.
   */
  readonly ratingHistory?: readonly number[];
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
export function seasonWrapped(
  records: readonly MatchRecord[],
  playerId: string,
  options: SeasonWrappedOptions = {},
): WrappedSummary {
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
  let durationSec = 0;
  let deciderPointsWon = 0;
  for (const r of records) {
    const involved = r.teamA.includes(playerId) || r.teamB.includes(playerId);
    if (!involved) continue;
    if (r.venue) venueCounts.set(r.venue, (venueCounts.get(r.venue) ?? 0) + 1);
    durationSec += r.durationSec ?? 0;
    deciderPointsWon += r.deciderWon?.[playerId]?.[0] ?? 0;
  }
  const mostPlayedVenue = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    playerId,
    totalMatches: stats.matches,
    winRate: stats.winRate,
    hoursOnCourt: Math.round((durationSec / 3600) * 10) / 10,
    favouritePartner,
    toughestOpponent,
    longestWinStreak: stats.longestWinStreak,
    comebacks: stats.comebacks,
    biggestComeback: biggestComeback(records, playerId),
    deciderPointsWon,
    mostPlayedVenue,
    ratingJourney: options.ratingHistory ? [...options.ratingHistory] : [],
    archetype: archetypeFor(stats.winRate, stats.deciderWinRate, stats.comebacks),
  };
}
