/**
 * Pure, timezone-deterministic date decomposition. We read the wall-clock
 * fields straight from the ISO string and compute the weekday with Zeller's
 * congruence — so time-of-day and day-of-week stats never depend on the host's
 * timezone or the JS Date parser. The app stores each match's local wall-clock
 * ISO, and these read exactly what was written.
 */

export interface IsoParts {
  readonly year: number;
  readonly month: number; // 1–12
  readonly day: number; // 1–31
  readonly hour: number; // 0–23
}

/** Parse a fixed-width numeric field, falling back if empty or non-numeric. */
function field(iso: string, start: number, end: number, fallback: number): number {
  const slice = iso.slice(start, end);
  if (slice.length < end - start) return fallback;
  const n = Number(slice);
  return Number.isFinite(n) ? n : fallback;
}

/** Read Y/M/D/H from an ISO-8601 string (YYYY-MM-DD[THH...]). */
export function isoParts(iso: string): IsoParts {
  return {
    year: field(iso, 0, 4, 1970),
    month: field(iso, 5, 7, 1),
    day: field(iso, 8, 10, 1),
    hour: field(iso, 11, 13, 0),
  };
}

export type Weekday = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
const WEEKDAYS: readonly Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Day of week via Zeller's congruence (0 = Sunday). Pure — no Date. */
export function weekdayIndex(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m < 3) {
    m += 12;
    y -= 1;
  }
  const k = y % 100;
  const j = Math.floor(y / 100);
  const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
  // Zeller: 0 = Saturday. Convert to 0 = Sunday.
  return (h + 6) % 7;
}

export function weekdayOf(iso: string): Weekday {
  const { year, month, day } = isoParts(iso);
  return WEEKDAYS[weekdayIndex(year, month, day)]!;
}

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

/** Bucket a wall-clock hour into a part of day. */
export function timeBucketOf(hour: number): TimeBucket {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night';
}

export { WEEKDAYS };
