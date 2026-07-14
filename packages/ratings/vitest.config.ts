import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'ratings',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts'],
      thresholds: { branches: 90, functions: 100, lines: 100, statements: 100 },
    },
  },
});
