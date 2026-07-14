package app.marque.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import kotlin.math.max

/**
 * Wear OS wrist scoring in Compose, driven by the FULL config engine. State is a
 * fold of an append-only action log (identical to the phone), so undo is perfect
 * and crash-resume is byte-identical. Standalone; persists via MatchRepository
 * and syncs the snapshot to the phone over the Wearable Data Layer.
 */
class MainActivity : ComponentActivity() {
    private val cfg = DefaultConfig.golden
    private val engine = ScoreEngine(DefaultConfig.golden)
    private lateinit var repo: MatchRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repo = MatchRepository(applicationContext)
        val initial = repo.restore()

        setContent {
            var players by remember { mutableStateOf(initial.players) }
            var log by remember { mutableStateOf(initial.log) }
            val state by remember {
                derivedStateOf {
                    var s = engine.initialState(players)
                    for (e in log) s = engine.reduce(s, e.toAction())
                    s
                }
            }

            fun commit(newLog: List<LoggedAction>) {
                log = newLog
                val snap = WearSnapshot(cfg.id, players, newLog)
                repo.persist(snap)
                DataLayerSync.push(applicationContext, snap)
            }

            MaterialTheme {
                Column(Modifier.fillMaxSize()) {
                    Half(0, state, Color(0xFF1B232E),
                        onTap = { commit(log + LoggedAction("point", 0)) },
                        onLongPress = { if (log.isNotEmpty()) commit(log.dropLast(1)) })
                    Half(1, state, Color(0xFF26313D),
                        onTap = { commit(log + LoggedAction("point", 1)) },
                        onLongPress = { if (log.isNotEmpty()) commit(log.dropLast(1)) })
                }
            }
        }
    }
}

@Composable
private fun ColumnScope.Half(side: Int, state: MatchState, bg: Color, onTap: () -> Unit, onLongPress: () -> Unit) {
    Box(
        Modifier
            .weight(1f)
            .fillMaxWidth()
            .background(bg)
            .pointerInput(Unit) { detectTapGestures(onTap = { onTap() }, onLongPress = { onLongPress() }) },
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(pointLabel(state, side), fontSize = 40.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(state.sets.joinToString("  ") { it[side].toString() }, fontSize = 12.sp, color = Color(0xFFA9B6C2))
        }
    }
}

private fun pointLabel(state: MatchState, side: Int): String {
    val set = state.sets[state.currentSetIndex]
    set.tiebreak?.let { return it.points[side].toString() }
    val a = state.currentGame[0]; val b = state.currentGame[1]
    val ladder = listOf("0", "15", "30", "40")
    if (max(a, b) < ladder.size) return ladder[if (side == 0) a else b]
    if (a == b) return "40"
    val mine = if (side == 0) a else b; val theirs = if (side == 0) b else a
    return if (mine > theirs) "AD" else "40"
}
