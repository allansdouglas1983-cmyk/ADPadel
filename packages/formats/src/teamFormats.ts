import type { CourtPairing, Round } from './types.js';
import { rotateKeepingFirst } from './rotation.js';
import { roundRobinRounds } from './roundrobin.js';

/**
 * Team Americano — partnerships are FIXED; the pairs play a round-robin against
 * each other, spread across the available courts. Both partners bank the team's
 * points individually, exactly like Americano, so standings still work per
 * player. Pairs that don't fit the courts this round rest (and rotate in later
 * rounds because the round-robin schedule advances).
 */
export function teamAmericanoRound(
  pairs: readonly (readonly [string, string])[],
  roundIndex: number,
  courts: number,
): Round {
  const teamIds = pairs.map((_, i) => `T${i}`);
  const schedule = roundRobinRounds(teamIds);
  const fixtures = schedule.length > 0 ? schedule[roundIndex % schedule.length]! : [];

  const courtsOut: CourtPairing[] = [];
  const usable = Math.min(courts, fixtures.length);
  for (let c = 0; c < usable; c++) {
    const f = fixtures[c]!;
    const ai = Number(f.teamA.slice(1));
    const bi = Number(f.teamB.slice(1));
    courtsOut.push({ court: c, teamA: [...pairs[ai]!], teamB: [...pairs[bi]!] });
  }

  const playing = new Set(courtsOut.flatMap((c) => [...c.teamA, ...c.teamB]));
  const sittingOut = pairs.flatMap((p) => [...p]).filter((id) => !playing.has(id));
  return { index: roundIndex, courts: courtsOut, sittingOut };
}

/**
 * Mixed Americano — every team is exactly one man + one woman. Men and women are
 * paired by a rotating offset so partnerships vary round to round, then teams are
 * matched two-per-court. Spare men/women (unequal counts) rest fairly as the
 * rotation advances.
 */
export function mixedAmericanoRound(
  men: readonly string[],
  women: readonly string[],
  roundIndex: number,
  courts: number,
): Round {
  const count = Math.min(men.length, women.length);
  const teams: Array<readonly [string, string]> = [];
  for (let i = 0; i < count; i++) {
    // A rotating, wrap-around pairing keeps every team one-man-one-woman.
    teams.push([men[i]!, women[(i + roundIndex) % women.length]!]);
  }

  const rotated = rotateKeepingFirst(teams, roundIndex);
  const courtsOut: CourtPairing[] = [];
  const usable = Math.min(courts, Math.floor(rotated.length / 2));
  for (let c = 0; c < usable; c++) {
    const tA = rotated[c * 2]!;
    const tB = rotated[c * 2 + 1]!;
    courtsOut.push({ court: c, teamA: [...tA], teamB: [...tB] });
  }

  const playing = new Set(courtsOut.flatMap((c) => [...c.teamA, ...c.teamB]));
  const sittingOut = [...men, ...women].filter((id) => !playing.has(id));
  return { index: roundIndex, courts: courtsOut, sittingOut };
}
