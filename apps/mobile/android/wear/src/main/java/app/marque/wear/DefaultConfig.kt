package app.marque.wear

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * Default rule set for a standalone Wear match (golden point + super-tiebreak),
 * byte-identical to a phone preset. The phone can push a different RuleSetConfig
 * over the Data Layer when a match starts.
 */
object DefaultConfig {
    private val json = Json { ignoreUnknownKeys = true }

    private const val GOLDEN_JSON = """
    {
      "id": "padel.golden.bo3.superTB", "version": 1,
      "point": { "ladder": ["0","15","30","40"], "winAtIndex": 4, "pointMargin": 2, "deuce": "golden" },
      "match": {
        "bestOf": 3,
        "regularSet": { "gamesToWin": 6, "gameMargin": 2, "tiebreakAtGames": 6,
          "tiebreak": { "targetPoints": 7, "pointMargin": 2, "firstServerPoints": 1, "serveEvery": 2, "changeEndsEvery": 6 } },
        "finalSet": { "kind": "superTiebreak",
          "superTiebreak": { "targetPoints": 10, "pointMargin": 2, "firstServerPoints": 1, "serveEvery": 2, "changeEndsEvery": 6 } },
        "playOutAfterMatchPoint": false
      },
      "serve": { "format": "doubles", "gameServeCycle": [0,1,2,3], "slotSide": [0,1,0,1] }
    }
    """

    val golden: RuleSetConfig get() = json.decodeFromString(GOLDEN_JSON)
}

/** Serializable action-log entry so Wear can persist + re-fold for undo. */
@Serializable
data class LoggedAction(val type: String, val side: Int? = null, val unit: String? = null) {
    fun toAction(): Action = when (type) {
        "point" -> Action.PointTo(side ?: 0)
        "replay" -> Action.Replay
        "penalty" -> Action.Penalty(side ?: 0, unit ?: "point")
        "retire" -> Action.Retire(side ?: 0)
        else -> Action.Replay
    }
}

/** Compact snapshot for persistence + phone sync (players + config id + log). */
@Serializable
data class WearSnapshot(val configId: String, val players: List<String>, val log: List<LoggedAction>)
