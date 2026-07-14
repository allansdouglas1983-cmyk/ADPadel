# Contributing to Marque

Solo-founder + AI-assisted for now, but the bar is world-class and the
conventions are strict. Read `CLAUDE.md` first — it is the governing standard.

## Setup
- **Node ≥ 20**, **pnpm 10** (pinned via `packageManager`). Do not install a
  different pnpm — CI reads the version from `package.json`.
- `pnpm install` at the repo root. The workspace uses a **hoisted**
  `node_modules` (`.npmrc` → `node-linker=hoisted`) because React Native / Expo
  autolinking and Metro's config loader need a flat layout. **Do not remove it.**

## Before every commit
```bash
pnpm -r build
pnpm -r test        # 227 tests must stay green
pnpm -r typecheck
```
The pure packages (`packages/*`) fully build and test locally/CI. The Expo app
and native watch targets are verified by typecheck + review here and by
EAS/Xcode/Gradle on a real machine (they cannot compile in a plain CI runner).

## Conventions
- **Conventional Commits** (`feat:`, `fix:`, `test:`, `chore:`, `refactor:`),
  one concern per commit.
- **Never hard-code padel** in the core engine — rules are DATA in `presets/`
  (enforced by a grep-guard test).
- **Design tokens only** — no raw hex or magic spacing in components; scores use
  tabular numerals.
- **Ask before adding any dependency** (prefer Expo-maintained). No WatermelonDB.
- **Never lose match state** — persist synchronously before the UI confirms;
  always resumable. Never gate on-court scoring or the shareable card.
- Add **Sentry breadcrumbs** on scoring actions and resume (Definition of Done).
- Every feature: works offline, state persists + resumes, tests pass, tokens
  used, a11y labels present, light + dark verified.

## Where things live
- Status / remaining work: **`docs/SPEC-AUDIT.md`** (canonical).
- Architecture, engine, data model, design system: `docs/`.
- Brand (name/wordmark): `packages/shared/src/brand.ts` (one file).
- Visual identity: `packages/design-tokens` (one package).
