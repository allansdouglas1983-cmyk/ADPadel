import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCanvasRef } from '@shopify/react-native-skia';
import { summarizeMatch } from '@padel/scoring-engine';
import { BRAND } from '@padel/shared';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { MatchCard, type MatchCardData } from '@/features/card/MatchCard';
import { shareCanvas } from '@/features/card/shareCard';
import { getPlayerNames } from '@/db/playerRepo';
import { getMatchRatingDelta } from '@/db/ratingsRepo';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';

/** Post-match summary → share the card (always free — it recruits new users). */
export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { state, cfg, snapshot } = useMatchStore();
  const canvasRef = useCanvasRef();
  const [sharing, setSharing] = useState(false);

  const cardData = useMemo<MatchCardData | null>(() => {
    if (!state || !cfg || !snapshot) return null;
    const summary = summarizeMatch(state);
    const players = snapshot.players;
    const sideA = players.filter((_, i) => cfg.serve.slotSide[i] === 0);
    const sideB = players.filter((_, i) => cfg.serve.slotSide[i] === 1);
    const names = getPlayerNames(players);
    const nameOf = (arr: string[]) => arr.map((pid) => names.get(pid) ?? pid).join(' & ');

    const scoreline = summary.sets.map((s) => `${s.games[0]}–${s.games[1]}`).join('  ');
    const deltaElo = getMatchRatingDelta(id!, sideA[0] ?? '') ?? 0;
    const deltaDisplay = deltaElo / 100;
    const signature = summary.wasComeback
      ? 'Comeback win'
      : summary.setsWon[0] === 2 || summary.setsWon[1] === 2
        ? 'Straight-sets win'
        : 'Match complete';

    return {
      teamAName: nameOf(sideA),
      teamBName: nameOf(sideB),
      scoreline,
      venue: '',
      dateLabel: new Date().toLocaleDateString(),
      signatureStat: signature,
      ratingDelta: `${deltaDisplay >= 0 ? '+' : ''}${deltaDisplay.toFixed(2)}`,
      claimUrl: `https://${BRAND.universalLinkHost}/m/${id}`,
    };
  }, [state, cfg, snapshot, id]);

  const won = state?.outcome.type === 'completed' && state.outcome.winner === 0;

  const onShare = async () => {
    setSharing(true);
    try {
      await shareCanvas(canvasRef.current);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.headline, { color: won ? theme.win : theme.textHi }]}>
        {won ? t('result.youWon') : t('result.youLost')}
      </Text>
      <Text style={[styles.score, { color: theme.textHi }]}>{cardData?.scoreline ?? ''}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('result.shareCard')}
        disabled={sharing || !cardData}
        onPress={onShare}
        style={[styles.share, { backgroundColor: theme.brand, opacity: sharing ? 0.6 : 1 }]}
      >
        <Text style={styles.shareText}>{t('result.shareCard')}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)')}>
        <Text style={[styles.done, { color: theme.textMid }]}>Done</Text>
      </Pressable>

      {/* Off-screen card, mounted for snapshotting only. */}
      {cardData && (
        <View style={styles.offscreen} pointerEvents="none">
          <MatchCard data={cardData} canvasRef={canvasRef} />
        </View>
      )}
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
  offscreen: { position: 'absolute', left: -10000, top: 0, width: 1080, height: 1920 },
});
