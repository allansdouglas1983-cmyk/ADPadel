import { create } from 'zustand';
import { getSetting, setSetting } from '@/db/settingsRepo';

/**
 * User preferences (high-contrast on-court mode, notifications). Backed by the
 * app_settings table so they persist. Loaded lazily on first read.
 */
interface SettingsStore {
  loaded: boolean;
  highContrast: boolean;
  notifications: boolean;
  load: () => void;
  setHighContrast: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  loaded: false,
  highContrast: false,
  notifications: true,
  load: () => {
    set({
      loaded: true,
      highContrast: getSetting('highContrast', 'false') === 'true',
      notifications: getSetting('notifications', 'true') === 'true',
    });
  },
  setHighContrast: (v) => {
    setSetting('highContrast', String(v));
    set({ highContrast: v });
  },
  setNotifications: (v) => {
    setSetting('notifications', String(v));
    set({ notifications: v });
  },
}));
