import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { SHOT_LABEL, SHOT_TYPES, type ShotType } from '@/lib/shots';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Shot picker shown after a point when per-point logging is enabled. Uses the
 * real padel shot vocabulary; "Skip" logs the point with no shot so logging is
 * never a chore.
 */
export function ShotPicker({ onPick }: { onPick: (shot: ShotType | null) => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.sheet, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textMid }]}>Winning shot</Text>
      <View style={styles.grid}>
        {SHOT_TYPES.map((s) => (
          <Pressable key={s} onPress={() => onPick(s)} style={[styles.chip, { borderColor: theme.border }]}>
            <Text style={{ color: theme.textHi, fontWeight: '600' }}>{SHOT_LABEL[s]}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => onPick(null)} style={[styles.chip, { borderColor: theme.brand }]}>
          <Text style={{ color: theme.brand, fontWeight: '700' }}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, borderTopWidth: 1, gap: spacing.sm },
  title: { fontSize: fontSize.sm, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1.5 },
});
