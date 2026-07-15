/**
 * A single-elimination match slot.
 *
 * `a`/`b` are the two competitors (team or player ids). A `null` side is either
 * an unfilled bye (its feeder had no entrant) or a not-yet-decided feeder (the
 * upstream match hasn't produced a winner). `winner` is the id that advances,
 * or `null` while the match is still pending. A bye resolves automatically: a
 * match with exactly one real side sets that side as the winner with no result.
 */
export interface BracketMatch {
  readonly round: number;
  readonly slot: number;
  readonly a: string | null;
  readonly b: string | null;
  readonly winner: string | null;
}

/** A recorded outcome for one contested match: the id that advances. */
export interface BracketResult {
  readonly round: number;
  readonly slot: number;
  readonly winner: string;
}

/**
 * A whole single-elimination bracket as one serializable value. `results` is
 * the append-only source of truth (which contested match was won by whom);
 * `rounds` and `champion` are deterministically derived from `seeds` + `results`
 * so the bracket resumes byte-identically from either.
 */
export interface Bracket {
  readonly seeds: readonly string[];
  /** Bracket size (a power of two ≥ the number of seeds). */
  readonly size: number;
  readonly results: readonly BracketResult[];
  /** Every round, index 0 = first round, last = the final (a single match). */
  readonly rounds: readonly (readonly BracketMatch[])[];
  /** The overall winner once the final is decided, else `null`. */
  readonly champion: string | null;
}

/** Next power of two ≥ n. */
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
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

/** The first-round slot layout (competitor placement only, no winners yet). */
function firstRoundSlots(seeds: readonly string[]): { a: string | null; b: string | null }[] {
  const size = nextPowerOfTwo(Math.max(seeds.length, 1));
  const order = seedOrder(size);
  const count = Math.max(1, Math.floor(size / 2));
  const slots: { a: string | null; b: string | null }[] = [];
  for (let i = 0; i < count; i++) {
    const a = order[i * 2]!;
    const b = order[i * 2 + 1]!;
    slots.push({
      a: a <= seeds.length ? seeds[a - 1]! : null,
      b: b <= seeds.length ? seeds[b - 1]! : null,
    });
  }
  return slots;
}

/**
 * Seed a single-elimination bracket. Seeds are placed so the top seeds meet
 * latest; empty slots become byes (null). Returns only the first round, with
 * byes already auto-resolved (equivalent to `createBracket(seeds).rounds[0]`).
 */
export function seedBracket(seeds: readonly string[]): BracketMatch[] {
  return createBracket(seeds).rounds[0]!.map((m) => ({ ...m }));
}

/**
 * Resolve the full bracket from `seeds` + `results`. This is the single pure
 * function every public operation funnels through: it rebuilds all rounds from
 * scratch each time, auto-advancing byes and propagating winners forward, so it
 * is idempotent and self-correcting (a result that no longer names a current
 * participant — e.g. after an upstream result is changed — is simply dropped).
 */
function build(seeds: readonly string[], results: readonly BracketResult[]): Bracket {
  const size = nextPowerOfTwo(Math.max(seeds.length, 1));
  const rounds: BracketMatch[][] = [];
  const applied: BracketResult[] = [];

  // Base competitor placement for the current round (a/b only).
  let base = firstRoundSlots(seeds);
  // Whether each match in the PREVIOUS round has a determined outcome. A side
  // in the next round is a real bye only when its feeder is settled-but-empty;
  // a `null` from a still-pending feeder must NOT auto-advance the opponent.
  let prevSettled: boolean[] | null = null;

  for (let round = 0; ; round++) {
    const resolved: BracketMatch[] = [];
    const settled: boolean[] = [];

    for (let slot = 0; slot < base.length; slot++) {
      const { a, b } = base[slot]!;
      const aKnown = round === 0 ? true : prevSettled![slot * 2]!;
      const bKnown = round === 0 ? true : prevSettled![slot * 2 + 1]!;

      let winner: string | null = null;
      let isSettled: boolean;

      if (!aKnown || !bKnown) {
        // Waiting on an upstream feeder — nothing to decide yet.
        isSettled = false;
      } else if (a !== null && b !== null) {
        const rec = results.find((r) => r.round === round && r.slot === slot);
        if (rec && (rec.winner === a || rec.winner === b)) {
          winner = rec.winner;
          isSettled = true;
          applied.push({ round, slot, winner });
        } else {
          isSettled = false;
        }
      } else if (a !== null) {
        winner = a; // bye
        isSettled = true;
      } else if (b !== null) {
        winner = b; // bye
        isSettled = true;
      } else {
        winner = null; // empty (both feeders were empty)
        isSettled = true;
      }

      resolved.push({ round, slot, a, b, winner });
      settled.push(isSettled);
    }

    rounds.push(resolved);

    if (resolved.length <= 1) {
      const champion = resolved[0]?.winner ?? null;
      return { seeds: [...seeds], size, results: applied, rounds, champion };
    }

    const next: { a: string | null; b: string | null }[] = [];
    for (let i = 0; i < resolved.length / 2; i++) {
      next.push({ a: resolved[i * 2]!.winner, b: resolved[i * 2 + 1]!.winner });
    }
    base = next;
    prevSettled = settled;
  }
}

/** Create a fresh bracket from a seed list. Byes are auto-advanced immediately. */
export function createBracket(seeds: readonly string[]): Bracket {
  return build(seeds, []);
}

/** Find a match by coordinates, or `undefined`. */
export function bracketMatch(bracket: Bracket, round: number, slot: number): BracketMatch | undefined {
  return bracket.rounds[round]?.[slot];
}

/**
 * Contested matches ready to be played: both competitors present and no winner
 * yet. Byes (already auto-advanced) and pending feeders (a `null` side) are
 * excluded, so this is exactly the set a UI should surface as "playable now".
 */
export function pendingMatches(bracket: Bracket): BracketMatch[] {
  const out: BracketMatch[] = [];
  for (const round of bracket.rounds) {
    for (const m of round) {
      if (m.a !== null && m.b !== null && m.winner === null) out.push(m);
    }
  }
  return out;
}

/**
 * Record the winner of a single contested match and propagate it forward,
 * auto-advancing any byes it unlocks. No-op if the coordinates don't exist, the
 * match is a bye/pending (not user-decidable), or `winner` isn't one of its two
 * competitors. Re-recording the same match replaces the prior result.
 */
export function recordBracketResult(
  bracket: Bracket,
  round: number,
  slot: number,
  winner: string,
): Bracket {
  const match = bracketMatch(bracket, round, slot);
  if (!match || match.a === null || match.b === null) return bracket;
  if (winner !== match.a && winner !== match.b) return bracket;
  const results = [
    ...bracket.results.filter((r) => !(r.round === round && r.slot === slot)),
    { round, slot, winner },
  ];
  return build(bracket.seeds, results);
}

/**
 * Apply a batch of results at once. Results are folded in bracket order (earlier
 * rounds first) so downstream matches see their unlocked competitors; any result
 * whose match isn't yet playable is ignored.
 */
export function advanceBracket(bracket: Bracket, results: readonly BracketResult[]): Bracket {
  const ordered = [...results].sort((x, y) => x.round - y.round || x.slot - y.slot);
  return ordered.reduce((b, r) => recordBracketResult(b, r.round, r.slot, r.winner), bracket);
}

/** True once the final has produced a champion. */
export function bracketIsComplete(bracket: Bracket): boolean {
  return bracket.champion !== null;
}
