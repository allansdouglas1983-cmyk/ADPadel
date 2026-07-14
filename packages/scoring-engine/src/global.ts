/**
 * Global entry for embedding the REAL engine in a host that runs JavaScript
 * (e.g. watchOS via JavaScriptCore). Bundling this exposes `globalThis.Marque`
 * so native code gets byte-identical scoring with zero port drift.
 *
 * Build: pnpm --filter @padel/scoring-engine bundle
 */
import {
  applyAction,
  foldLog,
  initialState,
  newSnapshot,
  reduce,
} from './engine.js';
import { summarizeMatch } from './summary.js';
import { currentPointLabels } from './display.js';
import { padelPresets } from './presets/padel.js';

const Marque = {
  initialState,
  reduce,
  foldLog,
  applyAction,
  newSnapshot,
  summarizeMatch,
  currentPointLabels,
  padelPresets,
  /** Convenience for a JS host: fold a snapshot JSON string → state JSON string. */
  foldJson(snapshotJson: string, cfgJson: string): string {
    return JSON.stringify(foldLog(JSON.parse(snapshotJson), JSON.parse(cfgJson)));
  },
  /** Reduce one action given state+action+config as JSON strings. */
  reduceJson(stateJson: string, actionJson: string, cfgJson: string): string {
    return JSON.stringify(reduce(JSON.parse(stateJson), JSON.parse(actionJson), JSON.parse(cfgJson)));
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Marque = Marque;

export default Marque;
