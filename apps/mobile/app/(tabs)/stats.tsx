import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toDisplayScale } from '@padel/ratings';
import { fontSize, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ProLock } from '@/components/ProLock';

/** Stats overview. Headline metrics are free; deep analytics are Pro. */
export default function StatsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro } = useEntitlements();
  const { stats, rating, chemistry } = usePlayerStats();

  const Tile = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.tile, { backgroundColor: theme.surface }]}>
      <Text style={[styles.tileValue, { color: theme.textHi }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: theme.textMid }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <Tile label="Win rate" value={`${Math.round(stats.winRate * 100)}%`} />
        <Tile label="Matches" value={String(stats.matches)} />
        <Tile label="Streak" value={String(stats.currentStreak)} />
        <Tile label="Rating" value={rating != null ? toDisplayScale(rating).toFixed(2) : '—'} />
      </View>

      <Text style={[styles.section, { color: theme.textMid }]}>Partner chemistry</Text>
      <ProLock unlocked={isPro}>
        {chemistry.slice(0, isPro ? undefined : 1).map((c) => (
          <View key={c.partnerId} style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.textHi }}>{c.partnerId}</Text>
            <Text style={{ color: theme.textMid }}>{Math.round(c.winRate * 100)}%</Text>
          </View>
        ))}
      </ProLock>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '47%', flexGrow: 1, padding: spacing.lg, borderRadius: 12 },
  tileValue: { fontSize: fontSize.xxl, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tileLabel: { fontSize: fontSize.sm },
  section: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1 },
});
