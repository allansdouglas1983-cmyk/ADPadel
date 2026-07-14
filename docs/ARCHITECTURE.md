# Architecture

## Layers
```
┌─────────────────────────────────────────────────────────────┐
│ apps/mobile (Expo)            ios/WatchApp    android/wear    │
│  expo-router · Zustand         SwiftUI         Compose        │
│  Skia card · RevenueCat        WCSession       Data Layer     │
├─────────────────────────────────────────────────────────────┤
│ Pure packages (framework-free, 100% testable)                │
│  scoring-engine · ratings · formats · stats · shared · tokens│
├─────────────────────────────────────────────────────────────┤
│ expo-sqlite + Drizzle (on-device source of truth)            │
│         ▲ synchronous write after every action               │
│ Supabase (thin, optional, signed-in users only)              │
└─────────────────────────────────────────────────────────────┘
```

## Data flow (scoring)
1. UI dispatches an `Action` to the Zustand `matchStore`.
2. The store calls `applyAction(snapshot, action, cfg)` (pure engine).
3. It **persists the new snapshot to SQLite synchronously** (`persistLiveSnapshot`).
4. Only then does it update React state — the score is durable the instant it
   shows. This is the reliability pillar.
5. On relaunch, `findResumableMatch()` re-folds any live match byte-identically.

## Offline-first & sync
- All writes hit SQLite first. Free users never touch the network (zero COGS).
- Signed-in users push `dirty` rows to Supabase; conflicts resolve
  last-write-wins by `updatedAt`. Matches are append-only and single-author, so
  conflicts are rare. A claimed guest's rows are re-parented server-side.

## Event lifecycle (Americano / Mexicano)
The same offline-first pattern as matches, one level up. `@padel/formats`
exposes a pure `EventSession` — one serializable value holding the config,
every round's court scores, and status. It ties together round generation
(Americano fixed draw / Mexicano leaderboard-driven) and standings:

1. `createEventSession(config)` generates round 0.
2. `addPoint` / `undoPoint` / `setCourtResult` score each court (point-per-rally
   to a fixed total; both players bank the team's points individually).
3. `canAdvance` / `advanceRound` generate the next round from the live
   leaderboard (Mexicano) or the fixed draw (Americano), or complete the event.
4. `leaderboard` ranks players with point-diff → total → head-to-head.

The app's `eventStore` (Zustand) persists the serialized session to SQLite after
every action via `eventRepo`, exactly like the match store — so a club night
resumes byte-identically after a crash. The UI (`app/event/*`,
`features/events/*`) holds ZERO event logic; it renders the session and
dispatches actions.

## Why the watches are native
React Native / JS cannot run on watchOS or Wear OS. Each watch has a small
native `ScoreEngine` that mirrors the TS engine's padel rules and the same
append-only-log undo, persists locally, and syncs to the phone. They must be
kept in lockstep with `packages/scoring-engine` — see WATCH-ARCHITECTURE.md.
