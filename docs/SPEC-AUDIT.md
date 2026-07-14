# Marque — Spec Audit & Remaining Work

**Date:** 2026-07-14
**Method:** Six parallel, read-only, evidence-based audits of the code against
the spec (`CLAUDE.md` + the build plan). Every claim below cites `file:line` or a
test. This is the single in-repo source of truth for *what is built, what is
verified, and what remains* — it supersedes status scattered across `ROADMAP.md`.

**Legend:** ✅ Done & verified here · 🟡 Partial / present-but-gapped ·
❌ Missing · ⚠️ Unverifiable in this environment (native/runtime — needs
EAS/Xcode/Gradle/device or a configured backend).

---

## 0. Headline

The **pure core is real and proven**: 227 unit/property tests pass across the six
`@padel/*` packages. The **offline-first reliability pillar holds structurally**
— the store persists a byte-stable log synchronously before the UI updates and
resumes by re-folding. The **tri-platform golden-vector parity contract is the
standout**: both watch ScoreEngines are genuine full config-driven ports (read
line-by-line), and a byte-identical 12-vector fixture is asserted by TS, Swift
(XCTest) and Kotlin (JUnit).

But the app **has never compiled or run** (no native toolchain here; the APK CI
is mid-stabilisation), and the audit surfaced **material gaps** that must not be
mistaken for done — chiefly: **RevenueCat is never initialised** (paywall is
runtime-dead), **Sentry scoring breadcrumbs are absent** (a Definition-of-Done
item), a **confirmed card-date bug**, a **largely-missing social layer**, **no
funnel analytics**, **knockout brackets that never advance**, and several
**watch/backend integration edges** (a manifest-declared foreground service with
no class, one-ended watch↔phone sync, native parity tests excluded from CI).

Test totals by package (all green): scoring-engine **106**, ratings **28**,
formats **39**, stats **34**, shared **12**, design-tokens **8** = **227**.

---

## 1. `@padel/scoring-engine` — ✅ with coverage caveat

Full config-as-data reducer; append-only log fold; all deuce modes
(advantage/golden/star/silver), tiebreak serve rotation, super-TB-as-one-game
set, best-of, doubles serve cycle, POINT_TO/REPLAY/PENALTY/RETIRE/UNDO,
playOutAfterMatchPoint, gender-blind star metadata, sport-agnostic grep-guard,
`summarizeMatch`/`resultDescriptor`. Property tests fixed-seed (424242).

| Item | Status | Evidence / gap |
|---|---|---|
| Config-as-data, reduce/foldLog/applyAction | ✅ | `config.ts:22-94`, `engine.ts:213,250,263` |
| Deuce advantage/golden/star/silver | ✅ | `rules/points.ts:16-20`; presets `padel.ts:82-88`; `deuce.test.ts` |
| Tiebreak serve rotation, super-TB, best-of, serve cycle | ✅ | `rules/tiebreak.ts:21-36`, `engine.ts:31-38`, `rules/serve.ts:5-16` |
| Actions incl. multi-level UNDO (log truncation) | ✅ | `engine.ts:220-272`; `undo.test.ts`, `penalty.test.ts`, `retire.test.ts` |
| Crash-resume byte-identical | ✅ | `resume.test.ts:8-14` (JSON identity) |
| **Engine coverage = declared 100%** | 🟡 | **Actual 93.42% lines / 96.4% funcs / 93.75% branch.** `src/global.ts` (watch-bundle entry) is 0% and **not** in `vitest.config.ts` `exclude`; `display.ts` L22/26 and `summary.ts` L76 uncovered. Thresholds are declared but the `test` script/CI run `vitest run` **without `--coverage`**, so they never gate. |
| `changeEndsEvery` (change ends every 6) | 🟡 | Config-only (`config.ts:42`); never consumed by the engine. Cosmetic-or-missing. |
| Sport-agnostic guard robustness | 🟡 | Guard lists nonexistent `rules/games.ts` and `try/catch→return`s on missing files — a future guarded file that errors would be silently skipped. |
| Property `numRuns` | 🟡 | Defaults to 400, not the plan's 1000 (`properties.test.ts:15`); env-overridable. |

---

## 2. `@padel/ratings` — ✅ (100% coverage)

Elo/DUPR hybrid, base 1200, logistic D=400, provisional k 64→16 over 20,
marginMultiplier, singles/doubles rows, rating history, recency-weighted
`formRating`, `toDisplayScale` 1–7. 28 tests, 100% cov.

