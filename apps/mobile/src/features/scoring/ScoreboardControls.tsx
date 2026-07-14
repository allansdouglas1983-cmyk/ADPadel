import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import { radii, spacing } from '@padel/design-tokens';
import { Text, haptics } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  timerLabel: string;
  paused: boolean;
  loggingOn: boolean;
  voiceOn: boolean;
  warnings: [number, number];
  onToggleTimeout: () => void;
  onToggleLogging: () => void;
  onToggleVoice: () => void;
  onPenalty: (side: 0 | 1) => void;
  onRetire: (side: 0 | 1) => void;
}

/**
 * The in-match controls menu: the match clock (tap the timer to pause for a
 * medical timeout), per-point shot logging, voice call-out, code-of-conduct
 * penalties (warning → point → game escalation) and retirement. Kept out of the
 * way in a bottom sheet so it never interrupts scoring.
 */
export function ScoreboardControls({
  timerLabel,
  paused,
  loggingOn,
  voiceOn,
  warnings,
  onToggleTimeout,
  onToggleLogging,
  onToggleVoice,
  onPenalty,
  onRetire,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) => (
    <View style={styles.rowBetween}>
      <Text variant="body" tone="hi">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={() => {
          haptics.select();
          onChange();
        }}
        trackColor={{ true: theme.brand }}
      />
    </View>
  );

  return (
    <>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Match timer paused, tap to resume' : 'Match timer, tap to pause for a timeout'}
          onPress={() => {
            haptics.tap();
            onToggleTimeout();
          }}
        >
          <Text variant="bodyStrong" tone={paused ? 'gold' : 'mid'} tabular>
            {paused ? '⏸ ' : ''}
            {timerLabel}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More match controls"
          hitSlop={12}
          onPress={() => {
            haptics.tap();
            setOpen(true);
          }}
        >
          <Text variant="heading" tone="mid">
            •••
          </Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close controls">
          <Pressable style={[styles.sheet, { backgroundColor: theme.surfaceRaised }]}>
            <View style={styles.handle} />

            <ToggleRow label="Log shots per point" value={loggingOn} onChange={onToggleLogging} />
            <ToggleRow label="Speak the score" value={voiceOn} onChange={onToggleVoice} />

            <Text variant="label" tone="lo" style={styles.section}>
              Penalty · warning → point → game
            </Text>
            {([0, 1] as const).map((side) => (
              <Pressable
                key={side}
                accessibilityRole="button"
                onPress={() => onPenalty(side)}
                style={[styles.action, { borderColor: theme.gold }]}
              >
                <Text variant="body" tone="hi">
                  Penalise {side === 0 ? 'You' : 'Opponents'} · {warnings[side]} warning{warnings[side] === 1 ? '' : 's'}
                </Text>
              </Pressable>
            ))}

            <Text variant="label" tone="lo" style={styles.section}>
              Retire / walkover
            </Text>
            {([0, 1] as const).map((side) => (
              <Pressable
                key={side}
                accessibilityRole="button"
                onPress={() => {
                  haptics.warning();
                  onRetire(side);
                  setOpen(false);
                }}
                style={[styles.action, { borderColor: theme.loss }]}
              >
                <Text variant="body" tone="loss">
                  {side === 0 ? 'You' : 'Opponents'} retire
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { padding: spacing.xl, gap: spacing.md, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, backgroundColor: '#FFFFFF22', marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { marginTop: spacing.sm },
  action: { padding: spacing.lg, borderRadius: radii.card, borderWidth: 1 },
});
