import type { MatchState, RuleSetConfig } from '@padel/scoring-engine';
import type { TFunction } from 'i18next';

/**
 * A human status line for the scoreboard — Deuce / Golden point / Star point /
 * Tie-break / Super tie-break / Match point — derived purely from engine state.
 * Presentational only; never affects scoring.
 */
export function statusLabel(state: MatchState, cfg: RuleSetConfig, t: TFunction): string | null {
  const set = state.sets[state.currentSetIndex];
  if (set?.isTiebreak) {
    return set.kind === 'final' && cfg.match.finalSet.kind === 'superTiebreak'
      ? t('score.superTiebreak')
      : t('score.tiebreak');
  }

  const [a, b] = state.currentGame.points;
  const w = cfg.point.winAtIndex;
  const atDeuce = a >= w - 1 && b >= w - 1 && a === b;
  if (atDeuce) {
    if (cfg.point.deuce === 'golden') return t('score.goldenPoint');
    if (cfg.point.deuce === 'star') return t('score.starPoint');
    return t('score.deuce');
  }

  // Match point: the leader needs one more set and is a point from the game/set.
  const needed = Math.ceil(cfg.match.bestOf / 2);
  const leadSide = state.setsWon[0] > state.setsWon[1] ? 0 : 1;
  const onSetPoint = Math.max(a, b) >= w - 1 && Math.abs(a - b) >= 1;
  if (state.setsWon[leadSide] === needed - 1 && onSetPoint) return t('score.matchPoint');

  return null;
}
