import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations as useDrizzleMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';
import migrations from './migrations/migrations';

/**
 * The on-device SQLite database — the source of truth. WAL mode for fast,
 * synchronous writes so scoring persists before the UI confirms (the
 * reliability pillar). Opened synchronously at module load.
 */
const sqlite = openDatabaseSync('marque.db', { enableChangeListener: true });
sqlite.execSync('PRAGMA journal_mode = WAL;');

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
