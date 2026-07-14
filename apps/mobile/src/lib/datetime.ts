/**
 * The device's LOCAL wall-clock time as an ISO-like string (no timezone suffix),
 * e.g. "2026-07-14T20:35:00". Stored per match so the stats engine's time-of-day
 * and day-of-week patterns reflect when the player actually played — not UTC.
 * (`Date.prototype.toISOString()` would force UTC, which is wrong for this.)
 */
export function localWallClockIso(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
