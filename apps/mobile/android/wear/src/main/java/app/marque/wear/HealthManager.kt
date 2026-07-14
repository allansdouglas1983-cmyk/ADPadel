package app.marque.wear

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord

/**
 * Health Connect integration for HR / calories during a match (dossier §3.8).
 * Kept thin: exposes the permission set and a client accessor; the foreground
 * service reads live samples while a match is active.
 */
object HealthManager {
    val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
    )

    fun clientOrNull(context: Context): HealthConnectClient? =
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE)
            HealthConnectClient.getOrCreate(context)
        else null
}
