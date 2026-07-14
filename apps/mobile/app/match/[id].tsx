import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { currentPointLabels, setScorelines } from '@padel/scoring-engine';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { finalizeMatch } from '@/features/scoring/finalizeMatch';

/**
 * The live scoreboard — the most-used screen. Giant left/right tap zones award
 * a point (one tap), a long-press undoes, and the score is glanceable and
 * high-contrast. Dark by default for glare + battery. Every action persists
 * synchronously via the store before the UI updates.
 */
export default function ScoreboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { state, cfg, snapshot, matchId, createdAtIso, dispatch } = useMatchStore();
  const lastComplete = useRef(false);

  useEffect(() => {
    if (state?.complete && cfg && snapshot && matchId && createdAtIso && !lastComplete.current) {
      lastComplete.current = true;
      // Record sets, update ratings + history, and mark the match complete — once.
      finalizeMatch(matchId, state, cfg, snapshot.players, createdAtIso);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/result/${id}`);
    }
  }, [state?.complete, cfg, snapshot, matchId, createdAtIso, id]);

  if (!state || !cfg) return <View style={[styles.container, { backgroundColor: theme.bg }]} />;

  const [labelA, labelB] = currentPointLabels(state, cfg);
  const scorelines = setScorelines(state);

  const scorePoint = (side: 0 | 1) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackType.Medium);
    dispatch({ type: 'POINT_TO', side });
  };

  const Zone = ({ side, label }: { side: 0 | 1; label: string }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('score.pointTo', { side: side === 0 ? t('score.you') : t('score.opponents') })}
      onPress={() => scorePoint(side)}
      onLongPress={() => dispatch({ type: 'UNDO' })}
      style={[styles.zone, { backgroundColor: side === 0 ? theme.surface : theme.surfaceRaised }]}
    >
      <Text style={[styles.point, { color: theme.textHi }]}>{label}</Text>
      <Text style={[styles.games, { color: theme.textMid }]}>
        {scorelines.map((s) => s[side]).join('  ')}
      </Text>
      {state.server.servingSide === side && <View style={[styles.serveDot, { backgroundColor: theme.gold }]} />}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Zone side={0} label={labelA} />
      <View style={styles.controls}>
        <Pressable accessibilityLabel={t('score.undo')} onPress={() => dispatch({ type: 'UNDO' })}>
          <Text style={[styles.control, { color: theme.textMid }]}>{t('score.undo')}</Text>
        </Pressable>
        <Pressable accessibilityLabel={t('score.replay')} onPress={() => dispatch({ type: 'REPLAY' })}>
          <Text style={[styles.control, { color: theme.textMid }]}>{t('score.replay')}</Text>
        </Pressable>
      </View>
      <Zone side={1} label={labelB} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  zone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  point: { fontSize: fontSize.score, fontWeight: '700', fontVariant: ['tabular-nums'] },
  games: { fontSize: fontSize.xl, fontVariant: ['tabular-nums'], letterSpacing: 2 },
  serveDot: { position: 'absolute', top: spacing.xl, width: 12, height: 12, borderRadius: radii.pill },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  control: { fontSize: fontSize.base, fontWeight: '600' },
});
