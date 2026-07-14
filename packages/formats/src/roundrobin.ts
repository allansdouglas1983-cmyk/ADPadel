/** A fixture between two teams (by id) in a round-robin round. */
export interface Fixture {
  readonly teamA: string;
  readonly teamB: string;
}

/**
 * Round-robin fixtures (fixed teams) via the circle method: every team plays
 * every other exactly once. A 'BYE' opponent appears for odd team counts.
 */
export function roundRobinRounds(teams: readonly string[]): Fixture[][] {
  const list = teams.slice();
  if (list.length % 2 === 1) list.push('BYE');
  const n = list.length;
  const rounds: Fixture[][] = [];
  const arr = list.slice();
  for (let r = 0; r < n - 1; r++) {
    const fixtures: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i]!;
      const b = arr[n - 1 - i]!;
      if (a !== 'BYE' && b !== 'BYE') fixtures.push({ teamA: a, teamB: b });
    }
    rounds.push(fixtures);
    // rotate keeping the first element fixed
    arr.splice(1, 0, arr.pop()!);
  }
  return rounds;
}
