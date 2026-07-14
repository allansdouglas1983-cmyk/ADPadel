import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Wraps Pro-gated content. When unlocked, renders children; otherwise shows a
 * tasteful upsell that routes to the paywall. NEVER wrap scoring or the share
 * card in this — those are always free.
 */
export function ProLock({ unlocked, children }: { unlocked: boolean; children: React.ReactNode }) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (unlocked) return <>{children}</>;
  return (
    <View>
      <View style={{ opacity: 0.4 }} pointerEvents="none">
        {children}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/paywall')}
        style={[styles.cta, { backgroundColor: theme.surfaceRaised, borderColor: theme.gold }]}
      >
        <Text style={[styles.ctaText, { color: theme.gold }]}>{t('paywall.title')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.control, borderWidth: 1, alignItems: 'center' },
  ctaText: { fontSize: fontSize.base, fontWeight: '700' },
});
