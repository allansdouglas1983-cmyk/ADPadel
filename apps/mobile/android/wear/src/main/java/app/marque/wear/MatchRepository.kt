package app.marque.wear

import android.content.Context
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Offline-first watch persistence. Writes the match after every action so a
 * crash, kill or dead battery resumes byte-identically. (Uses SharedPreferences
 * here for brevity; DataStore is the production choice — same contract.)
 */
class MatchRepository(context: Context) {
    private val prefs = context.getSharedPreferences("marque_wear", Context.MODE_PRIVATE)
    private val key = "match"

    fun persist(state: MatchState) {
        prefs.edit().putString(key, Json.encodeToString(state)).commit()
    }

    fun restore(): MatchState {
        val raw = prefs.getString(key, null) ?: return MatchState()
        return runCatching { Json.decodeFromString<MatchState>(raw) }.getOrDefault(MatchState())
    }
}
