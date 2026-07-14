import { describe, expect, it } from 'vitest';
import { darkTheme, fontSize, gradients, glow, lightTheme, motion, palette, spacing, themes } from '../src/index.js';

describe('design tokens', () => {
  it('exposes dark, light and high-contrast themes', () => {
    expect(themes.dark).toBe(darkTheme);
    expect(themes.light).toBe(lightTheme);
    expect(themes.highContrast.name).toBe('dark');
  });

  it('themes reference palette values', () => {
    expect(darkTheme.brand).toBe(palette.brand500);
  });

  it('spacing scale is monotonically increasing', () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });

  it('the hero score is the largest size in the ramp', () => {
    expect(fontSize.scoreHero).toBe(Math.max(...Object.values(fontSize)));
  });

  it('all palette values are hex colours', () => {
    for (const v of Object.values(palette)) expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('gradients have at least two stops', () => {
    for (const stops of Object.values(gradients)) expect(stops.length).toBeGreaterThanOrEqual(2);
  });

  it('glow presets carry a shadow radius', () => {
    expect(glow.brand.shadowRadius).toBeGreaterThan(0);
    expect(glow.gold.shadowRadius).toBeGreaterThan(0);
  });

  it('spring presets are well-formed', () => {
    for (const s of [motion.springGentle, motion.springBouncy, motion.springStiff]) {
      expect(s.damping).toBeGreaterThan(0);
      expect(s.stiffness).toBeGreaterThan(0);
    }
  });
});
