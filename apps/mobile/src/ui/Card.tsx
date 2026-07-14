import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass, glow, radii, spacing, type GlowName } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: ReactNode;
  variant?: 'surface' | 'glass';
  glowColor?: GlowName;
  padded?: boolean;
  style?: ViewStyle;
}

/** A premium content container — solid surface or frosted glass, with optional
 * coloured glow. The workhorse card for stats, lists and sheets. */
export function Card({ children, variant = 'surface', glowColor = 'none', padded = true, style }: Props) {
  const theme = useTheme();
  const pad = padded ? { padding: spacing.lg } : null;
  const glowStyle = glow[glowColor];

  if (variant === 'glass') {
    return (
      <View style={[styles.clip, { borderRadius: radii.card, borderColor: glass.border, borderWidth: 1 }, glowStyle, style]}>
        <BlurView intensity={glass.blurAmount} tint="dark" style={[{ backgroundColor: glass.tint }, pad]}>
          {children}
        </BlurView>
      </View>
    );
  }
  return (
    <View
      style={[
        { backgroundColor: theme.surface, borderRadius: radii.card, borderColor: theme.border, borderWidth: 1 },
        pad,
        glowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ clip: { overflow: 'hidden' } });
