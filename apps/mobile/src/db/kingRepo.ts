import { and, eq } from 'drizzle-orm';
import type { KingState } from '@padel/formats';
import { db } from './client';
import { sessions } from './schema';
import { genId } from './createMatch';

/** King of the Court persistence — serialized KingState, resumable like events. */
const nowSec = () => Math.floor(Date.now() / 1000);

export function createKingRow(state: KingState, venue?: string): string {
  const id = genId('sess');
  db.insert(sessions)
    .values({ id, type: 'king', venue, status: 'live', liveStateJson: JSON.stringify(state) })
    .run();
  return id;
}

export function persistKing(sessionId: string, state: KingState): void {
  db.update(sessions)
    .set({ liveStateJson: JSON.stringify(state), updatedAt: nowSec() })
    .where(eq(sessions.id, sessionId))
    .run();
}

export function findResumableKing(): { id: string; state: KingState } | null {
  const row = db
    .select({ id: sessions.id, live: sessions.liveStateJson })
    .from(sessions)
    .where(and(eq(sessions.status, 'live'), eq(sessions.deleted, false), eq(sessions.type, 'king')))
    .get();
  return row?.live ? { id: row.id, state: JSON.parse(row.live) as KingState } : null;
}
