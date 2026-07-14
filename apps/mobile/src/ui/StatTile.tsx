import { View } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { Card } from './Card';
import { Text } from './Text';

/** A stat tile: a big tabular value over an uppercase label. The KPI unit used
 * across the stats grid and match summary. */
export function StatTile({
  value,
  label,
  tone = 'hi',
  accent,
}: {
  value: string;
  label: string;
  tone?: 'hi' | 'brand' | 'gold' | 'accent';
  accent?: React.ReactNode;
}) {
  return (
    <Card style={{ flexBasis: '30%', flexGrow: 1, minWidth: 96 }}>
      <View style={{ gap: spacing.xs }}>
        {accent}
        <Text variant="title" tone={tone} tabular numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="caption" tone="mid">
          {label}
        </Text>
      </View>
    </Card>
  );
}
