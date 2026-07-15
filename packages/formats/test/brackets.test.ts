import { describe, expect, it } from 'vitest';
import type { Bracket, BracketMatch } from '../src/index.js';
import {
  advanceBracket,
  bracketIsComplete,
  bracketMatch,
  createBracket,
  nextPowerOfTwo,
  pendingMatches,
  recordBracketResult,
  roundRobinRounds,
  seedBracket,
} from '../src/index.js';

describe('roundRobinRounds', () => {
  it('every team plays every other exactly once', () => {
    const teams = ['t1', 't2', 't3', 't4'];
    const rounds = roundRobinRounds(teams);
    const seen = new Set<string>();
    for (const round of rounds) {
      for (const f of round) seen.add([f.teamA, f.teamB].sort().join('-'));
    }
    expect(seen.size).toBe(6); // C(4,2)
    expect(rounds).toHaveLength(3);
  });

  it('handles an odd number of teams with byes', () => {
    const rounds = roundRobinRounds(['t1', 't2', 't3']);
    // 3 teams → 3 rounds, one team rests each round
    expect(rounds).toHaveLength(3);
    for (const round of rounds) expect(round.length).toBeLessThanOrEqual(1);
  });
});

describe('knockout bracket', () => {
  it('rounds up to a power of two', () => {
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(1)).toBe(1);
  });

  it('seeds top vs bottom and byes the empty slots', () => {
    const first = seedBracket(['s1', 's2', 's3', 's4', 's5', 's6']);
    expect(first).toHaveLength(4); // bracket of 8
    // Top seed s1 should face a bye (only 6 of 8 filled → seeds 7,8 empty)
    const s1Match = first.find((m) => m.a === 's1' || m.b === 's1')!;
    expect(s1Match.a === null || s1Match.b === null).toBe(true);
  });

  it('seedBracket equals the created bracket\'s first round with byes auto-resolved', () => {
    const seeds = ['s1', 's2', 's3', 's4', 's5', 's6'];
    const first = seedBracket(seeds);
    expect(first).toEqual(createBracket(seeds).rounds[0]);
    // s1's bye is already resolved to s1 as the winner.
    const s1Match = first.find((m) => m.a === 's1' || m.b === 's1')!;
    expect(s1Match.winner).toBe('s1');
  });
});

/** Drive a bracket to completion, always advancing whichever side sits in `a`. */
function playOut(start: Bracket): Bracket {
  let b = start;
  let guard = 0;
  while (!bracketIsComplete(b)) {
    const playable = pendingMatches(b);
    expect(playable.length).toBeGreaterThan(0);
    b = advanceBracket(
      b,
      playable.map((m) => ({ round: m.round, slot: m.slot, winner: m.a! })),
    );
    if (++guard > 100) throw new Error('bracket did not converge');
  }
  return b;
}

