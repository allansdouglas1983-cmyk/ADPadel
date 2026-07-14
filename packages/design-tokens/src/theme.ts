import { palette } from './colors.js';

export interface Theme {
  readonly name: 'dark' | 'light';
  readonly bg: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly border: string;
  readonly textHi: string;
  readonly textMid: string;
  readonly textLo: string;
  readonly brand: string;
  readonly accent: string;
  readonly gold: string;
  readonly win: string;
  readonly loss: string;
}

/** Dark is the on-court default (glare + battery). */
export const darkTheme: Theme = {
  name: 'dark',
  bg: palette.bg900,
  surface: palette.surface700,
  surfaceRaised: palette.surface600,
  border: palette.border500,
  textHi: palette.textHi,
  textMid: palette.textMid,
  textLo: palette.textLo,
  brand: palette.brand500,
  accent: palette.accent500,
  gold: palette.gold500,
  win: palette.win,
  loss: palette.loss,
};

export const lightTheme: Theme = {
  name: 'light',
  bg: palette.bg50,
  surface: palette.surface0,
  surfaceRaised: palette.surface0,
  border: '#D8E0E8',
  textHi: palette.textDark,
  textMid: '#4A5761',
  textLo: '#6B7A88',
  brand: palette.brand600,
  accent: palette.accent500,
  gold: palette.gold500,
  win: palette.win,
  loss: palette.loss,
};

export const themes = { dark: darkTheme, light: lightTheme } as const;
