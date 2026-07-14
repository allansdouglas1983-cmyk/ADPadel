# Roadmap

## Build order (dossier §6.4) and current status
1. ✅ Scaffold — monorepo, tokens, CI, strict TS.
2. ✅ Scoring engine + exhaustive/property tests (before any UI).
3. ✅ Ratings, formats, stats — pure, tested packages.
4. ✅ Shared persistence + design tokens.
5. ◐ Phone scoring UI — live board, undo/replay, synchronous persistence + resume,
   match setup, result + share. (Source complete; builds via EAS.)
6. ◐ Apple Watch — SwiftUI scoring + WCSession + standalone persistence.
7. ◐ Wear OS — Compose scoring + Data Layer + standalone persistence.
8. ◐ Americano/Mexicano/tournament — rotation + standings wired to `@padel/formats`.
9. ◐ Sharing + Wrapped — Skia card + reveal + claim loop.
10. ◐ Monetisation — RevenueCat paywall (annual £9.99 / monthly £1.99).
11. ☐ Polish — deeper a11y, notifications, empty states.
12. ☐ Launch — ASO assets, store listings, seed 3–5 clubs.

Legend: ✅ done & verified here · ◐ source complete, verified off-environment
(EAS/Xcode/Gradle) · ☐ pending.

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
