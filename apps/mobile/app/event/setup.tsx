import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EventFormat, EventSessionConfig } from '@padel/formats';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { createGuestPlayer } from '@/db/playerRepo';
import { useEventStore } from '@/features/events/eventStore';
import { useTheme } from '@/theme/ThemeProvider';

const POINTS_OPTIONS = [16, 24, 32];
const EVENT_FORMATS: EventFormat[] = ['americano', 'mexicano', 'teamAmericano', 'mixedAmericano'];
const FORMAT_LABEL: Record<EventFormat, string> = {
  americano: 'Americano',
  mexicano: 'Mexicano',
  teamAmericano: 'Team',
  mixedAmericano: 'Mixed',
};

interface PlayerDraft {
  name: string;
  gender: 'm' | 'f';
}

/**
 * Create any event format: name the players, and for Mixed set each player's
 * gender (teams are one man + one woman); for Team, consecutive players form a
 * fixed pair. All event logic lives in the pure EventSession — this screen only
 * gathers config and hands it over.
 */
export default function EventSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ format?: string }>();
  const initialFormat = (EVENT_FORMATS.includes(params.format as EventFormat) ? params.format : 'americano') as EventFormat;

  const createEvent = useEventStore((s) => s.create);
  const [format, setFormat] = useState<EventFormat>(initialFormat);
  const [players, setPlayers] = useState<PlayerDraft[]>([
    { name: '', gender: 'm' },
    { name: '', gender: 'f' },
    { name: '', gender: 'm' },
    { name: '', gender: 'f' },
  ]);
  const [courts, setCourts] = useState(1);
  const [pointsPerMatch, setPointsPerMatch] = useState(24);
  const [rounds, setRounds] = useState(5);

  const filled = useMemo(() => players.filter((p) => p.name.trim()), [players]);
  const isMixed = format === 'mixedAmericano';
  const isTeam = format === 'teamAmericano';

  const menCount = filled.filter((p) => p.gender === 'm').length;
  const womenCount = filled.filter((p) => p.gender === 'f').length;
  const canStart =
    filled.length >= 4 &&
    (!isMixed || (menCount >= 2 && womenCount >= 2)) &&
    (!isTeam || filled.length % 2 === 0);

  const setPlayer = (i: number, patch: Partial<PlayerDraft>) =>
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const start = () => {
    // Create guest players preserving gender for Mixed.
    const created = filled.map((p) => ({
      id: createGuestPlayer(p.name.trim(), p.gender),
      gender: p.gender,
    }));
    const ids = created.map((c) => c.id);

    let config: EventSessionConfig;
    if (isTeam) {
      const pairs: [string, string][] = [];
      for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i]!, ids[i + 1]!]);
      config = { format, players: ids, pairs, courts, pointsPerMatch, totalRounds: rounds };
    } else if (isMixed) {
      const men = created.filter((c) => c.gender === 'm').map((c) => c.id);
      const women = created.filter((c) => c.gender === 'f').map((c) => c.id);
      config = { format, players: ids, men, women, courts, pointsPerMatch, totalRounds: rounds };
    } else {
      config = { format, players: ids, courts, pointsPerMatch, totalRounds: rounds };
    }

    const id = createEvent(config);
    router.replace(`/event/${id}`);
  };

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.textHi }]}>{FORMAT_LABEL[format]}</Text>

      <View style={styles.row}>
        {EVENT_FORMATS.map((f) => (
          <Pressable key={f} onPress={() => setFormat(f)} style={[styles.chip, { borderColor: f === format ? theme.brand : theme.border }]}>
            <Text style={{ color: f === format ? theme.brand : theme.textMid, fontWeight: '600' }}>{FORMAT_LABEL[f]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.textMid }]}>
        Players ({filled.length}
        {isMixed ? ` · ${menCount}M ${womenCount}F` : ''})
      </Text>
      {players.map((p, i) => (
        <View key={i} style={styles.playerRow}>
          <TextInput
            value={p.name}
            onChangeText={(v) => setPlayer(i, { name: v })}
            placeholder={`Player ${i + 1}`}
            placeholderTextColor={theme.textLo}
            style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
          />
          {isMixed && (
            <View style={styles.genderToggle}>
              {(['m', 'f'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setPlayer(i, { gender: g })}
                  style={[styles.genderBtn, { borderColor: p.gender === g ? theme.brand : theme.border }]}
                >
                  <Text style={{ color: p.gender === g ? theme.brand : theme.textLo, fontWeight: '700' }}>
                    {g.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
      <Pressable onPress={() => setPlayers((p) => [...p, { name: '', gender: p.length % 2 === 0 ? 'm' : 'f' }])}>
        <Text style={{ color: theme.brand, fontWeight: '600' }}>+ Add player</Text>
      </Pressable>

      <Stepper label="Courts" value={courts} min={1} max={Math.max(1, Math.floor(filled.length / 4)) || 1} onChange={setCourts} />
      <Stepper label="Rounds" value={rounds} min={1} max={20} onChange={setRounds} />

      <Text style={[styles.label, { color: theme.textMid }]}>Points per match</Text>
      <View style={styles.row}>
        {POINTS_OPTIONS.map((p) => (
          <Pressable key={p} onPress={() => setPointsPerMatch(p)} style={[styles.chip, { borderColor: p === pointsPerMatch ? theme.brand : theme.border }]}>
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
        <Text style={[styles.startText, { color: canStart ? '#04150E' : theme.textLo }]}>{t('setup.start')}</Text>
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
  playerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderRadius: radii.control, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fontSize.base },
  genderToggle: { flexDirection: 'row', gap: spacing.xs },
  genderBtn: { width: 40, height: 40, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1.5 },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: fontSize.lg, fontWeight: '700', minWidth: 32, textAlign: 'center', fontVariant: ['tabular-nums'] },
  start: { marginTop: spacing.xl, paddingVertical: spacing.xl, borderRadius: radii.card, alignItems: 'center' },
  startText: { fontSize: fontSize.lg, fontWeight: '700' },
});
