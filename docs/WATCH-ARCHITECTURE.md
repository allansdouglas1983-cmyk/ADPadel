# Watch Architecture

React Native / JS cannot run on watchOS or Wear OS, so both watch apps are
**native** and each carries a compact `ScoreEngine` that mirrors the canonical
TypeScript engine.

## The lockstep contract — enforced, not hoped
The exhaustively-tested source of truth is `packages/scoring-engine`. The Swift
`ScoreEngine.swift` and Kotlin `ScoreEngine.kt` are FULL, config-driven ports —
they decode the same `RuleSetConfig` JSON and reproduce every deuce mode
(golden/advantage/silver/star), tiebreaks with correct 1-then-2 serve rotation,
super-tiebreak deciders, mini-sets and best-of, with the same append-only-log
undo. Nothing is simplified.

Parity is **enforced by a shared golden-vector fixture**:
`packages/scoring-engine/fixtures/golden-vectors.json` is generated from the
canonical engine (`pnpm --filter @padel/scoring-engine fixtures`) and captures
the full per-step state (points, tiebreak, games, sets-won, server slot,
complete, winner) for 12 representative matches across every configuration.
- The TS suite (`test/fixtures.test.ts`) asserts the committed fixture still
  matches the engine — so any rules change that isn't regenerated fails CI.
- The Swift suite (`Tests/ScoreEngineTests.swift`) and Kotlin suite
  (`test/ScoreEngineTest.kt`) load the SAME JSON and assert their port agrees
  step-for-step. A Gradle `syncGoldenVectors` task copies the latest fixture.

So "the watches never disagree with the phone" is a test that fails loudly, not
an aspiration. When the engine changes: regenerate the fixture, run all three
suites.

## Embedded-engine option (zero drift)
For teams that prefer running the ACTUAL engine on-device, `pnpm --filter
@padel/scoring-engine bundle` emits `dist/marque-engine.global.js` (a self-
contained IIFE exposing `globalThis.Marque` with `reduceJson`/`foldJson`).
watchOS can run it via JavaScriptCore; it is smoke-tested in Node. The native
ports remain the default (best battery/perf); the bundle is the drop-in
true-parity alternative, and the golden-vector fixture validates either path.

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
