import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DeuceMode, RuleSetConfig } from '@padel/scoring-engine';
import { padelPresets } from '@padel/scoring-engine';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { createMatch } from '@/db/createMatch';
import { createGuestPlayer } from '@/db/playerRepo';

/**
 * Choose the rule config, name the players and start a match. Defaults to the
 * recreational golden-point / super-tiebreak preset — one tap to Start.
 *
 * The engine's doubles serve rotation expects players interleaved [A1,B1,A2,B2]
 * (slotSide [0,1,0,1]); we build that array here and store the teams to match,
 * so finalization derives the sides consistently.
 */
export default function SetupScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const start = useMatchStore((s) => s.start);
  const [deuce, setDeuce] = useState<DeuceMode>('golden');
  const [format, setFormat] = useState<'doubles' | 'singles'>('doubles');
  const [teamA, setTeamA] = useState(['You', 'Partner']);
  const [teamB, setTeamB] = useState(['Opponent 1', 'Opponent 2']);

  const perSide = format === 'singles' ? 1 : 2;

  const configFor = (): RuleSetConfig => {
    if (format === 'singles') return padelPresets.padelSinglesGolden;
    if (deuce === 'advantage') return padelPresets.padelAdvantageFull;
    if (deuce === 'star') return padelPresets.padelStarPointSuperTB;
    return padelPresets.padelGoldenPointSuperTB;
  };

  const onStart = () => {
    const cfg = configFor();
    const aNames = teamA.slice(0, perSide);
    const bNames = teamB.slice(0, perSide);
    const aIds = aNames.map((n, i) => createGuestPlayer(n.trim() || `Team A ${i + 1}`));
    const bIds = bNames.map((n, i) => createGuestPlayer(n.trim() || `Team B ${i + 1}`));

    // Interleave into the engine's expected slot order [A1,B1,A2,B2] / [A1,B1].
    const enginePlayers: string[] = [];
    for (let i = 0; i < perSide; i++) {
      enginePlayers.push(aIds[i]!);
      enginePlayers.push(bIds[i]!);
    }

    const { matchId } = createMatch({
      cfg,
      ruleSetName: cfg.id,
      format,
      teamAPlayerIds: aIds,
      teamBPlayerIds: bIds,
    });
    start(matchId, cfg, enginePlayers, new Date().toISOString());
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

  const NameInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholderTextColor={theme.textLo}
      style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
    />
  );

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
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

      <Text style={[styles.label, { color: theme.textMid }]}>{t('score.you')}</Text>
      {teamA.slice(0, perSide).map((n, i) => (
        <NameInput key={`a${i}`} value={n} onChange={(v) => setTeamA((p) => p.map((x, idx) => (idx === i ? v : x)))} />
      ))}
      <Text style={[styles.label, { color: theme.textMid }]}>{t('score.opponents')}</Text>
      {teamB.slice(0, perSide).map((n, i) => (
        <NameInput key={`b${i}`} value={n} onChange={(v) => setTeamB((p) => p.map((x, idx) => (idx === i ? v : x)))} />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('setup.start')}
        onPress={onStart}
        style={[styles.start, { backgroundColor: theme.brand }]}
      >
        <Text style={styles.startText}>{t('setup.start')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md },
  label: { fontSize: fontSize.sm, textTransform: 'uppercase', marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  choice: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.pill, borderWidth: 1.5 },
  input: { borderWidth: 1, borderRadius: radii.control, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fontSize.base },
  start: { marginTop: spacing.xl, paddingVertical: spacing.xl, borderRadius: radii.card, alignItems: 'center' },
  startText: { color: '#04150E', fontSize: fontSize.lg, fontWeight: '700' },
});
