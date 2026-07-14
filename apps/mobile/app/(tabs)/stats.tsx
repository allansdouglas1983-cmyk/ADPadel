import { router } from 'expo-router';
import { View } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { BarChart3, Card, EmptyState, Screen, StatTile, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ProLock } from '@/components/ProLock';
import { FormDots, Sparkline } from '@/components/Sparkline';

const pct = (v: number) => `${Math.round(v * 100)}%`;
const pctOrDash = (v: number | null) => (v == null ? '—' : pct(v));

/** Stats overview. Headline metrics are free; deep analytics are Pro. */
export default function StatsScreen() {
  const theme = useTheme();
  const { isPro } = useEntitlements();
  const s = usePlayerStats();

  if (s.stats.matches === 0) {
    return (
      <Screen>
        <EmptyState
          icon={<BarChart3 size={64} color={theme.textLo} />}
          title="Your stats live here"
          body="Win-rate, streaks, partner chemistry, ratings and more — they build automatically as you play."
          actionLabel="Start a match"
          onAction={() => router.push('/setup')}
        />
      </Screen>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" tone="lo">
        {title}
      </Text>
      {children}
    </View>
  );

  const Row = ({ left, right }: { left: string; right: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
      <Text variant="body" tone="hi" numberOfLines={1}>
        {left}
      </Text>
      <Text variant="bodyStrong" tone="mid" tabular>
        {right}
      </Text>
    </View>
  );

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <StatTile value={pct(s.stats.winRate)} label="Win rate" tone="brand" />
        <StatTile value={String(s.stats.matches)} label="Matches" />
        <StatTile value={String(s.stats.currentStreak)} label="Streak" />
        <StatTile value={s.ratingDisplay?.toFixed(2) ?? '—'} label="Rating" tone="gold" />
        <StatTile value={pct(s.stats.gameWinRate)} label="Games won" />
        <StatTile value={pctOrDash(s.stats.setsWon + s.stats.setsLost ? s.stats.setWinRate : null)} label="Sets won" />
      </View>

      <Section title="Form">
        <Card>
          <FormDots form={s.stats.form} />
        </Card>
      </Section>

      {s.ratingJourney.length >= 2 && (
        <Section title="Rating journey">
          <Card>
            <Sparkline values={s.ratingJourney} />
            <Text variant="caption" tone="lo" style={{ marginTop: spacing.sm }}>
              Form {s.formDisplay?.toFixed(2) ?? '—'} · longest win streak {s.stats.longestWinStreak}
            </Text>
          </Card>
        </Section>
      )}

      <Section title="Partner chemistry">
        <Card>
          <ProLock unlocked={isPro}>
            {(isPro ? s.chemistry : s.chemistry.slice(0, 1)).map((c) => (
              <Row key={c.partnerId} left={c.partnerId} right={`${pct(c.winRate)} · ${c.matches}`} />
            ))}
          </ProLock>
        </Card>
      </Section>

      <Section title="Head to head">
        <Card>
          <ProLock unlocked={isPro}>
            {(isPro ? s.headToHead : s.headToHead.slice(0, 1)).map((h) => (
              <Row key={h.opponentId} left={h.opponentId} right={`${h.wins}-${h.losses}`} />
            ))}
          </ProLock>
        </Card>
      </Section>

      <Section title="Service & deciders">
        <Card>
          <ProLock unlocked={isPro}>
            <Row left="Service hold" right={pctOrDash(s.stats.serviceHoldRate)} />
            <Row left="Golden/star points" right={pctOrDash(s.stats.deciderWinRate)} />
            <Row left="Points won" right={pctOrDash(s.stats.pointsWinRate)} />
            <Row left="Comebacks" right={String(s.stats.comebacks)} />
          </ProLock>
        </Card>
      </Section>

      <Section title="When you play best">
        <Card>
          <ProLock unlocked={isPro}>
            {s.timeOfDay.map((b) => (
              <Row key={b.key} left={b.key} right={`${pct(b.winRate)} · ${b.matches}`} />
            ))}
            {s.dayOfWeek.map((b) => (
              <Row key={b.key} left={b.key} right={`${pct(b.winRate)} · ${b.matches}`} />
            ))}
          </ProLock>
        </Card>
      </Section>

      {s.venues.length > 0 && (
        <Section title="Venues">
          <Card>
            {s.venues.map((v) => (
              <Row key={v.venue} left={v.venue} right={`${pct(v.winRate)} · ${v.matches}`} />
            ))}
          </Card>
        </Section>
      )}
    </Screen>
  );
}
