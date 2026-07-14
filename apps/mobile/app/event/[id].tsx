import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { canAdvance, currentRound, isEventComplete, leaderboard } from '@padel/formats';
import { fontSize, radii, spacing } from '@padel/design-tokens';
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
  if (!session) return <View style={[styles.container, { backgroundColor: theme.bg }]} />;

  const round = currentRound(session);
  const complete = isEventComplete(session);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.tabs}>
        {(['round', 'table'] as Tab[]).map((tk) => (
          <Pressable key={tk} onPress={() => setTab(tk)} style={styles.tab}>
            <Text style={{ color: tab === tk ? theme.brand : theme.textLo, fontWeight: '700' }}>
              {tk === 'round' ? `Round ${round.index + 1}` : 'Leaderboard'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'round' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {round.courts.map((court, i) => (
            <CourtCard
              key={court.court}
              court={court}
              pointsPerMatch={session.config.pointsPerMatch}
              nameOf={nameOf}
              onPoint={(side) => scorePoint(i, side)}
              onUndo={(side) => undoScore(i, side)}
            />
          ))}
          {round.sittingOut.length > 0 && (
            <Text style={[styles.resting, { color: theme.textLo }]}>
              Resting: {round.sittingOut.map(nameOf).join(', ')}
            </Text>
          )}

          {!complete && (
            <Pressable
              accessibilityRole="button"
              disabled={!canAdvance(session)}
              onPress={advance}
              style={[styles.advance, { backgroundColor: canAdvance(session) ? theme.brand : theme.surface }]}
            >
              <Text style={[styles.advanceText, { color: canAdvance(session) ? '#04150E' : theme.textLo }]}>
                Next round
              </Text>
            </Pressable>
          )}
          {complete && <Text style={[styles.done, { color: theme.win }]}>Event complete 🏆</Text>}
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
  resting: { fontSize: fontSize.sm, fontStyle: 'italic', marginTop: spacing.sm },
  advance: { marginTop: spacing.lg, paddingVertical: spacing.xl, borderRadius: radii.card, alignItems: 'center' },
  advanceText: { fontSize: fontSize.lg, fontWeight: '700' },
  done: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center', marginTop: spacing.lg },
});
