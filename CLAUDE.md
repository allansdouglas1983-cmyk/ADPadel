# CLAUDE.md — Marque (Padel Scoring)

## Project overview
Marque is an offline-first padel scorekeeping app for iOS, Android, Apple Watch
and Wear OS, built with React Native/Expo plus native watch targets. It keeps
score on court, tracks stats, runs Americano/Mexicano events, computes an
on-device rating, and generates beautiful shareable match cards and a Season
Wrapped. Solo founder, AI-assisted (Claude Code).

## Strategic thesis (carry this into every decision)
- Build a SPORT-AGNOSTIC scoring CORE, but SHIP PADEL-ONLY, polished to
  perfection, and brand it unmistakably as padel.
- Tennis & pickleball are future CONFIG of the same engine — never launch scope.
- Scoring is ALWAYS FREE (it fuels the viral share loop). Money comes from
  advanced stats, unlimited history, Wrapped export, themes and rating history.
- Every free user's shared card is a billboard. Protect the loop.

## Monorepo layout
- `packages/scoring-engine` — pure, deterministic reducer. Rules are DATA.
- `packages/ratings` — on-device Elo/DUPR-hybrid.
- `packages/formats` — Americano / Mexicano / round-robin / brackets + standings.
- `packages/stats` — pure per-player/pareja aggregation + Season Wrapped.
- `packages/shared` — persistence envelope, brand single-source, branded ids.
- `packages/design-tokens` — the one place the visual identity lives.
- `apps/mobile` — Expo app (iOS + Android) + native watch targets under
  `ios/WatchApp` (SwiftUI) and `android/wear` (Kotlin/Compose).
- `supabase/` — thin optional sync/backup schema.

## Architecture rules
- The scoring engine is a PURE, DETERMINISTIC, FRAMEWORK-FREE TS module in
  `packages/scoring-engine`. No React, no SQLite, no I/O. `reduce(state, action)`.
- Scoring rules are DATA (RuleSetConfig), never hard-coded branches. NEVER put
  the word "padel" or padel-specific numbers inside the core engine — they live
  ONLY in `presets/`, enforced by a CI grep-guard test.
- State is a fold of an append-only action log → free undo + byte-identical
  crash-resume. Persist the SNAPSHOT (players + log), never derived state.
- SQLite (expo-sqlite + Drizzle) is the on-device source of truth. Supabase is a
  thin optional sync/backup for logged-in users only.
- State: Zustand holds the live match snapshot; the engine owns the logic.
- Watch apps are NATIVE (SwiftUI / Jetpack Compose). RN cannot run on the
  watches. Their ScoreEngine mirrors the TS engine and must stay in lockstep.

## Brand isolation
- Workspace scope is `@padel/*` (domain, not brand) so package names never move.
- The product name lives ONLY in `packages/shared/src/brand.ts` ("Marque",
  pending trademark clearance; fallback "Pennant" is a one-line edit).

## Offline-first rules
- Every scoring action persists to SQLite SYNCHRONOUSLY before the UI confirms.
- The app MUST resume any live match after crash/kill/dead-battery, byte-identical.
- Free users never hit the network. No feature may require connectivity to score.

## Testing requirements (Definition of Done includes tests)
- The scoring engine has exhaustive unit tests for every rule config and
  property-based tests asserting invariants + perfect undo. No engine change
  merges without tests. Target 100% line coverage on the engine.
- Persistence/resume covered by tests. Key flows covered by E2E (Maestro).

## Design-token enforcement
- Use ONLY tokens from `packages/design-tokens`. No raw hex, no magic spacing
  numbers in components. Scores render with tabular numerals.

## Dependency rules
- Ask before adding any new dependency. Prefer Expo-maintained modules.
- No WatermelonDB.

## Git / commits
- Conventional Commits (feat:, fix:, test:, chore:, refactor:). One concern per
  commit. Never commit secrets. EAS + env for keys.

## Definition of Done
- Feature works offline; state persists + resumes; tests pass; tokens used; a11y
  labels present; light + dark verified; no new per-free-user COGS; Sentry
  breadcrumbs added.

## NEVER DO (guardrails)
- NEVER hard-code padel-specific logic into the core engine (config only).
- NEVER introduce a per-free-user server cost (no server image rendering, no
  forced cloud).
- NEVER lose match state. Persist before confirming; always be resumable.
- NEVER gate on-court scoring or the shareable card behind the paywall.
- NEVER ship tennis/pickleball UI in v1.
- NEVER block scoring on network.
