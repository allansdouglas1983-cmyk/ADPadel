# Scoring Engine

`packages/scoring-engine` is the strategic moat: a pure, deterministic,
framework-free reducer. No React, no SQLite, no I/O, no `Date.now()`/`Math.random()`.

## Core idea: rules are data
All sport knowledge lives in a `RuleSetConfig` value. The reducer contains only
generic hierarchical-scoring control flow. The word "padel" and the numbers
15/30/40/6/7/10 appear **only** in `src/presets/padel.ts` — a CI grep-guard test
(`test/sport-agnostic.guard.test.ts`) fails the build if they leak into the core.

Tennis (ad scoring) and pickleball (rally to 11) are future `RuleSetConfig`
values — zero engine code changes.

## State is a fold of the log
```
MatchState = foldLog(EngineSnapshot, cfg)
EngineSnapshot = { configId, configVersion, players, log: LoggedAction[] }
```
The append-only action log is the source of truth. This gives, for free:
- **Perfect multi-level undo** — drop the last log entry and re-fold.
- **Byte-identical crash-resume** — persist the snapshot, re-fold on launch.
- **Determinism** — same log + same config ⇒ identical state, on any device.

## Public API
- `initialState(cfg, players)` / `newSnapshot(cfg, players)`
- `reduce(state, action, cfg)` — the single pure step
- `foldLog(snapshot, cfg)` — re-derive state
- `applyAction(snapshot, action, cfg)` — app entry point (append or UNDO-truncate)

## Actions
`POINT_TO(side)`, `REPLAY` (let), `PENALTY(side, 'point'|'game')`,
`RETIRE(side)`, `UNDO`.

## Rules covered
- Deuce modes: `advantage`, `golden`, `star` — unified via a single "decider
  threshold" (`min(points) ≥ winAtIndex−1 + starMaxAdvantages`). Golden = star
  with 0 advantages; advantage = threshold of infinity.
- Tiebreaks with 1-then-every-2 serve rotation; ends change cadence is cosmetic.
- Super-tiebreak final sets modelled as a one-game set whose game is a TB to 10
  — reuses the ordinary tiebreak path, no special-casing.
- Mini-sets (to 4), best-of 1/3, doubles/singles serve cycles, penalties, lets,
  retirement, and an optional play-out-after-match-point mode.

## Testing
106 tests: example-based per config + fast-check property tests (determinism,
undo inverts POINT_TO, exactly-one-winner, monotonicity, serve legality), fixed
seed for reproducibility. Coverage thresholds (100% statements/functions/lines,
90% branch) are declared in `vitest.config.ts` but are **not currently enforced**
— the `test` script runs `vitest run` without `--coverage`, and measured line
coverage is ~93% (the watch-bundle entry `src/global.ts` is uncovered and not
excluded). Wiring `--coverage` into the script/CI and covering-or-excluding
`global.ts` is tracked in `docs/SPEC-AUDIT.md` (§1, task P2-18).
