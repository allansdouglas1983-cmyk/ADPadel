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
  control: 10,
  card: 16,
  cardLg: 24,
  sheet: 28,
  pill: 999,
} as const;

/** Two-layer elevation tokens (RN shadow-friendly). */
export const elevation = {
  elev1: { shadowOpacity: 0.12, shadowRadius: 4, elevation: 1 },
  elev2: { shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 },
  elev3: { shadowOpacity: 0.22, shadowRadius: 20, elevation: 6 },
} as const;

/** Motion durations (ms), easing curves, and Reanimated spring presets. */
export const motion = {
  durationFast: 120,
  durationBase: 200,
  durationSlow: 320,
  easingStandard: [0.2, 0, 0, 1] as const, // cubic-bezier
  easingEmphasised: [0.3, 0, 0, 1] as const,
  /** Reanimated `withSpring` configs. */
  springGentle: { damping: 18, stiffness: 180, mass: 1 } as const,
  springBouncy: { damping: 12, stiffness: 200, mass: 0.9 } as const,
  springStiff: { damping: 26, stiffness: 320, mass: 1 } as const,
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;
