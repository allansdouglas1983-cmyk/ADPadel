import type { Standing } from './types.js';

/** One played court: the two teams and the points each banked. */
export interface PlayedCourt {
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
  readonly pointsA: number;
  readonly pointsB: number;
}

/** Accumulate per-player standings and pairwise head-to-head from played courts. */
export function tallyStandings(courts: readonly PlayedCourt[]): {
  standings: Standing[];
  headToHead: Map<string, Map<string, number>>;
} {
  const acc = new Map<string, Standing>();
  const h2h = new Map<string, Map<string, number>>();

  const ensure = (id: string): Standing =>
    acc.get(id) ?? { playerId: id, pointsFor: 0, pointsAgainst: 0, played: 0, wins: 0 };

  const addH2H = (x: string, y: string, net: number): void => {
    const row = h2h.get(x) ?? new Map<string, number>();
    row.set(y, (row.get(y) ?? 0) + net);
    h2h.set(x, row);
  };

  for (const court of courts) {
    const aWon = court.pointsA > court.pointsB ? 1 : 0;
    const bWon = court.pointsB > court.pointsA ? 1 : 0;
    for (const p of court.teamA) {
      const s = ensure(p);
      acc.set(p, {
        ...s,
        pointsFor: s.pointsFor + court.pointsA,
        pointsAgainst: s.pointsAgainst + court.pointsB,
        played: s.played + 1,
        wins: s.wins + aWon,
      });
    }
    for (const p of court.teamB) {
      const s = ensure(p);
      acc.set(p, {
        ...s,
        pointsFor: s.pointsFor + court.pointsB,
        pointsAgainst: s.pointsAgainst + court.pointsA,
        played: s.played + 1,
        wins: s.wins + bWon,
      });
    }
    for (const a of court.teamA) {
      for (const b of court.teamB) {
        addH2H(a, b, court.pointsA - court.pointsB);
        addH2H(b, a, court.pointsB - court.pointsA);
      }
    }
  }

  return { standings: [...acc.values()], headToHead: h2h };
}

const diff = (s: Standing): number => s.pointsFor - s.pointsAgainst;

/**
 * Rank standings with the dossier tie-break order: point difference, then total
 * points, then head-to-head, then a stable id fallback.
 */
export function rankStandings(
  standings: readonly Standing[],
  headToHead?: Map<string, Map<string, number>>,
): Standing[] {
  return [...standings].sort((a, b) => {
    if (diff(b) !== diff(a)) return diff(b) - diff(a);
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    const h = headToHead?.get(a.playerId)?.get(b.playerId) ?? 0;
    if (h !== 0) return h > 0 ? -1 : 1;
    return a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0;
  });
}
