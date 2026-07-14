import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing } from '@padel/design-tokens';
import { Sparkles, Text } from '@/ui';
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
      <View style={{ opacity: 0.4 }} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        {children}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('paywall.title')} — unlock with Marque Pro`}
        onPress={() => router.push('/paywall')}
        style={[styles.cta, { backgroundColor: theme.surfaceRaised, borderColor: theme.gold }]}
      >
        <Sparkles size={18} color={theme.gold} />
        <Text variant="bodyStrong" tone="gold">
          {t('paywall.title')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
