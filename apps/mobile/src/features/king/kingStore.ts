import { create } from 'zustand';
import type { KingState, Side } from '@padel/formats';
import { createKingOfCourt, kingScore } from '@padel/formats';
import { createKingRow, persistKing } from '@/db/kingRepo';

/** Live King of the Court store — pure KingState + synchronous persistence. */
interface KingStore {
  sessionId: string | null;
  state: KingState | null;
  create: (pairs: [string, string][], courts: number, pointsPerMatch: number, venue?: string) => string;
  resume: (sessionId: string, state: KingState) => void;
  score: (courtIndex: number, side: Side) => void;
  clear: () => void;
}

export const useKingStore = create<KingStore>((set, get) => ({
  sessionId: null,
  state: null,

  create: (pairs, courts, pointsPerMatch, venue) => {
    const state = createKingOfCourt(pairs, courts, pointsPerMatch);
    const sessionId = createKingRow(state, venue);
    set({ sessionId, state });
    return sessionId;
  },

  resume: (sessionId, state) => set({ sessionId, state }),

  score: (courtIndex, side) => {
    const { state, sessionId } = get();
    if (!state || !sessionId) return;
    const next = kingScore(state, courtIndex, side);
    persistKing(sessionId, next);
    set({ state: next });
  },

  clear: () => set({ sessionId: null, state: null }),
}));
