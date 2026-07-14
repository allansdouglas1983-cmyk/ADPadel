# Roadmap

> **Canonical status lives in [`SPEC-AUDIT.md`](./SPEC-AUDIT.md)** — a full,
> evidence-based audit of every spec area against the code, plus the ordered
> remaining-work list (P0→P3). This roadmap is the high-level phase view; when
> the two disagree, SPEC-AUDIT wins.

## Build order (dossier §6.4) and current status
1. ✅ Scaffold — monorepo, tokens, CI, strict TS.
2. ✅ Scoring engine + exhaustive/property tests (before any UI).
3. ✅ Ratings, formats, stats — pure, tested packages.
4. ✅ Shared persistence + design tokens.
5. ◐ Phone scoring UI — live board, undo, synchronous persistence,
   resume-on-launch, named setup (all deuce presets incl. Silver Point), match
   finalization (set rows + ratings + history), full controls (pausable timer /
   medical timeout, warning→point→game penalties, retire, changeover cue),
   optional per-point shot logging, **optional voice score call-out**
   (`src/features/scoring/announcer.ts`, expo-speech), result + share, and a
   **match/history detail screen** (`app/history/[id].tsx`: set-by-set, rating
   deltas, re-share). *Known gaps (see SPEC-AUDIT §7): no REPLAY control on the
   phone yet; Sentry scoring breadcrumbs not wired.*
6. ◐ Apple Watch — SwiftUI scoring on a FULL config-driven engine (all deuce
   modes, tiebreak serve rotation, super-TB, mini-set) + WCSession snapshot sync
   + standalone persistence + HealthKit workout + WidgetKit complication.
7. ◐ Wear OS — full Kotlin port + Data Layer snapshot sync + standalone
   persistence + Health Connect + launch Tile. Both watches pass the shared
   golden-vector fixture (enforced parity).
8. ◐ Events — Americano, Mexicano, Team & Mixed Americano and King of the Court,
   all runnable end-to-end (pool → score → advance → live leaderboard) with
   resume. Round-robin/knockout pairings exist in `@padel/formats`.
9. ◐ Sharing + Wrapped — Skia share card (real data + rating delta + claim QR)
   that actually renders/saves/shares; animated multi-scene Wrapped with a
   holographic Skia finale; the claim-your-profile deep-link loop (/m, /claim).
10. ◐ Monetisation — RevenueCat paywall (annual £9.99 / monthly £1.99). *Known
    gap (SPEC-AUDIT §8): the RevenueCat SDK is not yet `configure()`d, so
    entitlements are runtime-dead until initialised.*
11. ◐ Cross-cutting — full stats surface, notifications, high-contrast on-court
    mode, offline-first sync (dirty tracking + push/pull LWW) with Apple/Google/
    email auth, real Drizzle migrations, EN/ES + FR/IT/PT/SV/NL locales.
12. ☐ Launch — ASO assets, store listings, seed 3–5 clubs. A sideloadable
    production APK builds on GitHub Actions (`docs/BUILD-APK.md`); the workflow is
    mid-stabilisation (awaiting a first green run).

Legend: ✅ done & verified here · ◐ source complete to full spec, verified
off-environment (EAS/Xcode/Gradle) · ☐ pending.

## Milestone benchmarks
- Kill the app mid-match 100× with zero state loss (structurally guaranteed by
  the log-fold persistence; covered by resume tests).
- A non-user added as a guest can claim their profile in ≤3 taps.

## Owner tasks (outside the code build)
- Finalise colour palette (`packages/design-tokens`).
- "Marque" trademark clearance (UK IPO / EUIPO / USPTO classes 9 & 41) + domains.
- Store & marketing assets (screenshots, icon, splash, preview videos).
- Pre-launch smoke tests (landing page, r/padel post, keyword-volume check).
- Provision RevenueCat / App Store Connect / Play Console / Supabase.

## Post-launch thresholds (dossier)
- Viral coefficient < 0.2 at month 3 → referral rewards + paid ASO.
- Conversion < 2% → tighten the free-history cap.
- Rating dips < 4.5★ → freeze features, fix reliability.
- Only consider tennis/pickleball config once padel Pro clears ~1,000 subscribers.
