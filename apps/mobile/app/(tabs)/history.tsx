import { desc, eq } from 'drizzle-orm';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '@padel/design-tokens';
import { FREE_HISTORY_LIMIT } from '@/paywall/config';
import { db } from '@/db/client';
import { matches } from '@/db/schema';
import { useTheme } from '@/theme/ThemeProvider';
import { useEntitlements } from '@/hooks/useEntitlements';

/** Match history. Free tier shows the most recent ~20; Pro is unlimited. */
export default function HistoryScreen() {
  const theme = useTheme();
  const { isPro } = useEntitlements();
  const rows = useMemo(() => {
    const q = db
      .select({ id: matches.id, status: matches.status, endedAt: matches.endedAt })
      .from(matches)
      .where(eq(matches.status, 'complete'))
      .orderBy(desc(matches.endedAt));
    const all = q.all();
    return isPro ? all : all.slice(0, FREE_HISTORY_LIMIT);
  }, [isPro]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={<Text style={{ color: theme.textMid }}>No matches yet — play your first!</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.textHi }}>{item.id}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1 },
});
