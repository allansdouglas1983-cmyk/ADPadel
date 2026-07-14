import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { fontFamily, fontSize, letterSpacing, lineHeight } from '@padel/design-tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'score' | 'scoreHero';
type Tone = 'hi' | 'mid' | 'lo' | 'brand' | 'gold' | 'accent' | 'win' | 'loss' | 'onBrand';

const VARIANT: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamily.display, fontSize: fontSize.display, lineHeight: fontSize.display + 4, letterSpacing: letterSpacing.tight },
  title: { fontFamily: fontFamily.display, fontSize: fontSize.xxl, lineHeight: lineHeight.xxl, letterSpacing: letterSpacing.tight },
  heading: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.lg, lineHeight: lineHeight.lg },
  body: { fontFamily: fontFamily.body, fontSize: fontSize.base, lineHeight: lineHeight.base },
  bodyStrong: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.base, lineHeight: lineHeight.base },
  label: { fontFamily: fontFamily.bodySemibold, fontSize: fontSize.sm, lineHeight: lineHeight.sm, letterSpacing: letterSpacing.wide, textTransform: 'uppercase' },
  caption: { fontFamily: fontFamily.body, fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  score: { fontFamily: fontFamily.display, fontSize: fontSize.score, fontVariant: ['tabular-nums'], letterSpacing: letterSpacing.tight },
  scoreHero: { fontFamily: fontFamily.display, fontSize: fontSize.scoreHero, fontVariant: ['tabular-nums'], letterSpacing: letterSpacing.tight },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  /** Tabular figures for any variant (scores default to tabular already). */
  tabular?: boolean;
}

/**
 * The single typographic primitive. Every piece of text in the app flows through
 * here, so type, rhythm and colour stay consistent and re-theme automatically.
 */
export function Text({ variant = 'body', tone = 'hi', tabular, style, ...rest }: TextProps) {
  const theme = useTheme();
  const color: Record<Tone, string> = {
    hi: theme.textHi,
    mid: theme.textMid,
    lo: theme.textLo,
    brand: theme.brand,
    gold: theme.gold,
    accent: theme.accent,
    win: theme.win,
    loss: theme.loss,
    onBrand: '#04150E',
  };
  return (
    <RNText
      {...rest}
      style={[VARIANT[variant], { color: color[tone] }, tabular ? { fontVariant: ['tabular-nums'] } : null, style]}
    />
  );
}
