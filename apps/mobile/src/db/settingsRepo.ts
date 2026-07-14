import { eq } from 'drizzle-orm';
import { db } from './client';
import { appSettings } from './schema';

/** Read a persisted app setting (string), or a fallback. */
export function getSetting(key: string, fallback = ''): string {
  const row = db.select({ v: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).get();
  return row?.v ?? fallback;
}

/** Persist an app setting. */
export function setSetting(key: string, value: string): void {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}
