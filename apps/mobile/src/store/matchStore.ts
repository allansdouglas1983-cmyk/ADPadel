import { create } from 'zustand';
import * as Sentry from '@sentry/react-native';
import type { Action, EngineSnapshot, MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { applyAction, foldLog, newSnapshot } from '@padel/scoring-engine';
import { persistLiveSnapshot } from '../db/matchRepo';

/** Compact score signature for breadcrumbs (sets | current-set games | points). */
function scoreSig(state: MatchState): string {
  const set = state.sets[state.currentSetIndex];
  const games = set ? `${set.games[0]}-${set.games[1]}` : '0-0';
  return `${state.setsWon[0]}-${state.setsWon[1]}|${games}|${state.currentGame.points[0]}-${state.currentGame.points[1]}`;
}

/**
 * Persist synchronously and evidence it via Sentry. A persist failure is THE
 * reliability event ("never lose a match"), so it is captured, not swallowed —
 * but it must never crash the UI, so we re-throw nothing.
 */
function persistWithBreadcrumb(
  matchId: string,
  snap: EngineSnapshot,
  cfg: RuleSetConfig,
  createdAtIso: string,
  crumb: { category: string; message: string; data?: Record<string, unknown> },
): void {
  try {
    persistLiveSnapshot(matchId, snap, cfg, createdAtIso);
    Sentry.addBreadcrumb({ level: 'info', ...crumb });
  } catch (err) {
    Sentry.captureException(err, { tags: { area: 'match-persist', matchId } });
  }
}

interface MatchStore {
  matchId: string | null;
  cfg: RuleSetConfig | null;
  snapshot: EngineSnapshot | null;
  state: MatchState | null;
  createdAtIso: string | null;

  /** Begin a new live match. */
  start: (matchId: string, cfg: RuleSetConfig, players: string[], createdAtIso: string) => void;
  /** Resume a persisted match (crash recovery / relaunch). */
  resume: (matchId: string, cfg: RuleSetConfig, snapshot: EngineSnapshot, createdAtIso: string) => void;
  /** Apply a scoring action, persisting SYNCHRONOUSLY before returning. */
  dispatch: (action: Action) => void;
  /** Clear the live match from memory (does not delete from DB). */
  clear: () => void;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchId: null,
  cfg: null,
  snapshot: null,
  state: null,
  createdAtIso: null,

  start: (matchId, cfg, players, createdAtIso) => {
    const snapshot = newSnapshot(cfg, players);
    const state = foldLog(snapshot, cfg);
    persistWithBreadcrumb(matchId, snapshot, cfg, createdAtIso, {
      category: 'match',
      message: 'start',
      data: { matchId, players: players.length },
    });
    set({ matchId, cfg, snapshot, state, createdAtIso });
  },

  resume: (matchId, cfg, snapshot, createdAtIso) => {
    Sentry.addBreadcrumb({
      level: 'info',
      category: 'match',
      message: 'resume',
      data: { matchId, actions: snapshot.log.length },
    });
    set({ matchId, cfg, snapshot, state: foldLog(snapshot, cfg), createdAtIso });
  },

  dispatch: (action) => {
    const { snapshot, cfg, matchId, createdAtIso } = get();
    if (!snapshot || !cfg || !matchId || !createdAtIso) return;
    const { snapshot: next, state } = applyAction(snapshot, action, cfg);
    // Persist BEFORE updating the UI — the score is durable the instant it shows.
    persistWithBreadcrumb(matchId, next, cfg, createdAtIso, {
      category: 'scoring',
      message: action.type,
      data: { matchId, score: scoreSig(state) },
    });
    set({ snapshot: next, state });
  },

  clear: () => set({ matchId: null, cfg: null, snapshot: null, state: null, createdAtIso: null }),
}));
