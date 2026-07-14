import { db } from './client';
import { genId } from './createMatch';
import { points } from './schema';

/**
 * Optional per-point logging (only when the user enables logging depth). Records
 * the winner side, serving side/player and an optional shot type — feeding the
 * shot-stat and service-hold analytics without ever being required to score.
 */
export function logPoint(args: {
  matchId: string;
  index: number;
  winnerSide: number;
  serveSide: number | null;
  serverPlayerId: string | null;
  shotType: string | null;
}): void {
  db.insert(points)
    .values({
      id: genId('pt'),
      matchId: args.matchId,
      idx: args.index,
      winnerSide: args.winnerSide,
      serveSide: args.serveSide,
      serverPlayerId: args.serverPlayerId,
      shotType: args.shotType,
    })
    .run();
}
