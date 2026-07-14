package app.marque.wear

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Runs the SHARED golden-vector fixture (generated from the canonical TS engine)
 * through the Kotlin port and asserts byte-for-byte agreement at every step —
 * the enforceable phone/watch parity contract on the Android side. The fixture is
 * copied to src/test/resources/golden-vectors.json from
 * packages/scoring-engine/fixtures/golden-vectors.json by a Gradle task.
 */
class ScoreEngineTest {

    @Serializable data class StepSnap(
        val points: List<Int>,
        val tiebreak: List<Int>? = null,
        val sets: List<List<Int>>,
        val setsWon: List<Int>,
        val serverSlot: Int,
        val complete: Boolean,
        val winner: Int? = null,
    )

    @Serializable data class FixtureAction(val type: String, val side: Int? = null, val unit: String? = null)

    @Serializable data class Vector(
        val name: String,
        val config: RuleSetConfig,
        val players: List<String>,
        val actions: List<FixtureAction>,
        val steps: List<StepSnap>,
    )

    @Serializable data class Fixture(val version: Int, val vectors: List<Vector>)

    private val json = Json { ignoreUnknownKeys = true }

    private fun snap(s: MatchState) = StepSnap(
        points = s.currentGame,
        tiebreak = s.sets[s.currentSetIndex].tiebreak?.points,
        sets = s.sets.map { it.games },
        setsWon = s.setsWon,
        serverSlot = s.serverSlot,
        complete = s.complete,
        winner = s.outcome.winnerOrNull,
    )

    private fun toAction(a: FixtureAction): Action = when (a.type) {
        "POINT_TO" -> Action.PointTo(a.side ?: 0)
        "PENALTY" -> Action.Penalty(a.side ?: 0, a.unit ?: "point")
        "RETIRE" -> Action.Retire(a.side ?: 0)
        else -> Action.Replay
    }

    @Test
    fun goldenVectors() {
        val text = this::class.java.getResourceAsStream("/golden-vectors.json")!!
            .bufferedReader().use { it.readText() }
        val fixture = json.decodeFromString<Fixture>(text)
        assertTrue(fixture.vectors.size >= 12)

        for (v in fixture.vectors) {
            val engine = ScoreEngine(v.config)
            var state = engine.initialState(v.players)
            assertEquals("initial: ${v.name}", v.steps[0], snap(state))
            v.actions.forEachIndexed { i, a ->
                state = engine.reduce(state, toAction(a))
                assertEquals("step $i: ${v.name}", v.steps[i + 1], snap(state))
            }
        }
    }
}
