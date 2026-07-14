import { palette } from './colors.js';

/**
 * Gradient tokens (ordered colour stops). The premium visual world of the app —
 * padel's night-match neon and glass — is expressed here so every surface and
 * the share card share one identity. Consumers map these to their gradient
 * primitive (Skia LinearGradient, expo-linear-gradient, CSS).
 */
export const gradients = {
  /** App background — deep, subtly blue-green. */
  appBg: [palette.bg900, '#0C1620'] as const,
  /** Brand hero (buttons, highlights). */
  brand: [palette.brand400, palette.brand600] as const,
  /** Court blue accent. */
  court: [palette.accent400, palette.accent500] as const,
  /** Golden/star-point flourish. */
  gold: ['#FFD25A', palette.gold500] as const,
  /** Card / surface sheen. */
  surface: [palette.surface700, palette.bg800] as const,
  /** Glassy translucent overlay stops (use with opacity). */
  glass: ['#FFFFFF22', '#FFFFFF05'] as const,
  /** Holographic sweep for the Wrapped finale. */
  holographic: ['#7C5CFF', '#2BD08C', '#4C93FF', '#F5B301'] as const,
} as const;

export type GradientName = keyof typeof gradients;
