import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');

/**
 * The strategic moat: the core reducer must be sport-agnostic. All padel
 * numbers/names live ONLY in presets/. If this guard fails, a sport-specific
 * literal has leaked into the engine — move it into a RuleSetConfig instead.
 */
const CORE_FILES = [
  'engine.ts',
  'rules/points.ts',
  'rules/games.ts',
  'rules/tiebreak.ts',
  'rules/serve.ts',
];

describe('sport-agnosticism guard', () => {
  for (const rel of CORE_FILES) {
    it(`${rel} contains no sport name or point-ladder literals`, () => {
      let source: string;
      try {
        source = readFileSync(join(srcDir, rel), 'utf8');
      } catch {
        return; // file may not exist (games logic lives inline in engine.ts)
      }
      // No sport names.
      expect(source).not.toMatch(/\bpadel\b/i);
      expect(source).not.toMatch(/\btennis\b/i);
      expect(source).not.toMatch(/\bpickleball\b/i);
      // No tennis/padel point-ladder string literals.
      expect(source).not.toMatch(/['"](?:15|30|40)['"]/);
    });
  }
});
