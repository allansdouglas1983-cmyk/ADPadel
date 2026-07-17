import * as Haptics from 'expo-haptics';

/** Fire-and-forget; haptics must NEVER crash the app if the platform errors. */
const safe = (run: () => Promise<unknown>) => {
  try {
    void run().catch(() => {});
  } catch {
    /* ignore — haptics are non-essential feedback */
  }
};

/**
 * Centralised haptics so touch feedback is consistent and intentional across the
 * app — light for taps, medium for scoring, success/warning for outcomes.
 */
export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  select: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
