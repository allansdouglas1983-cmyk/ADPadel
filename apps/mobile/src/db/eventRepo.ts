import { and, eq, inArray } from 'drizzle-orm';
import type { EventSession } from '@padel/formats';
import { db } from './client';
import { sessions } from './schema';
import { genId } from './createMatch';

/**
 * Event persistence, mirroring matchRepo: the serialized EventSession is written
 * SYNCHRONOUSLY after every action so an Americano/Mexicano night survives a
 * crash or a dead battery and resumes byte-identically.
 */
const nowSec = () => Math.floor(Date.now() / 1000);

export function createEventRow(session: EventSession, venue?: string): string {
  const id = genId('sess');
  db.insert(sessions)
    .values({
      id,
      type: session.config.format,
      venue,
      status: 'live',
      liveStateJson: JSON.stringify(session),
    })
    .run();
  return id;
}

export function persistEvent(sessionId: string, session: EventSession): void {
  db.update(sessions)
    .set({
      liveStateJson: JSON.stringify(session),
      status: session.status === 'complete' ? 'complete' : 'live',
      endedAt: session.status === 'complete' ? nowSec() : null,
      updatedAt: nowSec(),
    })
    .where(eq(sessions.id, sessionId))
    .run();
}

export function loadEvent(sessionId: string): EventSession | null {
  const row = db.select({ live: sessions.liveStateJson }).from(sessions).where(eq(sessions.id, sessionId)).get();
  return row?.live ? (JSON.parse(row.live) as EventSession) : null;
}

/** Any live event — offered as "resume" on the Play tab. Filtered to event
 * session types so a live *match* session is never mistaken for an event. */
export function findResumableEvent(): { id: string; session: EventSession } | null {
  const row = db
    .select({ id: sessions.id, live: sessions.liveStateJson })
    .from(sessions)
    .where(
      and(
        eq(sessions.status, 'live'),
        eq(sessions.deleted, false),
        inArray(sessions.type, ['americano', 'mexicano', 'teamAmericano', 'mixedAmericano']),
      ),
    )
    .get();
  return row?.live ? { id: row.id, session: JSON.parse(row.live) as EventSession } : null;
}
