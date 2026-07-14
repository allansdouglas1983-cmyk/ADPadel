import Foundation

/// A compact, standalone scoring model for watchOS that mirrors the TypeScript
/// engine's semantics (RN/JS cannot run on the watch). It is deliberately a
/// faithful port of the SAME rules — golden-point games, tiebreak-set padel —
/// so the watch and phone never disagree. State persists locally so a lost
/// phone connection never loses the score.
///
/// The canonical, exhaustively-tested source of truth remains
/// `packages/scoring-engine`; this file must be kept in lockstep with it (see
/// docs/WATCH-ARCHITECTURE.md).
struct MatchState: Codable, Equatable {
    var pointsA: Int = 0
    var pointsB: Int = 0
    var gamesA: Int = 0
    var gamesB: Int = 0
    var setsA: Int = 0
    var setsB: Int = 0
    var complete: Bool = false
    var winner: Int? = nil
    /// Append-only log of scored sides for perfect undo (mirrors the engine).
    var log: [Int] = []
}

enum DeuceMode: String, Codable { case golden, advantage }

struct ScoreEngine {
    var deuce: DeuceMode = .golden
    let gamesToWin = 6
    let setsToWin = 2

    /// Award a point to `side` (0 or 1) and return the new state.
    func pointTo(_ side: Int, _ state: MatchState) -> MatchState {
        guard !state.complete else { return state }
        var s = state
        s.log.append(side)
        if side == 0 { s.pointsA += 1 } else { s.pointsB += 1 }
        resolveGame(&s)
        return s
    }

    /// Undo the last point by replaying the log from zero (deterministic).
    func undo(_ state: MatchState) -> MatchState {
        guard !state.log.isEmpty else { return state }
        var replay = MatchState()
        let log = Array(state.log.dropLast())
        for side in log { replay = pointToRaw(side, replay) }
        replay.log = log
        return replay
    }

    private func pointToRaw(_ side: Int, _ state: MatchState) -> MatchState {
        var s = state
        if side == 0 { s.pointsA += 1 } else { s.pointsB += 1 }
        resolveGame(&s)
        return s
    }

    private func resolveGame(_ s: inout MatchState) {
        let hi = max(s.pointsA, s.pointsB)
        let lo = min(s.pointsA, s.pointsB)
        let leader = s.pointsA > s.pointsB ? 0 : 1
        let decider = deuce == .golden ? 3 : Int.max
        let won: Bool
        if lo >= decider {
            won = (hi - lo) >= 1
        } else {
            won = hi >= 4 && (hi - lo) >= 2
        }
        if won { closeGame(leader, &s) }
    }

    private func closeGame(_ winner: Int, _ s: inout MatchState) {
        s.pointsA = 0; s.pointsB = 0
        if winner == 0 { s.gamesA += 1 } else { s.gamesB += 1 }
        let gHi = max(s.gamesA, s.gamesB), gLo = min(s.gamesA, s.gamesB)
        if gHi >= gamesToWin && (gHi - gLo) >= 2 {
            s.gamesA = 0; s.gamesB = 0
            if winner == 0 { s.setsA += 1 } else { s.setsB += 1 }
            if max(s.setsA, s.setsB) >= setsToWin {
                s.complete = true
                s.winner = winner
            }
        }
    }
}
