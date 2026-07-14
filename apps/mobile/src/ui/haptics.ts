import * as Haptics from 'expo-haptics';

/**
 * Centralised haptics so touch feedback is consistent and intentional across the
 * app — light for taps, medium for scoring, success/warning for outcomes.
 */
export const haptics = {
  tap: () => void Haptics.impactAsync(Haptics.ImpactFeedbackType.Light),
  press: () => void Haptics.impactAsync(Haptics.ImpactFeedbackType.Medium),
  select: () => void Haptics.selectionAsync(),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