| Item | Status | Evidence / gap |
|---|---|---|
| All rating mechanics | ✅ | `elo.ts:5,29-47,58-100`, `update.ts` |
| Idempotency | 🟡 | Keyed on `matchId` only (`update.ts:47-50`); plan phrased "matchId/lastUpdatedSeq" — no `seq`. Works & tested. |

---

## 3. `@padel/shared` — ✅ with one deviation

PersistedMatch envelope, canonical byte-stable serialize, deserialize/resume,
ConfigMismatchError, branded ids, brand single-source. 12 tests, 100% cov.

| Item | Status | Evidence / gap |
|---|---|---|
| Envelope, serialize/resume, branded ids, brand.ts | ✅ | `persistence.ts:14-102`, `ids.ts`, `brand.ts` |
| `configHash` **sha256** | 🟡 | Uses **FNV-1a 32-bit**, not sha256 (`persistence.ts:44-53`). Intentional (dependency-free, RN-safe) and documented in DATA-MODEL.md; deviates from the build plan wording. Integrity check works. |

---

## 4. `@padel/formats` — 🟡 (39 tests; two real gaps)

| Item | Status | Evidence / gap |
|---|---|---|
| Americano, Mexicano, Team Americano, King of Court, round-robin | ✅ | `americano.ts`, `mexicano.ts`, `teamFormats.ts`, `kingOfCourt.ts`, `roundrobin.ts` |
| Fair sit-out for non-multiples-of-4 | ✅ | `rotation.ts:22`; test asserts rest max−min ≤ 1 |
| Points-per-match (16/24/32) | ✅ | `types.ts:36`, `session.ts:62` |
| Standings tie-breaks (diff → total → h2h) | ✅ | `standings.ts:68-77` |
| Mixed Americano one-man-one-woman | 🟡 | Structural (`teamFormats.ts:41`), not a validated invariant — no guard rejects malformed input. |
| **Knockout bracket advancement** | ❌ | `seedBracket` emits **round 0 only** (`knockout.ts:21`); no winner-propagation/`advanceBracket` — brackets never progress to a champion. |
| **Time-per-round event mode** | ❌ | Spec is "points-per-match **or** time-per-round"; no time/duration field anywhere in `formats/src`. Points-only. |

---

## 5. `@padel/stats` — 🟡 (34 tests; §3.3 mostly complete)

All headline metrics present and tested (win-rate, sets/games/points %, service-
hold %, decider win %, streaks, head-to-head, chemistry, venue, time-of-day &
day-of-week via timezone-deterministic Zeller). Wrapped summary present.

| Gap | Status | Evidence |
|---|---|---|
| Form "last N" cap | 🟡 | `compute.ts:114` returns full history; no N param (caller must slice). |
| Optional shot stats | ❌ | No shot fields on `MatchRecord` (`types.ts:5`); no shot aggregation. |
| Wrapped "rating journey" | ❌ | Not in `WrappedSummary` (`wrapped.ts:4`); composed only in the app screen. |
| "Biggest comeback" magnitude | 🟡 | Only a comeback **count** (`wrapped.ts:64`); the single biggest isn't identified. |
| Comeback detection | 🟡 | External — sums a `wasComeback` flag supplied by the app; not computed/tested in-package. |

---

## 6. `@padel/design-tokens` — ✅ (placeholder values by design)

Colors, spacing (4–64), radii, elevation, typography (tabular nums, Space
Grotesk + Inter), motion, dark/light/high-contrast themes, gradients, effects.
8 tests. **Note:** radii (10/16/24/28/999) and the type ramp differ from the
plan's placeholder numbers; tests don't pin exact values. Values are explicitly
provisional pending the final palette (owner task).

---

## 7. Mobile app — foundation — 🟡 (one DoD miss)

