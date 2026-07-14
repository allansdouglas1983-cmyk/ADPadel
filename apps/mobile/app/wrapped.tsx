import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { seasonWrapped } from '@padel/stats';
import { fontSize, spacing } from '@padel/design-tokens';
import { loadMatchRecords } from '@/db/statsRepo';
import { useCurrentPlayerId } from '@/hooks/useCurrentPlayer';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Season Wrapped — a tap-through, multi-scene reveal generated entirely on
 * device, any time (pre-empting the Strava-paywall backlash). The shareable
 * card stays free; deep export is the Pro gate.
 */
export default function WrappedScreen() {
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const summary = useMemo(() => seasonWrapped(loadMatchRecords(), playerId), [playerId]);
  const [scene, setScene] = useState(0);

  const scenes: Array<{ big: string; small: string }> = [
    { big: String(summary.totalMatches), small: 'matches this season' },
    { big: `${Math.round(summary.winRate * 100)}%`, small: 'win rate' },
    { big: summary.favouritePartner?.partnerId ?? '—', small: 'favourite partner' },
    { big: String(summary.longestWinStreak), small: 'longest win streak' },
    { big: summary.archetype, small: 'your padel archetype' },
  ];
  const current = scenes[Math.min(scene, scenes.length - 1)]!;

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.container, { backgroundColor: theme.bg }]}
      onPress={() => setScene((s) => (s + 1) % scenes.length)}
    >
      <Text style={[styles.big, { color: theme.brand }]}>{current.big}</Text>
      <Text style={[styles.small, { color: theme.textMid }]}>{current.small}</Text>
      <Text style={[styles.hint, { color: theme.textLo }]}>tap to continue</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  big: { fontSize: fontSize.score, fontWeight: '700', textAlign: 'center' },
  small: { fontSize: fontSize.xl },
  hint: { fontSize: fontSize.sm, position: 'absolute', bottom: spacing.huge },
});
