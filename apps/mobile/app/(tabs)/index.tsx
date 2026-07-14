import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, radii, fontSize } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';
import { useTheme } from '@/theme/ThemeProvider';

/** The Play tab — the app's home. Start a match or an event in one tap. */
export default function PlayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const Action = ({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.action,
        { backgroundColor: primary ? theme.brand : theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.actionText, { color: primary ? '#04150E' : theme.textHi }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.wordmark, { color: theme.textHi }]}>{BRAND.wordmark}</Text>
      <Text style={[styles.tagline, { color: theme.textMid }]}>{BRAND.tagline}</Text>

      <View style={styles.actions}>
        <Action label={t('play.newMatch')} primary onPress={() => router.push('/setup')} />
        <Action label={t('play.americano')} onPress={() => router.push('/setup?type=americano')} />
        <Action label={t('play.mexicano')} onPress={() => router.push('/setup?type=mexicano')} />
        <Action label={t('play.tournament')} onPress={() => router.push('/setup?type=tournament')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.huge, gap: spacing.sm },
  wordmark: { fontSize: fontSize.xxl, fontWeight: '700', letterSpacing: 2 },
  tagline: { fontSize: fontSize.base, marginBottom: spacing.xxl },
  actions: { gap: spacing.md },
  action: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  actionText: { fontSize: fontSize.lg, fontWeight: '600' },
});
