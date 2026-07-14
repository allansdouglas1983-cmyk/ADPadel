import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { createGuestPlayer } from '@/db/playerRepo';
import { useKingStore } from '@/features/king/kingStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Create a King of the Court night: name the players, who are paired into fixed
 * teams. Two teams start on each court; the rest wait in the queue. Winners
 * stay, losers rotate to the back.
 */
export default function KingSetupScreen() {
  const theme = useTheme();
  const createKing = useKingStore((s) => s.create);
  const [names, setNames] = useState<string[]>(['', '', '', '', '', '']);
  const [courts, setCourts] = useState(1);
  const [pointsPerMatch, setPointsPerMatch] = useState(16);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  // Need an even number ≥ 4 to form at least two pairs.
  const canStart = filled.length >= 4 && filled.length % 2 === 0;

  const start = () => {
    const ids = filled.map((n) => createGuestPlayer(n));
    const pairs: [string, string][] = [];
    for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i]!, ids[i + 1]!]);
    const id = createKing(pairs, courts, pointsPerMatch);
    router.replace(`/king/${id}`);
  };

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.textHi }]}>King of the Court</Text>
      <Text style={[styles.hint, { color: theme.textMid }]}>Players pair up in twos. Winners stay on.</Text>

      {names.map((name, i) => (
        <TextInput
          key={i}
          value={name}
          onChangeText={(v) => setNames((p) => p.map((x, idx) => (idx === i ? v : x)))}
          placeholder={`Player ${i + 1}`}
          placeholderTextColor={theme.textLo}
          style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
        />
      ))}
      <Pressable onPress={() => setNames((p) => [...p, '', ''])}>
        <Text style={{ color: theme.brand, fontWeight: '600' }}>+ Add pair</Text>
      </Pressable>

      <View style={styles.stepperRow}>
        <Text style={[styles.label, { color: theme.textMid }]}>Courts</Text>
        <View style={styles.row}>
          <Pressable onPress={() => setCourts((c) => Math.max(1, c - 1))} style={[styles.stepBtn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.textHi, fontSize: fontSize.lg }}>–</Text>
          </Pressable>
          <Text style={[styles.stepValue, { color: theme.textHi }]}>{courts}</Text>
          <Pressable onPress={() => setCourts((c) => c + 1)} style={[styles.stepBtn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.textHi, fontSize: fontSize.lg }}>+</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.label, { color: theme.textMid }]}>Points per match</Text>
      <View style={styles.row}>
        {[11, 16, 21].map((p) => (
          <Pressable key={p} onPress={() => setPointsPerMatch(p)} style={[styles.chip, { borderColor: p === pointsPerMatch ? theme.brand : theme.border }]}>
            <Text style={{ color: p === pointsPerMatch ? theme.brand : theme.textMid, fontWeight: '600' }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable disabled={!canStart} onPress={start} style={[styles.start, { backgroundColor: canStart ? theme.brand : theme.surface }]}>
        <Text style={[styles.startText, { color: canStart ? '#04150E' : theme.textLo }]}>Start</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
  hint: { fontSize: fontSize.base },
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
