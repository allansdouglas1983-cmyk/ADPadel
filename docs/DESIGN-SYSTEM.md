# Design System

The visual identity lives entirely in `packages/design-tokens`. Components read
tokens — never raw hex or magic numbers — so applying the final brand palette is
a one-package change (the current palette is a placeholder seeded from the
build dossier).

## Tokens
- **Colour** (`colors.ts`): brand (court green), accent (court blue), gold
  (golden/star point), dark-first neutrals, semantic win/loss/warn/info, and a
  light-mode set.
- **Spacing** (`scale.ts`): 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- **Radii**: 8 control · 12 card · 20 sheet · 999 pill.
- **Elevation**: two-layer `elev1/2/3`.
- **Motion**: 120/200/320ms, standard & emphasised easing; spring for Wrapped.
- **Typography** (`typography.ts`): display geometric sans + Inter body; scale
  12→96; the live board uses 64–96. **Scores use tabular numerals** so digits
  never jump — the single most important type decision for a scoreboard.
- **Theme** (`theme.ts`): `dark` (on-court default — glare + battery) and
  `light`, consumed via `ThemeProvider` / `useTheme` in the app.

## Surfaces
- **Live scoreboard:** two giant tap zones (≥64pt), big tabular score, a serve
  dot in brand-gold, one tap per point, long-press to undo, no mid-match modals.
- **Match card (Skia):** dark premium base, neon court accent, big tabular
  score, a gold flourish for golden/star moments, wordmark + claim link.
- **Wrapped card:** the same tokens with an optional holographic sheen (Skia
  shader) for the Pro export.

## Accessibility
Large targets, VoiceOver/TalkBack labels on every scoring action, Dynamic Type,
high-contrast on-court mode, dark default.
