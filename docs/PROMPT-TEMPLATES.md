# Reusable Claude Code Prompt Templates

Small, test-backed increments. Start engine work from tests. Never add
dependencies without approval. Commit per concern.

## Engine work
> Implement `<rule>` in `packages/scoring-engine` as pure config/reducer logic.
> Do not reference padel by name in the core. First write failing unit tests
> covering `<cases>` and property tests asserting `<invariants>`, then implement
> until green. Show the diff and the test output.

## Feature (phone)
> Build `<feature>` under `apps/mobile/src/features/<x>`. Use only design-tokens,
> persist state to SQLite synchronously, ensure offline + resume, add
> VoiceOver/TalkBack labels, verify light+dark. Add a Maestro flow. Follow
> CLAUDE.md guardrails.

## Watch
> Implement `<watch feature>` in the native `<SwiftUI/Compose>` target. Keep
> score locally, persist to `<UserDefaults/DataStore>`, sync via
> `<WCSession/Data Layer>` with main-thread calls and reply handlers. Never lose
> state on disconnect. Keep the ScoreEngine in lockstep with the TS engine.

## Card / Wrapped
> Render `<card>` off-screen with react-native-skia at 1080×1920, encode PNG,
> save to gallery, share via the OS sheet. No server calls. Use tokens; include
> the wordmark + claim link.

## Refactor guard
> Refactor `<x>` without changing engine behaviour; all engine tests must stay
> green; do not add dependencies.
