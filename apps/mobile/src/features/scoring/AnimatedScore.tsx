import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { motion } from '@padel/design-tokens';
import { Text } from '@/ui';

/**
 * The big point value on the scoreboard. On every change it springs — a quick
 * scale bump + fade — so the score feels alive and the eye tracks each point.
 */
export function AnimatedScore({ value, tone = 'hi' }: { value: string; tone?: 'hi' | 'brand' | 'gold' }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.18, motion.springBouncy), withSpring(1, motion.springGentle));
    opacity.value = withSequence(withTiming(0.5, { duration: 60 }), withTiming(1, { duration: 200 }));
  }, [value]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <Animated.View style={style}>
      <Text variant="scoreHero" tone={tone}>
        {value}
      </Text>
    </Animated.View>
  );
}
