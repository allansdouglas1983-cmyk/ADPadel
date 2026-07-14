import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { claimGuestProfile } from '@/db/claimRepo';
import { useAuth } from '@/sync/useAuth';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Claim a guest profile in ≤3 taps (the dossier benchmark). If the user isn't
 * signed in, they sign in first (Apple / Google / email) — then the guest's
 * whole history is re-parented to them locally and on the server.
 */
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
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Text style={[styles.title, { color: theme.win }]}>Profile claimed 🎾</Text>
        <Text style={{ color: theme.textMid }}>Your match history is now yours across devices.</Text>
        <Pressable onPress={() => router.replace('/(tabs)')} style={[styles.cta, { backgroundColor: theme.brand }]}>
          <Text style={styles.ctaText}>Open {`Marque`}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.textHi }]}>Claim your profile</Text>

      {user ? (
        <Pressable onPress={claim} disabled={claiming} style={[styles.cta, { backgroundColor: theme.brand }]}>
          {claiming ? <ActivityIndicator /> : <Text style={styles.ctaText}>Claim now</Text>}
        </Pressable>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: theme.textMid }}>Sign in to keep your stats.</Text>
          <Pressable onPress={signInWithApple} style={[styles.provider, { backgroundColor: theme.textHi }]}>
            <Text style={{ color: theme.bg, fontWeight: '700' }}>Continue with Apple</Text>
          </Pressable>
          <Pressable onPress={signInWithGoogle} style={[styles.provider, { borderColor: theme.border, borderWidth: 1 }]}>
            <Text style={{ color: theme.textHi, fontWeight: '700' }}>Continue with Google</Text>
          </Pressable>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.textLo}
            style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
          />
          <Pressable onPress={() => signInWithEmail(email)} disabled={busy || !email} style={[styles.provider, { borderColor: theme.brand, borderWidth: 1 }]}>
            <Text style={{ color: theme.brand, fontWeight: '700' }}>Email me a link</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: { fontSize: fontSize.display, fontWeight: '700' },
  cta: { paddingVertical: spacing.lg, borderRadius: radii.card, alignItems: 'center' },
  ctaText: { color: '#04150E', fontSize: fontSize.lg, fontWeight: '700' },
  provider: { paddingVertical: spacing.lg, borderRadius: radii.card, alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: radii.control, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fontSize.base },
});
