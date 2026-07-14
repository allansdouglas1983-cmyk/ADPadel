import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Thin, OPTIONAL sync/backup. Free users never call this — they stay 100%
 * on-device (zero COGS). Only signed-in users push their `dirty` rows and pull
 * remote changes; conflicts resolve last-write-wins by `updatedAt`.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
  const key = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: true } });
  return client;
}

export interface SyncRow {
  entity: string;
  entityId: string;
  updatedAt: number;
  payload: unknown;
  deleted: boolean;
}

/** Push dirty rows; the server upserts by (entity, entityId) keeping the newer
 * `updatedAt`. Re-parents a claimed guest's rows to the new user server-side. */
export async function pushDirty(rows: SyncRow[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || rows.length === 0) return;
  await supabase.from('sync_rows').upsert(
    rows.map((r) => ({
      entity: r.entity,
      entity_id: r.entityId,
      updated_at: r.updatedAt,
      payload: r.payload,
      deleted: r.deleted,
    })),
    { onConflict: 'entity,entity_id' },
  );
}
