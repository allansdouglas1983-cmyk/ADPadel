import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients, spacing } from '@padel/design-tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * The app's page container: a subtle full-bleed gradient background, safe-area
 * padding and an optional scroll view. Gives every screen the same premium base.
 */
export function Screen({ children, scroll, padded = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + (padded ? spacing.md : 0),
    paddingBottom: insets.bottom + (padded ? spacing.md : 0),
    paddingHorizontal: padded ? spacing.xl : 0,
  };

  return (
    <LinearGradient colors={gradients.appBg} style={styles.fill}>
      {scroll ? (
        <ScrollView contentContainerStyle={[pad, { gap: spacing.lg }, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, pad, contentStyle]}>{children}</View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
