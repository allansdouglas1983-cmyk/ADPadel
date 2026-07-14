import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '@padel/design-tokens';
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

  const Tile = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.tile, { backgroundColor: theme.surface }]}>
      <Text style={[styles.tileValue, { color: theme.textHi }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: theme.textMid }]}>{label}</Text>
    </View>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ gap: spacing.sm }}>
      <Text style={[styles.section, { color: theme.textMid }]}>{title}</Text>
      {children}
    </View>
  );

  const Row = ({ left, right }: { left: string; right: string }) => (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={{ color: theme.textHi }} numberOfLines={1}>
        {left}
      </Text>
      <Text style={{ color: theme.textMid, fontVariant: ['tabular-nums'] }}>{right}</Text>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <Tile label="Win rate" value={pct(s.stats.winRate)} />
        <Tile label="Matches" value={String(s.stats.matches)} />
        <Tile label="Current streak" value={String(s.stats.currentStreak)} />
        <Tile label="Rating" value={s.ratingDisplay?.toFixed(2) ?? '—'} />
        <Tile label="Games won" value={pct(s.stats.gameWinRate)} />
        <Tile label="Sets won" value={pctOrDash(s.stats.setsWon + s.stats.setsLost ? s.stats.setWinRate : null)} />
      </View>

      <Section title="Form">
        <FormDots form={s.stats.form} />
      </Section>

      {s.ratingJourney.length >= 2 && (
        <Section title="Rating journey">
          <Sparkline values={s.ratingJourney} />
          <Text style={{ color: theme.textLo, fontSize: fontSize.xs }}>
            Form {s.formDisplay?.toFixed(2) ?? '—'} · longest win streak {s.stats.longestWinStreak}
          </Text>
        </Section>
      )}

      <Section title="Partner chemistry">
        <ProLock unlocked={isPro}>
          {(isPro ? s.chemistry : s.chemistry.slice(0, 1)).map((c) => (
            <Row key={c.partnerId} left={c.partnerId} right={`${pct(c.winRate)} · ${c.matches}`} />
          ))}
        </ProLock>
      </Section>

      <Section title="Head to head">
        <ProLock unlocked={isPro}>
          {(isPro ? s.headToHead : s.headToHead.slice(0, 1)).map((h) => (
            <Row key={h.opponentId} left={h.opponentId} right={`${h.wins}-${h.losses}`} />
          ))}
        </ProLock>
      </Section>

      <Section title="Service & deciders">
        <ProLock unlocked={isPro}>
          <Row left="Service hold" right={pctOrDash(s.stats.serviceHoldRate)} />
          <Row left="Golden/star points" right={pctOrDash(s.stats.deciderWinRate)} />
          <Row left="Points won" right={pctOrDash(s.stats.pointsWinRate)} />
          <Row left="Comebacks" right={String(s.stats.comebacks)} />
        </ProLock>
      </Section>

      <Section title="When you play best">
        <ProLock unlocked={isPro}>
          {s.timeOfDay.map((b) => (
            <Row key={b.key} left={b.key} right={`${pct(b.winRate)} · ${b.matches}`} />
          ))}
          {s.dayOfWeek.map((b) => (
            <Row key={b.key} left={b.key} right={`${pct(b.winRate)} · ${b.matches}`} />
          ))}
        </ProLock>
      </Section>

      <Section title="Venues">
        <ProLock unlocked={isPro}>
          {s.venues.map((v) => (
            <Row key={v.venue} left={v.venue} right={`${pct(v.winRate)} · ${v.matches}`} />
          ))}
        </ProLock>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '30%', flexGrow: 1, padding: spacing.lg, borderRadius: 12 },
  tileValue: { fontSize: fontSize.xl, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tileLabel: { fontSize: fontSize.xs },
  section: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1 },
});
