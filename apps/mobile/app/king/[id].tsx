import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { KingCourt } from '@padel/formats';
import { kingCourtComplete, kingStandings } from '@padel/formats';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { getPlayerNames } from '@/db/playerRepo';
import { Leaderboard } from '@/features/events/components/Leaderboard';
import { useKingStore } from '@/features/king/kingStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Live King of the Court: score each court; winners stay, losers queue. */
export default function KingScreen() {
  useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
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
  if (!state) return <View style={[styles.container, { backgroundColor: theme.bg }]} />;

  const pair = (players: readonly string[] | undefined) => (players ? players.map(nameOf).join(' & ') : '—');

  const Court = ({ court, index }: { court: KingCourt; index: number }) => {
    const complete = kingCourtComplete(court, state.pointsPerMatch);
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: complete ? theme.brand : theme.border }]}>
        <Text style={[styles.courtLabel, { color: theme.textMid }]}>Court {court.court + 1}</Text>
        {([0, 1] as const).map((side) => (
          <Pressable
            key={side}
            accessibilityLabel={`Point to ${pair(side === 0 ? court.a?.players : court.b?.players)}`}
            onPress={() => score(index, side)}
            style={styles.sideRow}
          >
            <Text style={[styles.names, { color: theme.textHi }]} numberOfLines={1}>
              {pair(side === 0 ? court.a?.players : court.b?.players)}
            </Text>
            <Text style={[styles.points, { color: theme.brand }]}>{side === 0 ? court.pointsA : court.pointsB}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.tabs}>
        {(['courts', 'table'] as const).map((tk) => (
          <Pressable key={tk} onPress={() => setTab(tk)} style={styles.tab}>
            <Text style={{ color: tab === tk ? theme.brand : theme.textLo, fontWeight: '700' }}>
              {tk === 'courts' ? 'Courts' : 'Leaderboard'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'courts' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {state.courts.map((court, i) => (
            <Court key={court.court} court={court} index={i} />
          ))}
          {state.queue.length > 0 && (
            <Text style={[styles.queue, { color: theme.textLo }]}>
              Next up: {state.queue.map((p) => pair(p.players)).join(' · ')}
            </Text>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Leaderboard standings={board} nameOf={nameOf} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  tab: { paddingVertical: spacing.sm },
  list: { padding: spacing.xl, gap: spacing.md },
  card: { borderRadius: radii.card, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  courtLabel: { fontSize: fontSize.sm, fontWeight: '600', textTransform: 'uppercase' },
  sideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  names: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  points: { fontSize: fontSize.xxl, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  queue: { fontSize: fontSize.sm, fontStyle: 'italic', marginTop: spacing.sm },
});
