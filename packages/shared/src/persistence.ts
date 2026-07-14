import type { EngineSnapshot, LoggedAction, MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { foldLog } from '@padel/scoring-engine';

/**
 * The envelope persisted to SQLite's `liveStateJson` column. We store the
 * SNAPSHOT (players + action log), never the derived MatchState — so resume is
 * a deterministic re-fold and can never drift across engine versions.
 */
export interface PersistedMatch {
  readonly schema: 1;
  readonly configId: string;
  readonly configVersion: number;
  /** Integrity check that the resolved config still matches what was played. */
  readonly configHash: string;
  readonly players: readonly string[];
  readonly log: readonly LoggedAction[];
  /** Caller-supplied — the engine never reads the clock. */
  readonly createdAtIso: string;
}

/** Recursively key-sorted JSON so serialization is byte-stable. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * A fast, dependency-free FNV-1a hash of a config's canonical JSON. Not a
 * cryptographic hash — just a stable integrity fingerprint that works
 * identically on device and in Node (no native crypto needed).
 */
export function configHash(cfg: RuleSetConfig): string {
  const text = canonicalJson(cfg);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Serialize a live snapshot into the persistence envelope. */
export function serialize(snap: EngineSnapshot, cfg: RuleSetConfig, createdAtIso: string): PersistedMatch {
  return {
    schema: 1,
    configId: snap.configId,
    configVersion: snap.configVersion,
    configHash: configHash(cfg),
    players: snap.players,
    log: snap.log,
    createdAtIso,
  };
}

export class ConfigMismatchError extends Error {
  constructor(expected: string, actual: string) {
    super(`Config integrity mismatch: persisted ${expected}, resolved ${actual}`);
    this.name = 'ConfigMismatchError';
  }
}

/**
 * Restore a snapshot from its envelope, verifying config integrity. Throws
 * ConfigMismatchError if the resolved config no longer matches what was played
 * — the caller should then run a migration rather than misinterpret the log.
 */
export function deserialize(persisted: PersistedMatch, cfg: RuleSetConfig): EngineSnapshot {
  const actual = configHash(cfg);
  if (persisted.configHash !== actual) {
    throw new ConfigMismatchError(persisted.configHash, actual);
  }
  return {
    configId: persisted.configId,
    configVersion: persisted.configVersion,
    players: persisted.players,
    log: persisted.log,
  };
}

/** Restore straight to a MatchState (deserialize + fold) for resume-on-launch. */
export function resume(persisted: PersistedMatch, cfg: RuleSetConfig): MatchState {
  return foldLog(deserialize(persisted, cfg), cfg);
}
