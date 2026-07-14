import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DeuceMode, RuleSetConfig } from '@padel/scoring-engine';
import { padelPresets } from '@padel/scoring-engine';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { createMatch, genId } from '@/db/createMatch';

/** Choose the rule config and start a match. Defaults to the recreational
 * golden-point / super-tiebreak preset — one tap to Start. */
export default function SetupScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const start = useMatchStore((s) => s.start);
  const [deuce, setDeuce] = useState<DeuceMode>('golden');
  const [format, setFormat] = useState<'doubles' | 'singles'>('doubles');

  const configFor = (): RuleSetConfig => {
    if (format === 'singles') return padelPresets.padelSinglesGolden;
    if (deuce === 'advantage') return padelPresets.padelAdvantageFull;
    if (deuce === 'star') return padelPresets.padelStarPointSuperTB;
    return padelPresets.padelGoldenPointSuperTB;
  };

  const onStart = () => {
    const cfg = configFor();
    const players =
      format === 'singles' ? [genId('p'), genId('p')] : [genId('p'), genId('p'), genId('p'), genId('p')];
    const half = players.length / 2;
    const { matchId } = createMatch({
      cfg,
      ruleSetName: cfg.id,
      format,
      teamAPlayerIds: players.slice(0, half),
      teamBPlayerIds: players.slice(half),
    });
    start(matchId, cfg, players, new Date().toISOString());
    router.replace(`/match/${matchId}`);
  };

  const Choice = <T,>({ value, current, set, label }: { value: T; current: T; set: (v: T) => void; label: string }) => (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: value === current }}
      onPress={() => set(value)}
      style={[styles.choice, { borderColor: value === current ? theme.brand : theme.border }]}
    >
      <Text style={{ color: value === current ? theme.brand : theme.textMid, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.label, { color: theme.textMid }]}>{t('setup.format')}</Text>
      <View style={styles.row}>
        <Choice value="doubles" current={format} set={setFormat} label={t('setup.doubles')} />
        <Choice value="singles" current={format} set={setFormat} label={t('setup.singles')} />
      </View>

      <Text style={[styles.label, { color: theme.textMid }]}>{t('setup.deuceMode')}</Text>
      <View style={styles.row}>
        <Choice value="golden" current={deuce} set={setDeuce} label={t('setup.golden')} />
        <Choice value="advantage" current={deuce} set={setDeuce} label={t('setup.advantage')} />
        <Choice value="star" current={deuce} set={setDeuce} label={t('setup.star')} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('setup.start')}
        onPress={onStart}
        style={[styles.start, { backgroundColor: theme.brand }]}
      >
        <Text style={styles.startText}>{t('setup.start')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  label: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  choice: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1.5 },
  start: { marginTop: 'auto', paddingVertical: spacing.xl, borderRadius: radii.card, alignItems: 'center' },
  startText: { color: '#04150E', fontSize: fontSize.lg, fontWeight: '700' },
});
