import { and, eq } from 'drizzle-orm';
import type { MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { summarizeMatch } from '@padel/scoring-engine';
import type { Discipline, MatchResultInput } from '@padel/ratings';
import { updateRatings } from '@padel/ratings';
import { db } from '@/db/client';
import { genId } from '@/db/createMatch';
import { sets, teams } from '@/db/schema';
import { markMatchComplete } from '@/db/matchRepo';
import { loadRating, saveRatingUpdate } from '@/db/ratingsRepo';

/**
 * Finalize a completed match: write its set rows, update every player's rating
 * (via the tested @padel/ratings), append rating history, and mark the match
 * complete. This is the link that makes History, Stats, ratings and the share
 * card actually populate. Derived purely from the MatchState via summarizeMatch.
 */
export function finalizeMatch(
  matchId: string,
  state: MatchState,
  cfg: RuleSetConfig,
  players: readonly string[],
  startedAtIso: string,
): void {
  const summary = summarizeMatch(state);
  if (!summary.complete && !summary.retired) return;

  // Persist per-set rows.
  summary.sets.forEach((s, idx) => {
    db.insert(sets)
      .values({
        id: genId('set'),
        matchId,
        idx,
        teamAGames: s.games[0],
        teamBGames: s.games[1],
        tiebreakScore: s.tiebreak ? `${s.tiebreak[0]}-${s.tiebreak[1]}` : null,
      })
      .run();
  });

  const discipline: Discipline = cfg.serve.format === 'singles' ? 'singles' : 'doubles';
  const sideA = players.filter((_, i) => cfg.serve.slotSide[i] === 0);
  const sideB = players.filter((_, i) => cfg.serve.slotSide[i] === 1);

  let winnerTeamId: string | null = null;
  if (summary.winner !== null) {
    const winningSide = summary.winner;
    const input: MatchResultInput = {
      matchId,
      discipline,
      sideA: sideA.map((id) => loadRating(id, discipline)),
      sideB: sideB.map((id) => loadRating(id, discipline)),
      gamesWon: summary.totalGames,
      winner: winningSide,
      atIso: new Date().toISOString(),
    };
    saveRatingUpdate(updateRatings(input));

    const teamRow = db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.matchId, matchId), eq(teams.sideKey, winningSide)))
      .get();
    winnerTeamId = teamRow?.id ?? null;
  }

  const durationSec = Math.max(0, Math.floor((Date.now() - Date.parse(startedAtIso)) / 1000));
  markMatchComplete(matchId, winnerTeamId, durationSec);
}
