/**
 * The current player's id. On a signed-out device this is a stable local
 * "self" player created at first launch; once claimed it maps to the user.
 */
export function useCurrentPlayerId(): string {
  return 'self';
}
