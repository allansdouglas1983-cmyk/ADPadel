import type { MatchRecord } from './types.js';
import { timeBucketOf, weekdayOf, isoParts, type TimeBucket, type Weekday, WEEKDAYS } from './datetime.js';

export interface Bucket<K> {
  readonly key: K;
  readonly matches: number;
  readonly wins: number;
  readonly winRate: number;
}

type Side = 0 | 1;
function sideOf(r: MatchRecord, playerId: string): Side | null {
  if (r.teamA.includes(playerId)) return 0;
  if (r.teamB.includes(playerId)) return 1;
  return null;
}

function aggregate<K>(
  records: readonly MatchRecord[],
  playerId: string,
  keyOf: (r: MatchRecord) => K,
  order: readonly K[],
): Bucket<K>[] {
  const acc = new Map<K, { matches: number; wins: number }>();
  for (const r of records) {
    const side = sideOf(r, playerId);
    if (side === null) continue;
    const key = keyOf(r);
    const cur = acc.get(key) ?? { matches: 0, wins: 0 };
    cur.matches += 1;
    if (r.winner === side) cur.wins += 1;
    acc.set(key, cur);
  }
  return order
    .filter((k) => acc.has(k))
    .map((k) => {
      const v = acc.get(k)!;
      return { key: k, matches: v.matches, wins: v.wins, winRate: v.matches === 0 ? 0 : v.wins / v.matches };
    });
}

const TIME_ORDER: readonly TimeBucket[] = ['morning', 'afternoon', 'evening', 'night'];

/** Win-rate and volume by part of day (from each match's local wall-clock hour). */
export function timeOfDayPattern(records: readonly MatchRecord[], playerId: string): Bucket<TimeBucket>[] {
  return aggregate(records, playerId, (r) => timeBucketOf(isoParts(r.startedAtIso).hour), TIME_ORDER);
}

/** Win-rate and volume by day of week. */
export function dayOfWeekPattern(records: readonly MatchRecord[], playerId: string): Bucket<Weekday>[] {
  return aggregate(records, playerId, (r) => weekdayOf(r.startedAtIso), WEEKDAYS);
}
