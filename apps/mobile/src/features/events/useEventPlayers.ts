import { useMemo } from 'react';
import type { EventSession } from '@padel/formats';
import { getPlayerNames } from '@/db/playerRepo';

/** Resolves the event's player ids to display names, with a graceful fallback. */
export function useEventPlayers(session: EventSession | null): (id: string) => string {
  return useMemo(() => {
    const names = session ? getPlayerNames(session.config.players) : new Map<string, string>();
    return (id: string) => names.get(id) ?? id;
  }, [session?.config.players]);
}
