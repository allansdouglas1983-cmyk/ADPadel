import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { KingCourt } from '@padel/formats';
import { kingCourtComplete, kingStandings } from '@padel/formats';
import { spacing } from '@padel/design-tokens';
import { Card, Screen, Segmented, Text, haptics } from '@/ui';
import { getPlayerNames } from '@/db/playerRepo';
import { Leaderboard } from '@/features/events/components/Leaderboard';
import { useKingStore } from '@/features/king/kingStore';

/** Live King of the Court: tap a pair to score; winners stay, losers queue. */
export default function KingScreen() {
  useLocalSearchParams<{ id: string }>();
  const { state, score } = useKingStore();
  const [tab, setTab] = useState<'courts' | 'table'>('courts');

  const nameOf = useMemo(() => {
    if (!state) return (id: string) => id;
    const ids = [
      ...state.courts.flatMap((c) => [...(c.a?.players ?? []), ...(c.b?.players ?? [])]),
      ...state.queue.flatMap((p) => p.players),
    ];
    const names = getPlayerNames(ids);
    return (id: string) => names.get(id) ?? id;
  }, [state]);

  const board = useMemo(() => (state ? kingStandings(state) : []), [state]);
  if (!state) return <Screen><View /></Screen>;

  const pair = (players?: readonly string[]) => (players ? players.map(nameOf).join(' & ') : '—');

  const Court = ({ court, index }: { court: KingCourt; index: number }) => {
    const complete = kingCourtComplete(court, state.pointsPerMatch);
    return (
      <Card glowColor={complete ? 'brand' : 'none'} style={{ gap: spacing.sm }}>
        <Text variant="label" tone="mid">
          Court {court.court + 1}
        </Text>
        {([0, 1] as const).map((side) => (
          <Pressable
            key={side}
            accessibilityRole="button"
            accessibilityLabel={`Point to ${pair(side === 0 ? court.a?.players : court.b?.players)}`}
            onPress={() => {
              haptics.press();
              score(index, side);
            }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md }}
          >
            <Text variant="bodyStrong" tone="hi" numberOfLines={1} style={{ flex: 1 }}>
              {pair(side === 0 ? court.a?.players : court.b?.players)}
            </Text>
            <Text variant="title" tone="brand" tabular style={{ minWidth: 48, textAlign: 'right' }}>
              {side === 0 ? court.pointsA : court.pointsB}
            </Text>
          </Pressable>
        ))}
      </Card>
    );
  };

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}>
        <Segmented
          options={[
            { value: 'courts', label: 'Courts' },
            { value: 'table', label: 'Leaderboard' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as 'courts' | 'table')}
        />
      </View>

      {tab === 'courts' ? (
        <Animated.ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
          {state.courts.map((court, i) => (
            <Animated.View key={court.court} entering={FadeInDown.delay(i * 70)}>
              <Court court={court} index={i} />
            </Animated.View>
          ))}
          {state.queue.length > 0 && (
            <Text variant="caption" tone="lo" style={{ fontStyle: 'italic' }}>
              Next up: {state.queue.map((p) => pair(p.players)).join(' · ')}
            </Text>
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
