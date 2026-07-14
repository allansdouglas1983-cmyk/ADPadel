import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';
import { ENTITLEMENT_PRO } from '@/paywall/config';

/**
 * RevenueCat entitlement check. Scoring is never gated on this — only depth
 * features (advanced stats, unlimited history, Wrapped export, themes) read it.
 */
export function useEntitlements(): { isPro: boolean; loading: boolean } {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Purchases.getCustomerInfo()
      .then((info) => {
        if (alive) setIsPro(Boolean(info.entitlements.active[ENTITLEMENT_PRO]));
      })
      .catch(() => {
        /* offline / not configured — default to free, never block the user */
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { isPro, loading };
}
