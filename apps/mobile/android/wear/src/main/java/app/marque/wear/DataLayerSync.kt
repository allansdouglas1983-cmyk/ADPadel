package app.marque.wear

import android.content.Context
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Syncs match state to the phone over the Wearable Data Layer (DataClient).
 * Latest-wins: the phone reconciles by the match's updatedAt. The watch keeps
 * scoring even when unreachable and re-syncs on reconnect.
 */
object DataLayerSync {
    private const val PATH = "/marque/match"

    fun push(context: Context, state: MatchState) {
        val request = PutDataMapRequest.create(PATH).apply {
            dataMap.putString("state", Json.encodeToString(state))
            dataMap.putLong("updatedAt", System.currentTimeMillis())
        }.asPutDataRequest().setUrgent()
        Wearable.getDataClient(context).putDataItem(request)
    }
}
