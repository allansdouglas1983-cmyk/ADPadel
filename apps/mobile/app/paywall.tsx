import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { fontSize, radii, spacing } from '@padel/design-tokens';
import { PRODUCTS } from '@/paywall/config';
import { useTheme } from '@/theme/ThemeProvider';

/** Pro paywall. Annual (£9.99) is the highlighted default; monthly (£1.99) is
 * secondary. Triggered from Pro-gated surfaces — never from scoring. */
export default function PaywallScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const purchase = async (productId: string) => {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === productId);
      if (pkg) await Purchases.purchasePackage(pkg);
      router.back();
    } catch {
      /* user cancelled or store error — stay on the paywall */
    }
  };

  const Plan = ({ productId, label, price, highlighted }: { productId: string; label: string; price: string; highlighted?: boolean }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => purchase(productId)}
      style={[styles.plan, { borderColor: highlighted ? theme.gold : theme.border, backgroundColor: theme.surface }]}
    >
      <Text style={[styles.planLabel, { color: theme.textHi }]}>{label}</Text>
      <Text style={[styles.planPrice, { color: highlighted ? theme.gold : theme.textMid }]}>{price}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.textHi }]}>{t('paywall.title')}</Text>
      <Text style={[styles.body, { color: theme.textMid }]}>{t('paywall.unlock')}</Text>

      <Plan productId={PRODUCTS.annual.id} label={t('paywall.annual')} price={PRODUCTS.annual.priceLabel} highlighted />
      <Plan productId={PRODUCTS.monthly.id} label={t('paywall.monthly')} price={PRODUCTS.monthly.priceLabel} />

      <Pressable onPress={() => void Purchases.restorePurchases().then(() => router.back())}>
        <Text style={[styles.restore, { color: theme.textLo }]}>{t('paywall.restore')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.display, fontWeight: '700' },
  body: { fontSize: fontSize.base, marginBottom: spacing.lg },
  plan: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.xl, borderRadius: radii.card, borderWidth: 1.5 },
  planLabel: { fontSize: fontSize.lg, fontWeight: '600' },
  planPrice: { fontSize: fontSize.lg, fontWeight: '700' },
  restore: { textAlign: 'center', marginTop: spacing.lg, fontSize: fontSize.sm },
});
