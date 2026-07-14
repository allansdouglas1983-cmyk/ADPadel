import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { matches, players, ratings, sessions, syncCursor, syncMeta } from '@/db/schema';
import { getSupabase, pushDirty, type SyncRow } from './supabase';

/**
 * Offline-first sync (dossier §5.4). SQLite is always the source of truth. Only
 * signed-in users sync: dirty local rows are pushed to Supabase and remote
 * changes pulled back, reconciled LAST-WRITE-WINS by `updatedAt`. Free users
 * never call any of this (zero COGS).
 */

type Entity = 'players' | 'sessions' | 'matches' | 'ratings';

const nowSec = () => Math.floor(Date.now() / 1000);

/** Mark a row dirty so the next push includes it. Call after every local write. */
export function markDirty(entity: Entity, id: string, deleted = false): void {
  db.insert(syncMeta)
    .values({ entity, entityId: id, updatedAt: nowSec(), dirty: true, deleted })
    .onConflictDoUpdate({
      target: [syncMeta.entity, syncMeta.entityId],
      set: { updatedAt: nowSec(), dirty: true, deleted },
    })
    .run();
}

/** Read the current row for an entity as a plain payload. */
function rowPayload(entity: Entity, id: string): { payload: unknown; updatedAt: number } | null {
  switch (entity) {
    case 'players': {
      const r = db.select().from(players).where(eq(players.id, id)).get();
      return r ? { payload: r, updatedAt: r.updatedAt } : null;
    }
    case 'sessions': {
      const r = db.select().from(sessions).where(eq(sessions.id, id)).get();
      return r ? { payload: r, updatedAt: r.updatedAt } : null;
    }
    case 'matches': {
      const r = db.select().from(matches).where(eq(matches.id, id)).get();
      return r ? { payload: r, updatedAt: r.updatedAt } : null;
    }
    case 'ratings': {
      const r = db.select().from(ratings).where(eq(ratings.id, id)).get();
      return r ? { payload: r, updatedAt: r.updatedAt } : null;
    }
  }
}

/** Push every dirty row to Supabase, then clear the dirty flags. */
export async function pushLocalChanges(): Promise<void> {
  if (!getSupabase()) return;
  const dirty = db.select().from(syncMeta).where(eq(syncMeta.dirty, true)).all();
  const rows: SyncRow[] = [];
  for (const d of dirty) {
    const row = rowPayload(d.entity as Entity, d.entityId);
    rows.push({
      entity: d.entity,
      entityId: d.entityId,
      updatedAt: row?.updatedAt ?? d.updatedAt,
      payload: row?.payload ?? null,
      deleted: d.deleted || !row,
    });
  }
  if (rows.length === 0) return;
  await pushDirty(rows);
  for (const d of dirty) {
    db.update(syncMeta).set({ dirty: false }).where(and(eq(syncMeta.entity, d.entity), eq(syncMeta.entityId, d.entityId))).run();
  }
}

/** Apply a remote row locally, last-write-wins by updatedAt. */
function applyRemote(entity: Entity, id: string, payload: Record<string, unknown>, remoteUpdatedAt: number): void {
  const local = rowPayload(entity, id);
  if (local && local.updatedAt >= remoteUpdatedAt) return; // local is newer or equal

  const table = { players, sessions, matches, ratings }[entity];
  // Upsert the full row; Drizzle maps snake_case columns from the payload.
  db.insert(table as never)
    .values(payload as never)
    .onConflictDoUpdate({ target: (table as { id: unknown }).id as never, set: payload as never })
    .run();
}

/** Pull remote changes newer than our per-entity cursor and apply them. */
export async function pullRemoteChanges(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const entities: Entity[] = ['players', 'sessions', 'matches', 'ratings'];
  for (const entity of entities) {
    const cursor = db.select().from(syncCursor).where(eq(syncCursor.entity, entity)).get();
    const since = cursor?.lastPulledAt ?? 0;
    const { data, error } = await supabase
      .from('sync_rows')
      .select('entity_id, updated_at, payload, deleted')
      .eq('entity', entity)
      .gt('updated_at', since)
      .order('updated_at', { ascending: true });
    if (error || !data) continue;

    let maxAt = since;
    for (const remote of data as Array<{ entity_id: string; updated_at: number; payload: Record<string, unknown>; deleted: boolean }>) {
      if (!remote.deleted && remote.payload) applyRemote(entity, remote.entity_id, remote.payload, remote.updated_at);
      maxAt = Math.max(maxAt, remote.updated_at);
    }
    db.insert(syncCursor)
      .values({ entity, lastPulledAt: maxAt })
      .onConflictDoUpdate({ target: syncCursor.entity, set: { lastPulledAt: maxAt } })
      .run();
  }
  // Touch to keep the imported symbols honest for the type checker.
  void gt;
}

/** Full sync: push then pull. Safe to call on foreground for signed-in users. */
export async function fullSync(): Promise<void> {
  await pushLocalChanges();
  await pullRemoteChanges();
}
