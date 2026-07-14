import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EventFormat } from '@padel/formats';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { createGuestPlayer } from '@/db/playerRepo';
import { useEventStore } from '@/features/events/eventStore';
import { useTheme } from '@/theme/ThemeProvider';

const POINTS_OPTIONS = [16, 24, 32];

/**
 * Create an Americano/Mexicano night: name the players, pick courts, points per
 * match and rounds. All event logic is in the pure EventSession; this screen
 * only gathers config and hands it over.
 */
export default function EventSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ format?: string }>();
  const format: EventFormat = params.format === 'mexicano' ? 'mexicano' : 'americano';
  const createEvent = useEventStore((s) => s.create);

  const [names, setNames] = useState<string[]>(['', '', '', '']);
  const [courts, setCourts] = useState(1);
  const [pointsPerMatch, setPointsPerMatch] = useState(24);
  const [rounds, setRounds] = useState(5);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length >= 4;

  const setName = (i: number, value: string) =>
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));

  const start = () => {
    const playerIds = filled.map((name) => createGuestPlayer(name));
    const id = createEvent({ format, players: playerIds, courts, pointsPerMatch, totalRounds: rounds });
    router.replace(`/event/${id}`);
  };

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.textHi }]}>
        {format === 'mexicano' ? t('play.mexicano') : t('play.americano')}
      </Text>

      <Text style={[styles.label, { color: theme.textMid }]}>Players ({filled.length})</Text>
      {names.map((name, i) => (
        <TextInput
          key={i}
          value={name}
          onChangeText={(v) => setName(i, v)}
          placeholder={`Player ${i + 1}`}
          placeholderTextColor={theme.textLo}
          style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
        />
      ))}
      <Pressable onPress={() => setNames((p) => [...p, ''])}>
        <Text style={{ color: theme.brand, fontWeight: '600' }}>+ Add player</Text>
      </Pressable>

      <Stepper label="Courts" value={courts} min={1} max={Math.max(1, Math.floor(filled.length / 4)) || 1} onChange={setCourts} />
      <Stepper label="Rounds" value={rounds} min={1} max={20} onChange={setRounds} />

      <Text style={[styles.label, { color: theme.textMid }]}>Points per match</Text>
      <View style={styles.row}>
        {POINTS_OPTIONS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPointsPerMatch(p)}
            style={[styles.chip, { borderColor: p === pointsPerMatch ? theme.brand : theme.border }]}
          >
            <Text style={{ color: p === pointsPerMatch ? theme.brand : theme.textMid, fontWeight: '600' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canStart}
        onPress={start}
        style={[styles.start, { backgroundColor: canStart ? theme.brand : theme.surface }]}
      >
        <Text style={[styles.startText, { color: canStart ? '#04150E' : theme.textLo }]}>
          {t('setup.start')}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.label, { color: theme.textMid }]}>{label}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[styles.stepBtn, { borderColor: theme.border }]}>
          <Text style={{ color: theme.textHi, fontSize: fontSize.lg }}>–</Text>
        </Pressable>
        <Text style={[styles.stepValue, { color: theme.textHi }]}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepBtn, { borderColor: theme.border }]}>
          <Text style={{ color: theme.textHi, fontSize: fontSize.lg }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
  label: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: radii.control, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fontSize.base },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radii.pill, borderWidth: 1.5 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: fontSize.lg, fontWeight: '700', minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
  start: { marginTop: spacing.xl, paddingVertical: spacing.xl, borderRadius: radii.card, alignItems: 'center' },
  startText: { fontSize: fontSize.lg, fontWeight: '700' },
});