| Item | Status | Evidence / gap |
|---|---|---|
| DB schema vs data model | 🟡 | All model tables present (`schema.ts`) **except a dedicated `games` table** (games derive from the folded log — functional, but a documented deviation). |
| expo-sqlite WAL + drizzle migrations | ✅ | `client.ts:12-24`; migrations `0000/0001` |
| Synchronous persist before UI confirm | ✅ | `matchStore.ts:44-47` — `persistLiveSnapshot().run()` precedes `set()`. Pillar holds. |
| Resume live match | ✅ | `matchStore.ts:37-39`, `useResumable.ts:24-39` (⚠️ byte-identity is runtime-only) |
| Giant tap zones, one-tap/point, haptics, server indicator, status line | ✅ | `app/match/[id].tsx:116-146,58-59,131-138`, `statusLabel.ts:9-32` |
| Penalties, timeout, per-point shot logging, voice call-out | ✅ | `match/[id].tsx:94-114,66-73`, `announcer.ts` |
| Bottom tabs, onboarding (no forced account), settings | ✅ | `(tabs)/_layout.tsx:21-40`, `onboarding.tsx`, `profile.tsx` |
| No network on scoring path | ✅ | `src/store` has no fetch/http/supabase imports |
| **Sentry breadcrumbs on scoring + resume** | ❌ | **DoD violation.** Zero `addBreadcrumb` anywhere; Sentry is only init'd (`_layout.tsx:18`). The "never lose a match" claim is uninstrumented. |
| **REPLAY control on phone** | ❌ | Engine + both watches + all locales support REPLAY, but the scoreboard exposes no control. |
| Undo a11y / discoverability | 🟡 | Long-press-only; no `accessibilityActions`/hint, no visible affordance. |
| Live-region score announcement (VoiceOver/TalkBack) | 🟡 | Score change is not announced (distinct from optional voice call-out). |
| Scoreboard theme-reactivity | ⚠️ | Hardcodes dark tokens (`palette.bg900`); dark-only on court is likely deliberate — confirm & record. |

---

## 8. Mobile app — features/growth/infra — 🟡/❌ (biggest cluster of gaps)

| Item | Status | Evidence / gap |
|---|---|---|
| Skia card portrait, zero COGS, buildCardData selector, wordmark+QR, signature stat | ✅ | `MatchCard.tsx`, `buildCardData.ts`, `shareCard.ts` |
| **Card date** | ❌ | **BUG:** `buildCardData.ts:56` stamps `new Date()`. Every shared/re-shared card shows *today*, not the match date (`loadMatchDetail` reads the true date for the screen but the card ignores it). |
| Card venue / duration / format+deuce / each-player delta | ❌/🟡 | venue hard-coded `''`; duration computed but never passed; format+deuce never shown; only the **sharer's** rating delta is on the card. |
| Square 1080×1080 variant | 🟡 | Renderer supports `square` (`MatchCard.tsx:62`) but **no caller sets it** — dead path. |
| Wrapped screen (all scenes, share, holographic) | ✅ | `app/wrapped.tsx`, `WrappedShareCard.tsx` |
| **RevenueCat `Purchases.configure()`** | ❌ | **Runtime-dead paywall.** `useEntitlements`/`paywall.tsx` call `getCustomerInfo()`/`getOfferings()` but the SDK is **never configured** with the RC keys (which exist in `app.config.ts:63-64`). |
| Pricing/free-paid split (£9.99/£1.99, free history 20, gate advanced stats) | ✅ | `paywall/config.ts:9-35`, `stats.tsx:84-115`, `history.tsx:25` |
| Wrapped export gating | 🟡 | `wrappedExport` is a Pro feature but the share has no `isPro` check — inconsistent (decide: gate or drop from `PRO_FEATURES`). |
| Cloud-backup gating | 🟡 | Sync gated on **auth**, not `isPro`; spec frames backup as Pro. |
| Premium card themes | 🟡 | Only a single holographic on/off; no multi-theme picker. |
| NEVER gate scoring or the card | ✅ | Confirmed — only holographic sheen is Pro. |
| Sync (offline-first, dirty push, LWW, free≠network, claim re-parent) | ✅ | `syncEngine.ts`, `supabase.ts`, `claimRepo.ts`; useAuth Apple/Google/email |
| **Contacts import / friend tagging / friends list / feed** | ❌ | All missing. `friends.tsx` is a static `EmptyState` placeholder; no `expo-contacts`; no feed. |
| Profile screen | 🟡 | Settings/account only — no editable/viewable player profile. |
| **Funnel/product analytics** | ❌ | No SDK, no events — install→activation and trial→paid are unmeasurable. |
| Deep-link association files (AASA / assetlinks.json) | ❌ | Intent filters configured (`app.config.ts:28,37-44`) but no `.well-known` files in repo; universal/app links won't verify without them hosted. |
| i18n EN+ES + FR/IT/PT/SV/NL | ✅ | **Exceeds spec** — all 7 locales have full 53-key parity (not scaffolds). |
| a11y labels consistency | 🟡 | Several `View onTouchEnd role=button` rows lack `accessibilityLabel` (`profile.tsx:37`, `paywall.tsx:45`, `m/[matchId].tsx:37`); prefer `Pressable`. |
| Notifications | ✅ | `notify.ts` (⚠️ Android channel creation not found). |
| Minor | 🟡 | `syncEngine.ts:112` dead line. |

