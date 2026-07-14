/**
 * THE SINGLE SOURCE OF TRUTH for the product's name and voice.
 *
 * Everything user-facing (app display name, share card wordmark, store listing)
 * reads from here. Renaming the product is a one-file change — the workspace
 * package scope stays `@padel/*` and never needs to move. The final trademark
 * clearance for "Marque" is pending; the fallback "Pennant" would be a
 * single-line edit below.
 */
export const BRAND = {
  name: 'Marque',
  wordmark: 'MARQUE',
  tagline: 'Make your mark.',
  storeTitle: 'Marque: Padel Scores & Stats',
  storeSubtitle: 'Scoreboard, Americano & Wrapped',
  /** Deep-link scheme + universal-link host for claim/share URLs. */
  scheme: 'marque',
  universalLinkHost: 'marque.app',
} as const;

export type Brand = typeof BRAND;
