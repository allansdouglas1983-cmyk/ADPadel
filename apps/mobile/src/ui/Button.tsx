import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { glow, gradients, motion, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { haptics } from './haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const HEIGHT: Record<Size, number> = { sm: 40, md: 52, lg: 60 };

/**
 * The primary action primitive: a gradient-filled button with a coloured glow, a
 * springy press animation and haptics. Secondary/ghost/danger variants keep one
 * consistent shape. Everything is token-driven so it re-themes automatically.
 */
export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading, full, icon, style }: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const gradient = variant === 'gold' ? gradients.gold : gradients.brand;
  const isFilled = variant === 'primary' || variant === 'gold' || variant === 'danger';
  const tone = isFilled ? 'onBrand' : variant === 'secondary' ? 'hi' : 'brand';

  const press = () => {
    if (disabled || loading) return;
    haptics.press();
    onPress();
  };

  const inner = (
    <View style={[styles.content, { height: HEIGHT[size], paddingHorizontal: size === 'sm' ? spacing.lg : spacing.xl }]}>
      {loading ? (
        <ActivityIndicator color={isFilled ? '#04150E' : theme.brand} />
      ) : (
        <>
          {icon}
          <Text variant={size === 'lg' ? 'heading' : 'bodyStrong'} tone={tone}>
            {label}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[animated, full && { alignSelf: 'stretch' }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled || loading}
        onPressIn={() => (scale.value = withSpring(0.96, motion.springStiff))}
        onPressOut={() => (scale.value = withSpring(1, motion.springStiff))}
        onPress={press}
        style={{ opacity: disabled ? 0.45 : 1 }}
      >
        {variant === 'danger' ? (
          <View style={[styles.solid, { backgroundColor: theme.loss, borderRadius: radii.card }]}>{inner}</View>
        ) : isFilled ? (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.solid, glow.brand, { borderRadius: radii.card }]}>
            {inner}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.solid,
              {
                borderRadius: radii.card,
                backgroundColor: variant === 'secondary' ? theme.surfaceRaised : 'transparent',
                borderWidth: variant === 'ghost' ? 1.5 : 0,
                borderColor: theme.border,
              },
            ]}
          >
            {inner}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  solid: { overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
