/**
 * The padel shot vocabulary for optional per-point logging (dossier §1.3/§3.3).
 * Using the real terms keeps the app native to padel, not a tennis clone.
 */
export const SHOT_TYPES = [
  'bandeja',
  'vibora',
  'remate',
  'globo',
  'chiquita',
  'bajada',
  'rulo',
  'volea',
] as const;

export type ShotType = (typeof SHOT_TYPES)[number];

/** Display labels (with accents) keyed by the ascii shot id. */
export const SHOT_LABEL: Record<ShotType, string> = {
  bandeja: 'Bandeja',
  vibora: 'Víbora',
  remate: 'Remate',
  globo: 'Globo',
  chiquita: 'Chiquita',
  bajada: 'Bajada',
  rulo: 'Rulo',
  volea: 'Volea',
};
