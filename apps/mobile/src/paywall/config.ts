/**
 * Monetisation config (dossier §8, adjusted to the founder's pricing).
 * Scoring and the shareable card are ALWAYS FREE — they fuel the viral loop.
 * Pro gates depth: advanced stats, unlimited history, Wrapped export, themes,
 * cloud backup.
 */
export const ENTITLEMENT_PRO = 'pro';

export const PRODUCTS = {
  annual: {
    id: 'marque_pro_annual',
    priceLabel: '£9.99/yr',
    highlighted: true,
    trialDays: 14,
  },
  monthly: {
    id: 'marque_pro_monthly',
    priceLabel: '£1.99/mo',
    highlighted: false,
  },
} as const;

/** Features gated behind Pro. Scoring is deliberately absent — never gate it. */
export const PRO_FEATURES = [
  'advancedStats',
  'unlimitedHistory',
  'wrappedExport',
  'premiumCardThemes',
  'cloudBackup',
] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

/** Free tier keeps roughly the last 20 matches of history. */
export const FREE_HISTORY_LIMIT = 20;
