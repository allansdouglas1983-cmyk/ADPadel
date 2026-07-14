/**
 * Colour tokens. PLACEHOLDER palette seeded from the build dossier — the final
 * brand palette is pending. Because every surface reads these tokens (never raw
 * hex), restyling the whole app + share card is an edit to this one file.
 */
export const palette = {
  // Brand — padel-court green
  brand400: '#2BD08C',
  brand500: '#0BA66D',
  brand600: '#087E53',
  // Accent — court blue
  accent400: '#4C93FF',
  accent500: '#1E6FE6',
  // Signature golden/star point
  gold500: '#F5B301',
  // Dark-first neutrals
  bg900: '#0B0F14',
  bg800: '#121821',
  surface700: '#1B232E',
  surface600: '#26313D',
  border500: '#33404D',
  textHi: '#F5F8FA',
  textMid: '#A9B6C2',
  textLo: '#6B7A88',
  // Light mode
  bg50: '#F7FAFC',
  surface0: '#FFFFFF',
  textDark: '#0B0F14',
  // Semantic
  win: '#0BA66D',
  loss: '#E5484D',
  warn: '#F5B301',
  info: '#1E6FE6',
} as const;

export type Palette = typeof palette;
