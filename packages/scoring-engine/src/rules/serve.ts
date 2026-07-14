import type { ServeConfig, Side } from '../config.js';

/** Resolve the serving player-slot and side for a normal (non-tiebreak) game. */
export function serverForGame(
  gamesStartedTotal: number,
  serve: ServeConfig,
): { slot: number; side: Side } {
  const cycle = serve.gameServeCycle;
  const slot = cycle[gamesStartedTotal % cycle.length]!;
  return { slot, side: serve.slotSide[slot]! };
}

/** Resolve the serving player-slot and side for a given cycle cursor. */
export function serverForCursor(cursor: number, serve: ServeConfig): { slot: number; side: Side } {
  const slot = serve.gameServeCycle[cursor % serve.gameServeCycle.length]!;
  return { slot, side: serve.slotSide[slot]! };
}
