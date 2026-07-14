import { sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * The offline-first, sport-agnostic data model (dossier §5.2). SQLite is the
 * on-device source of truth. Every scoring-relevant table carries `updatedAt`
 * and a soft-delete flag for last-write-wins sync. Free users never sync.
 */

const now = sql`(strftime('%s','now'))`;

/** A player — full profile or guest (host-added, claimable later). */
export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar'),
  isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(true),
  /** The user who claimed this player, if any. */
  claimedUserId: text('claimed_user_id'),
  contactRef: text('contact_ref'),
  gender: text('gender', { enum: ['m', 'f', 'x'] }),
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

/** A claimed player with an auth identity. */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  authId: text('auth_id'),
  handle: text('handle'),
  settingsJson: text('settings_json'),
  updatedAt: integer('updated_at').notNull().default(now),
});

/** The pareja (pair/partnership) — a first-class entity, cached for chemistry. */
export const partnerships = sqliteTable('partnerships', {
  id: text('id').primaryKey(),
  playerAId: text('player_a_id').notNull(),
  playerBId: text('player_b_id').notNull(),
  sportKey: text('sport_key').notNull().default('padel'),
  updatedAt: integer('updated_at').notNull().default(now),
});

/** The config anchor for sport-agnosticism. */
export const sports = sqliteTable('sports', {
  id: text('id').primaryKey(),
  key: text('key').notNull(), // 'padel'
  displayName: text('display_name').notNull(),
});

/** A saved scoring configuration (the RuleSetConfig, as JSON). */
export const ruleSets = sqliteTable('rule_sets', {
  id: text('id').primaryKey(),
  sportKey: text('sport_key').notNull().default('padel'),
  name: text('name').notNull(),
  configJson: text('config_json').notNull(),
  updatedAt: integer('updated_at').notNull().default(now),
});

/** A play session: a single match or a multi-match event. */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: ['match', 'americano', 'mexicano', 'teamAmericano', 'mixedAmericano', 'king', 'roundrobin', 'tournament'],
  }).notNull(),
  sportKey: text('sport_key').notNull().default('padel'),
  ruleSetId: text('rule_set_id'),
  venue: text('venue'),
  startedAt: integer('started_at').notNull().default(now),
  endedAt: integer('ended_at'),
  status: text('status', { enum: ['live', 'complete', 'abandoned'] }).notNull().default('live'),
  ownerUserId: text('owner_user_id'),
  /** Serialized EventSession for Americano/Mexicano resume (mirrors matches). */
  liveStateJson: text('live_state_json'),
  updatedAt: integer('updated_at').notNull().default(now),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

/** A single match. `liveStateJson` is the engine SNAPSHOT for crash-resume. */
export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  sportKey: text('sport_key').notNull().default('padel'),
  ruleSetId: text('rule_set_id').notNull(),
  format: text('format', { enum: ['doubles', 'singles'] }).notNull().default('doubles'),
  teamAId: text('team_a_id'),
  teamBId: text('team_b_id'),
  winnerTeamId: text('winner_team_id'),
  startedAt: integer('started_at').notNull().default(now),
  /** Local wall-clock ISO for time-of-day / day-of-week stats. */
  startedAtIso: text('started_at_iso'),
  endedAt: integer('ended_at'),
  durationSec: integer('duration_sec'),
  status: text('status', { enum: ['live', 'complete', 'retired'] }).notNull().default('live'),
  /** PersistedMatch envelope (players + action log). The resume source. */
  liveStateJson: text('live_state_json'),
  updatedAt: integer('updated_at').notNull().default(now),
  deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
});

/** A team within a match (a side). */
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  sideKey: integer('side_key').notNull(), // 0 | 1
  playerIdsJson: text('player_ids_json').notNull(),
});

/** Per-set summary (for completed matches / stats). */
export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  idx: integer('idx').notNull(),
  teamAGames: integer('team_a_games').notNull(),
  teamBGames: integer('team_b_games').notNull(),
  tiebreakScore: text('tiebreak_score'),
});

/** Optional per-point log (only when the user enables logging depth). */
export const points = sqliteTable('points', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull(),
  idx: integer('idx').notNull(),
  winnerSide: integer('winner_side').notNull(),
  serveSide: integer('serve_side'),
  serverPlayerId: text('server_player_id'),
  shotType: text('shot_type'),
});

/** Americano/Mexicano round assignments and per-player results. */
export const americanoResults = sqliteTable('americano_results', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  roundIndex: integer('round_index').notNull(),
  courtIndex: integer('court_index').notNull(),
  playerId: text('player_id').notNull(),
  teamKey: integer('team_key').notNull(), // 0 | 1
  pointsFor: integer('points_for').notNull().default(0),
  pointsAgainst: integer('points_against').notNull().default(0),
  updatedAt: integer('updated_at').notNull().default(now),
});

/** Current per-player rating (per discipline). */
export const ratings = sqliteTable('ratings', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull(),
  sportKey: text('sport_key').notNull().default('padel'),
  discipline: text('discipline', { enum: ['singles', 'doubles'] }).notNull(),
  value: real('value').notNull(),
  matchesCount: integer('matches_count').notNull().default(0),
  updatedAt: integer('updated_at').notNull().default(now),
});

/** Full rating history for the Wrapped "rating journey" and card delta. */
export const ratingHistory = sqliteTable('rating_history', {
  id: text('id').primaryKey(),
  playerId: text('player_id').notNull(),
  matchId: text('match_id').notNull(),
  discipline: text('discipline', { enum: ['singles', 'doubles'] }).notNull(),
  delta: real('delta').notNull(),
  valueAfter: real('value_after').notNull(),
  at: integer('at').notNull().default(now),
});

/** Sync bookkeeping for last-write-wins reconciliation. */
export const syncMeta = sqliteTable(
  'sync_meta',
  {
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    updatedAt: integer('updated_at').notNull().default(now),
    dirty: integer('dirty', { mode: 'boolean' }).notNull().default(true),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => ({ pk: primaryKey({ columns: [t.entity, t.entityId] }) }),
);

/** Last successful pull timestamp per entity, so pulls are incremental. */
export const syncCursor = sqliteTable('sync_cursor', {
  entity: text('entity').primaryKey(),
  lastPulledAt: integer('last_pulled_at').notNull().default(0),
});

/** Simple key/value app settings (high-contrast mode, logging default, etc). */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type PlayerRow = typeof players.$inferSelect;
export type MatchRow = typeof matches.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type RatingRow = typeof ratings.$inferSelect;
