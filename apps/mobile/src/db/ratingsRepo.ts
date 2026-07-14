import { and, eq } from 'drizzle-orm';
import type { Discipline, PlayerRating, RatingUpdate } from '@padel/ratings';
import { initialRating } from '@padel/ratings';
import { db } from './client';
import { genId } from './createMatch';
import { ratingHistory, ratings } from './schema';

const nowSec = () => Math.floor(Date.now() / 1000);

/** Load a player's current rating for a discipline, or a fresh provisional one. */
export function loadRating(playerId: string, discipline: Discipline): PlayerRating {
  const row = db
    .select()
    .from(ratings)
    .where(and(eq(ratings.playerId, playerId), eq(ratings.discipline, discipline)))
    .get();
  if (!row) return initialRating(playerId, discipline);
  return { playerId, discipline, elo: row.value, matchesPlayed: row.matchesCount, lastMatchId: null };
}

/** Persist an updated rating and append its history entries. Idempotent per match. */
export function saveRatingUpdate(update: RatingUpdate): void {
  for (const r of update.updated) {
    const id = `rat_${r.playerId}_${r.discipline}`;
    db.insert(ratings)
      .values({ id, playerId: r.playerId, discipline: r.discipline, value: r.elo, matchesCount: r.matchesPlayed, updatedAt: nowSec() })
      .onConflictDoUpdate({
        target: ratings.id,
        set: { value: r.elo, matchesCount: r.matchesPlayed, updatedAt: nowSec() },
      })
      .run();
  }
  for (const h of update.history) {
    db.insert(ratingHistory)
      .values({
        id: genId('rh'),
        playerId: h.playerId,
        matchId: h.matchId,
        discipline: h.discipline,
        delta: h.delta,
        valueAfter: h.after,
        at: nowSec(),
      })
      .run();
  }
}
