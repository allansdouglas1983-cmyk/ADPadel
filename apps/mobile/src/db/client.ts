import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations as useDrizzleMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';
import migrations from './migrations/migrations';
import { reportStartupError } from '@/lib/StartupErrorBoundary';

/** Set if the database failed to open at startup (surfaced by the boundary). */
export let dbInitError: Error | null = null;

/**
 * The on-device SQLite database — the source of truth. WAL mode for fast,
 * synchronous writes so scoring persists before the UI confirms (the
 * reliability pillar). Opened synchronously at module load, but guarded so a
 * native open failure surfaces a visible error instead of crashing the bundle.
 */
function openDb(): SQLiteDatabase {
  const sqlite = openDatabaseSync('marque.db', { enableChangeListener: true });
  sqlite.execSync('PRAGMA journal_mode = WAL;');
  return sqlite;
}

let sqlite: SQLiteDatabase;
try {
  sqlite = openDb();
} catch (err) {
  dbInitError = err instanceof Error ? err : new Error(String(err));
  reportStartupError(dbInitError);
  // Best-effort in-memory fallback so module evaluation completes and the error
  // screen can render rather than the process dying at import time.
  sqlite = openDatabaseSync(':memory:');
}

export const db = drizzle(sqlite, { schema });
export { schema };
export type Database = typeof db;

/**
 * Applies generated Drizzle migrations on startup (see src/db/migrations,
 * produced by `drizzle-kit generate`). Use in the root layout to gate the app
 * until the schema is ready.
 */
export function useMigrations() {
  return useDrizzleMigrations(db, migrations);
}
