import { View } from 'react-native';
import type { CourtProgress, Side } from '@padel/formats';
import { courtIsComplete } from '@padel/formats';
import { spacing } from '@padel/design-tokens';
import { Card, IconButton, Text } from '@/ui';

interface Props {
  court: CourtProgress;
  pointsPerMatch: number;
  nameOf: (id: string) => string;
  onPoint: (side: Side) => void;
  onUndo: (side: Side) => void;
}

/** One court's live score entry — a premium Card with an animated score and
 * +/- IconButtons. All scoring rules live in the pure EventSession. */
export function CourtCard({ court, pointsPerMatch, nameOf, onPoint, onUndo }: Props) {
  const complete = courtIsComplete(court, pointsPerMatch);

  const TeamRow = ({ side, names, points }: { side: Side; names: string; points: number }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="bodyStrong" tone="hi" numberOfLines={1} style={{ flex: 1 }}>
        {names}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <IconButton accessibilityLabel={`Remove point from ${names}`} onPress={() => onUndo(side)} size={36}>
          <Text variant="heading" tone="mid">
            –
          </Text>
        </IconButton>
        <Text variant="title" tone={side === 0 ? 'hi' : 'brand'} tabular style={{ minWidth: 44, textAlign: 'center' }}>
          {points}
        </Text>
        <IconButton accessibilityLabel={`Add point to ${names}`} onPress={() => onPoint(side)} size={36} filled>
          <Text variant="heading" tone={complete ? 'lo' : 'brand'}>
            +
          </Text>
        </IconButton>
      </View>
    </View>
  );

  return (
    <Card glowColor={complete ? 'brand' : 'none'} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label" tone="mid">
          Court {court.court + 1}
        </Text>
        <Text variant="caption" tone="lo" tabular>
          {court.pointsA + court.pointsB}/{pointsPerMatch}
        </Text>
      </View>
      <TeamRow side={0} names={court.teamA.map(nameOf).join(' & ')} points={court.pointsA} />
      <TeamRow side={1} names={court.teamB.map(nameOf).join(' & ')} points={court.pointsB} />
    </Card>
  );
}
