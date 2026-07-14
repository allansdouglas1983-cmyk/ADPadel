import { and, eq } from 'drizzle-orm';
import type { EngineSnapshot, RuleSetConfig } from '@padel/scoring-engine';
import { serialize, type PersistedMatch } from '@padel/shared';
import { db } from './client';
import { markDirty } from '@/sync/syncEngine';
import { matches, ruleSets } from './schema';

/**
 * Persist the live engine snapshot to SQLite SYNCHRONOUSLY. Called after every
 * scoring action, before the UI confirms — so a crash, kill or dead battery can
 * never lose a match. The stored value is the PersistedMatch envelope.
 */
export function persistLiveSnapshot(
  matchId: string,
  snap: EngineSnapshot,
  cfg: RuleSetConfig,
  createdAtIso: string,
): void {
  const envelope: PersistedMatch = serialize(snap, cfg, createdAtIso);
  db.update(matches)
    .set({ liveStateJson: JSON.stringify(envelope), updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(matches.id, matchId))
    .run();
}

/** Load the persisted envelope for a match, if one exists. */
export function loadLiveEnvelope(matchId: string): PersistedMatch | null {
  const row = db.select({ live: matches.liveStateJson }).from(matches).where(eq(matches.id, matchId)).get();
  if (!row?.live) return null;
  return JSON.parse(row.live) as PersistedMatch;
}

/** Any match still in `live` status — offered as "resume match" on relaunch. */
export function findResumableMatch(): { id: string; envelope: PersistedMatch } | null {
  const row = db
    .select({ id: matches.id, live: matches.liveStateJson })
    .from(matches)
    .where(and(eq(matches.status, 'live'), eq(matches.deleted, false)))
    .get();
  if (!row?.live) return null;
  return { id: row.id, envelope: JSON.parse(row.live) as PersistedMatch };
}

/** Load the RuleSetConfig a match was played under (needed to fold its log). */
export function loadMatchConfig(matchId: string): RuleSetConfig | null {
  const row = db
    .select({ config: ruleSets.configJson })
    .from(matches)
    .innerJoin(ruleSets, eq(matches.ruleSetId, ruleSets.id))
    .where(eq(matches.id, matchId))
    .get();
  return row?.config ? (JSON.parse(row.config) as RuleSetConfig) : null;
}

export function markMatchComplete(matchId: string, winnerTeamId: string | null, durationSec: number): void {
  db.update(matches)
    .set({
      status: 'complete',
      winnerTeamId,
      endedAt: Math.floor(Date.now() / 1000),
      durationSec,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(matches.id, matchId))
    .run();
  markDirty('matches', matchId);
}
