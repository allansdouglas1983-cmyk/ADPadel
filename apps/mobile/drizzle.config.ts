import type { Config } from 'drizzle-kit';

// Generates SQL migrations from src/db/schema.ts for expo-sqlite. Run:
//   pnpm --filter @padel/mobile exec drizzle-kit generate
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
