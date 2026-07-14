import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useCanvasRef } from '@shopify/react-native-skia';
import { summarizeMatch } from '@padel/scoring-engine';
import { BRAND } from '@padel/shared';
import { spacing } from '@padel/design-tokens';
import { Button, Screen, Share2, Text, Trophy } from '@/ui';
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
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <Trophy size={72} color={won ? theme.gold : theme.textLo} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120)} style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text variant="display" tone={won ? 'gold' : 'hi'}>
            {won ? t('result.youWon') : t('result.youLost')}
          </Text>
          <Text variant="score" tone="hi" style={{ fontSize: 40 }}>
            {cardData?.scoreline ?? ''}
          </Text>
          {cardData && (
            <Text variant="body" tone="mid">
              {cardData.signatureStat} · rating {cardData.ratingDelta}
            </Text>
          )}
        </Animated.View>
      </View>

      <Button
        label={t('result.shareCard')}
        size="lg"
        full
        variant="gold"
        loading={sharing}
        icon={<Share2 size={20} color="#04150E" />}
        onPress={onShare}
      />
      <Text variant="label" tone="lo" onPress={() => router.replace('/(tabs)')} style={{ textAlign: 'center', marginTop: spacing.md }}>
        Done
      </Text>

      {cardData && (
        <View style={{ position: 'absolute', left: -10000, top: 0, width: 1080, height: 1920 }} pointerEvents="none">
          <MatchCard data={cardData} canvasRef={canvasRef} />
        </View>
      )}
    </Screen>
  );
}
