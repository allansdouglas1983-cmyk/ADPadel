import * as Speech from 'expo-speech';
import type { MatchState, RuleSetConfig } from '@padel/scoring-engine';
import { currentPointLabels } from '@padel/scoring-engine';

/**
 * A stable signature of the visible score. Changes exactly when the score the
 * user sees changes (points within a game, games, or sets), so the announcer
 * speaks once per real change and never on a re-render. Pure.
 */
export function scoreSignature(state: MatchState): string {
  const set = state.sets[state.currentSetIndex];
  const games = set ? `${set.games[0]}-${set.games[1]}` : '0-0';
  const pts = `${state.currentGame.points[0]}-${state.currentGame.points[1]}`;
  return `${state.setsWon[0]}-${state.setsWon[1]}|${games}|${pts}`;
}

/**
 * The spoken utterance for the current score — server's side first, as called on
 * court. Pure (returns the text) so it is trivially testable and locale-agnostic;
 * the two point labels already come localised from the engine's display layer.
 */
export function scoreUtterance(state: MatchState, cfg: RuleSetConfig): string {
  const [a, b] = currentPointLabels(state, cfg);
  const serverFirst = state.server.servingSide === 0;
  return serverFirst ? `${a}, ${b}` : `${b}, ${a}`;
}

/**
 * Speak the current score on device (expo-speech / native TTS, zero COGS).
 * Interrupts any in-flight utterance so rapid points don't stack up.
 */
export function announceScore(state: MatchState, cfg: RuleSetConfig, language: string): void {
  if (state.complete) return;
  Speech.stop();
  Speech.speak(scoreUtterance(state, cfg), { language, rate: 1.0, pitch: 1.0 });
}
