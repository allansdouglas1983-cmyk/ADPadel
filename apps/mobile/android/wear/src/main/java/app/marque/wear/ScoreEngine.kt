package app.marque.wear

import kotlinx.serialization.Serializable
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

/**
 * Full, config-driven port of the canonical TypeScript scoring engine. Rules are
 * DATA (RuleSetConfig) exactly as on the phone, so Wear OS handles every deuce
 * mode, tiebreaks with correct serve rotation, super-tiebreak deciders, mini-sets
 * and best-of — with zero divergence. Validated against the shared golden-vector
 * fixture in ScoreEngineTest (the enforceable phone/watch parity contract).
 */

@Serializable
data class PointConfig(
    val ladder: List<String>,
    val winAtIndex: Int,
    val pointMargin: Int,
    val deuce: String, // advantage | golden | star
    val starMaxAdvantages: Int? = null,
)

@Serializable
data class TiebreakConfig(
    val targetPoints: Int,
    val pointMargin: Int,
    val firstServerPoints: Int,
    val serveEvery: Int,
    val changeEndsEvery: Int,
)

@Serializable
data class SetConfig(
    val gamesToWin: Int,
    val gameMargin: Int,
    val tiebreakAtGames: Int? = null,
    val tiebreak: TiebreakConfig? = null,
    val maxGames: Int? = null,
)

@Serializable
data class FinalSetConfig(val kind: String, val set: SetConfig? = null, val superTiebreak: TiebreakConfig? = null)

@Serializable
data class MatchConfig(
    val bestOf: Int,
    val regularSet: SetConfig,
    val finalSet: FinalSetConfig,
    val playOutAfterMatchPoint: Boolean,
)

@Serializable
data class ServeConfig(val format: String, val gameServeCycle: List<Int>, val slotSide: List<Int>)

@Serializable
data class RuleSetConfig(
    val id: String,
    val version: Int,
    val point: PointConfig,
    val match: MatchConfig,
    val serve: ServeConfig,
)

@Serializable
data class TiebreakScore(val points: List<Int>, val winner: Int? = null)

@Serializable
data class SetScore(
    val games: List<Int>,
    val tiebreak: TiebreakScore? = null,
    val isTiebreak: Boolean = false,
    val winner: Int? = null,
    val kind: String, // regular | final
)

@Serializable
sealed class Outcome {
    @Serializable object InProgress : Outcome()
    @Serializable data class Completed(val winner: Int) : Outcome()
    @Serializable data class Retired(val winner: Int, val retiree: Int) : Outcome()

    val winnerOrNull: Int?
        get() = when (this) {
            is Completed -> winner
            is Retired -> winner
            else -> null
        }
}

@Serializable
data class MatchState(
    val players: List<String>,
    val sets: List<SetScore>,
    val setsWon: List<Int>,
    val currentSetIndex: Int,
    val currentGame: List<Int>,
    val gamesStartedTotal: Int,
    val serverSlot: Int,
    val servingSide: Int,
    val outcome: Outcome,
    val complete: Boolean,
    val seq: Int,
)

sealed class Action {
    data class PointTo(val side: Int) : Action()
    object Replay : Action()
    data class Penalty(val side: Int, val unit: String) : Action()
    data class Retire(val side: Int) : Action()
    object Undo : Action()
}

class ScoreEngine(private val cfg: RuleSetConfig) {
    private fun other(s: Int) = if (s == 0) 1 else 0
    private val setsNeeded get() = ceil(cfg.match.bestOf / 2.0).toInt()

    private fun deciderThreshold(): Int = when (cfg.point.deuce) {
        "advantage" -> Int.MAX_VALUE
        "golden" -> cfg.point.winAtIndex - 1
        else -> cfg.point.winAtIndex - 1 + (cfg.point.starMaxAdvantages ?: 0)
    }

    private fun resolveGamePoint(pts: List<Int>): Int? {
        val hi = max(pts[0], pts[1]); val lo = min(pts[0], pts[1])
        val lead = hi - lo; val leader = if (pts[0] > pts[1]) 0 else 1
        if (lo >= deciderThreshold()) return if (lead >= 1) leader else null
        if (hi >= cfg.point.winAtIndex && lead >= cfg.point.pointMargin) return leader
        return null
    }

    private fun tiebreakWinner(pts: List<Int>, tb: TiebreakConfig): Int? {
        val hi = max(pts[0], pts[1]); val lead = kotlin.math.abs(pts[0] - pts[1])
        return if (hi >= tb.targetPoints && lead >= tb.pointMargin) (if (pts[0] > pts[1]) 0 else 1) else null
    }

    private fun tiebreakServeCursor(opener: Int, played: Int, tb: TiebreakConfig, len: Int): Int {
        if (played < tb.firstServerPoints) return opener % len
        val swaps = (played - tb.firstServerPoints) / tb.serveEvery + 1
        return (opener + swaps) % len
    }

    private fun configForSet(kind: String): SetConfig {
        if (kind == "regular") return cfg.match.regularSet
        val fs = cfg.match.finalSet
        return when (fs.kind) {
            "full" -> fs.set ?: cfg.match.regularSet
            "miniSet" -> fs.set ?: SetConfig(4, 2, 4, cfg.match.regularSet.tiebreak)
            else -> SetConfig(1, 1, 0, fs.superTiebreak)
        }
    }

    private fun openSet(index: Int): SetScore {
        val kind = if (index == cfg.match.bestOf - 1) "final" else "regular"
        val setCfg = configForSet(kind)
        val startsTB = setCfg.tiebreakAtGames == 0
        return SetScore(
            games = listOf(0, 0),
            tiebreak = if (startsTB) TiebreakScore(listOf(0, 0)) else null,
            isTiebreak = startsTB, winner = null, kind = kind,
        )
    }

