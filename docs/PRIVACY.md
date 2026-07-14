# Privacy Policy — Marque (DRAFT)

> **DRAFT / TEMPLATE — requires legal review before publication.** Replace every
> `[bracketed]` placeholder with real values, have a lawyer review it, and host
> it at a public URL (e.g. `https://marque.app/privacy`) before submitting to the
> App Store or Google Play. A privacy policy is **mandatory** for store
> submission, and doubly so because the watch apps request Health data.

**Effective date:** [DATE]
**Provider:** [Legal entity name], [address], contact: [privacy@marque.app]

## Summary
Marque is **offline-first**. You can install the app, score matches, view stats,
and generate share cards **without an account and without any data leaving your
device**. Cloud features are strictly opt-in.

## What we store on your device
- Matches, scores, players/guests, ratings, stats, and app settings — held in a
  local SQLite database on your device. This never leaves the device unless you
  sign in and enable sync.

## What we collect only if you opt in
- **Account & sync (optional):** if you sign in (Apple, Google, or email), we
  store your matches and profile in our hosted database ([Supabase]) so you can
  back up and sync across devices. Legal basis: performance of contract /
  consent.
- **Health & workouts (optional, watch apps):** with your permission, the Apple
  Watch app uses **HealthKit** and the Wear OS app uses **Health Connect** to
  record a workout session and heart-rate/calories during a match. This data is
  used only to power the workout/session feature and is **not** sold or shared.
  You can revoke permission at any time in system settings.
- **Purchases:** subscriptions are processed by **RevenueCat** and the app
  stores (Apple/Google). We receive entitlement status, not your payment details.
- **Crash diagnostics (optional):** if enabled, **Sentry** receives crash reports
  and diagnostic breadcrumbs to help us fix reliability issues.

## What we do NOT do
- We do **not** require an account to use core features.
- We do **not** sell your personal data.
- We do **not** put your scoring behind the network — scoring always works
  offline.

## Sharing
Share cards and leaderboard links you choose to share contain the information
shown on them (player names, scores, a claim link). You control when to share.

## Your rights
Depending on your region (UK GDPR / EU GDPR / CCPA), you may request access,
correction, export, or deletion of your data. **In-app account deletion** is
provided in the app; you may also contact [privacy@marque.app].

## Data retention & security
Local data persists until you delete it or uninstall. Synced data is retained
while your account is active and deleted on account deletion. Data in transit is
encrypted (TLS); the backend enforces row-level security so you can only access
your own rows.

## Children
Marque is not directed at children under [13/16]. [Adjust per jurisdiction.]

## Changes
We will post changes here and update the effective date.

## Contact
[privacy@marque.app] · [Legal entity name] · [address]
