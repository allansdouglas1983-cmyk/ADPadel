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

## Why the watches are native
React Native / JS cannot run on watchOS or Wear OS. Each watch has a small
native `ScoreEngine` that mirrors the TS engine's padel rules and the same
append-only-log undo, persists locally, and syncs to the phone. They must be
kept in lockstep with `packages/scoring-engine` — see WATCH-ARCHITECTURE.md.
