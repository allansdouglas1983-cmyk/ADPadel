import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EventFormat, EventSessionConfig } from '@padel/formats';
import { radii, spacing } from '@padel/design-tokens';
import { Button, NameInput, Screen, Segmented, Stepper, Text } from '@/ui';
import { createGuestPlayer } from '@/db/playerRepo';
import { useEventStore } from '@/features/events/eventStore';
import { useTheme } from '@/theme/ThemeProvider';

const POINTS_OPTIONS = [16, 24, 32];
const EVENT_FORMATS: EventFormat[] = ['americano', 'mexicano', 'teamAmericano', 'mixedAmericano'];
const FORMAT_LABEL: Record<EventFormat, string> = {
  americano: 'Americano',
  mexicano: 'Mexicano',
  teamAmericano: 'Team',
  mixedAmericano: 'Mixed',
};

interface PlayerDraft {
  name: string;
  gender: 'm' | 'f';
}

/** Create any event format: name the players, set gender for Mixed, pair for
 * Team. All event logic lives in the pure EventSession. */
export default function EventSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ format?: string }>();
  const initialFormat = (EVENT_FORMATS.includes(params.format as EventFormat) ? params.format : 'americano') as EventFormat;

  const createEvent = useEventStore((s) => s.create);
  const [format, setFormat] = useState<EventFormat>(initialFormat);
  const [players, setPlayers] = useState<PlayerDraft[]>([
    { name: '', gender: 'm' },
    { name: '', gender: 'f' },
    { name: '', gender: 'm' },
    { name: '', gender: 'f' },
  ]);
  const [courts, setCourts] = useState(1);
  const [pointsPerMatch, setPointsPerMatch] = useState(24);
  const [rounds, setRounds] = useState(5);

  const filled = useMemo(() => players.filter((p) => p.name.trim()), [players]);
  const isMixed = format === 'mixedAmericano';
  const isTeam = format === 'teamAmericano';
  const menCount = filled.filter((p) => p.gender === 'm').length;
  const womenCount = filled.filter((p) => p.gender === 'f').length;
  const canStart = filled.length >= 4 && (!isMixed || (menCount >= 2 && womenCount >= 2)) && (!isTeam || filled.length % 2 === 0);

  const setPlayer = (i: number, patch: Partial<PlayerDraft>) =>
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const start = () => {
    const created = filled.map((p) => ({ id: createGuestPlayer(p.name.trim(), p.gender), gender: p.gender }));
    const ids = created.map((c) => c.id);
    let config: EventSessionConfig;
    if (isTeam) {
      const pairs: [string, string][] = [];
      for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i]!, ids[i + 1]!]);
      config = { format, players: ids, pairs, courts, pointsPerMatch, totalRounds: rounds };
    } else if (isMixed) {
      config = {
        format,
        players: ids,
        men: created.filter((c) => c.gender === 'm').map((c) => c.id),
        women: created.filter((c) => c.gender === 'f').map((c) => c.id),
        courts,
        pointsPerMatch,
        totalRounds: rounds,
      };
    } else {
      config = { format, players: ids, courts, pointsPerMatch, totalRounds: rounds };
    }
    const id = createEvent(config);
    router.replace(`/event/${id}`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen scroll>
        <Text variant="title" tone="hi">
          {FORMAT_LABEL[format]}
        </Text>
        <Segmented options={EVENT_FORMATS.map((f) => ({ value: f, label: FORMAT_LABEL[f] }))} value={format} onChange={setFormat} />

        <Text variant="label" tone="lo">
          Players ({filled.length}
          {isMixed ? ` · ${menCount}M ${womenCount}F` : ''})
        </Text>
        {players.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <NameInput value={p.name} onChangeText={(v) => setPlayer(i, { name: v })} placeholder={`Player ${i + 1}`} style={{ flex: 1 }} />
            {isMixed && (
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {(['m', 'f'] as const).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setPlayer(i, { gender: g })}
                    style={{ width: 40, height: 40, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderColor: p.gender === g ? theme.brand : theme.border }}
                  >
                    <Text variant="bodyStrong" tone={p.gender === g ? 'brand' : 'lo'}>
                      {g.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
        <Text variant="label" tone="brand" onPress={() => setPlayers((p) => [...p, { name: '', gender: p.length % 2 === 0 ? 'm' : 'f' }])}>
          + Add player
        </Text>

        <Stepper label="Courts" value={courts} min={1} max={Math.max(1, Math.floor(filled.length / 4)) || 1} onChange={setCourts} />
        <Stepper label="Rounds" value={rounds} min={1} max={20} onChange={setRounds} />

        <Text variant="label" tone="lo">
          Points per match
        </Text>
        <Segmented
          options={POINTS_OPTIONS.map((p) => ({ value: String(p), label: String(p) }))}
          value={String(pointsPerMatch)}
          onChange={(v) => setPointsPerMatch(Number(v))}
        />

        <Button label={t('setup.start')} size="lg" full disabled={!canStart} onPress={start} style={{ marginTop: spacing.md }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
