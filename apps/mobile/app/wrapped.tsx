import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  ZoomIn,
  useReducedMotion,
} from 'react-native-reanimated';
import { useCanvasRef } from '@shopify/react-native-skia';
import { seasonWrapped } from '@padel/stats';
import { radii, spacing } from '@padel/design-tokens';
import { Button, Screen, Share2, Text, haptics } from '@/ui';
import { loadMatchRecords } from '@/db/statsRepo';
import { getPlayerNames } from '@/db/playerRepo';
import { useCurrentPlayerId } from '@/hooks/useCurrentPlayer';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { HolographicCard } from '@/features/wrapped/HolographicCard';
import { WrappedShareCard } from '@/features/wrapped/WrappedShareCard';
import { buildWrappedCardData } from '@/features/wrapped/buildWrappedCardData';
import { shareCanvas } from '@/features/card/shareCard';
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
 * springs/parallax-reveals in; the finale is a holographic personality card with
 * a real share action reusing the Skia snapshot path. The shareable card stays
 * free; deep export is the Pro gate.
 */
export default function WrappedScreen() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const { width, height } = Dimensions.get('window');
  const playerId = useCurrentPlayerId();
  const { ratingJourney } = usePlayerStats();
  const canvasRef = useCanvasRef();
  const [sharing, setSharing] = useState(false);

  const summary = useMemo(() => seasonWrapped(loadMatchRecords(), playerId), [playerId]);
  const names = useMemo(() => {
    const ids = [summary.favouritePartner?.partnerId, summary.toughestOpponent?.opponentId].filter(
      (v): v is string => Boolean(v),
    );
    return getPlayerNames(ids);
  }, [summary]);
  const cardData = useMemo(
    () => buildWrappedCardData({ summary, seasonLabel: `${new Date().getFullYear()} Season`, names }),
    [summary, names],
  );
  const nameOf = (id: string | undefined) => (id ? (names.get(id) ?? id) : '—');

  const [scene, setScene] = useState(0);

  const scenes: Scene[] = [
    { big: String(summary.totalMatches), small: 'matches this season' },
    { big: `${summary.hoursOnCourt}h`, small: 'on court' },
    { big: `${Math.round(summary.winRate * 100)}%`, small: 'win rate' },
    { big: nameOf(summary.favouritePartner?.partnerId), small: 'favourite partner' },
    { big: nameOf(summary.toughestOpponent?.opponentId), small: 'toughest opponent' },
    { big: String(summary.longestWinStreak), small: 'longest win streak' },
    { big: String(summary.deciderPointsWon), small: 'golden & star points won' },
    { big: String(summary.comebacks), small: 'comeback wins' },
    { big: summary.mostPlayedVenue ?? '—', small: 'home court' },
    { big: 'Your journey', small: 'rating over the season', journey: true },
    { big: summary.archetype, small: 'your padel personality', hero: true },
  ];
  const total = scenes.length;
  const current = scenes[Math.min(scene, total - 1)]!;
  const isFinale = scene >= total - 1;

  const advance = () => {
    if (isFinale) return;
    haptics.tap();
    setScene((s) => s + 1);
  };

  const onShare = async () => {
    setSharing(true);
    haptics.success();
    try {
      await shareCanvas(canvasRef.current);
    } finally {
      setSharing(false);
    }
  };

  const sceneEnter = current.hero
    ? ZoomIn.springify().damping(11).stiffness(140)
    : reduceMotion
      ? FadeIn.duration(240)
      : FadeInDown.springify().damping(16).stiffness(120);

  return (
    <Pressable style={[styles.container, { backgroundColor: theme.bg }]} onPress={advance} accessibilityRole="button" accessibilityLabel="Season Wrapped, tap to continue">
      {current.hero && <HolographicCard width={width} height={height} />}

      {/* Segmented progress affordance. */}
      <View style={styles.progress} pointerEvents="none">
        {scenes.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSeg,
              { backgroundColor: i <= scene ? theme.gold : theme.surfaceRaised },
            ]}
          />
        ))}
      </View>

      <Animated.View
        key={scene}
        entering={sceneEnter}
        exiting={reduceMotion ? undefined : FadeOut.duration(180)}
        style={styles.scene}
      >
        <Text variant="display" tone={current.hero ? 'gold' : 'brand'} style={styles.big}>
          {current.big}
        </Text>
        <Text variant="title" tone="mid" style={styles.small}>
          {current.small}
        </Text>
        {current.journey && ratingJourney.length >= 2 && (
          <View style={styles.journey}>
            <Sparkline values={ratingJourney} height={80} />
          </View>
        )}
      </Animated.View>

      {isFinale ? (
        <Animated.View entering={reduceMotion ? FadeIn.duration(300) : SlideInDown.springify().damping(18).delay(300)} style={styles.finale}>
          <Button
            label="Share your Wrapped"
            size="lg"
            variant="gold"
            loading={sharing}
            icon={<Share2 size={20} color="#04150E" />}
            onPress={onShare}
            accessibilityLabel="Share your Season Wrapped card"
          />
        </Animated.View>
      ) : (
        <Text variant="label" tone="lo" style={styles.hint}>
          {scene + 1} / {total} · tap to continue
        </Text>
      )}

      {/* Off-screen share card, snapshotted on demand. */}
      <View style={styles.offscreen} pointerEvents="none">
        <WrappedShareCard data={cardData} canvasRef={canvasRef} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  progress: { position: 'absolute', top: spacing.huge, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xl },
  progressSeg: { flex: 1, height: 4, borderRadius: radii.pill, minWidth: 14 },
  scene: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  big: { textAlign: 'center', fontSize: 96 },
  small: { textAlign: 'center' },
  journey: { width: '80%', marginTop: spacing.lg },
  finale: { position: 'absolute', bottom: spacing.huge, width: '82%' },
  hint: { position: 'absolute', bottom: spacing.huge },
  offscreen: { position: 'absolute', left: -10000, top: 0, width: 1080, height: 1920 },
});
