# Watch Architecture

React Native / JS cannot run on watchOS or Wear OS, so both watch apps are
**native** and each carries a compact `ScoreEngine` that mirrors the canonical
TypeScript engine.

## The lockstep contract
The exhaustively-tested source of truth is `packages/scoring-engine`. The Swift
`ScoreEngine.swift` and Kotlin `ScoreEngine.kt` are faithful ports of the SAME
rules (golden-point games, tiebreak padel sets) with the SAME append-only-log
undo. When the TS engine's rules change, update both ports in the same PR. A
future improvement is a golden-vector fixture (shared JSON of action→state
cases) that all three engines run against in CI.

## Apple Watch (SwiftUI)
- `ScoreEngine.swift` — the scoring port.
- `MatchStore.swift` — persists to `UserDefaults` after every action
  (standalone; survives a dead battery), plays haptics, mirrors to the phone.
- `WatchConnectivityManager.swift` — `WCSession`; `updateApplicationContext`
  for latest-wins state, main-thread calls. Bridged to RN via a local Expo
  native module wrapping `WCSession` on the phone side.
- `ContentView.swift` — two giant tap zones, tap to score, long-press to undo,
  glanceable tabular score, dark by default. Complication + HealthKit workout
  session are wired in the App target.

## Wear OS (Kotlin + Compose for Wear)
- `ScoreEngine.kt` — the scoring port.
- `MatchRepository.kt` — offline-first persistence after every action
  (SharedPreferences shown; DataStore in production).
- `DataLayerSync.kt` — pushes state over the Wearable Data Layer (DataClient),
  latest-wins by timestamp.
- `MainActivity.kt` — Compose tap-zones UI. A foreground service keeps the
  active match alive across navigation; `AndroidManifest.xml` declares
  `standalone=true` and the watch `uses-feature`.

## Sync reconciliation
The phone treats watch state as latest-wins by `updatedAt`. Because a match is
single-author, divergence is rare; when both edited offline, the newer wins and
the action logs are compatible (both are the same rules).
