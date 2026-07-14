/** Spacing scale (px). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/** Corner radii (px). */
export const radii = {
  control: 8,
  card: 12,
  sheet: 20,
  pill: 999,
} as const;

/** Two-layer elevation tokens (RN shadow-friendly). */
export const elevation = {
  elev1: { shadowOpacity: 0.12, shadowRadius: 4, elevation: 1 },
  elev2: { shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 },
  elev3: { shadowOpacity: 0.22, shadowRadius: 20, elevation: 6 },
} as const;

/** Motion durations (ms) and easing curves. */
export const motion = {
  durationFast: 120,
  durationBase: 200,
  durationSlow: 320,
  easingStandard: [0.2, 0, 0, 1] as const, // cubic-bezier
  easingEmphasised: [0.3, 0, 0, 1] as const,
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;
