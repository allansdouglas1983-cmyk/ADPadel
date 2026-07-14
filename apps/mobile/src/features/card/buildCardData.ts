import type { MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { resultDescriptor, summarizeMatch } from '@padel/scoring-engine';
import { BRAND } from '@padel/shared';
import type { MatchCardData } from './MatchCard';

const SIGNATURE: Record<string, string> = {
  comeback: 'Comeback win',
  straightSets: 'Straight-sets win',
  decided: 'Match win',
  retired: 'Won by retirement',
  inProgress: 'In progress',
};

const initials = (name: string): string =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

/**
 * Build the share-card data from a completed match. Pure (no DB) — takes a
 * resolved name map and the sharer's rating delta — so the result screen and any
 * other share entry point derive the card identically. Copy-free facts come from
 * the tested `resultDescriptor`; only the marketing strings live here.
 */
export function buildCardData(args: {
  matchId: string;
  state: MatchState;
  cfg: RuleSetConfig;
  names: Map<string, string>;
  ratingDeltaElo: number;
  isPro: boolean;
}): MatchCardData {
  const { matchId, state, cfg, names, ratingDeltaElo, isPro } = args;
  const summary = summarizeMatch(state);
  const desc = resultDescriptor(summary, cfg.point.deuce);

  const players = state.players;
  const sideA = players.filter((_, i) => cfg.serve.slotSide[i] === 0);
  const sideB = players.filter((_, i) => cfg.serve.slotSide[i] === 1);
  const nameOf = (arr: readonly string[]) => arr.map((pid) => names.get(pid) ?? pid).join(' & ');
  const teamAName = nameOf(sideA);
  const teamBName = nameOf(sideB);

  const delta = ratingDeltaElo / 100;

  return {
    teamAName,
    teamBName,
    teamAInitials: initials(teamAName),
    teamBInitials: initials(teamBName),
    scoreline: desc.scoreline,
    venue: '',
    dateLabel: new Date().toLocaleDateString(),
    signatureStat: SIGNATURE[desc.kind] ?? 'Match complete',
    ratingDelta: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`,
    claimUrl: `https://${BRAND.universalLinkHost}/m/${matchId}`,
    goldFlourish: desc.goldFlourish,
    holographic: isPro,
  };
}
