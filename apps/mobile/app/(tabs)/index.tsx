import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, radii, fontSize } from '@padel/design-tokens';
import { BRAND } from '@padel/shared';
import { useTheme } from '@/theme/ThemeProvider';
import { useResumable } from '@/hooks/useResumable';

/** The Play tab — the app's home. Start a match or an event in one tap. */
export default function PlayScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const resumable = useResumable();

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
        {resumable && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={resumable.label}
            onPress={resumable.resume}
            style={[styles.action, styles.resume, { backgroundColor: theme.surfaceRaised, borderColor: theme.gold }]}
          >
            <Text style={[styles.actionText, { color: theme.gold }]}>{resumable.label} ▸</Text>
          </Pressable>
        )}
        <Action label={t('play.newMatch')} primary onPress={() => router.push('/setup')} />
        <Action label={t('play.americano')} onPress={() => router.push('/event/setup?format=americano')} />
        <Action label={t('play.mexicano')} onPress={() => router.push('/event/setup?format=mexicano')} />
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
  resume: { borderWidth: 1.5 },
});
