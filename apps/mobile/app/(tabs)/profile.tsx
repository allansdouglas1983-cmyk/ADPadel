import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BRAND } from '@padel/shared';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/hooks/useEntitlements';

/** Profile & settings, plus the Season Wrapped entry point. */
export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro } = useEntitlements();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.name, { color: theme.textHi }]}>{t('score.you')}</Text>
      <Text style={{ color: theme.textMid }}>{isPro ? 'Marque Pro' : 'Free'}</Text>

      <Pressable onPress={() => router.push('/wrapped')} style={[styles.item, { borderColor: theme.border }]}>
        <Text style={{ color: theme.textHi }}>Season Wrapped</Text>
      </Pressable>
      {!isPro && (
        <Pressable onPress={() => router.push('/paywall')} style={[styles.item, { borderColor: theme.gold }]}>
          <Text style={{ color: theme.gold, fontWeight: '700' }}>{t('paywall.title')}</Text>
        </Pressable>
      )}

      <Text style={[styles.footer, { color: theme.textLo }]}>{BRAND.storeTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  name: { fontSize: fontSize.xxl, fontWeight: '700' },
  item: { padding: spacing.lg, borderRadius: radii.card, borderWidth: 1 },
  footer: { marginTop: 'auto', fontSize: fontSize.xs },
});
