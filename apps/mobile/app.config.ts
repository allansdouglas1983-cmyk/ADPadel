import type { ExpoConfig } from 'expo/config';

// Brand values come from the single source of truth so a rename never touches
// app config. (Imported lazily to keep the config file dependency-light.)
const BRAND = {
  name: 'Marque',
  scheme: 'marque',
  universalLinkHost: 'marque.app',
};

const config: ExpoConfig = {
  name: BRAND.name,
  slug: 'marque-padel',
  scheme: BRAND.scheme,
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.marque.padel',
    infoPlist: {
      // Apple Watch companion + HealthKit workout session.
      NSHealthShareUsageDescription: 'Record heart rate and calories during matches.',
      NSHealthUpdateUsageDescription: 'Save your match workouts to Health.',
    },
    associatedDomains: [`applinks:${BRAND.universalLinkHost}`],
  },
  android: {
    package: 'app.marque.padel',
    permissions: ['android.permission.health.READ_HEART_RATE'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: BRAND.universalLinkHost }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-font',
    ['expo-sqlite', { enableFTS: false }],
    'expo-notifications',
    '@sentry/react-native/expo',
    [
      'expo-splash-screen',
      { backgroundColor: '#0B0F14', image: './assets/splash.png', imageWidth: 180 },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    // Injected via EAS env — never hard-coded. See .env.example.
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    revenueCatKeyIos: process.env.EXPO_PUBLIC_RC_IOS,
    revenueCatKeyAndroid: process.env.EXPO_PUBLIC_RC_ANDROID,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
};

export default config;
