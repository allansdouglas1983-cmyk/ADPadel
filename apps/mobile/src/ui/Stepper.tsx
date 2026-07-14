import { View } from 'react-native';
import { spacing } from '@padel/design-tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

/** A labelled numeric stepper (courts, rounds, players) with springy buttons. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="label" tone="lo">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <IconButton accessibilityLabel={`Decrease ${label}`} onPress={() => onChange(Math.max(min, value - 1))} size={40} filled>
          <Text variant="heading" tone="hi">
            –
          </Text>
        </IconButton>
        <Text variant="title" tone="hi" tabular style={{ minWidth: 36, textAlign: 'center' }}>
          {value}
        </Text>
        <IconButton accessibilityLabel={`Increase ${label}`} onPress={() => onChange(Math.min(max, value + 1))} size={40} filled>
          <Text variant="heading" tone="hi">
            +
          </Text>
        </IconButton>
      </View>
    </View>
  );
}
