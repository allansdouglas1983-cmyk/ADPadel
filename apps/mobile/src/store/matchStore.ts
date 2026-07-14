import { create } from 'zustand';
import type { Action, EngineSnapshot, MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { applyAction, foldLog, newSnapshot } from '@padel/scoring-engine';
import { persistLiveSnapshot } from '../db/matchRepo';

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
    persistLiveSnapshot(matchId, snapshot, cfg, createdAtIso);
    set({ matchId, cfg, snapshot, state, createdAtIso });
  },

  resume: (matchId, cfg, snapshot, createdAtIso) => {
    set({ matchId, cfg, snapshot, state: foldLog(snapshot, cfg), createdAtIso });
  },

  dispatch: (action) => {
    const { snapshot, cfg, matchId, createdAtIso } = get();
    if (!snapshot || !cfg || !matchId || !createdAtIso) return;
    const { snapshot: next, state } = applyAction(snapshot, action, cfg);
    // Persist BEFORE updating the UI — the score is durable the instant it shows.
    persistLiveSnapshot(matchId, next, cfg, createdAtIso);
    set({ snapshot: next, state });
  },

  clear: () => set({ matchId: null, cfg: null, snapshot: null, state: null, createdAtIso: null }),
}));
