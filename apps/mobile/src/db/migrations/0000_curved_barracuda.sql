CREATE TABLE `americano_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`round_index` integer NOT NULL,
	`court_index` integer NOT NULL,
	`player_id` text NOT NULL,
	`team_key` integer NOT NULL,
	`points_for` integer DEFAULT 0 NOT NULL,
	`points_against` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sport_key` text DEFAULT 'padel' NOT NULL,
	`rule_set_id` text NOT NULL,
	`format` text DEFAULT 'doubles' NOT NULL,
	`team_a_id` text,
	`team_b_id` text,
	`winner_team_id` text,
	`started_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`started_at_iso` text,
	`ended_at` integer,
	`duration_sec` integer,
	`status` text DEFAULT 'live' NOT NULL,
	`live_state_json` text,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `partnerships` (
	`id` text PRIMARY KEY NOT NULL,
	`player_a_id` text NOT NULL,
	`player_b_id` text NOT NULL,
	`sport_key` text DEFAULT 'padel' NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar` text,
	`is_guest` integer DEFAULT true NOT NULL,
	`claimed_user_id` text,
	`contact_ref` text,
	`gender` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `points` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`idx` integer NOT NULL,
	`winner_side` integer NOT NULL,
	`serve_side` integer,
	`server_player_id` text,
	`shot_type` text
);
--> statement-breakpoint
CREATE TABLE `rating_history` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`match_id` text NOT NULL,
	`discipline` text NOT NULL,
	`delta` real NOT NULL,
	`value_after` real NOT NULL,
	`at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`sport_key` text DEFAULT 'padel' NOT NULL,
	`discipline` text NOT NULL,
	`value` real NOT NULL,
	`matches_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rule_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`sport_key` text DEFAULT 'padel' NOT NULL,
	`name` text NOT NULL,
	`config_json` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`sport_key` text DEFAULT 'padel' NOT NULL,
	`rule_set_id` text,
	`venue` text,
	`started_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`ended_at` integer,
	`status` text DEFAULT 'live' NOT NULL,
	`owner_user_id` text,
	`live_state_json` text,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`deleted` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`idx` integer NOT NULL,
	`team_a_games` integer NOT NULL,
	`team_b_games` integer NOT NULL,
	`tiebreak_score` text
);
--> statement-breakpoint
CREATE TABLE `sports` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`display_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_cursor` (
	`entity` text PRIMARY KEY NOT NULL,
	`last_pulled_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`entity`, `entity_id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`side_key` integer NOT NULL,
	`player_ids_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_id` text,
	`handle` text,
	`settings_json` text,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
