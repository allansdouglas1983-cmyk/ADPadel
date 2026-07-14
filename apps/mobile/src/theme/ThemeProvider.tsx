import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme } from '@padel/design-tokens';

const ThemeContext = createContext<Theme>(themes.dark);

/**
 * Provides the active theme. Dark is the on-court default; we honour the OS
 * setting but fall back to dark. Every component reads colours from here — never
 * raw hex — so applying the final brand palette is a design-tokens-only change.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = scheme === 'light' ? themes.light : themes.dark;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext);
