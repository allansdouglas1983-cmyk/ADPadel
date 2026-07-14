/** Rotate all elements except the first (circle method for round-robin). */
export function rotateKeepingFirst<T>(arr: readonly T[], by: number): T[] {
  if (arr.length <= 1) return arr.slice();
  const head = arr[0]!;
  const tail = arr.slice(1);
  const n = tail.length;
  const k = ((by % n) + n) % n;
  return [head, ...tail.slice(k), ...tail.slice(0, k)];
}

/** How many players are active (a multiple of 4 that fits the courts). */
export function activeCount(numPlayers: number, courts: number): number {
  const capacity = courts * 4;
  const roundedDown = numPlayers - (numPlayers % 4);
  return Math.max(0, Math.min(capacity, roundedDown));
}

/**
 * Indices of the players resting this round, rotated so that rest is shared
 * fairly across rounds (each player sits out roughly equally).
 */
export function restingIndices(numPlayers: number, roundIndex: number, sitCount: number): number[] {
  if (sitCount <= 0) return [];
  const base = roundIndex * sitCount;
  const out: number[] = [];
  for (let k = 0; k < sitCount; k++) out.push((base + k) % numPlayers);
  return out;
}

/** Split a foursome into two balanced teams by one of the three combinations. */
export function splitFoursome(group: readonly string[], combo: number): [string[], string[]] {
  const [a, b, c, d] = group;
  switch (((combo % 3) + 3) % 3) {
    case 0:
      return [[a!, b!], [c!, d!]];
    case 1:
      return [[a!, c!], [b!, d!]];
    default:
      return [[a!, d!], [b!, c!]];
  }
}
