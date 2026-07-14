import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, radii } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { haptics } from './haptics';

/** A circular, springy icon button used for compact actions (undo, close, add). */
export function IconButton({
  onPress,
  children,
  accessibilityLabel,
  size = 44,
  filled,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  size?: number;
  filled?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={anim}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => (scale.value = withSpring(0.9, motion.springStiff))}
        onPressOut={() => (scale.value = withSpring(1, motion.springStiff))}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={{
          width: size,
          height: size,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? theme.surfaceRaised : 'transparent',
          borderWidth: filled ? 0 : 1,
          borderColor: theme.border,
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
