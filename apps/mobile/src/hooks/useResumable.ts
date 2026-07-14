import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { deserialize } from '@padel/shared';
import { findResumableMatch, loadMatchConfig } from '@/db/matchRepo';
import { findResumableEvent } from '@/db/eventRepo';
import { findResumableKing } from '@/db/kingRepo';
import { useMatchStore } from '@/store/matchStore';
import { useEventStore } from '@/features/events/eventStore';
import { useKingStore } from '@/features/king/kingStore';

type Resumable = { kind: 'match' | 'event' | 'king'; label: string; resume: () => void };

/**
 * Surfaces any in-progress match or event so the Play tab can offer "Resume".
 * This is the reliability pillar made visible: after a crash, kill or dead
 * battery, the live game is one tap away, restored byte-identically.
 */
export function useResumable(): Resumable | null {
  const [resumable, setResumable] = useState<Resumable | null>(null);
  const resumeMatch = useMatchStore((s) => s.resume);
  const resumeEvent = useEventStore((s) => s.resume);
  const resumeKing = useKingStore((s) => s.resume);

  const build = useCallback((): Resumable | null => {
    const match = findResumableMatch();
    if (match) {
      const cfg = loadMatchConfig(match.id);
      if (cfg) {
        return {
          kind: 'match',
          label: 'Resume match',
          resume: () => {
            const snapshot = deserialize(match.envelope, cfg);
            resumeMatch(match.id, cfg, snapshot, match.envelope.createdAtIso);
            router.push(`/match/${match.id}`);
          },
        };
      }
    }
    const event = findResumableEvent();
    if (event) {
      return {
        kind: 'event',
        label: 'Resume event',
        resume: () => {
          resumeEvent(event.id, event.session);
          router.push(`/event/${event.id}`);
        },
      };
    }
    const king = findResumableKing();
    if (king) {
      return {
        kind: 'king',
        label: 'Resume King of the Court',
        resume: () => {
          resumeKing(king.id, king.state);
          router.push(`/king/${king.id}`);
        },
      };
    }
    return null;
  }, [resumeMatch, resumeEvent, resumeKing]);

  useEffect(() => {
    setResumable(build());
  }, [build]);

  return resumable;
}
