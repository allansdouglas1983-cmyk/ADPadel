import type { PlayedCourt } from './standings.js';
import type { Side, Standing } from './types.js';
import { rankStandings, tallyStandings } from './standings.js';

/**
 * King (Queen) of the Court — winners stay on, challengers rotate in from a
 * shared queue. Each court holds two pairs; when a match reaches the point
 * target the winning pair stays, the losing pair joins the back of the queue,
 * and the next waiting pair comes on. With an empty queue the two pairs simply
 * replay. Standings accumulate per player from a running match history, so the
 * viral leaderboard works exactly as in the other formats.
 */

export interface KingPair {
  readonly id: string;
  readonly players: readonly [string, string];
}

export interface KingCourt {
  readonly court: number;
  readonly a: KingPair | null;
  readonly b: KingPair | null;
  readonly pointsA: number;
  readonly pointsB: number;
}

export interface KingState {
  readonly courts: readonly KingCourt[];
  readonly queue: readonly KingPair[];
  readonly pointsPerMatch: number;
  readonly history: readonly PlayedCourt[];
}

export function createKingOfCourt(
  pairs: readonly (readonly [string, string])[],
  courts: number,
  pointsPerMatch: number,
): KingState {
  const kingPairs: KingPair[] = pairs.map((players, i) => ({ id: `KP${i}`, players }));
  const courtList: KingCourt[] = [];
  let cursor = 0;
  for (let c = 0; c < courts; c++) {
    const a = kingPairs[cursor++] ?? null;
    const b = kingPairs[cursor++] ?? null;
    courtList.push({ court: c, a, b, pointsA: 0, pointsB: 0 });
  }
  return { courts: courtList, queue: kingPairs.slice(cursor), pointsPerMatch, history: [] };
}

export function kingCourtComplete(court: KingCourt, pointsPerMatch: number): boolean {
  return court.a !== null && court.b !== null && court.pointsA + court.pointsB >= pointsPerMatch;
}

function replaceCourt(state: KingState, courtIndex: number, court: KingCourt): KingCourt[] {
  return state.courts.map((c, i) => (i === courtIndex ? court : c));
}

/** Award one rally point; resolves the court (winner stays) when it completes. */
export function kingScore(state: KingState, courtIndex: number, side: Side): KingState {
  const court = state.courts[courtIndex];
  if (!court || !court.a || !court.b || kingCourtComplete(court, state.pointsPerMatch)) return state;

  const scored: KingCourt = {
    ...court,
    pointsA: side === 0 ? court.pointsA + 1 : court.pointsA,
    pointsB: side === 1 ? court.pointsB + 1 : court.pointsB,
  };
  if (!kingCourtComplete(scored, state.pointsPerMatch)) {
    return { ...state, courts: replaceCourt(state, courtIndex, scored) };
  }

  // Resolve: record the result, winner stays, loser to the back of the queue.
  const winner = scored.pointsA > scored.pointsB ? scored.a! : scored.b!;
  const loser = winner === scored.a ? scored.b! : scored.a!;
  const played: PlayedCourt = {
    teamA: scored.a!.players,
    teamB: scored.b!.players,
    pointsA: scored.pointsA,
    pointsB: scored.pointsB,
  };

  const next = state.queue[0] ?? null;
  const newQueue = next ? [...state.queue.slice(1), loser] : state.queue;
  const challenger = next ?? loser; // empty queue → the two pairs replay
  const resolved: KingCourt = { court: court.court, a: winner, b: challenger, pointsA: 0, pointsB: 0 };

  return {
    ...state,
    courts: replaceCourt(state, courtIndex, resolved),
    queue: newQueue,
    history: [...state.history, played],
  };
}

/** The live King of the Court leaderboard. */
export function kingStandings(state: KingState): Standing[] {
  const { standings, headToHead } = tallyStandings(state.history);
  return rankStandings(standings, headToHead);
}
