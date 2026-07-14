package app.marque.wear

import kotlinx.serialization.Serializable

/**
 * Standalone Wear OS scoring model mirroring the TypeScript engine's semantics
 * (RN/JS cannot run on the watch). A faithful port of the SAME padel rules so
 * the watch and phone never disagree. The canonical, exhaustively-tested source
 * is packages/scoring-engine; keep this in lockstep (see WATCH-ARCHITECTURE.md).
 */
@Serializable
data class MatchState(
    var pointsA: Int = 0,
    var pointsB: Int = 0,
    var gamesA: Int = 0,
    var gamesB: Int = 0,
    var setsA: Int = 0,
    var setsB: Int = 0,
    var complete: Boolean = false,
    var winner: Int? = null,
    /** Append-only log of scored sides → perfect undo, mirroring the engine. */
    val log: MutableList<Int> = mutableListOf(),
)

enum class DeuceMode { GOLDEN, ADVANTAGE }

class ScoreEngine(private val deuce: DeuceMode = DeuceMode.GOLDEN) {
    private val gamesToWin = 6
    private val setsToWin = 2

    fun pointTo(side: Int, state: MatchState): MatchState {
        if (state.complete) return state
        val s = state.copy(log = (state.log + side).toMutableList())
        if (side == 0) s.pointsA++ else s.pointsB++
        resolveGame(s)
        return s
    }

    fun undo(state: MatchState): MatchState {
        if (state.log.isEmpty()) return state
        val log = state.log.dropLast(1)
        var replay = MatchState()
        for (side in log) {
            if (side == 0) replay.pointsA++ else replay.pointsB++
            resolveGame(replay)
        }
        return replay.copy(log = log.toMutableList())
    }

    private fun resolveGame(s: MatchState) {
        val hi = maxOf(s.pointsA, s.pointsB)
        val lo = minOf(s.pointsA, s.pointsB)
        val leader = if (s.pointsA > s.pointsB) 0 else 1
        val decider = if (deuce == DeuceMode.GOLDEN) 3 else Int.MAX_VALUE
        val won = if (lo >= decider) (hi - lo) >= 1 else hi >= 4 && (hi - lo) >= 2
        if (won) closeGame(leader, s)
    }

    private fun closeGame(winner: Int, s: MatchState) {
        s.pointsA = 0; s.pointsB = 0
        if (winner == 0) s.gamesA++ else s.gamesB++
        val gHi = maxOf(s.gamesA, s.gamesB)
        val gLo = minOf(s.gamesA, s.gamesB)
        if (gHi >= gamesToWin && (gHi - gLo) >= 2) {
            s.gamesA = 0; s.gamesB = 0
            if (winner == 0) s.setsA++ else s.setsB++
            if (maxOf(s.setsA, s.setsB) >= setsToWin) {
                s.complete = true
                s.winner = winner
            }
        }
    }
}
