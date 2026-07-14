# Monetisation

Generous freemium — because every free user's shared card is a billboard that
recruits. Hard paywalls convert better but kill the viral loop; for a
virality-dependent social scoring app, freemium is the right call.

## Free forever
- All scoring (phone + both watches), all formats incl. Americano/Mexicano.
- Basic stats (win-rate, streak, recent history ~last 20 matches).
- The shareable match card (with wordmark + claim link).
- Add/invite players; one rating number.

## Marque Pro (entitlement `pro`)
- Unlimited match history.
- Advanced stats (partner chemistry, head-to-head depth, form, shot stats).
- Rating history & journey.
- Season Wrapped **export** (the Wrapped reveal itself stays free).
- Premium / holographic card themes.
- Multi-device cloud backup/sync.

## Pricing (founder's call)
| Plan | Price | Product id |
|---|---|---|
| Annual (default, highlighted) | **£9.99/yr** | `marque_pro_annual` |
| Monthly | **£1.99/mo** | `marque_pro_monthly` |

A ~14-day free trial on the annual plan. Deliberately low — it undercuts every
incumbent (e.g. Pady £19.99/yr) as a value/ASO wedge. No lifetime tier, no ads.

## Guardrails
- NEVER gate on-court scoring or the shareable card. They fuel the loop.
- No per-free-user server cost: the card renders on-device (Skia), free users
  never sync.

## Config
`apps/mobile/src/paywall/config.ts` (products, entitlement, `FREE_HISTORY_LIMIT`).
Purchases via RevenueCat (`react-native-purchases`); entitlement read in
`useEntitlements`. Gated UI is wrapped in `<ProLock>` — never scoring.
