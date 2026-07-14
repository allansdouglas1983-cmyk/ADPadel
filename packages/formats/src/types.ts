/** A pairing on a single court for one round: two teams of player indices. */
export interface CourtPairing {
  readonly court: number;
  readonly teamA: readonly string[];
  readonly teamB: readonly string[];
}

export interface Round {
  readonly index: number;
  readonly courts: readonly CourtPairing[];
  /** Players resting this round (fairly rotated). */
  readonly sittingOut: readonly string[];
}

/** Result of one court after play: points banked by each team. */
export interface CourtResult {
  readonly court: number;
  readonly pointsA: number;
  readonly pointsB: number;
}

/** A player's cumulative standing across an event. */
export interface Standing {
  readonly playerId: string;
  readonly pointsFor: number;
  readonly pointsAgainst: number;
  readonly played: number;
  readonly wins: number;
}

export interface EventConfig {
  /** Points contested per match (e.g. 16 / 24 / 32). */
  readonly pointsPerMatch: number;
  readonly courts: number;
}
