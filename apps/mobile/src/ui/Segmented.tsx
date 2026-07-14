import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { haptics } from './haptics';

interface Option<T extends string> {
  value: T;
  label: string;
}

/** An animated segmented control — the selection pill springs between options.
 * The premium replacement for rows of bordered chips. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = width / Math.max(1, options.length);
  const x = useSharedValue(0);
  x.value = withSpring(index * seg, motion.springGentle);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: seg }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={[styles.track, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {width > 0 && <Animated.View style={[styles.pill, pill, { backgroundColor: theme.surfaceRaised }]} />}
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => {
            haptics.select();
            onChange(o.value);
          }}
          style={styles.item}
        >
          <Text variant="label" tone={o.value === value ? 'brand' : 'mid'} style={{ textTransform: 'none' }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radii.pill, borderWidth: 1, padding: 4, position: 'relative' },
  pill: { position: 'absolute', top: 4, bottom: 4, borderRadius: radii.pill },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, zIndex: 1 },
});
