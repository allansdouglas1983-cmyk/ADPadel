import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import type { DeuceMode, RuleSetConfig } from '@padel/scoring-engine';
import { padelPresets } from '@padel/scoring-engine';
import { fontFamily, fontSize, radii, spacing } from '@padel/design-tokens';
import { Button, Screen, Segmented, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useMatchStore } from '@/store/matchStore';
import { createMatch } from '@/db/createMatch';
import { createGuestPlayer } from '@/db/playerRepo';

/** Choose the rule config, name the players and start a match. Defaults to the
 * recreational golden-point / super-tiebreak preset — one tap to Start. */
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
    const aIds = teamA.slice(0, perSide).map((n, i) => createGuestPlayer(n.trim() || `Team A ${i + 1}`));
    const bIds = teamB.slice(0, perSide).map((n, i) => createGuestPlayer(n.trim() || `Team B ${i + 1}`));
    const enginePlayers: string[] = [];
    for (let i = 0; i < perSide; i++) {
      enginePlayers.push(aIds[i]!);
      enginePlayers.push(bIds[i]!);
    }
    const { matchId } = createMatch({ cfg, ruleSetName: cfg.id, format, teamAPlayerIds: aIds, teamBPlayerIds: bIds });
    start(matchId, cfg, enginePlayers, new Date().toISOString());
    router.replace(`/match/${matchId}`);
  };

  const NameInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholderTextColor={theme.textLo}
      style={[styles.input, { color: theme.textHi, borderColor: theme.border, backgroundColor: theme.surface }]}
    />
  );

  return (
    <Screen scroll>
      <Text variant="title" tone="hi">
        New match
      </Text>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="lo">
          {t('setup.format')}
        </Text>
        <Segmented
          options={[{ value: 'doubles', label: t('setup.doubles') }, { value: 'singles', label: t('setup.singles') }]}
          value={format}
          onChange={setFormat}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="lo">
          {t('setup.deuceMode')}
        </Text>
        <Segmented
          options={[
            { value: 'golden', label: t('setup.golden') },
            { value: 'advantage', label: t('setup.advantage') },
            { value: 'star', label: t('setup.star') },
          ]}
          value={deuce}
          onChange={setDeuce}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="lo">
          {t('score.you')}
        </Text>
        {teamA.slice(0, perSide).map((n, i) => (
          <NameInput key={`a${i}`} value={n} onChange={(v) => setTeamA((p) => p.map((x, idx) => (idx === i ? v : x)))} />
        ))}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" tone="lo">
          {t('score.opponents')}
        </Text>
        {teamB.slice(0, perSide).map((n, i) => (
          <NameInput key={`b${i}`} value={n} onChange={(v) => setTeamB((p) => p.map((x, idx) => (idx === i ? v : x)))} />
        ))}
      </View>

      <Button label={t('setup.start')} size="lg" full onPress={onStart} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.base,
    fontFamily: fontFamily.body,
  },
});
