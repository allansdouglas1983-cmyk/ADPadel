import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { Button, NameInput, Screen, Segmented, Stepper, Text } from '@/ui';
import { createGuestPlayer } from '@/db/playerRepo';
import { useKingStore } from '@/features/king/kingStore';

/** Create a King of the Court night: players pair up in twos; winners stay on. */
export default function KingSetupScreen() {
  const createKing = useKingStore((s) => s.create);
  const [names, setNames] = useState<string[]>(['', '', '', '', '', '']);
  const [courts, setCourts] = useState(1);
  const [pointsPerMatch, setPointsPerMatch] = useState(16);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const canStart = filled.length >= 4 && filled.length % 2 === 0;

  const start = () => {
    const ids = filled.map((n) => createGuestPlayer(n));
    const pairs: [string, string][] = [];
    for (let i = 0; i + 1 < ids.length; i += 2) pairs.push([ids[i]!, ids[i + 1]!]);
    const id = createKing(pairs, courts, pointsPerMatch);
    router.replace(`/king/${id}`);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Screen scroll>
        <Text variant="title" tone="hi">
          King of the Court
        </Text>
        <Text variant="body" tone="mid">
          Players pair up in twos. Winners stay on, losers rotate to the queue.
        </Text>

        {names.map((name, i) => (
          <NameInput
            key={i}
            value={name}
            onChangeText={(v) => setNames((p) => p.map((x, idx) => (idx === i ? v : x)))}
            placeholder={`Player ${i + 1}`}
          />
        ))}
        <Text variant="label" tone="brand" onPress={() => setNames((p) => [...p, '', ''])}>
          + Add pair
        </Text>

        <Stepper label="Courts" value={courts} min={1} max={Math.max(1, Math.floor(filled.length / 4)) || 1} onChange={setCourts} />

        <Text variant="label" tone="lo">
          Points per match
        </Text>
        <Segmented
          options={[11, 16, 21].map((p) => ({ value: String(p), label: String(p) }))}
          value={String(pointsPerMatch)}
          onChange={(v) => setPointsPerMatch(Number(v))}
        />

        <Button label="Start" size="lg" full disabled={!canStart} onPress={start} style={{ marginTop: spacing.md }} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
