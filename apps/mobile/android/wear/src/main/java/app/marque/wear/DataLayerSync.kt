package app.marque.wear

import android.content.Context
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Syncs the match SNAPSHOT (config id + players + action log) to the phone over
 * the Wearable Data Layer. The phone folds the SAME log through its engine to
 * reach identical state — true parity, no reconciliation guesswork. The watch
 * keeps scoring when unreachable and re-syncs on reconnect.
 */
object DataLayerSync {
    private const val PATH = "/marque/match"
    private val json = Json { ignoreUnknownKeys = true }

    fun push(context: Context, snapshot: WearSnapshot) {
        val request = PutDataMapRequest.create(PATH).apply {
            dataMap.putString("snapshot", json.encodeToString(snapshot))
            dataMap.putLong("updatedAt", System.currentTimeMillis())
        }.asPutDataRequest().setUrgent()
        Wearable.getDataClient(context).putDataItem(request)
    }
}
