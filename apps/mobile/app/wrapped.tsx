import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { seasonWrapped } from '@padel/stats';
import { fontSize, spacing } from '@padel/design-tokens';
import { loadMatchRecords } from '@/db/statsRepo';
import { useCurrentPlayerId } from '@/hooks/useCurrentPlayer';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { HolographicCard } from '@/features/wrapped/HolographicCard';
import { Sparkline } from '@/components/Sparkline';
import { useTheme } from '@/theme/ThemeProvider';

interface Scene {
  big: string;
  small: string;
  hero?: boolean;
  journey?: boolean;
}

/**
 * Season Wrapped — an animated, tap-through multi-scene reveal generated entirely
 * on device, any time (pre-empting the Strava-paywall backlash). Each scene
 * springs/fades in; the finale is a holographic personality card. The shareable
 * card stays free; deep export is the Pro gate.
 */
export default function WrappedScreen() {
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const playerId = useCurrentPlayerId();
  const { ratingJourney } = usePlayerStats();
  const summary = useMemo(() => seasonWrapped(loadMatchRecords(), playerId), [playerId]);
  const [scene, setScene] = useState(0);

  const scenes: Scene[] = [
    { big: String(summary.totalMatches), small: 'matches this season' },
    { big: `${summary.hoursOnCourt}h`, small: 'on court' },
    { big: `${Math.round(summary.winRate * 100)}%`, small: 'win rate' },
    { big: summary.favouritePartner?.partnerId ?? '—', small: 'favourite partner' },
    { big: summary.toughestOpponent?.opponentId ?? '—', small: 'toughest opponent' },
    { big: String(summary.longestWinStreak), small: 'longest win streak' },
    { big: String(summary.deciderPointsWon), small: 'golden & star points won' },
    { big: String(summary.comebacks), small: 'comeback wins' },
    { big: summary.mostPlayedVenue ?? '—', small: 'home court' },
    { big: 'Your journey', small: 'rating over the season', journey: true },
    { big: summary.archetype, small: 'your padel personality', hero: true },
  ];
  const current = scenes[Math.min(scene, scenes.length - 1)]!;
  const advance = () => setScene((s) => (s + 1) % scenes.length);

  return (
    <Pressable style={[styles.container, { backgroundColor: theme.bg }]} onPress={advance} accessibilityRole="button">
      {current.hero && <HolographicCard width={width} height={Dimensions.get('window').height} />}

      <Animated.View
        key={scene}
        entering={current.hero ? ZoomIn.springify().damping(12) : FadeIn.duration(500)}
        exiting={FadeOut.duration(200)}
        style={styles.scene}
      >
        <Text style={[styles.big, { color: current.hero ? theme.gold : theme.brand }]}>{current.big}</Text>
        <Text style={[styles.small, { color: theme.textMid }]}>{current.small}</Text>
        {current.journey && ratingJourney.length >= 2 && (
          <View style={styles.journey}>
            <Sparkline values={ratingJourney} height={80} />
          </View>
        )}
      </Animated.View>

      <Text style={[styles.hint, { color: theme.textLo }]}>
        {scene + 1} / {scenes.length} · tap to continue
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  scene: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  big: { fontSize: fontSize.displayLg, fontWeight: '800', textAlign: 'center' },
  small: { fontSize: fontSize.xl, textAlign: 'center' },
  journey: { width: '80%', marginTop: spacing.lg },
  hint: { fontSize: fontSize.sm, position: 'absolute', bottom: spacing.huge },
});
