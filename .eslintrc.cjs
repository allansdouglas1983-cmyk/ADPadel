/**
 * Root ESLint config. The pure-TS packages are linted with the
 * TypeScript recommended ruleset. The mobile app has its own Expo ESLint
 * config layered on top.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '**/*.tsbuildinfo',
    'apps/mobile/android/',
    'apps/mobile/ios/',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};
