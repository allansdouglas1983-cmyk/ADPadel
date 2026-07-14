import { palette } from './colors.js';

/**
 * Depth effects — glow (coloured shadows for the premium neon feel) and glass
 * (translucent tint + hairline border for frosted surfaces). Given as
 * RN-shadow-friendly specs so components apply them consistently.
 */
export const glow = {
  brand: { shadowColor: palette.brand400, shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  gold: { shadowColor: palette.gold500, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  accent: { shadowColor: palette.accent400, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  none: { shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
} as const;

export const glass = {
  /** Frosted panel: translucent fill + hairline top-lit border. */
  tint: '#FFFFFF14',
  tintStrong: '#FFFFFF22',
  border: '#FFFFFF26',
  blurAmount: 24,
} as const;

export type GlowName = keyof typeof glow;
