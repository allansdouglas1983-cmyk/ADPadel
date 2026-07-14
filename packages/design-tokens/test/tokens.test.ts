import { describe, expect, it } from 'vitest';
import { darkTheme, fontSize, lightTheme, palette, spacing, themes } from '../src/index.js';

describe('design tokens', () => {
  it('exposes a dark and a light theme', () => {
    expect(themes.dark).toBe(darkTheme);
    expect(themes.light).toBe(lightTheme);
    expect(darkTheme.name).toBe('dark');
    expect(lightTheme.name).toBe('light');
  });

  it('themes reference palette values', () => {
    expect(darkTheme.brand).toBe(palette.brand500);
  });

  it('spacing scale is monotonically increasing', () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });

  it('the score font size is the largest in the scale', () => {
    expect(fontSize.score).toBe(Math.max(...Object.values(fontSize)));
  });

  it('all palette values are hex colours', () => {
    for (const v of Object.values(palette)) expect(v).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
