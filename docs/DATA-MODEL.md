# Data Model

Sport-agnostic core, padel-first. Defined in `apps/mobile/src/db/schema.ts`
(Drizzle + expo-sqlite). Every scoring-relevant table carries `updatedAt` and a
soft-delete flag for last-write-wins sync.

## Entities
- **players** — full profile or guest (`isGuest`, `claimedUserId`, `gender` for
  the star-point mixed rule). Guests are claimable via the invite loop.
- **users** — a claimed player with an auth identity.
- **partnerships** — the *pareja*, a first-class entity cached for chemistry.
- **sports / rule_sets** — the sport-agnostic anchor; `rule_sets.configJson`
  holds the serialized `RuleSetConfig`.
- **sessions** — a match or a multi-match event (`americano` / `mexicano` /
  `roundrobin` / `tournament`).
- **matches** — `liveStateJson` holds the `PersistedMatch` envelope (players +
  action log) — the crash-resume source. `format`, `winnerTeamId`, `durationSec`.
- **teams / sets / points** — per-match breakdown; `points` is the OPTIONAL
  per-point log (only when logging depth is on), carrying `serveSide`, `shotType`.
- **americano_results** — per-round, per-court, per-player points banked.
- **ratings / rating_history** — current per-discipline rating + full history for
  the Wrapped "rating journey" and the card delta.
- **sync_meta** — `dirty` / `deleted` / `updatedAt` bookkeeping.

## Persistence envelope (`@padel/shared`)
```ts
PersistedMatch = {
  schema: 1, configId, configVersion,
  configHash,        // FNV-1a integrity check (dependency-free, RN-safe)
  players, log,      // the engine snapshot — never derived state
  createdAtIso,      // caller-supplied; the engine never reads the clock
}
```
Resume: `resume(persisted, cfg)` verifies `configHash`, then folds the log. A
mismatch throws `ConfigMismatchError` so a rules change triggers a migration
rather than silently misinterpreting a stored log.
