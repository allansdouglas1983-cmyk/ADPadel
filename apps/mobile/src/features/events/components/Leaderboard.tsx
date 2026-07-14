import { View } from 'react-native';
import type { Standing } from '@padel/formats';
import { spacing } from '@padel/design-tokens';
import { Card, Text } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  standings: readonly Standing[];
  nameOf: (id: string) => string;
}

/** Live event leaderboard — ranked with point-diff → total → head-to-head. The
 * top three are subtly highlighted. */
export function Leaderboard({ standings, nameOf }: Props) {
  const theme = useTheme();
  return (
    <Card padded={false}>
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text variant="caption" tone="lo" style={{ width: 28 }}>
          #
        </Text>
        <Text variant="caption" tone="lo" style={{ flex: 1 }}>
          Player
        </Text>
        <Text variant="caption" tone="lo" style={{ width: 56, textAlign: 'right' }}>
          Pts
        </Text>
        <Text variant="caption" tone="lo" style={{ width: 56, textAlign: 'right' }}>
          +/–
        </Text>
      </View>
      {standings.map((s, i) => {
        const diff = s.pointsFor - s.pointsAgainst;
        const medal = i < 3;
        return (
          <View
            key={s.playerId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          >
            <Text variant="bodyStrong" tone={medal ? 'gold' : 'mid'} tabular style={{ width: 28 }}>
              {i + 1}
            </Text>
            <Text variant="bodyStrong" tone="hi" numberOfLines={1} style={{ flex: 1 }}>
              {nameOf(s.playerId)}
            </Text>
            <Text variant="bodyStrong" tone="hi" tabular style={{ width: 56, textAlign: 'right' }}>
              {s.pointsFor}
            </Text>
            <Text variant="bodyStrong" tone={diff >= 0 ? 'win' : 'loss'} tabular style={{ width: 56, textAlign: 'right' }}>
              {diff >= 0 ? '+' : ''}
              {diff}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}