describe('bracket advancement', () => {
  it('models every round explicitly, halving down to a single final', () => {
    const b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']);
    expect(b.size).toBe(8);
    expect(b.rounds.map((r) => r.length)).toEqual([4, 2, 1]);
    expect(b.champion).toBeNull();
    expect(bracketIsComplete(b)).toBe(false);
  });

  it('plays a full 8-competitor bracket (no byes) through to a champion', () => {
    let b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']);
    // Round 0: advance the `a` side of each match.
    expect(pendingMatches(b)).toHaveLength(4);
    b = advanceBracket(
      b,
      b.rounds[0]!.map((m) => ({ round: 0, slot: m.slot, winner: m.a! })),
    );
    // Round 1 is now populated and playable.
    expect(pendingMatches(b)).toHaveLength(2);
    expect(b.rounds[1]!.every((m) => m.a !== null && m.b !== null)).toBe(true);
    b = advanceBracket(
      b,
      b.rounds[1]!.map((m) => ({ round: 1, slot: m.slot, winner: m.a! })),
    );
    // Final.
    const final = b.rounds[2]![0]!;
    expect(final.a).not.toBeNull();
    expect(final.b).not.toBeNull();
    b = recordBracketResult(b, 2, 0, final.a!);
    expect(bracketIsComplete(b)).toBe(true);
    expect(b.champion).toBe(final.a);
  });

  it('auto-advances byes into the next round without a recorded result', () => {
    // 6 of 8 → seeds 7 & 8 empty → top two seeds get byes.
    const b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6']);
    // Byes are resolved in round 0; only the two contested matches are playable.
    const playable = pendingMatches(b);
    expect(playable).toHaveLength(2);
    expect(playable.every((m) => m.a !== null && m.b !== null)).toBe(true);
    // The bye winners are already sitting in round 1, waiting on their opponents.
    const r1 = b.rounds[1]!;
    const filledSides = r1.flatMap((m) => [m.a, m.b]).filter((x) => x !== null);
    expect(filledSides.sort()).toEqual(['s1', 's2']);
  });

  it('plays a bye-heavy bracket all the way to a champion', () => {
    const b = playOut(createBracket(['s1', 's2', 's3', 's4', 's5', 's6']));
    // Advancing the `a`/top side throughout, the tournament's top seed wins.
    expect(b.champion).toBe('s1');
    expect(bracketIsComplete(b)).toBe(true);
  });

  it('handles a 5-competitor (three-bye) bracket', () => {
    const b = playOut(createBracket(['s1', 's2', 's3', 's4', 's5']));
    expect(b.size).toBe(8);
    expect(b.champion).toBe('s1');
  });

  it('treats a single competitor as an immediate champion', () => {
    const b = createBracket(['solo']);
    expect(b.size).toBe(1);
    expect(b.champion).toBe('solo');
    expect(bracketIsComplete(b)).toBe(true);
    expect(pendingMatches(b)).toHaveLength(0);
  });

  it('decides a two-competitor bracket with one result', () => {
    let b = createBracket(['s1', 's2']);
    expect(b.rounds).toHaveLength(1);
    expect(bracketIsComplete(b)).toBe(false);
    b = recordBracketResult(b, 0, 0, 's2');
    expect(b.champion).toBe('s2');
  });

  it('does not auto-advance a competitor whose opponent is still pending', () => {
    let b = createBracket(['s1', 's2', 's3', 's4']);
    // Decide only one round-0 match. Its winner must WAIT, not walk over.
    const first = b.rounds[0]![0]!;
    b = recordBracketResult(b, 0, 0, first.a!);
    const final = b.rounds[1]![0]!;
    expect(final.winner).toBeNull();
    // The final has one known side and one still-pending (null) side.
    expect([final.a, final.b].filter((x) => x !== null)).toEqual([first.a]);
    expect(bracketIsComplete(b)).toBe(false);
  });

  it('is self-correcting: changing an upstream result invalidates the stale downstream one', () => {
    let b = createBracket(['s1', 's2', 's3', 's4']);
    const m0 = b.rounds[0]![0]!;
    const m1 = b.rounds[0]![1]!;
    b = recordBracketResult(b, 0, 0, m0.a!);
    b = recordBracketResult(b, 0, 1, m1.a!);
    // Decide the final in favour of the slot-0 winner.
    b = recordBracketResult(b, 1, 0, m0.a!);
    expect(b.champion).toBe(m0.a);
    // Now flip round-0 slot-0 to the OTHER competitor: the recorded final winner
    // is no longer a participant, so the champion resets to undecided.
    b = recordBracketResult(b, 0, 0, m0.b!);
    expect(b.champion).toBeNull();
    // The stale final result was pruned from the source-of-truth log.
    expect(b.results.some((r) => r.round === 1)).toBe(false);
  });

  it('no-ops on invalid coordinates, non-participants, and bye matches', () => {
    const b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6']);
    expect(recordBracketResult(b, 9, 0, 's1')).toBe(b); // no such round
    expect(recordBracketResult(b, 0, 9, 's1')).toBe(b); // no such slot
    const contested = pendingMatches(b)[0]!;
    expect(recordBracketResult(b, contested.round, contested.slot, 'ghost')).toBe(b); // not a competitor
    // A bye match cannot be user-decided.
    const bye = b.rounds[0]!.find((m) => m.a === 's1' || m.b === 's1')!;
    expect(recordBracketResult(b, bye.round, bye.slot, 's1')).toBe(b);
  });

  it('ignores a batched result whose match is not yet playable', () => {
    const b = createBracket(['s1', 's2', 's3', 's4']);
    // Try to decide the final before either semifinal — no participants yet.
    const after = advanceBracket(b, [{ round: 1, slot: 0, winner: 's1' }]);
    expect(after.champion).toBeNull();
    expect(after.results).toHaveLength(0);
  });

  it('bracketMatch looks up by coordinates', () => {
    const b = createBracket(['s1', 's2', 's3', 's4']);
    expect(bracketMatch(b, 0, 0)).toEqual(b.rounds[0]![0]);
    expect(bracketMatch(b, 5, 5)).toBeUndefined();
  });

  it('round-trips through JSON byte-identically', () => {
    let b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6']);
    b = advanceBracket(
      b,
      pendingMatches(b).map((m) => ({ round: m.round, slot: m.slot, winner: m.b! })),
    );
    const restored = JSON.parse(JSON.stringify(b)) as Bracket;
    expect(restored).toEqual(b);
    // Rebuilding from the same seeds + results is deterministic.
    expect(advanceBracket(createBracket(b.seeds), b.results)).toEqual(b);
  });

  it('never leaves a playable match with a null side', () => {
    const b = createBracket(['s1', 's2', 's3', 's4', 's5', 's6', 's7']);
    for (const m of pendingMatches(b) as BracketMatch[]) {
      expect(m.a).not.toBeNull();
      expect(m.b).not.toBeNull();
    }
  });
});
