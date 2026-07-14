import type { WrappedSummary } from '@padel/stats';

export interface WrappedStatLine {
  readonly value: string;
  readonly label: string;
}

export interface WrappedCardData {
  readonly archetype: string;
  readonly seasonLabel: string;
  readonly stats: readonly WrappedStatLine[];
  readonly favouritePartner: string | null;
  readonly toughestOpponent: string | null;
  readonly homeCourt: string | null;
}

const pct = (n: number): string => `${Math.round(n * 100)}%`;

/**
 * Pure selector turning a {@link WrappedSummary} into display-ready card rows.
 * Kept free of React/DB so the Wrapped screen and the shareable Skia card derive
 * an identical card, and so it is unit-testable. Player ids are resolved to names
 * by the caller via the passed `names` map (ids fall through unchanged).
 */
export function buildWrappedCardData(args: {
  summary: WrappedSummary;
  seasonLabel: string;
  names: Map<string, string>;
}): WrappedCardData {
  const { summary, seasonLabel, names } = args;
  const nameOf = (id: string | null | undefined): string | null =>
    id == null ? null : (names.get(id) ?? id);

  return {
    archetype: summary.archetype,
    seasonLabel,
    stats: [
      { value: String(summary.totalMatches), label: 'matches' },
      { value: `${summary.hoursOnCourt}h`, label: 'on court' },
      { value: pct(summary.winRate), label: 'win rate' },
      { value: String(summary.longestWinStreak), label: 'win streak' },
      { value: String(summary.deciderPointsWon), label: 'gold points' },
      { value: String(summary.comebacks), label: 'comebacks' },
    ],
    favouritePartner: nameOf(summary.favouritePartner?.partnerId),
    toughestOpponent: nameOf(summary.toughestOpponent?.opponentId),
    homeCourt: summary.mostPlayedVenue,
  };
}
