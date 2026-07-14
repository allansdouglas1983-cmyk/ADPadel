import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { radii, spacing } from '@padel/design-tokens';
import { Text, haptics } from '@/ui';
import { SHOT_LABEL, SHOT_TYPES, type ShotType } from '@/lib/shots';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Shot picker shown after a point when per-point logging is enabled. Uses the
 * real padel shot vocabulary; "Skip" logs the point with no shot so logging is
 * never a chore. Slides up from the bottom (respecting reduce-motion).
 */
export function ShotPicker({ onPick }: { onPick: (shot: ShotType | null) => void }) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();

  const pick = (shot: ShotType | null) => {
    haptics.select();
    onPick(shot);
  };

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(18)}
      style={[styles.sheet, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
    >
      <Text variant="label" tone="lo">
        Winning shot
      </Text>
      <View style={styles.grid}>
        {SHOT_TYPES.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={`Winning shot: ${SHOT_LABEL[s]}`}
            onPress={() => pick(s)}
            style={[styles.chip, { borderColor: theme.border }]}
          >
            <Text variant="bodyStrong" tone="hi">
              {SHOT_LABEL[s]}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip logging a shot"
          onPress={() => pick(null)}
          style={[styles.chip, { borderColor: theme.brand }]}
        >
          <Text variant="bodyStrong" tone="brand">
            Skip
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, borderTopWidth: 1, gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1.5 },
});
