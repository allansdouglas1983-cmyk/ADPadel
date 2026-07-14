import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CourtProgress, Side } from '@padel/formats';
import { courtIsComplete } from '@padel/formats';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  court: CourtProgress;
  pointsPerMatch: number;
  nameOf: (id: string) => string;
  onPoint: (side: Side) => void;
  onUndo: (side: Side) => void;
}

/** One court's live score entry: tap +/- for each team. Presentational only —
 * all scoring rules live in the pure EventSession. */
export function CourtCard({ court, pointsPerMatch, nameOf, onPoint, onUndo }: Props) {
  const theme = useTheme();
  const complete = courtIsComplete(court, pointsPerMatch);

  const TeamRow = ({ side, names, points }: { side: Side; names: string; points: number }) => (
    <View style={styles.teamRow}>
      <Text style={[styles.names, { color: theme.textHi }]} numberOfLines={1}>
        {names}
      </Text>
      <View style={styles.scoreControls}>
        <Pressable
          accessibilityLabel={`Remove point from ${names}`}
          onPress={() => onUndo(side)}
          hitSlop={8}
          style={[styles.stepper, { borderColor: theme.border }]}
        >
          <Text style={[styles.stepperText, { color: theme.textMid }]}>–</Text>
        </Pressable>
        <Text style={[styles.points, { color: theme.textHi }]}>{points}</Text>
        <Pressable
          accessibilityLabel={`Add point to ${names}`}
          onPress={() => onPoint(side)}
          disabled={complete}
          hitSlop={8}
          style={[styles.stepper, { borderColor: complete ? theme.border : theme.brand }]}
        >
          <Text style={[styles.stepperText, { color: complete ? theme.textLo : theme.brand }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: complete ? theme.brand : theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.courtLabel, { color: theme.textMid }]}>Court {court.court + 1}</Text>
        <Text style={[styles.total, { color: theme.textLo }]}>
          {court.pointsA + court.pointsB}/{pointsPerMatch}
        </Text>
      </View>
      <TeamRow side={0} names={court.teamA.map(nameOf).join(' & ')} points={court.pointsA} />
      <TeamRow side={1} names={court.teamB.map(nameOf).join(' & ')} points={court.pointsB} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  courtLabel: { fontSize: fontSize.sm, fontWeight: '600', textTransform: 'uppercase' },
  total: { fontSize: fontSize.sm, fontVariant: ['tabular-nums'] },
  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  names: { flex: 1, fontSize: fontSize.base, fontWeight: '600' },
  scoreControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { width: 36, height: 36, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: fontSize.lg, fontWeight: '700' },
  points: { fontSize: fontSize.xl, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 28, textAlign: 'center' },
});
