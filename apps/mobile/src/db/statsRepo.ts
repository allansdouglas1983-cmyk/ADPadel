import { eq } from 'drizzle-orm';
import type { MatchRecord } from '@padel/stats';
import { db } from './client';
import { matches, sets, teams } from './schema';

/**
 * Flatten completed matches into the pure MatchRecord shape the stats engine
 * consumes. Keeps the stats package DB-free and testable.
 */
export function loadMatchRecords(): MatchRecord[] {
  const completed = db.select().from(matches).where(eq(matches.status, 'complete')).all();
  const out: MatchRecord[] = [];

  for (const m of completed) {
    const teamRows = db.select().from(teams).where(eq(teams.matchId, m.id)).all();
    const teamA = teamRows.find((tr) => tr.sideKey === 0);
    const teamB = teamRows.find((tr) => tr.sideKey === 1);
    if (!teamA || !teamB) continue;

    const setRows = db.select().from(sets).where(eq(sets.matchId, m.id)).all();
    const gamesA = setRows.reduce((n, s) => n + s.teamAGames, 0);
    const gamesB = setRows.reduce((n, s) => n + s.teamBGames, 0);

    out.push({
      matchId: m.id,
      teamA: JSON.parse(teamA.playerIdsJson) as string[],
      teamB: JSON.parse(teamB.playerIdsJson) as string[],
      winner: m.winnerTeamId === teamB.id ? 1 : 0,
      gamesWon: [gamesA, gamesB],
      startedAtIso: new Date((m.startedAt ?? 0) * 1000).toISOString(),
    });
  }
  return out;
}