---

## 9. Watch apps + parity — 🟡 (engines ✅, integration edges gapped)

| Item | Status | Evidence / gap |
|---|---|---|
| **Apple Watch ScoreEngine = full port** | ✅ | `ScoreEngine.swift:118-307` mirrors TS near line-for-line (all deuce modes, TB, serve, super-TB). Not a stub. |
| **Wear ScoreEngine = full port** | ✅ | `ScoreEngine.kt:115-274` faithful mirror. Not a stub. |
| **Golden-vector parity (TS+Swift+Kotlin)** | ✅ | Fixture `fixtures/golden-vectors.json` (12 vectors); all three consumers load & assert per-step incl. serverSlot; md5 identical across platforms. **Strongest part of the build.** |
| Watch standalone persistence, tap zones, haptics, complication/Tile | ✅ | `MatchStore.swift`, `MatchRepository.kt`, `ContentView.swift`, `MainActivity.kt`, `MarqueComplication.swift`, `MarqueTileService.kt` |
| **Wear `MatchForegroundService`** | ❌ | Declared in `AndroidManifest.xml:28` but **no Kotlin class exists** — latent crash + missing `FOREGROUND_SERVICE` permission. |
| Phone-side watch-sync receiver | ❌ | Watch→phone `push` exists on both platforms but there's **no phone-side receiver / Expo native module** — sync loop is one-ended. |
| HealthKit workout (iOS) / Health Connect (Wear) | 🟡 | `WorkoutManager.swift` & `HealthManager.kt` implemented/scaffolded but **never invoked** — dead until wired. |
| Digital Crown (Apple Watch) | ❌ | Spec lists it; no `digitalCrownRotation` anywhere. |
| Wear persistence uses DataStore/Room | 🟡 | Uses SharedPreferences (self-admitted `MatchRepository.kt:12`); below the spec's durability bar. |

---

## 10. Backend (Supabase) — 🟡

| Item | Status | Evidence / gap |
|---|---|---|
| Postgres mirror + RLS per table | ✅ | `0001_init.sql:9-51` — `profiles` + `sync_rows` envelope; RLS enabled, policies scoped to `auth.uid()` with `with check`. |
| Guest-claim re-parenting | 🟡 | `claim_guest()` re-parents **only `players`** (`0001_init.sql:32-37`), not matches/ratings; `security definer` lacks `set search_path` (Supabase advisor finding). |
| Auth providers (email/Apple/Google) in repo | ❌ | No `config.toml`/provider config — console-only, not version-controlled. |

---

## 11. CI / build — 🟡

| Item | Status | Evidence / gap |
|---|---|---|
| `ci.yml` builds/tests all 6 packages + TS parity fixture | ✅ | `ci.yml:31-53`, fixed FASTCHECK_SEED |
| **Native (Swift/Kotlin) parity tests in CI** | ❌ | No macOS `xcodebuild test` / `./gradlew :wear:test` job — the native halves of the parity contract never run in CI. |
| `android-apk.yml` sideload APK | 🟡 | Full pipeline; **mid-stabilisation.** Last run failed at `createBundleReleaseJsAndAssets` (pnpm `expo-asset` resolution + Sentry upload). Fixes pushed (`.npmrc node-linker=hoisted`, `SENTRY_DISABLE_AUTO_UPLOAD`); **awaiting a green run.** Coverage thresholds are not wired into CI (see §1). |

---

## 12. Remaining work — logically ordered

Ordered so each block unblocks the next. **P0** = correctness/runtime blockers;
**P1** = spec completeness; **P2** = verification/hardening; **P3** = launch/owner.

### P0 — Runtime & correctness blockers (do first)
1. **Get the sideload APK green** — confirm the `node-linker=hoisted` +
   `SENTRY_DISABLE_AUTO_UPLOAD` fixes carry the build through Hermes + packaging;
   iterate on any next error. *(Gate for every runtime item below.)*
2. **Initialise RevenueCat** — add `Purchases.configure({ apiKey })` in
   `app/_layout.tsx` (keys already in `app.config.ts`). Without it the entire
   paywall/entitlement layer is dead. Verify offerings return the two products.
