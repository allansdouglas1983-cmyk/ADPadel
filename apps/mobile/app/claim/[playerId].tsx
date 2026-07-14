import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Button, NameInput, Screen, Sparkles, Text } from '@/ui';
import { claimGuestProfile } from '@/db/claimRepo';
import { useAuth } from '@/sync/useAuth';
import { useTheme } from '@/theme/ThemeProvider';

/** Claim a guest profile in ≤3 taps. If not signed in, sign in first (Apple /
 * Google / email), then re-parent the guest's whole history to the user. */
export default function ClaimScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const theme = useTheme();
  const { user, busy, signInWithApple, signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);

  const claim = async () => {
    if (!user) return;
    setClaiming(true);
    try {
      await claimGuestProfile(playerId!, user.id);
      setDone(true);
    } finally {
      setClaiming(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Animated.View entering={ZoomIn.springify().damping(11)}>
            <Sparkles size={72} color={theme.gold} />
          </Animated.View>
          <Text variant="display" tone="gold">
            Profile claimed
          </Text>
          <Text variant="body" tone="mid" style={{ textAlign: 'center' }}>
            Your match history is now yours across every device.
          </Text>
          <Button label={`Open ${BRAND.name}`} size="lg" full onPress={() => router.replace('/(tabs)')} />
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <Text variant="display" tone="hi">
            Claim your profile
          </Text>

          {user ? (
            <Button label="Claim now" size="lg" full loading={claiming} onPress={claim} />
          ) : (
            <View style={{ gap: spacing.md }}>
              <Text variant="body" tone="mid">
                Sign in to keep your stats — free to score offline forever.
              </Text>
              <Button label="Continue with Apple" size="lg" full variant="secondary" onPress={signInWithApple} />
              <Button label="Continue with Google" size="lg" full variant="ghost" onPress={signInWithGoogle} />
              <NameInput value={email} onChangeText={setEmail} placeholder="you@email.com" autoCapitalize="none" keyboardType="email-address" />
              <Button label="Email me a link" full variant="ghost" disabled={busy || !email} onPress={() => signInWithEmail(email)} />
            </View>
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
