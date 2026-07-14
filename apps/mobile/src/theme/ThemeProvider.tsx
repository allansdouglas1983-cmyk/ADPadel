import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme } from '@padel/design-tokens';
import { useSettings } from '@/store/settingsStore';

const ThemeContext = createContext<Theme>(themes.dark);

/**
 * Provides the active theme. Dark is the on-court default; we honour the OS
 * setting, and a user's high-contrast preference overrides everything (for
 * sunlight glare / low vision). Every component reads colours from here — never
 * raw hex — so applying the final brand palette is a design-tokens-only change.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const { loaded, highContrast, load } = useSettings();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const theme = highContrast ? themes.highContrast : scheme === 'light' ? themes.light : themes.dark;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
