import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/theme/ThemeProvider';
import '@/i18n';

// Crash reporting is how we EVIDENCE the "never lose a match" reliability claim.
Sentry.init({
  dsn: (Constants.expoConfig?.extra?.sentryDsn as string) ?? undefined,
  tracesSampleRate: 0.2,
  enabled: !__DEV__,
});

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
