/**
 * Branded id types. Branding prevents accidentally passing a PlayerId where a
 * MatchId is expected, at zero runtime cost.
 */
declare const brand: unique symbol;
type Branded<T, B> = T & { readonly [brand]: B };

export type PlayerId = Branded<string, 'PlayerId'>;
export type MatchId = Branded<string, 'MatchId'>;
export type SessionId = Branded<string, 'SessionId'>;
export type UserId = Branded<string, 'UserId'>;

const NON_EMPTY = /\S/;

function assertId(raw: string, kind: string): void {
  if (typeof raw !== 'string' || !NON_EMPTY.test(raw)) {
    throw new Error(`Invalid ${kind}: expected a non-empty string`);
  }
}

export const asPlayerId = (raw: string): PlayerId => (assertId(raw, 'PlayerId'), raw as PlayerId);
export const asMatchId = (raw: string): MatchId => (assertId(raw, 'MatchId'), raw as MatchId);
export const asSessionId = (raw: string): SessionId => (assertId(raw, 'SessionId'), raw as SessionId);
export const asUserId = (raw: string): UserId => (assertId(raw, 'UserId'), raw as UserId);

/**
 * Build a prefixed id from a caller-supplied unique token (e.g. a uuid or an
 * ULID from the app layer). The engine/shared code never reads the clock or RNG
 * itself, keeping everything deterministic and testable.
 */
export function makeId(prefix: string, unique: string): string {
  assertId(unique, `${prefix} token`);
  return `${prefix}_${unique}`;
}
