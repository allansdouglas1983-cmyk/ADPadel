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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Wear OS wrist scoring in Jetpack Compose. Standalone (works without the
 * phone): the match persists via MatchRepository (DataStore) and survives
 * navigation through a foreground service, then syncs to the phone over the
 * Wearable Data Layer. Tap a half to score; long-press to undo.
 */
class MainActivity : ComponentActivity() {
    private val engine = ScoreEngine()
    private lateinit var repo: MatchRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repo = MatchRepository(applicationContext)
        setContent {
            var state by remember { mutableStateOf(repo.restore()) }

            fun apply(next: MatchState) {
                state = next
                repo.persist(next)
                DataLayerSync.push(applicationContext, next)
            }

            MaterialTheme {
                Column(Modifier.fillMaxSize()) {
                    Half(0, state.pointsA, state.gamesA, state.setsA, Color(0xFF1B232E),
                        onTap = { apply(engine.pointTo(0, state)) },
                        onLongPress = { apply(engine.undo(state)) })
                    Half(1, state.pointsB, state.gamesB, state.setsB, Color(0xFF26313D),
                        onTap = { apply(engine.pointTo(1, state)) },
                        onLongPress = { apply(engine.undo(state)) })
                }
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun ColumnScope.Half(
    side: Int, points: Int, games: Int, sets: Int, bg: Color,
    onTap: () -> Unit, onLongPress: () -> Unit,
) {
    Box(
        Modifier
            .weight(1f)
            .fillMaxWidth()
            .background(bg)
            .pointerInput(Unit) {
                detectTapGestures(onTap = { onTap() }, onLongPress = { onLongPress() })
            },
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(pointLabel(points), fontSize = 40.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text("$sets · $games", fontSize = 12.sp, color = Color(0xFFA9B6C2))
        }
    }
}

private fun pointLabel(raw: Int): String = when (raw) {
    0 -> "0"; 1 -> "15"; 2 -> "30"; else -> "40"
}
