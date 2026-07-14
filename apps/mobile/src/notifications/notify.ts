import * as Notifications from 'expo-notifications';
import { getSetting } from '@/db/settingsRepo';

/**
 * Thoughtful, local-first notifications (dossier §3.10) — post-match share
 * nudge, milestone unlocks, "your Wrapped is ready", and an optional recurring
 * court-slot reminder. All scheduled on-device; never spammy, and gated by the
 * user's notifications preference.
 */
function enabled(): boolean {
  return getSetting('notifications', 'true') === 'true';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function fire(title: string, body: string, secondsFromNow = 1): Promise<void> {
  if (!enabled()) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: secondsFromNow <= 0 ? null : { seconds: secondsFromNow, channelId: 'default' },
  });
}

/** After a match: nudge to share the card (the viral loop). */
export const notifyShareCard = () => fire('Great match! 🎾', 'Share your match card with the club.', 2);

/** A milestone unlocked (streak, rating tier, etc.). */
export const notifyMilestone = (text: string) => fire('Milestone unlocked', text, 1);

/** The season Wrapped is ready to view. */
export const notifyWrappedReady = () => fire('Your Season Wrapped is ready', 'Tap to relive your year on court.', 1);

/**
 * A weekly reminder for a regular court slot (e.g. Tuesday 7pm). weekday: 1=Sun.
 */
export async function scheduleSlotReminder(weekday: number, hour: number, minute = 0): Promise<void> {
  if (!enabled()) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Padel time', body: 'Your regular slot is coming up — log your match in Marque.' },
    trigger: { weekday, hour, minute, repeats: true },
  });
}
