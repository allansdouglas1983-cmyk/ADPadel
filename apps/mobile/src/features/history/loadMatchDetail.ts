import { eq } from 'drizzle-orm';
import type { MatchState, MatchSummary, RuleSetConfig } from '@padel/scoring-engine';
import { summarizeMatch } from '@padel/scoring-engine';
import { resume } from '@padel/shared';
import { db } from '@/db/client';
import { matches } from '@/db/schema';
import { loadLiveEnvelope, loadMatchConfig } from '@/db/matchRepo';
import { getPlayerNames } from '@/db/playerRepo';
import { getMatchRatingDelta } from '@/db/ratingsRepo';
import { buildCardData } from '@/features/card/buildCardData';
import type { MatchCardData } from '@/features/card/MatchCard';

export interface TeamDetail {
  readonly side: 0 | 1;
  readonly players: readonly { id: string; name: string; ratingDelta: string }[];
  readonly setsWon: number;
  readonly isWinner: boolean;
}

export interface MatchDetail {
  readonly matchId: string;
  readonly summary: MatchSummary;
  readonly teams: readonly [TeamDetail, TeamDetail];
  readonly durationLabel: string | null;
  readonly dateLabel: string;
  readonly cardData: MatchCardData;
}

const fmtDelta = (elo: number | null): string => {
  const d = (elo ?? 0) / 100;
  return `${d >= 0 ? '+' : ''}${d.toFixed(2)}`;
};

const fmtDuration = (sec: number | null | undefined): string | null => {
  if (!sec || sec <= 0) return null;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

/**
 * Reconstruct a completed match for the history detail screen. Re-folds the
 * stored action log (via the tested engine) so the set-by-set breakdown is
 * byte-identical to what was played, resolves player names + per-player rating
 * deltas, and prepares the same {@link MatchCardData} the result screen uses so
 * the match can be re-shared. Returns null if the match can't be reconstructed
 * (missing envelope/config or a config-integrity mismatch).
 */
export function loadMatchDetail(matchId: string, isPro: boolean): MatchDetail | null {
  const envelope = loadLiveEnvelope(matchId);
  const cfg = loadMatchConfig(matchId);
  if (!envelope || !cfg) return null;

  let state: MatchState;
  try {
    state = resume(envelope, cfg);
  } catch {
    return null;
  }

  const summary = summarizeMatch(state);
  const row = db
    .select({ startedAtIso: matches.startedAtIso, durationSec: matches.durationSec })
    .from(matches)
    .where(eq(matches.id, matchId))
    .get();

  const players = state.players;
  const names = getPlayerNames(players);
  const bySide = (side: 0 | 1): TeamDetail => {
    const ids = players.filter((_, i) => cfg.serve.slotSide[i] === side);
    return {
      side,
      players: ids.map((id) => ({
        id,
        name: names.get(id) ?? id,
        ratingDelta: fmtDelta(getMatchRatingDelta(matchId, id)),
      })),
      setsWon: summary.setsWon[side],
      isWinner: summary.winner === side,
    };
  };

  const deltasElo = new Map(players.map((pid) => [pid, getMatchRatingDelta(matchId, pid) ?? 0]));
  const cardData = buildCardData({
    matchId,
    state,
    cfg,
    names,
    deltasElo,
    dateIso: row?.startedAtIso ?? undefined,
    durationSec: row?.durationSec ?? undefined,
    isPro,
  });

  const dateLabel = row?.startedAtIso?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  return {
    matchId,
    summary,
    teams: [bySide(0), bySide(1)],
    durationLabel: fmtDuration(row?.durationSec),
    dateLabel,
    cardData,
  };
}
