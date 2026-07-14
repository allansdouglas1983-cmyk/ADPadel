import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'scoring-engine',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Exclude the barrel, presets (padel data, not logic), and the pure
      // type-only modules (no executable code to cover).
      exclude: ['src/index.ts', 'src/presets/**', 'src/config.ts', 'src/state.ts', 'src/actions.ts'],
      thresholds: {
        // The engine core is the reliability moat — hold it to a high bar.
        // 100% statements/functions/lines; the small branch gap is unreachable
        // defensive `?.`/`??` guards, so 90 is the honest floor there.
        branches: 90,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
