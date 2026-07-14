/**
 * Typography tokens. Scores use TABULAR numerals so digits never jump on the
 * live scoreboard — the single most important type decision for this app.
 */
export const fontFamily = {
  display: 'ClashDisplay', // strong geometric sans for headings/board
  body: 'Inter',
  /** Same face, tabular figures — for all score/stat numerals. */
  numeric: 'Inter',
} as const;

export const fontVariant = {
  tabularNumbers: ['tabular-nums'] as const,
} as const;

/** Type scale (px): 12 → 96. The live board score uses 64–96. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 48,
  displayLg: 64,
  score: 96,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontSize = typeof fontSize;
