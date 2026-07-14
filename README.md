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
| `@padel/scoring-engine` | Pure, deterministic reducer. Rules are DATA, never code. | ✅ 106 tests |
| `@padel/ratings` | On-device Elo/DUPR-hybrid rating. | ✅ 28 tests, 100% cov |
| `@padel/formats` | Americano, Mexicano, round-robin, brackets, standings. | ✅ 39 tests |
| `@padel/stats` | Per-player/pareja stats + Season Wrapped. | ✅ 34 tests |
| `@padel/shared` | Persistence envelope, brand, ids. | ✅ 12 tests, 100% cov |
| `@padel/design-tokens` | The single restyle point. | ✅ 8 tests |
| `apps/mobile` | Expo app + native watch targets. | Off-env (EAS/Xcode/Gradle) |
| `supabase/` | Thin optional sync/backup. | Off-env |

**227 tests pass across the pure packages.** For a precise, evidence-based
status of every spec area — what's built, verified, and still pending — see
**[`docs/SPEC-AUDIT.md`](docs/SPEC-AUDIT.md)** (the canonical status doc).

## Prerequisites
- **Node ≥ 20** and **pnpm 10** (pinned via `packageManager` in `package.json`).
- The workspace uses a **hoisted node_modules** (`.npmrc` → `node-linker=hoisted`)
  because React Native / Expo autolinking and Metro's config loader require a
  flat layout — don't remove it or the app bundle fails to resolve `expo-*`.

## Develop
```bash
pnpm install
pnpm -r build          # build all packages
pnpm -r test           # run every test suite (227 tests)
pnpm -r typecheck
```

The pure TypeScript packages run and test entirely in CI (see
`.github/workflows/ci.yml`). The Expo app and native watch targets build on a
Mac / with the Android SDK via EAS, Xcode and Gradle.

## Build a test APK
A production-variant, **sideloadable Android APK** builds on GitHub Actions with
no EAS cloud — see **[`docs/BUILD-APK.md`](docs/BUILD-APK.md)**.

## Docs
See `docs/` — **[`SPEC-AUDIT.md`](docs/SPEC-AUDIT.md)** (canonical status),
architecture, the scoring engine, the data model, watch architecture,
monetisation, ASO, the build-APK guide and the roadmap. Guardrails live in
`CLAUDE.md`; contribution conventions in `CONTRIBUTING.md`.

## License
Proprietary — all rights reserved. See [`LICENSE`](LICENSE).
