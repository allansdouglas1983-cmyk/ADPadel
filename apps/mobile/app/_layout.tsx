import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useMigrations } from '@/db/client';
import { useAppFonts } from '@/theme/fonts';
import { useSettings } from '@/store/settingsStore';
import { configurePurchases } from '@/paywall/purchases';
import { StartupErrorBoundary, reportStartupError } from '@/lib/StartupErrorBoundary';
import '@/i18n';

// Surface any uncaught JS error on screen instead of a silent close.
const globalWithErrorUtils = global as unknown as {
  ErrorUtils?: {
    getGlobalHandler?: () => (e: unknown, isFatal?: boolean) => void;
    setGlobalHandler?: (h: (e: unknown, isFatal?: boolean) => void) => void;
  };
};
const prevHandler = globalWithErrorUtils.ErrorUtils?.getGlobalHandler?.();
globalWithErrorUtils.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  reportStartupError(error);
  prevHandler?.(error, isFatal);
});

// Initialise RevenueCat once at module load, before any entitlement check.
try {
  configurePurchases();
} catch (err) {
  reportStartupError(err);
}

void SplashScreen.preventAutoHideAsync();

// Crash reporting is how we EVIDENCE the "never lose a match" reliability claim.
// Only enable when a DSN is actually configured — initialising the native SDK
// with an empty DSN crashes a release build at launch (sideload builds have no
// Sentry secret). Breadcrumbs/captureException elsewhere are safe no-ops when off.
const sentryDsn = (Constants.expoConfig?.extra?.sentryDsn as string) || undefined;
Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.2,
  enabled: !__DEV__ && Boolean(sentryDsn),
});

function RootLayout() {
  const { success, error } = useMigrations();
  const fontsLoaded = useAppFonts();
  const ready = (success || Boolean(error)) && fontsLoaded;

  // Restore persisted preferences (high-contrast, notifications, voice call-out)
  // once the schema exists — before any screen reads them.
  useEffect(() => {
    if (success) useSettings.getState().load();
  }, [success]);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Hold the splash until the schema is migrated and premium type is loaded.
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#0B0F14' }} />;

  return (
    <StartupErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="match/[id]" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="event/[id]" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="king/[id]" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="setup" options={{ presentation: 'modal' }} />
              <Stack.Screen name="event/setup" options={{ presentation: 'modal' }} />
              <Stack.Screen name="king/setup" options={{ presentation: 'modal' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            </Stack>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StartupErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