    private fun withServer(s: MatchState): MatchState {
        val len = cfg.serve.gameServeCycle.size
        val set = s.sets[s.currentSetIndex]
        val slot: Int
        if (set.isTiebreak && set.tiebreak != null) {
            val tbCfg = configForSet(set.kind).tiebreak!!
            val opener = s.gamesStartedTotal % len
            val played = set.tiebreak.points[0] + set.tiebreak.points[1]
            slot = cfg.serve.gameServeCycle[tiebreakServeCursor(opener, played, tbCfg, len) % len]
        } else {
            slot = cfg.serve.gameServeCycle[s.gamesStartedTotal % len]
        }
        return s.copy(serverSlot = slot, servingSide = cfg.serve.slotSide[slot])
    }

    fun initialState(players: List<String>): MatchState = withServer(
        MatchState(
            players = players, sets = listOf(openSet(0)), setsWon = listOf(0, 0),
            currentSetIndex = 0, currentGame = listOf(0, 0), gamesStartedTotal = 0,
            serverSlot = cfg.serve.gameServeCycle[0], servingSide = 0,
            outcome = Outcome.InProgress, complete = false, seq = 0,
        )
    )

    private fun replaceSet(s: MatchState, set: SetScore): MatchState {
        val sets = s.sets.toMutableList(); sets[s.currentSetIndex] = set
        return s.copy(sets = sets)
    }

    private fun closeSet(s0: MatchState, winner: Int, gamesStartedTotal: Int): MatchState {
        val setsWon = s0.setsWon.toMutableList(); setsWon[winner] += 1
        var s = s0.copy(setsWon = setsWon, gamesStartedTotal = gamesStartedTotal, currentGame = listOf(0, 0))
        val matchWon = setsWon[winner] >= setsNeeded
        if (matchWon) {
            s = s.copy(outcome = Outcome.Completed(winner), complete = true)
            if (!cfg.match.playOutAfterMatchPoint) return s
        }
        val nextIndex = s0.currentSetIndex + 1
        return withServer(s.copy(sets = s.sets + openSet(nextIndex), currentSetIndex = nextIndex))
    }

    private fun closeGame(s: MatchState, winner: Int): MatchState {
        val set = s.sets[s.currentSetIndex]
        val setCfg = configForSet(set.kind)
        val games = set.games.toMutableList(); games[winner] += 1
        val gamesStartedTotal = s.gamesStartedTotal + 1

        val tbAt = setCfg.tiebreakAtGames
        if (tbAt != null && tbAt > 0 && games[0] == tbAt && games[1] == tbAt) {
            val ns = set.copy(games = games, isTiebreak = true, tiebreak = TiebreakScore(listOf(0, 0)))
            return withServer(replaceSet(s.copy(gamesStartedTotal = gamesStartedTotal, currentGame = listOf(0, 0)), ns))
        }
        val lead = games[winner] - games[other(winner)]
        var won = games[winner] >= setCfg.gamesToWin && lead >= setCfg.gameMargin
        if (setCfg.maxGames != null && games[winner] >= setCfg.maxGames) won = true
        if (!won) {
            val ns = set.copy(games = games)
            return withServer(replaceSet(s.copy(gamesStartedTotal = gamesStartedTotal, currentGame = listOf(0, 0)), ns))
        }
        val ns = set.copy(games = games, winner = winner)
        return closeSet(replaceSet(s, ns), winner, gamesStartedTotal)
    }

    private fun tiebreakPoint(s: MatchState, side: Int): MatchState {
        val set = s.sets[s.currentSetIndex]
        val tbCfg = configForSet(set.kind).tiebreak!!
        val pts = set.tiebreak!!.points.toMutableList(); pts[side] += 1
        val winner = tiebreakWinner(pts, tbCfg)
        if (winner != null) {
            val games = set.games.toMutableList(); games[winner] += 1
            val gamesStartedTotal = s.gamesStartedTotal + 1
            val ns = set.copy(games = games, tiebreak = TiebreakScore(pts, winner), isTiebreak = false, winner = winner)
            return closeSet(replaceSet(s, ns), winner, gamesStartedTotal)
        }
        return withServer(replaceSet(s, set.copy(tiebreak = TiebreakScore(pts, null))))
    }

    private fun awardPoint(s: MatchState, side: Int): MatchState {
        val set = s.sets[s.currentSetIndex]
        if (set.isTiebreak) return tiebreakPoint(s, side)
        val pts = s.currentGame.toMutableList(); pts[side] += 1
        return if (resolveGamePoint(pts) != null) closeGame(s, side) else s.copy(currentGame = pts)
    }

    private fun isFrozen(s: MatchState): Boolean {
        if (!s.complete) return false
        if (cfg.match.playOutAfterMatchPoint && s.outcome is Outcome.Completed) return false
        return true
    }

    fun reduce(s: MatchState, action: Action): MatchState {
        fun bump(x: MatchState) = x.copy(seq = s.seq + 1)
        return when (action) {
            is Action.Undo -> s
            is Action.Replay -> bump(s)
            is Action.Retire ->
                if (s.outcome is Outcome.InProgress)
                    bump(s.copy(outcome = Outcome.Retired(other(action.side), action.side), complete = true))
                else bump(s)
            is Action.Penalty -> {
                if (isFrozen(s)) return bump(s)
                val beneficiary = other(action.side)
                val set = s.sets[s.currentSetIndex]
                if (action.unit == "game" && !set.isTiebreak) bump(closeGame(s, beneficiary))
                else bump(awardPoint(s, beneficiary))
            }
            is Action.PointTo -> if (isFrozen(s)) bump(s) else bump(awardPoint(s, action.side))
        }
    }
}
