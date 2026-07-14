import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  timerLabel: string;
  paused: boolean;
  loggingOn: boolean;
  warnings: [number, number];
  onToggleTimeout: () => void;
  onToggleLogging: () => void;
  onPenalty: (side: 0 | 1) => void;
  onRetire: (side: 0 | 1) => void;
}

/**
 * The in-match controls menu: the match clock (tap the timer to pause for a
 * medical timeout), per-point logging toggle, code-of-conduct penalties
 * (warning → point → game escalation) and retirement. Kept out of the way so it
 * never interrupts scoring.
 */
export function ScoreboardControls({
  timerLabel,
  paused,
  loggingOn,
  warnings,
  onToggleTimeout,
  onToggleLogging,
  onPenalty,
  onRetire,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={styles.bar}>
        <Pressable accessibilityLabel="Match timer, tap to pause" onPress={onToggleTimeout}>
          <Text style={[styles.timer, { color: paused ? theme.gold : theme.textMid }]}>
            {paused ? '⏸ ' : ''}
            {timerLabel}
          </Text>
        </Pressable>
        <Pressable accessibilityLabel="More controls" onPress={() => setOpen(true)}>
          <Text style={[styles.more, { color: theme.textMid }]}>•••</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: theme.surfaceRaised }]}>
            <View style={styles.rowBetween}>
              <Text style={{ color: theme.textHi, fontSize: fontSize.base }}>Log shots per point</Text>
              <Switch value={loggingOn} onValueChange={onToggleLogging} />
            </View>

            <Text style={[styles.section, { color: theme.textMid }]}>Penalty (warning → point → game)</Text>
            {([0, 1] as const).map((side) => (
              <Pressable
                key={side}
                onPress={() => onPenalty(side)}
                style={[styles.action, { borderColor: theme.warn }]}
              >
                <Text style={{ color: theme.textHi }}>
                  Penalise {side === 0 ? 'You' : 'Opponents'} (warnings: {warnings[side]})
                </Text>
              </Pressable>
            ))}

            <Text style={[styles.section, { color: theme.textMid }]}>Retire / walkover</Text>
            {([0, 1] as const).map((side) => (
              <Pressable
                key={side}
                onPress={() => {
                  onRetire(side);
                  setOpen(false);
                }}
                style={[styles.action, { borderColor: theme.loss }]}
              >
                <Text style={{ color: theme.loss }}>{side === 0 ? 'You' : 'Opponents'} retire</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl },
  timer: { fontSize: fontSize.base, fontVariant: ['tabular-nums'], fontWeight: '600' },
  more: { fontSize: fontSize.lg, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' },
  sheet: { padding: spacing.xl, gap: spacing.md, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.sm },
  action: { padding: spacing.lg, borderRadius: radii.card, borderWidth: 1 },
});
