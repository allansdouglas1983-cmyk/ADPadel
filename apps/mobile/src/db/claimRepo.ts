import { eq } from 'drizzle-orm';
import { db } from './client';
import { matches, players, teams } from './schema';
import { markDirty } from '@/sync/syncEngine';
import { getSupabase } from '@/sync/supabase';

/**
 * The claim-your-profile loop (dossier §3.4) — the core viral mechanic. A guest
 * added by a host is re-parented to the claiming user: locally we flag the
 * player as claimed (so their whole history becomes the user's), mark it dirty,
 * and call the server `claim_guest` RPC to re-parent the synced rows too.
 */
export async function claimGuestProfile(playerId: string, userId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  db.update(players)
    .set({ claimedUserId: userId, isGuest: false, updatedAt: now })
    .where(eq(players.id, playerId))
    .run();
  markDirty('players', playerId);

  const supabase = getSupabase();
  if (supabase) {
    await supabase.rpc('claim_guest', { guest_entity_id: playerId });
  }
}

export interface MatchPlayerRef {
  id: string;
  displayName: string;
  claimed: boolean;
}

/** The players in a match (for the shared-card landing page). */
export function matchPlayers(matchId: string): MatchPlayerRef[] {
  const teamRows = db.select().from(teams).where(eq(teams.matchId, matchId)).all();
  const ids = teamRows.flatMap((t) => JSON.parse(t.playerIdsJson) as string[]);
  return ids.map((id) => {
    const p = db.select().from(players).where(eq(players.id, id)).get();
    return { id, displayName: p?.displayName ?? id, claimed: Boolean(p?.claimedUserId) };
  });
}

/** Whether a match exists locally (deep-linked cards may reference remote ones). */
export function matchExists(matchId: string): boolean {
  return Boolean(db.select({ id: matches.id }).from(matches).where(eq(matches.id, matchId)).get());
}
