import type { RuleSetConfig } from '@padel/scoring-engine';
import { db } from './client';
import { localWallClockIso } from '../lib/datetime';
import { markDirty } from '@/sync/syncEngine';
import { matches, ruleSets, sessions, teams } from './schema';

/** Small unique id — app layer may use the clock/RNG (the engine never does). */
export function genId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export interface CreateMatchArgs {
  cfg: RuleSetConfig;
  ruleSetName: string;
  format: 'doubles' | 'singles';
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
  venue?: string;
}

/** Insert the session + rule set + match + team rows for a new match. */
export function createMatch(args: CreateMatchArgs): { matchId: string; sessionId: string } {
  const sessionId = genId('sess');
  const ruleSetId = genId('rs');
  const matchId = genId('match');
  const teamAId = genId('team');
  const teamBId = genId('team');

  db.insert(ruleSets)
    .values({ id: ruleSetId, name: args.ruleSetName, configJson: JSON.stringify(args.cfg) })
    .run();
  db.insert(sessions).values({ id: sessionId, type: 'match', ruleSetId, venue: args.venue }).run();
  db.insert(matches)
    .values({ id: matchId, sessionId, ruleSetId, format: args.format, teamAId, teamBId, startedAtIso: localWallClockIso() })
    .run();
  db.insert(teams).values({ id: teamAId, matchId, sideKey: 0, playerIdsJson: JSON.stringify(args.teamAPlayerIds) }).run();
  db.insert(teams).values({ id: teamBId, matchId, sideKey: 1, playerIdsJson: JSON.stringify(args.teamBPlayerIds) }).run();

  markDirty('sessions', sessionId);
  markDirty('matches', matchId);
  return { matchId, sessionId };
}
