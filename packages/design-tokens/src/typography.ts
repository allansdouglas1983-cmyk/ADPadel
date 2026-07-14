/**
 * Typography tokens. Display uses a strong geometric sans (Space Grotesk — the
 * closest freely-bundlable relative of Clash Display); body/numerals use Inter.
 * Scores use TABULAR numerals so digits never jump on the live scoreboard — the
 * single most important type decision for this app.
 *
 * The font family strings match the names registered by expo-font in the app.
 */
export const fontFamily = {
  display: 'SpaceGrotesk-Bold',
  displayMedium: 'SpaceGrotesk-Medium',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemibold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  /** Inter with tabular figures — for all score/stat numerals. */
  numeric: 'Inter-SemiBold',
} as const;

export const fontVariant = {
  tabularNumbers: ['tabular-nums'] as const,
} as const;

/** Type scale (px): 12 → 112. The live board score uses 80–112. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
  displayLg: 64,
  score: 88,
  scoreHero: 112,
} as const;

/** Line heights paired to the scale for comfortable rhythm. */
export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 32,
  xxl: 40,
} as const;

/** Letter spacing tokens (px). Display tightens; labels track wide. */
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1,
  wider: 2,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontSize = typeof fontSize;
