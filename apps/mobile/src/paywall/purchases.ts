import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

let configured = false;

/**
 * Initialise RevenueCat once, at app start, with the platform API key from
 * `app.config.ts` → `extra`. Without this call `Purchases.getCustomerInfo()` /
 * `getOfferings()` fail, so the whole entitlement/paywall layer is dead.
 *
 * Keys are optional: free users never need RevenueCat, so a missing key is not
 * an error — we simply skip configuration and every entitlement check resolves
 * to "free" (scoring and the shareable card are never gated regardless).
 */
export function configurePurchases(): void {
  if (configured) return;
  const extra = Constants.expoConfig?.extra ?? {};
  const apiKey = (Platform.OS === 'ios' ? extra.revenueCatKeyIos : extra.revenueCatKeyAndroid) as
    | string
    | undefined;
  if (!apiKey) return; // No key configured (e.g. free/local build) — stay offline.

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
}
