import type { RuleSetConfig, SetConfig, Side } from './config.js';
import type { Action, EngineSnapshot, LoggedAction } from './actions.js';
import type { MatchState, SetScore } from './state.js';
import { resolveGamePoint } from './rules/points.js';
import { tiebreakServeCursor, tiebreakWinner } from './rules/tiebreak.js';
import { serverForCursor, serverForGame } from './rules/serve.js';

const other = (side: Side): Side => (side === 0 ? 1 : 0);
const setsNeeded = (cfg: RuleSetConfig): number => Math.ceil(cfg.match.bestOf / 2);

/**
 * The SetConfig governing a set of the given kind. The super-tiebreak final set
 * is modelled as a one-game set whose game is a tiebreak to 10 — so it reuses
 * the ordinary tiebreak code path with no special-casing.
 */
export function configForSet(kind: 'regular' | 'final', cfg: RuleSetConfig): SetConfig {
  if (kind === 'regular') return cfg.match.regularSet;
  const fs = cfg.match.finalSet;
  switch (fs.kind) {
    case 'full':
      return fs.set ?? cfg.match.regularSet;
    case 'miniSet':
      return (
        fs.set ?? {
          gamesToWin: 4,
          gameMargin: 2,
          tiebreakAtGames: 4,
          ...(cfg.match.regularSet.tiebreak ? { tiebreak: cfg.match.regularSet.tiebreak } : {}),
        }
      );
    case 'superTiebreak':
      return {
        gamesToWin: 1,
        gameMargin: 1,
        tiebreakAtGames: 0,
        ...(fs.superTiebreak ? { tiebreak: fs.superTiebreak } : {}),
      };
  }
}

function openSet(index: number, cfg: RuleSetConfig): SetScore {
  const kind: 'regular' | 'final' = index === cfg.match.bestOf - 1 ? 'final' : 'regular';
  const setCfg = configForSet(kind, cfg);
  const startsInTiebreak = setCfg.tiebreakAtGames === 0;
  return {
    games: [0, 0],
    tiebreak: startsInTiebreak ? { points: [0, 0], winner: null } : null,
    isTiebreak: startsInTiebreak,
    winner: null,
    kind,
  };
}

function withServer(state: MatchState, cfg: RuleSetConfig): MatchState {
  const set = state.sets[state.currentSetIndex]!;
  if (set.isTiebreak && set.tiebreak) {
    const tbCfg = configForSet(set.kind, cfg).tiebreak!;
    const len = cfg.serve.gameServeCycle.length;
    const openerCursor = state.gamesStartedTotal % len;
    const pointsPlayed = set.tiebreak.points[0] + set.tiebreak.points[1];
    const cursor = tiebreakServeCursor(openerCursor, pointsPlayed, tbCfg, len);
    const { slot, side } = serverForCursor(cursor, cfg.serve);
    return { ...state, server: { serverSlot: slot, servingSide: side } };
  }
  const { slot, side } = serverForGame(state.gamesStartedTotal, cfg.serve);
  return { ...state, server: { serverSlot: slot, servingSide: side } };
}

function replaceCurrentSet(state: MatchState, set: SetScore): MatchState {
  const sets = state.sets.slice();
  sets[state.currentSetIndex] = set;
  return { ...state, sets };
}

/** Create a fresh match at 0–0. */
export function initialState(cfg: RuleSetConfig, players: readonly string[]): MatchState {
  const base: MatchState = {
    configId: cfg.id,
    configVersion: cfg.version,
    players: players.slice(),
    sets: [openSet(0, cfg)],
    setsWon: [0, 0],
    currentSetIndex: 0,
    currentGame: { points: [0, 0], winner: null },
    gamesStartedTotal: 0,
    server: { serverSlot: cfg.serve.gameServeCycle[0]!, servingSide: 0 },
    outcome: { type: 'inProgress' },
    complete: false,
    seq: 0,
  };
  return withServer(base, cfg);
}

function closeSet(
  state: MatchState,
  setWinner: Side,
  gamesStartedTotal: number,
  cfg: RuleSetConfig,
): MatchState {
  const setsWon: [number, number] = [state.setsWon[0], state.setsWon[1]];
  setsWon[setWinner] += 1;
  const matchWon = setsWon[setWinner] >= setsNeeded(cfg);

  let next: MatchState = {
    ...state,
    setsWon,
    gamesStartedTotal,
    currentGame: { points: [0, 0], winner: null },
  };

  if (matchWon) {
    next = { ...next, outcome: { type: 'completed', winner: setWinner }, complete: true };
    if (!cfg.match.playOutAfterMatchPoint) return next;
  }

  const nextIndex = state.currentSetIndex + 1;
  next = {
    ...next,
    sets: [...next.sets, openSet(nextIndex, cfg)],
    currentSetIndex: nextIndex,
  };
  return withServer(next, cfg);
}

