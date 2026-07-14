import { desc, eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { Card, EmptyState, History as HistoryIcon, Screen, Text } from '@/ui';
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
    const all = db
      .select({ id: matches.id, endedAt: matches.endedAt, startedAtIso: matches.startedAtIso })
      .from(matches)
      .where(eq(matches.status, 'complete'))
      .orderBy(desc(matches.endedAt))
      .all();
    return isPro ? all : all.slice(0, FREE_HISTORY_LIMIT);
  }, [isPro]);

  if (rows.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={<HistoryIcon size={64} color={theme.textLo} />}
          title="No matches yet"
          body="Play your first match and it'll appear here — with the scoreline, stats and a shareable card."
          actionLabel="Start a match"
          onAction={() => router.push('/setup')}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <Text variant="bodyStrong" tone="hi">
              {item.startedAtIso?.slice(0, 10) ?? 'Match'}
            </Text>
          </Card>
        )}
      />
    </Screen>
  );
}
