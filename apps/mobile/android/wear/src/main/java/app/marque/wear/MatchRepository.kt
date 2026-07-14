package app.marque.wear

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Offline-first Wear persistence of the match SNAPSHOT (config id + players +
 * action log). Written after every action so a crash, kill or dead battery
 * re-folds to byte-identical state. (SharedPreferences for brevity; DataStore is
 * the production choice — same contract.)
 */
class MatchRepository(context: Context) {
    private val prefs = context.getSharedPreferences("marque_wear", Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }
    private val key = "snapshot"

    fun persist(snapshot: WearSnapshot) {
        prefs.edit().putString(key, json.encodeToString(snapshot)).commit()
    }

    fun restore(): WearSnapshot {
        val raw = prefs.getString(key, null)
            ?: return WearSnapshot(DefaultConfig.golden.id, listOf("A1", "B1", "A2", "B2"), emptyList())
        return runCatching { json.decodeFromString<WearSnapshot>(raw) }
            .getOrDefault(WearSnapshot(DefaultConfig.golden.id, listOf("A1", "B1", "A2", "B2"), emptyList()))
    }
}