function closeGame(state: MatchState, gameWinner: Side, cfg: RuleSetConfig): MatchState {
  const set = state.sets[state.currentSetIndex]!;
  const setCfg = configForSet(set.kind, cfg);
  const games: [number, number] = [set.games[0], set.games[1]];
  games[gameWinner] += 1;
  const gamesStartedTotal = state.gamesStartedTotal + 1;

  // Tiebreak trigger (e.g. 6–6).
  if (
    setCfg.tiebreakAtGames != null &&
    setCfg.tiebreakAtGames > 0 &&
    games[0] === setCfg.tiebreakAtGames &&
    games[1] === setCfg.tiebreakAtGames
  ) {
    const next = replaceCurrentSet(
      { ...state, gamesStartedTotal, currentGame: { points: [0, 0], winner: null } },
      { ...set, games, isTiebreak: true, tiebreak: { points: [0, 0], winner: null } },
    );
    return withServer(next, cfg);
  }

  const lead = games[gameWinner] - games[other(gameWinner)];
  let won = games[gameWinner] >= setCfg.gamesToWin && lead >= setCfg.gameMargin;
  if (setCfg.maxGames != null && games[gameWinner] >= setCfg.maxGames) won = true;

  if (!won) {
    const next = replaceCurrentSet(
      { ...state, gamesStartedTotal, currentGame: { points: [0, 0], winner: null } },
      { ...set, games },
    );
    return withServer(next, cfg);
  }

  const withWinner = replaceCurrentSet(state, { ...set, games, winner: gameWinner });
  return closeSet(withWinner, gameWinner, gamesStartedTotal, cfg);
}

function tiebreakPoint(state: MatchState, side: Side, cfg: RuleSetConfig): MatchState {
  const set = state.sets[state.currentSetIndex]!;
  const tb = set.tiebreak!;
  const tbCfg = configForSet(set.kind, cfg).tiebreak!;
  const points: [number, number] = [tb.points[0], tb.points[1]];
  points[side] += 1;
  const winner = tiebreakWinner(points, tbCfg);

  if (winner === null) {
    const next = replaceCurrentSet(state, { ...set, tiebreak: { points, winner: null } });
    return withServer(next, cfg);
  }

  // Tiebreak win directly decides the set (a TB win = one game = the set).
  const games: [number, number] = [set.games[0], set.games[1]];
  games[winner] += 1;
  const gamesStartedTotal = state.gamesStartedTotal + 1;
  const closedSet = replaceCurrentSet(state, {
    ...set,
    games,
    tiebreak: { points, winner },
    isTiebreak: false,
    winner,
  });
  return closeSet(closedSet, winner, gamesStartedTotal, cfg);
}

function awardPoint(state: MatchState, side: Side, cfg: RuleSetConfig): MatchState {
  const set = state.sets[state.currentSetIndex]!;
  if (set.isTiebreak) return tiebreakPoint(state, side, cfg);

  const points: [number, number] = [state.currentGame.points[0], state.currentGame.points[1]];
  points[side] += 1;
  const winner = resolveGamePoint(points, cfg.point);
  if (winner === null) {
    return { ...state, currentGame: { points, winner: null } };
  }
  return closeGame(state, side, cfg);
}

/** True when the match is over and no further scoring input should apply. */
function isFrozen(state: MatchState, cfg: RuleSetConfig): boolean {
  if (!state.complete) return false;
  // A retirement always freezes; a natural win freezes unless playOut is on.
  return !(cfg.match.playOutAfterMatchPoint && state.outcome.type === 'completed');
}

/**
 * The single pure reduction step. `nextState = reduce(state, action, cfg)`.
 * UNDO is handled at the log level (see applyAction) and is a no-op here.
 */
export function reduce(state: MatchState, action: Action, cfg: RuleSetConfig): MatchState {
  const bump = (s: MatchState): MatchState => ({ ...s, seq: state.seq + 1 });

  switch (action.type) {
    case 'UNDO':
      return state;

    case 'REPLAY':
      return bump(state);

    case 'RETIRE': {
      if (state.outcome.type !== 'inProgress') return bump(state);
      return bump({
        ...state,
        outcome: { type: 'retired', winner: other(action.side), retiree: action.side },
        complete: true,
      });
    }

    case 'PENALTY': {
      if (isFrozen(state, cfg)) return bump(state);
      const beneficiary = other(action.side);
      const set = state.sets[state.currentSetIndex]!;
      if (action.unit === 'game' && !set.isTiebreak) {
        return bump(closeGame(state, beneficiary, cfg));
      }
      return bump(awardPoint(state, beneficiary, cfg));
    }

    case 'POINT_TO': {
      if (isFrozen(state, cfg)) return bump(state);
      return bump(awardPoint(state, action.side, cfg));
    }
  }
}

/** Re-derive the full MatchState from a snapshot by folding its action log. */
export function foldLog(snap: EngineSnapshot, cfg: RuleSetConfig): MatchState {
  let state = initialState(cfg, snap.players);
  for (const action of snap.log) {
    state = reduce(state, action, cfg);
  }
  return state;
}

/**
 * Apply an action to a snapshot, returning the new snapshot AND derived state.
 * This is the app-facing entry point. UNDO truncates the log; everything else
 * appends. Free crash-resume and perfect undo fall out of the log-fold design.
 */
export function applyAction(
  snap: EngineSnapshot,
  action: Action,
  cfg: RuleSetConfig,
): { snapshot: EngineSnapshot; state: MatchState } {
  if (action.type === 'UNDO') {
    const log = snap.log.slice(0, -1);
    const next: EngineSnapshot = { ...snap, log };
    return { snapshot: next, state: foldLog(next, cfg) };
  }
  const log: LoggedAction[] = [...snap.log, action];
  const next: EngineSnapshot = { ...snap, log };
  return { snapshot: next, state: foldLog(next, cfg) };
}

/** Build an empty snapshot for a new match. */
export function newSnapshot(cfg: RuleSetConfig, players: readonly string[]): EngineSnapshot {
  return { configId: cfg.id, configVersion: cfg.version, players: players.slice(), log: [] };
}
