// Monorepo-aware Metro config: watch the workspace root and resolve the
// hoisted node_modules so `@padel/*` workspace packages load correctly.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Drizzle's generated migrations bundle (`src/db/migrations/migrations.js`)
// imports the raw `.sql` files, so Metro must treat `.sql` as a source module.
// https://orm.drizzle.team/docs/get-started/expo-new
config.resolver.sourceExts.push('sql');

module.exports = config;
