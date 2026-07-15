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

/** Human deuce-mode label (silver = star with a single advantage). */
function deuceLabel(cfg: RuleSetConfig): string {
  switch (cfg.point.deuce) {
    case 'advantage':
      return 'Advantage';
    case 'golden':
      return 'Golden point';
    case 'star':
      return cfg.point.starMaxAdvantages === 1 ? 'Silver point' : 'Star point';
    default:
      return 'Match';
  }
}

const initials = (name: string): string =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

const fmtDelta = (elo: number): string => {
  const d = elo / 100;
  return `${d >= 0 ? '+' : ''}${d.toFixed(2)}`;
};

/** Format a stored local wall-clock ISO date without touching the timezone. */
const fmtDate = (iso: string | undefined): string => {
  const day = iso?.slice(0, 10);
  if (!day || day.length !== 10) return '';
  const [y, m, d] = day.split('-');
  return `${d}/${m}/${y}`;
};

const fmtDuration = (sec: number | undefined): string => {
  if (!sec || sec <= 0) return '';
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
};

/**
 * Build the share-card data from a completed match. Pure (no DB) — takes the
 * match's real date/venue/duration and a resolved name + per-player rating-delta
 * map, so the result screen and any other share entry point derive an identical
 * card. Copy-free facts come from the tested `resultDescriptor`; only the
 * marketing strings live here.
 */
export function buildCardData(args: {
  matchId: string;
  state: MatchState;
  cfg: RuleSetConfig;
  names: Map<string, string>;
  /** Per-player Elo delta for this match (playerId → centi-Elo). */
  deltasElo: Map<string, number>;
  /** The match's local wall-clock ISO start (never "now"). */
  dateIso?: string;
  venue?: string;
  durationSec?: number;
  isPro: boolean;
}): MatchCardData {
  const { matchId, state, cfg, names, deltasElo, dateIso, venue, durationSec, isPro } = args;
  const summary = summarizeMatch(state);
  const desc = resultDescriptor(summary, cfg.point.deuce);

  const players = state.players;
  const sideA = players.filter((_, i) => cfg.serve.slotSide[i] === 0);
  const sideB = players.filter((_, i) => cfg.serve.slotSide[i] === 1);
  const nameOf = (arr: readonly string[]) => arr.map((pid) => names.get(pid) ?? pid).join(' & ');
  const teamAName = nameOf(sideA);
  const teamBName = nameOf(sideB);

  // Each player's rating delta (spec §3.5 — "each player's rating delta").
  const playerDeltas = players.map((pid) => ({
    name: names.get(pid) ?? pid,
    delta: fmtDelta(deltasElo.get(pid) ?? 0),
  }));
  const sharerDelta = fmtDelta(deltasElo.get(sideA[0] ?? '') ?? 0);

  return {
    teamAName,
    teamBName,
    teamAInitials: initials(teamAName),
    teamBInitials: initials(teamBName),
    scoreline: desc.scoreline,
    venue: venue ?? '',
    dateLabel: fmtDate(dateIso),
    durationLabel: fmtDuration(durationSec),
    formatLabel: `${deuceLabel(cfg)} · Best of ${cfg.match.bestOf}`,
    signatureStat: SIGNATURE[desc.kind] ?? 'Match complete',
    ratingDelta: sharerDelta,
    playerDeltas,
    claimUrl: `https://${BRAND.universalLinkHost}/m/${matchId}`,
    goldFlourish: desc.goldFlourish,
    holographic: isPro,
  };
}
