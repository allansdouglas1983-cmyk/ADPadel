import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { currentPointLabels, setScorelines } from '@padel/scoring-engine';
import { palette, radii, spacing } from '@padel/design-tokens';
import { Text, haptics } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { useMatchTimer } from '@/hooks/useMatchTimer';
import { finalizeMatch } from '@/features/scoring/finalizeMatch';
import { notifyShareCard } from '@/notifications/notify';
import { AnimatedScore } from '@/features/scoring/AnimatedScore';
import { statusLabel } from '@/features/scoring/statusLabel';
import { ScoreboardControls } from '@/features/scoring/ScoreboardControls';
import { ShotPicker } from '@/features/scoring/ShotPicker';
import { logPoint } from '@/db/pointsRepo';
import type { ShotType } from '@/lib/shots';

/**
 * The live scoreboard — the app's centerpiece. Two glass-court gradient zones,
 * a huge animated tabular score that springs on every point, a pulsing serve
 * indicator, a live status line (deuce / golden point / tie-break / match
 * point), and the full control set. One tap per point; long-press to undo.
 */
export default function ScoreboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { state, cfg, snapshot, matchId, createdAtIso, dispatch } = useMatchStore();
  const lastComplete = useRef(false);
  const prevGames = useRef(0);
  const prevSets = useRef(0);

  const startMs = createdAtIso ? Date.parse(createdAtIso) : Date.now();
  const timer = useMatchTimer(startMs);
  const [loggingOn, setLoggingOn] = useState(false);
  const [warnings, setWarnings] = useState<[number, number]>([0, 0]);
  const [pendingSide, setPendingSide] = useState<0 | 1 | null>(null);

  // Serve indicator pulse.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  useEffect(() => {
    if (!state) return;
    const games = state.sets.reduce((n, s) => n + s.games[0] + s.games[1], 0);
    const sets = state.setsWon[0] + state.setsWon[1];
    if (games > prevGames.current) haptics.press();
    if (sets > prevSets.current) haptics.success();
    prevGames.current = games;
    prevSets.current = sets;
  }, [state]);

  useEffect(() => {
    if (state?.complete && cfg && snapshot && matchId && createdAtIso && !lastComplete.current) {
      lastComplete.current = true;
      finalizeMatch(matchId, state, cfg, snapshot.players, createdAtIso);
      haptics.success();
      void notifyShareCard();
      router.replace(`/result/${id}`);
    }
  }, [state?.complete, cfg, snapshot, matchId, createdAtIso, id]);

  if (!state || !cfg || !snapshot) return <View style={[styles.container, { backgroundColor: palette.bg900 }]} />;

  const [labelA, labelB] = currentPointLabels(state, cfg);
  const scorelines = setScorelines(state);
  const status = statusLabel(state, cfg, t);
  const currentSet = state.sets[state.currentSetIndex]!;
  const showChangeover =
    (currentSet.games[0] + currentSet.games[1]) % 2 === 1 && state.currentGame.points[0] + state.currentGame.points[1] === 0;

  const commitPoint = (side: 0 | 1, shot: ShotType | null) => {
    const serverPlayerId = snapshot.players[state.server.serverSlot] ?? null;
    const serveSide = state.server.servingSide;
    const index = snapshot.log.length;
    dispatch({ type: 'POINT_TO', side });
    if (loggingOn && matchId) logPoint({ matchId, index, winnerSide: side, serveSide, serverPlayerId, shotType: shot });
  };

  const scorePoint = (side: 0 | 1) => {
    haptics.press();
    if (loggingOn) setPendingSide(side);
    else commitPoint(side, null);
  };

  const applyPenalty = (side: 0 | 1) => {
    const next = warnings[side] + 1;
    setWarnings((w) => (side === 0 ? [next, w[1]] : [w[0], next]));
    haptics.warning();
    if (next === 2) dispatch({ type: 'PENALTY', side, unit: 'point' });
    else if (next >= 3) dispatch({ type: 'PENALTY', side, unit: 'game' });
  };

  const Zone = ({ side, label }: { side: 0 | 1; label: string }) => {
    const serving = state.server.servingSide === side;
    const grad = side === 0 ? ([palette.surface700, palette.bg900] as const) : ([palette.surface600, palette.bg800] as const);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('score.pointTo', { side: side === 0 ? t('score.you') : t('score.opponents') })}
        onPress={() => scorePoint(side)}
        onLongPress={() => {
          haptics.tap();
          dispatch({ type: 'UNDO' });
        }}
        style={styles.flex}
      >
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.zone}>
          {serving && (
            <Animated.View style={[styles.serveRow, pulseStyle]}>
              <View style={[styles.serveDot, { backgroundColor: theme.gold }]} />
              <Text variant="caption" tone="gold">
                serving
              </Text>
            </Animated.View>
          )}
          <AnimatedScore value={label} tone={serving ? 'gold' : 'hi'} />
          <Text variant="heading" tone="mid" tabular style={{ letterSpacing: 3 }}>
            {scorelines.map((s) => s[side]).join('   ')}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg900 }]}>
      <Zone side={0} label={labelA} />

      <View style={[styles.middle, { backgroundColor: palette.bg900, borderColor: theme.border }]}>
        <ScoreboardControls
          timerLabel={timer.label}
          paused={timer.paused}
          loggingOn={loggingOn}
          warnings={warnings}
          onToggleTimeout={timer.togglePause}
          onToggleLogging={() => setLoggingOn((v) => !v)}
          onPenalty={applyPenalty}
          onRetire={(side) => dispatch({ type: 'RETIRE', side })}
        />
        {status && (
          <Animated.View entering={FadeIn} style={styles.statusPill}>
            <Text variant="label" tone="gold">
              {status}
            </Text>
          </Animated.View>
        )}
        {showChangeover && (
          <Text variant="caption" tone="mid">
            ⟳ change ends
          </Text>
        )}
      </View>

      <Zone side={1} label={labelB} />

      {pendingSide !== null && (
        <ShotPicker
          onPick={(shot) => {
            commitPoint(pendingSide, shot);
            setPendingSide(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  zone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  serveRow: { position: 'absolute', top: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  serveDot: { width: 10, height: 10, borderRadius: radii.pill },
  middle: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statusPill: { alignSelf: 'center', paddingVertical: spacing.xs },
});
