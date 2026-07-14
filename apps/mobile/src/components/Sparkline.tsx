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

  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
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
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {form.slice(0, 10).map((r, i) => (
        <View
          key={i}
          style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r === 'W' ? theme.win : theme.loss }}
        />
      ))}
    </View>
  );
}
