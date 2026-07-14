import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setScorelines } from '@padel/scoring-engine';
import { BRAND } from '@padel/shared';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { shareMatchCard } from '@/features/card/shareCard';

/** Post-match summary → share the card (always free — it recruits new users). */
export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { state } = useMatchStore();

  const won = state?.outcome.type === 'completed' && state.outcome.winner === 0;
  const scoreline = state ? setScorelines(state).map((s) => `${s[0]}–${s[1]}`).join('  ') : '';

  const onShare = () => {
    void shareMatchCard({
      teamAName: t('score.you'),
      teamBName: t('score.opponents'),
      scoreline,
      venue: '',
      dateLabel: new Date().toLocaleDateString(),
      signatureStat: won ? t('result.youWon') : t('result.youLost'),
      ratingDelta: '+0.00',
      claimUrl: `https://${BRAND.universalLinkHost}/m/${id}`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.headline, { color: won ? theme.win : theme.textHi }]}>
        {won ? t('result.youWon') : t('result.youLost')}
      </Text>
      <Text style={[styles.score, { color: theme.textHi }]}>{scoreline}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('result.shareCard')}
        onPress={onShare}
        style={[styles.share, { backgroundColor: theme.brand }]}
      >
        <Text style={styles.shareText}>{t('result.shareCard')}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)')}>
        <Text style={[styles.done, { color: theme.textMid }]}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  headline: { fontSize: fontSize.display, fontWeight: '700' },
  score: { fontSize: fontSize.xxl, fontVariant: ['tabular-nums'], letterSpacing: 2 },
  share: { paddingVertical: spacing.lg, paddingHorizontal: spacing.huge, borderRadius: radii.card },
  shareText: { color: '#04150E', fontSize: fontSize.lg, fontWeight: '700' },
  done: { fontSize: fontSize.base, marginTop: spacing.md },
});
