import { create } from 'zustand';
import type { EventSession, EventSessionConfig, Side } from '@padel/formats';
import { addPoint, advanceRound, createEventSession, setCourtResult, undoPoint } from '@padel/formats';
import { createEventRow, persistEvent } from '@/db/eventRepo';

/**
 * Live event store. Mirrors the match store exactly: the pure EventSession holds
 * all the logic, this store only holds the live snapshot and persists it
 * SYNCHRONOUSLY before updating the UI. No event logic lives here or in the UI.
 */
interface EventStore {
  sessionId: string | null;
  session: EventSession | null;

  create: (config: EventSessionConfig, venue?: string) => string;
  resume: (sessionId: string, session: EventSession) => void;
  scorePoint: (courtIndex: number, side: Side) => void;
  undoScore: (courtIndex: number, side: Side) => void;
  setResult: (courtIndex: number, pointsA: number, pointsB: number) => void;
  advance: () => void;
  clear: () => void;
}

export const useEventStore = create<EventStore>((set, get) => {
  const commit = (session: EventSession) => {
    const { sessionId } = get();
    if (sessionId) persistEvent(sessionId, session);
    set({ session });
  };

  return {
    sessionId: null,
    session: null,

    create: (config, venue) => {
      const session = createEventSession(config);
      const sessionId = createEventRow(session, venue);
      set({ sessionId, session });
      return sessionId;
    },

    resume: (sessionId, session) => set({ sessionId, session }),

    scorePoint: (courtIndex, side) => {
      const { session } = get();
      if (session) commit(addPoint(session, courtIndex, side));
    },
    undoScore: (courtIndex, side) => {
      const { session } = get();
      if (session) commit(undoPoint(session, courtIndex, side));
    },
    setResult: (courtIndex, pointsA, pointsB) => {
      const { session } = get();
      if (session) commit(setCourtResult(session, courtIndex, pointsA, pointsB));
    },
    advance: () => {
      const { session } = get();
      if (session) commit(advanceRound(session));
    },

    clear: () => set({ sessionId: null, session: null }),
  };
});
