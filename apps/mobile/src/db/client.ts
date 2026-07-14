import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

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
