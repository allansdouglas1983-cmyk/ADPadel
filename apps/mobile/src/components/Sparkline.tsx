import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A tiny dependency-free sparkline for the rating journey / form trend. Renders
 * normalized bars whose height maps each value into the row — glanceable, and it
 * re-themes from design tokens.
 */
export function Sparkline({ values, height = 40, color }: { values: number[]; height?: number; color?: string }) {
  const theme = useTheme();
  if (values.length < 2) return <View style={{ height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const trend = last > first ? 'up' : last < first ? 'down' : 'flat';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Trend ${trend}, from ${Math.round(first)} to ${Math.round(last)}`}
      style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}
    >
      {values.map((v, i) => {
        const h = 4 + ((v - min) / span) * (height - 4);
        return (
          <View
            key={i}
            style={{ flex: 1, height: h, backgroundColor: color ?? theme.brand, borderRadius: 2, opacity: 0.5 + (0.5 * i) / values.length }}
          />
        );
      })}
    </View>
  );
}

/** Recent-first W/L dots for the form indicator. */
export function FormDots({ form }: { form: readonly ('W' | 'L')[] }) {
  const theme = useTheme();
  const recent = form.slice(0, 10);
  const wins = recent.filter((r) => r === 'W').length;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Recent form: ${wins} wins of the last ${recent.length}`}
      style={{ flexDirection: 'row', gap: 4 }}
    >
      {recent.map((r, i) => (
        <View
          key={i}
          style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r === 'W' ? theme.win : theme.loss }}
        />
      ))}
    </View>
  );
}
