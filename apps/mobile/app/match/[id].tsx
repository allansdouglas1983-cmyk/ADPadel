import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { currentPointLabels, setScorelines } from '@padel/scoring-engine';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { useMatchTimer } from '@/hooks/useMatchTimer';
import { finalizeMatch } from '@/features/scoring/finalizeMatch';
import { notifyShareCard } from '@/notifications/notify';
import { ScoreboardControls } from '@/features/scoring/ScoreboardControls';
import { ShotPicker } from '@/features/scoring/ShotPicker';
import { logPoint } from '@/db/pointsRepo';
import type { ShotType } from '@/lib/shots';

/**
 * The live scoreboard — the most-used screen. Giant tap zones score a point,
 * long-press undoes. Adds the full control set: a pausable match clock (medical
 * timeout), code-of-conduct penalties (warning→point→game), retirement, and
 * optional per-point shot logging with a changeover cue. Dark, glanceable,
 * one tap per point; every action persists synchronously.
 */
export default function ScoreboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { state, cfg, snapshot, matchId, createdAtIso, dispatch } = useMatchStore();
  const lastComplete = useRef(false);

  const startMs = createdAtIso ? Date.parse(createdAtIso) : Date.now();
  const timer = useMatchTimer(startMs);
  const [loggingOn, setLoggingOn] = useState(false);
  const [warnings, setWarnings] = useState<[number, number]>([0, 0]);
  const [pendingSide, setPendingSide] = useState<0 | 1 | null>(null);

  useEffect(() => {
    if (state?.complete && cfg && snapshot && matchId && createdAtIso && !lastComplete.current) {
      lastComplete.current = true;
      finalizeMatch(matchId, state, cfg, snapshot.players, createdAtIso);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void notifyShareCard();
      router.replace(`/result/${id}`);
    }
  }, [state?.complete, cfg, snapshot, matchId, createdAtIso, id]);

  if (!state || !cfg || !snapshot) return <View style={[styles.container, { backgroundColor: theme.bg }]} />;

  const [labelA, labelB] = currentPointLabels(state, cfg);
  const scorelines = setScorelines(state);
  const currentSet = state.sets[state.currentSetIndex]!;
  const showChangeover = (currentSet.games[0] + currentSet.games[1]) % 2 === 1 && state.currentGame.points[0] + state.currentGame.points[1] === 0;

  const commitPoint = (side: 0 | 1, shot: ShotType | null) => {
    // Capture serve context BEFORE the point is applied.
    const serverPlayerId = snapshot.players[state.server.serverSlot] ?? null;
    const serveSide = state.server.servingSide;
    const index = snapshot.log.length;
    dispatch({ type: 'POINT_TO', side });
    if (loggingOn && matchId) {
      logPoint({ matchId, index, winnerSide: side, serveSide, serverPlayerId, shotType: shot });
    }
  };

  const scorePoint = (side: 0 | 1) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackType.Medium);
    if (loggingOn) {
      setPendingSide(side);
    } else {
      commitPoint(side, null);
    }
  };

  // Code-of-conduct escalation: 1st = warning, 2nd = point, 3rd+ = game.
  const applyPenalty = (side: 0 | 1) => {
    const next = warnings[side] + 1;
    setWarnings((w) => (side === 0 ? [next, w[1]] : [w[0], next]));
    if (next === 2) dispatch({ type: 'PENALTY', side, unit: 'point' });
    else if (next >= 3) dispatch({ type: 'PENALTY', side, unit: 'game' });
  };

  const Zone = ({ side, label }: { side: 0 | 1; label: string }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('score.pointTo', { side: side === 0 ? t('score.you') : t('score.opponents') })}
      onPress={() => scorePoint(side)}
      onLongPress={() => dispatch({ type: 'UNDO' })}
      style={[styles.zone, { backgroundColor: side === 0 ? theme.surface : theme.surfaceRaised }]}
    >
      <Text style={[styles.point, { color: theme.textHi }]}>{label}</Text>
      <Text style={[styles.games, { color: theme.textMid }]}>{scorelines.map((s) => s[side]).join('  ')}</Text>
      {state.server.servingSide === side && <View style={[styles.serveDot, { backgroundColor: theme.gold }]} />}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Zone side={0} label={labelA} />

      <View style={styles.middle}>
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
        <View style={styles.controls}>
          <Pressable accessibilityLabel={t('score.undo')} onPress={() => dispatch({ type: 'UNDO' })}>
            <Text style={[styles.control, { color: theme.textMid }]}>{t('score.undo')}</Text>
          </Pressable>
          {showChangeover && <Text style={[styles.changeover, { color: theme.gold }]}>⟳ change ends</Text>}
          <Pressable accessibilityLabel={t('score.replay')} onPress={() => dispatch({ type: 'REPLAY' })}>
            <Text style={[styles.control, { color: theme.textMid }]}>{t('score.replay')}</Text>
          </Pressable>
        </View>
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
  zone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  point: { fontSize: fontSize.score, fontWeight: '700', fontVariant: ['tabular-nums'] },
  games: { fontSize: fontSize.xl, fontVariant: ['tabular-nums'], letterSpacing: 2 },
  serveDot: { position: 'absolute', top: spacing.xl, width: 12, height: 12, borderRadius: radii.pill },
  middle: { paddingVertical: spacing.sm, gap: spacing.xs },
  controls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  control: { fontSize: fontSize.base, fontWeight: '600' },
  changeover: { fontSize: fontSize.sm, fontWeight: '700' },
});
