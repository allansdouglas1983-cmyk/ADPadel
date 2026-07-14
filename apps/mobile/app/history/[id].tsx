import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCanvasRef } from '@shopify/react-native-skia';
import { spacing } from '@padel/design-tokens';
import { Button, Card, EmptyState, History as HistoryIcon, Screen, Share2, Text } from '@/ui';
import { MatchCard } from '@/features/card/MatchCard';
import { shareCanvas } from '@/features/card/shareCard';
import { loadMatchDetail, type TeamDetail } from '@/features/history/loadMatchDetail';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useTheme } from '@/theme/ThemeProvider';

/** History detail — set-by-set breakdown, parejas, duration, rating deltas, re-share. */
export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { isPro } = useEntitlements();
  const canvasRef = useCanvasRef();
  const [sharing, setSharing] = useState(false);

  const detail = useMemo(() => (id ? loadMatchDetail(id, isPro) : null), [id, isPro]);

  const onShare = async () => {
    setSharing(true);
    try {
      await shareCanvas(canvasRef.current);
    } finally {
      setSharing(false);
    }
  };

  if (!detail) {
    return (
      <Screen>
        <EmptyState
          icon={<HistoryIcon size={64} color={theme.textLo} />}
          title="Match unavailable"
          body="We couldn't reconstruct this match. It may have been created under an older ruleset."
          actionLabel="Back to history"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const { summary, teams, durationLabel, dateLabel, cardData } = detail;
  const [teamA, teamB] = teams;

  const TeamRow = ({ team }: { team: TeamDetail }) => (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="heading" tone={team.isWinner ? 'gold' : 'hi'}>
          {team.players.map((p) => p.name).join(' & ')}
        </Text>
        {team.isWinner && (
          <Text variant="label" tone="gold">
            won
          </Text>
        )}
      </View>
      <Text variant="caption" tone="mid">
        {team.players.map((p) => `${p.name.split(' ')[0]} ${p.ratingDelta}`).join('  ·  ')}
      </Text>
    </View>
  );

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown} style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="label" tone="lo">
            {dateLabel}
            {durationLabel ? ` · ${durationLabel}` : ''}
          </Text>
          <Text variant="score" tone="hi" style={{ fontSize: 48 }}>
            {summary.sets.map((s) => `${s.games[0]}–${s.games[1]}`).join('  ')}
          </Text>
        </View>

        <Card>
          <View style={{ gap: spacing.md }}>
            <TeamRow team={teamA} />
            <View style={{ height: 1, backgroundColor: theme.surfaceRaised }} />
            <TeamRow team={teamB} />
          </View>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Text variant="label" tone="lo">
            Set by set
          </Text>
          {summary.sets.map((s, i) => (
            <Card key={i} padded>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="body" tone="mid">
                  Set {i + 1}
                </Text>
                <Text variant="score" tone="hi" style={{ fontSize: 26 }}>
                  {s.games[0]}–{s.games[1]}
                  {s.tiebreak ? `  (${s.tiebreak[0]}–${s.tiebreak[1]})` : ''}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        <Button
          label="Re-share card"
          size="lg"
          full
          variant="gold"
          loading={sharing}
          icon={<Share2 size={20} color="#04150E" />}
          onPress={onShare}
        />
      </Animated.View>

      {/* Off-screen card for the snapshot. */}
      <View style={{ position: 'absolute', left: -10000, top: 0, width: 1080, height: 1920 }} pointerEvents="none">
        <MatchCard data={cardData} canvasRef={canvasRef} />
      </View>
    </Screen>
  );
}
