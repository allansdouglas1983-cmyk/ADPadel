import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BRAND } from '@padel/shared';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuth } from '@/sync/useAuth';
import { fullSync } from '@/sync/syncEngine';

/** Profile & settings: Season Wrapped, Pro, and optional cloud backup (sign-in). */
export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro } = useEntitlements();
  const { user, busy, signInWithApple, signInWithGoogle, signOut } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const syncNow = async () => {
    setSyncing(true);
    try {
      await fullSync();
    } finally {
      setSyncing(false);
    }
  };

  const Item = ({ label, onPress, tint }: { label: string; onPress: () => void; tint?: string }) => (
    <Pressable onPress={onPress} style={[styles.item, { borderColor: tint ?? theme.border }]}>
      <Text style={{ color: tint ?? theme.textHi, fontWeight: tint ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.name, { color: theme.textHi }]}>{user?.email ?? t('score.you')}</Text>
      <Text style={{ color: theme.textMid }}>{isPro ? 'Marque Pro' : 'Free'}</Text>

      <Item label="Season Wrapped" onPress={() => router.push('/wrapped')} />
      {!isPro && <Item label={t('paywall.title')} tint={theme.gold} onPress={() => router.push('/paywall')} />}

      <Text style={[styles.section, { color: theme.textMid }]}>Backup & multi-device</Text>
      {user ? (
        <>
          <Item label={syncing ? 'Syncing…' : 'Sync now'} onPress={syncNow} />
          <Item label="Sign out" tint={theme.loss} onPress={signOut} />
        </>
      ) : (
        <>
          <Text style={{ color: theme.textLo, fontSize: fontSize.sm }}>
            Free to score offline forever. Sign in only to back up and sync across devices.
          </Text>
          <Item label="Continue with Apple" onPress={signInWithApple} />
          <Item label="Continue with Google" onPress={signInWithGoogle} />
        </>
      )}

      <Text style={[styles.footer, { color: theme.textLo }]}>{BRAND.storeTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  name: { fontSize: fontSize.xxl, fontWeight: '700' },
  section: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.lg },
  item: { padding: spacing.lg, borderRadius: radii.card, borderWidth: 1 },
  footer: { marginTop: 'auto', fontSize: fontSize.xs },
});
