/** A single-elimination match slot; a null side is an unfilled/bye slot. */
export interface BracketMatch {
  readonly round: number;
  readonly slot: number;
  readonly a: string | null;
  readonly b: string | null;
}

/** Next power of two ≥ n. */
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Seed a single-elimination bracket. Seeds are placed so the top seeds meet
 * latest; empty slots become byes (null). Returns only the first round — later
 * rounds are derived as results come in.
 */
export function seedBracket(seeds: readonly string[]): BracketMatch[] {
  const size = nextPowerOfTwo(Math.max(seeds.length, 1));
  const order = seedOrder(size);
  const first: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const a = order[i * 2]!;
    const b = order[i * 2 + 1]!;
    first.push({
      round: 0,
      slot: i,
      a: a <= seeds.length ? seeds[a - 1]! : null,
      b: b <= seeds.length ? seeds[b - 1]! : null,
    });
  }
  return first;
}

/** Standard seed placement order (1 vs last, etc.) for a bracket of `size`. */
function seedOrder(size: number): number[] {
  let rounds: number[] = [1, 2];
  while (rounds.length < size) {
    const n = rounds.length * 2;
    const next: number[] = [];
    for (const s of rounds) {
      next.push(s);
      next.push(n + 1 - s);
    }
    rounds = next;
  }
  return rounds;
}
