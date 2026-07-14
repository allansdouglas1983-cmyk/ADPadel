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
import '@/i18n';

void SplashScreen.preventAutoHideAsync();

// Crash reporting is how we EVIDENCE the "never lose a match" reliability claim.
Sentry.init({
  dsn: (Constants.expoConfig?.extra?.sentryDsn as string) ?? undefined,
  tracesSampleRate: 0.2,
  enabled: !__DEV__,
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
  );
}

export default Sentry.wrap(RootLayout);
