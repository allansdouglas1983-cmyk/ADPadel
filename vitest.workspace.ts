import { defineWorkspace } from 'vitest/config';

// Aggregates the per-package Vitest configs. The pure-TS packages
// (scoring-engine, ratings, shared) run in a Node environment and are fully
// verifiable in CI. The mobile app is intentionally excluded — it is exercised
// via Maestro E2E and native test suites off-environment.
export default defineWorkspace([
  'packages/scoring-engine',
  'packages/ratings',
  'packages/shared',
]);
