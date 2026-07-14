import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Purchases from 'react-native-purchases';
import { useTranslation } from 'react-i18next';
import { gradients, radii, spacing } from '@padel/design-tokens';
import { BarChart3, Button, Card, Screen, Sparkles, Text, Trophy } from '@/ui';
import { PRODUCTS } from '@/paywall/config';
import { useTheme } from '@/theme/ThemeProvider';

const FEATURES = [
  { icon: BarChart3, text: 'Advanced stats — partner chemistry, head-to-head, form & shot analytics' },
  { icon: Trophy, text: 'Unlimited match history & your full rating journey' },
  { icon: Sparkles, text: 'Season Wrapped export, premium & holographic card themes' },
];

/** Pro paywall. A persuasive premium surface — gradient hero, feature list, and
 * plan cards with the annual highlighted. Triggered from Pro-gated surfaces,
 * never from scoring or the share card (those stay free forever). */
export default function PaywallScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<'annual' | 'monthly'>('annual');

  const purchase = async () => {
    const productId = plan === 'annual' ? PRODUCTS.annual.id : PRODUCTS.monthly.id;
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
      if (pkg) await Purchases.purchasePackage(pkg);
      router.back();
    } catch {
      /* cancelled or store error — stay on the paywall */
    }
  };

  const Plan = ({ id, label, price, sub, highlighted }: { id: 'annual' | 'monthly'; label: string; price: string; sub?: string; highlighted?: boolean }) => (
    <Card
      glowColor={plan === id && highlighted ? 'gold' : 'none'}
      style={{ borderColor: plan === id ? (highlighted ? theme.gold : theme.brand) : theme.border, borderWidth: 1.5 }}
    >
      <View
        accessibilityRole="button"
        onTouchEnd={() => setPlan(id)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <View style={{ gap: 2 }}>
          <Text variant="heading" tone="hi">
            {label}
          </Text>
          {sub && (
            <Text variant="caption" tone="gold">
              {sub}
            </Text>
          )}
        </View>
        <Text variant="title" tone={highlighted ? 'gold' : 'hi'}>
          {price}
        </Text>
      </View>
    </Card>
  );

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <LinearGradient colors={gradients.gold} style={{ width: 72, height: 72, borderRadius: radii.cardLg, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={36} color="#04150E" />
        </LinearGradient>
        <Text variant="display" tone="hi" style={{ textAlign: 'center' }}>
          {t('paywall.title')}
        </Text>
        <Text variant="body" tone="mid" style={{ textAlign: 'center' }}>
          {t('paywall.unlock')}
        </Text>
      </Animated.View>

      <View style={{ gap: spacing.md, marginVertical: spacing.md }}>
        {FEATURES.map((f, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(100 + i * 70)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <f.icon size={22} color={theme.brand} />
            <Text variant="body" tone="hi" style={{ flex: 1 }}>
              {f.text}
            </Text>
          </Animated.View>
        ))}
      </View>

      <Plan id="annual" label={t('paywall.annual')} price={PRODUCTS.annual.priceLabel} sub={`${PRODUCTS.annual.trialDays}-day free trial · best value`} highlighted />
      <Plan id="monthly" label={t('paywall.monthly')} price={PRODUCTS.monthly.priceLabel} />

      <Button label={t('paywall.trial')} size="lg" full variant="gold" onPress={purchase} style={{ marginTop: spacing.md }} />
      <Text
        variant="label"
        tone="lo"
        onPress={() => void Purchases.restorePurchases().then(() => router.back())}
        style={{ textAlign: 'center', marginTop: spacing.md }}
      >
        {t('paywall.restore')}
      </Text>
    </Screen>
  );
}
