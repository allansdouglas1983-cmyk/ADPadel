import type {
  HeadToHead,
  MatchRecord,
  PartnerChemistry,
  PlayerStats,
  VenueBreakdown,
} from './types.js';

type Side = 0 | 1;

function sideOf(record: MatchRecord, playerId: string): Side | null {
  if (record.teamA.includes(playerId)) return 0;
  if (record.teamB.includes(playerId)) return 1;
  return null;
}

function partnerOf(record: MatchRecord, playerId: string, side: Side): string | null {
  const team = side === 0 ? record.teamA : record.teamB;
  return team.find((p) => p !== playerId) ?? null;
}

/** Records involving the player, oldest first. */
function playerMatches(records: readonly MatchRecord[], playerId: string): MatchRecord[] {
  return records
    .filter((r) => sideOf(r, playerId) !== null)
    .slice()
    .sort((a, b) => (a.startedAtIso < b.startedAtIso ? -1 : a.startedAtIso > b.startedAtIso ? 1 : 0));
}

const rate = (num: number, den: number): number => (den === 0 ? 0 : num / den);

export function playerStats(records: readonly MatchRecord[], playerId: string): PlayerStats {
  const matches = playerMatches(records, playerId);
  let wins = 0;
  let gamesWon = 0;
  let gamesLost = 0;
  let setsWon = 0;
  let setsLost = 0;
  let ptsWon = 0;
  let ptsTotal = 0;
  let svcWon = 0;
  let svcPlayed = 0;
  let decWon = 0;
  let decPlayed = 0;
  let comebacks = 0;
  const outcomes: ('W' | 'L')[] = [];

  for (const r of matches) {
    const side = sideOf(r, playerId)!;
    const other = side === 0 ? 1 : 0;
    const won = r.winner === side;
    if (won) wins += 1;
    outcomes.push(won ? 'W' : 'L');
    gamesWon += r.gamesWon[side];
    gamesLost += r.gamesWon[other];
    if (r.setsWon) {
      setsWon += r.setsWon[side];
      setsLost += r.setsWon[other];
    }
    if (r.pointsWon) {
      ptsWon += r.pointsWon[side];
      ptsTotal += r.pointsWon[0] + r.pointsWon[1];
    }
    if (r.serviceWon?.[playerId]) {
      svcWon += r.serviceWon[playerId]![0];
      svcPlayed += r.serviceWon[playerId]![1];
    }
    if (r.deciderWon?.[playerId]) {
      decWon += r.deciderWon[playerId]![0];
      decPlayed += r.deciderWon[playerId]![1];
    }
    if (won && r.wasComeback) comebacks += 1;
  }

  // Current streak: trailing run of identical outcomes (most recent match back).
  let currentStreak = 0;
  for (let i = outcomes.length - 1; i >= 0; i--) {
    const isWin = outcomes[i] === 'W';
    if (i === outcomes.length - 1) {
      currentStreak = isWin ? 1 : -1;
    } else if ((currentStreak > 0) === isWin) {
      currentStreak += isWin ? 1 : -1;
    } else {
      break;
    }
  }

  // Longest win streak.
  let longestWinStreak = 0;
  let run = 0;
  for (const o of outcomes) {
    run = o === 'W' ? run + 1 : 0;
    if (run > longestWinStreak) longestWinStreak = run;
  }

  return {
    playerId,
    matches: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: rate(wins, matches.length),
    currentStreak,
    longestWinStreak,
    gamesWon,
    gamesLost,
    gameWinRate: rate(gamesWon, gamesWon + gamesLost),
    setsWon,
    setsLost,
    setWinRate: rate(setsWon, setsWon + setsLost),
    pointsWinRate: ptsTotal > 0 ? rate(ptsWon, ptsTotal) : null,
    serviceHoldRate: svcPlayed > 0 ? rate(svcWon, svcPlayed) : null,
    deciderWinRate: decPlayed > 0 ? rate(decWon, decPlayed) : null,
    comebacks,
    form: outcomes.slice().reverse(),
  };
}

export function partnerChemistry(records: readonly MatchRecord[], playerId: string): PartnerChemistry[] {
  const byPartner = new Map<string, { matches: number; wins: number }>();
  for (const r of playerMatches(records, playerId)) {
    const side = sideOf(r, playerId)!;
    const partner = partnerOf(r, playerId, side);
    if (!partner) continue;
    const cur = byPartner.get(partner) ?? { matches: 0, wins: 0 };
    cur.matches += 1;
    if (r.winner === side) cur.wins += 1;
    byPartner.set(partner, cur);
  }
  return [...byPartner.entries()]
    .map(([partnerId, v]) => ({ partnerId, matches: v.matches, wins: v.wins, winRate: rate(v.wins, v.matches) }))
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches);
}

export function headToHead(records: readonly MatchRecord[], playerId: string): HeadToHead[] {
  const byOpp = new Map<string, { matches: number; wins: number }>();
  for (const r of playerMatches(records, playerId)) {
    const side = sideOf(r, playerId)!;
    const opponents = side === 0 ? r.teamB : r.teamA;
    const won = r.winner === side;
    for (const opp of opponents) {
      const cur = byOpp.get(opp) ?? { matches: 0, wins: 0 };
      cur.matches += 1;
      if (won) cur.wins += 1;
      byOpp.set(opp, cur);
    }
  }
  return [...byOpp.entries()]
    .map(([opponentId, v]) => ({
      opponentId,
      matches: v.matches,
      wins: v.wins,
      losses: v.matches - v.wins,
      winRate: rate(v.wins, v.matches),
    }))
    .sort((a, b) => b.matches - a.matches);
}

export function venueBreakdown(records: readonly MatchRecord[], playerId: string): VenueBreakdown[] {
  const byVenue = new Map<string, { matches: number; wins: number }>();
  for (const r of playerMatches(records, playerId)) {
    if (!r.venue) continue;
    const side = sideOf(r, playerId)!;
    const cur = byVenue.get(r.venue) ?? { matches: 0, wins: 0 };
    cur.matches += 1;
    if (r.winner === side) cur.wins += 1;
    byVenue.set(r.venue, cur);
  }
  return [...byVenue.entries()]
    .map(([venue, v]) => ({ venue, matches: v.matches, wins: v.wins, winRate: rate(v.wins, v.matches) }))
    .sort((a, b) => b.matches - a.matches);
}