3. **Fix the card-date bug** — thread the match's `startedAtIso` (and `venue`,
   `durationSec`) into `buildCardData`; format the real date. Covers result +
   history re-share.
4. **Add Sentry scoring breadcrumbs + exception capture** (DoD) — breadcrumbs on
   dispatch/start/resume/persist and `findResumableMatch`; `captureException` in
   the swallowing `catch{}` blocks (share/purchase/sync).

### P1 — Spec completeness (features that are missing/partial)
5. **Complete the match card** — add venue, duration, format+deuce, and each
   player's rating delta to `MatchCardData`/`buildCardData`; wire the **square
   1080×1080** variant to a share-format toggle (or remove the dead path).
6. **Expose REPLAY** (let/replay point) on the phone scoreboard.
7. **Knockout bracket advancement** — add `advanceBracket(matches, results)` so
   single-elim progresses to a champion; test full play-through incl. byes.
8. **Time-per-round event mode** — add a time-based completion mode to
   `EventSessionConfig`/court-complete, or explicitly document the deferral.
9. **Social layer** — contacts import (`expo-contacts`), friend tagging, a real
   friends list (replace the `friends.tsx` placeholder), opt-in feed.
10. **Funnel analytics** — add a lightweight event layer + key events
    (install→activation=first match scored, trial-start, trial→paid, annual mix).
11. **Reconcile Pro gating** — decide Wrapped-export (gate vs free) and
    cloud-backup (auth vs Pro); implement premium card themes or narrow the spec.
12. **Wrapped depth** — surface the rating journey and biggest-comeback magnitude
    (fold `RatingHistoryEntry[]` / comeback magnitude into `WrappedSummary` or the
    screen selector); optional shot-stats aggregation if in scope.
13. **a11y** — accessible undo action + live-region score announcement; add
    `accessibilityLabel` to `onTouchEnd`/role=button rows; verify Dynamic Type.

### P2 — Verification & hardening
14. **Wear `MatchForegroundService`** — implement the Kotlin service + permission
    (or remove the manifest declaration). Latent crash today.
15. **Two-ended watch↔phone sync** — build the phone-side receiver (iOS Expo
    native `WCSessionDelegate` bridge; Android `WearableListenerService`).
16. **Wire HealthKit / Health Connect** — instantiate `WorkoutManager` /
    `HealthManager` on match lifecycle; add Digital Crown on Apple Watch; migrate
    Wear persistence to DataStore.
17. **Native parity tests in CI** — macOS `xcodebuild test` + `./gradlew
    :wear:test` jobs so the Swift/Kotlin engines are validated on every push.
18. **Engine coverage** — cover or `exclude` `src/global.ts`; wire `--coverage`
    into the engine/ratings/shared `test` scripts + CI so declared thresholds
    actually gate. Harden the sport-agnostic guard (fail on unexpected-missing).
19. **Backend** — broaden `claim_guest` to matches/ratings + pin `search_path`;
    version-control auth providers (`supabase/config.toml`).
20. **Add missing `games` table or document the deviation;** `configHash`
    sha256-vs-FNV decision (update spec or switch).
21. **Device smoke test + Maestro E2E** — score→kill→resume→share→Wrapped on a
    real device; run the authored Maestro flows.

### P3 — Store-submission & launch (partly owner)
22. **Legal & compliance (store blockers)** — privacy policy + terms (HealthKit/
    Health Connect makes a privacy policy mandatory), App Store/Play Data-Safety
    disclosures, and **in-app account deletion** (Apple requirement for apps with
    sign-in — not currently built).
23. **Deep-link association files** — host AASA + `assetlinks.json` at marque.app.
24. **Owner/launch** — final palette; "Marque" trademark clearance + domains;
    store assets (screenshots/icon/preview); provision RevenueCat / App Store
    Connect / Play Console / Supabase; stabilise the APK signing keystore; seed
    launch clubs.

---

## 13. Confirmed-solid (no action)

Pure core packages (227 tests), synchronous log-fold persistence + resume,
offline isolation of the scoring path, the tri-platform golden-vector parity
system, both watch ScoreEngine ports, full 7-locale translations, correct paywall
pricing/free-paid split in code, RLS-per-table on the backend, and the docs
listed Accurate in `docs/` (ARCHITECTURE, ASO, BUILD-APK, DESIGN-SYSTEM,
MONETISATION, PROMPT-TEMPLATES, WATCH-ARCHITECTURE, CLAUDE.md).
