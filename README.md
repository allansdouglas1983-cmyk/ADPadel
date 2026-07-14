# Marque — Padel Scores & Stats

Offline-first padel scorekeeping for iOS, Android, Apple Watch and Wear OS. A
sport-agnostic scoring core shipped padel-perfect, with on-device stats &
ratings, Americano/Mexicano events, shareable match cards and a Season Wrapped.

> **Tagline:** *Make your mark.*
> Name pending trademark clearance — isolated to one file, see `packages/shared/src/brand.ts`.

## Why it exists
The #1 complaint across every incumbent padel scoring app is **losing match
state to a crash**. Marque's answer is an architecture where that is
*structurally impossible*: the scoring engine is a pure fold of an append-only
action log, persisted synchronously before the UI ever updates, so a crash,
kill or dead battery resumes byte-identically.

## Monorepo
| Package | What | Verified here |
|---|---|---|
| `@padel/scoring-engine` | Pure, deterministic reducer. Rules are DATA, never code. | ✅ 100% line cov |
| `@padel/ratings` | On-device Elo/DUPR-hybrid rating. | ✅ 100% cov |
| `@padel/formats` | Americano, Mexicano, round-robin, brackets, standings. | ✅ |
| `@padel/stats` | Per-player/pareja stats + Season Wrapped. | ✅ |
| `@padel/shared` | Persistence envelope, brand, ids. | ✅ |
| `@padel/design-tokens` | The single restyle point. | ✅ |
| `apps/mobile` | Expo app + native watch targets. | Off-env (EAS/Xcode/Gradle) |
| `supabase/` | Thin optional sync/backup. | Off-env |

## Develop
```bash
pnpm install
pnpm -r build          # build all packages
pnpm -r test           # run every test suite
pnpm -r typecheck
```

The pure TypeScript packages run and test entirely in CI (see
`.github/workflows/ci.yml`). The Expo app and native watch targets build on a
Mac / with the Android SDK via EAS, Xcode and Gradle.

## Docs
See `docs/` — architecture, the scoring engine, the data model, watch
architecture, monetisation, ASO and the roadmap. Guardrails live in `CLAUDE.md`.
