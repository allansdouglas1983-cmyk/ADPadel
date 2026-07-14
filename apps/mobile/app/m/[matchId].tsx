import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BRAND } from '@padel/shared';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { matchPlayers } from '@/db/claimRepo';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * The landing page a shared card's QR/link opens (`/m/<matchId>`). It lists the
 * players and lets each tap to claim their profile — turning a card in a club
 * chat into new users. This is the entry point of the viral loop.
 */
export default function MatchLandingScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const theme = useTheme();
  const people = useMemo(() => matchPlayers(matchId!), [matchId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.wordmark, { color: theme.textHi }]}>{BRAND.wordmark}</Text>
      <Text style={[styles.subtitle, { color: theme.textMid }]}>Claim your profile to keep your stats.</Text>

      {people.map((p) => (
        <Pressable
          key={p.id}
          disabled={p.claimed}
          onPress={() => router.push(`/claim/${p.id}`)}
          style={[styles.row, { borderColor: p.claimed ? theme.border : theme.brand }]}
        >
          <Text style={{ color: theme.textHi, fontWeight: '600' }}>{p.displayName}</Text>
          <Text style={{ color: p.claimed ? theme.textLo : theme.brand }}>{p.claimed ? 'Claimed' : 'Claim →'}</Text>
        </Pressable>
      ))}

      {people.length === 0 && (
        <Text style={{ color: theme.textMid }}>This match isn’t on your device — install {BRAND.name} to claim.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md, justifyContent: 'center' },
  wordmark: { fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: 2 },
  subtitle: { fontSize: fontSize.base, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderRadius: radii.card, borderWidth: 1.5 },
});
