import { StyleSheet, Text, View } from 'react-native';
import type { Standing } from '@padel/formats';
import { fontSize, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  standings: readonly Standing[];
  nameOf: (id: string) => string;
}

/** Live event leaderboard — ranked with point-diff → total → head-to-head. */
export function Leaderboard({ standings, nameOf }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.rank, { color: theme.textLo }]}>#</Text>
        <Text style={[styles.name, { color: theme.textLo }]}>Player</Text>
        <Text style={[styles.stat, { color: theme.textLo }]}>Pts</Text>
        <Text style={[styles.stat, { color: theme.textLo }]}>+/–</Text>
      </View>
      {standings.map((s, i) => (
        <View key={s.playerId} style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.rank, { color: theme.textMid }]}>{i + 1}</Text>
          <Text style={[styles.name, { color: theme.textHi }]} numberOfLines={1}>
            {nameOf(s.playerId)}
          </Text>
          <Text style={[styles.stat, { color: theme.textHi }]}>{s.pointsFor}</Text>
          <Text style={[styles.stat, { color: s.pointsFor - s.pointsAgainst >= 0 ? theme.win : theme.loss }]}>
            {s.pointsFor - s.pointsAgainst >= 0 ? '+' : ''}
            {s.pointsFor - s.pointsAgainst}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  head: { borderBottomWidth: 0 },
  rank: { width: 28, fontSize: fontSize.sm, fontVariant: ['tabular-nums'] },
  name: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  stat: { width: 56, textAlign: 'right', fontSize: fontSize.base, fontVariant: ['tabular-nums'] },
});
