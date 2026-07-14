import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { canAdvance, currentRound, isEventComplete, leaderboard } from '@padel/formats';
import { spacing } from '@padel/design-tokens';
import { Button, Screen, Segmented, Text, Trophy } from '@/ui';
import { CourtCard } from '@/features/events/components/CourtCard';
import { Leaderboard } from '@/features/events/components/Leaderboard';
import { useEventStore } from '@/features/events/eventStore';
import { useEventPlayers } from '@/features/events/useEventPlayers';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'round' | 'table';

/** The live event screen: score each court this round, then advance. A running
 * leaderboard is one tap away. All logic is in the pure EventSession. */
export default function EventScreen() {
  useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session, scorePoint, undoScore, advance } = useEventStore();
  const nameOf = useEventPlayers(session);
  const [tab, setTab] = useState<Tab>('round');

  const board = useMemo(() => (session ? leaderboard(session) : []), [session]);
  if (!session) return <Screen><View /></Screen>;

  const round = currentRound(session);
  const complete = isEventComplete(session);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.md }}>
        <Segmented
          options={[
            { value: 'round', label: `Round ${round.index + 1}` },
            { value: 'table', label: 'Leaderboard' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </View>

      {tab === 'round' ? (
        <Animated.ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
          {round.courts.map((court, i) => (
            <Animated.View key={court.court} entering={FadeInDown.delay(i * 70)}>
              <CourtCard
                court={court}
                pointsPerMatch={session.config.pointsPerMatch}
                nameOf={nameOf}
                onPoint={(side) => scorePoint(i, side)}
                onUndo={(side) => undoScore(i, side)}
              />
            </Animated.View>
          ))}
          {round.sittingOut.length > 0 && (
            <Text variant="caption" tone="lo" style={{ fontStyle: 'italic' }}>
              Resting: {round.sittingOut.map(nameOf).join(', ')}
            </Text>
          )}

          {complete ? (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.lg }}>
              <Trophy size={56} color={theme.gold} />
              <Text variant="title" tone="gold">
                Event complete
              </Text>
            </Animated.View>
          ) : (
            <Button
              label="Next round"
              size="lg"
              full
              disabled={!canAdvance(session)}
              onPress={advance}
              style={{ marginTop: spacing.lg }}
            />
          )}
        </Animated.ScrollView>
      ) : (
        <Animated.ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <Leaderboard standings={board} nameOf={nameOf} />
        </Animated.ScrollView>
      )}
    </Screen>
  );
}
