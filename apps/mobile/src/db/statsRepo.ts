import { eq } from 'drizzle-orm';
import type { MatchRecord } from '@padel/stats';
import { db } from './client';
import { localWallClockIso } from '../lib/datetime';
import { matches, sessions, sets, teams } from './schema';

/**
 * Flatten completed matches into the pure MatchRecord shape the stats engine
 * consumes — fully populated (sets won, comeback flag, venue, local play time)
 * so every §3.3 metric computes. Keeps the stats package DB-free and testable.
 */
export function loadMatchRecords(): MatchRecord[] {
  const completed = db.select().from(matches).where(eq(matches.status, 'complete')).all();
  const out: MatchRecord[] = [];

  for (const m of completed) {
    const teamRows = db.select().from(teams).where(eq(teams.matchId, m.id)).all();
    const teamA = teamRows.find((tr) => tr.sideKey === 0);
    const teamB = teamRows.find((tr) => tr.sideKey === 1);
    if (!teamA || !teamB) continue;

    const setRows = db.select().from(sets).where(eq(sets.matchId, m.id)).orderBy(sets.idx).all();
    const gamesA = setRows.reduce((n, s) => n + s.teamAGames, 0);
    const gamesB = setRows.reduce((n, s) => n + s.teamBGames, 0);

    // Per-set winners → sets won, and the comeback flag (dropped the first set).
    let setsA = 0;
    let setsB = 0;
    for (const s of setRows) {
      if (s.teamAGames > s.teamBGames) setsA += 1;
      else if (s.teamBGames > s.teamAGames) setsB += 1;
    }
    const winner: 0 | 1 = m.winnerTeamId === teamB.id ? 1 : 0;
    const firstSet = setRows[0];
    const firstSetWinner = firstSet
      ? firstSet.teamAGames > firstSet.teamBGames
        ? 0
        : firstSet.teamBGames > firstSet.teamAGames
          ? 1
          : null
      : null;
    const wasComeback = firstSetWinner !== null && firstSetWinner !== winner;

    const session = m.sessionId
      ? db.select({ venue: sessions.venue }).from(sessions).where(eq(sessions.id, m.sessionId)).get()
      : undefined;

    out.push({
      matchId: m.id,
      teamA: JSON.parse(teamA.playerIdsJson) as string[],
      teamB: JSON.parse(teamB.playerIdsJson) as string[],
      winner,
      gamesWon: [gamesA, gamesB],
      setsWon: [setsA, setsB],
      wasComeback,
      venue: session?.venue ?? undefined,
      startedAtIso: m.startedAtIso ?? localWallClockIso(new Date((m.startedAt ?? 0) * 1000)),
      durationSec: m.durationSec ?? undefined,
    });
  }
  return out;
}
