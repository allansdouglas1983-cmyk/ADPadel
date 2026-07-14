import { inArray } from 'drizzle-orm';
import { db } from './client';
import { genId } from './createMatch';
import { players } from './schema';

/** Create a guest player (host-added, claimable later) and return its id. */
export function createGuestPlayer(displayName: string, gender?: 'm' | 'f' | 'x'): string {
  const id = genId('p');
  db.insert(players).values({ id, displayName, isGuest: true, gender }).run();
  return id;
}

/** Resolve a set of player ids to display names in one query. */
export function getPlayerNames(ids: readonly string[]): Map<string, string> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = db
    .select({ id: players.id, name: players.displayName })
    .from(players)
    .where(inArray(players.id, [...ids]))
    .all();
  for (const r of rows) map.set(r.id, r.name);
  return map;
}
