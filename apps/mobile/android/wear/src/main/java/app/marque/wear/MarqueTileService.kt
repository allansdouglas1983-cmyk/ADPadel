package app.marque.wear

import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.ResourceBuilders
import androidx.wear.tiles.TimelineBuilders
import androidx.wear.tiles.LayoutElementBuilders
import androidx.wear.tiles.ModifiersBuilders
import androidx.wear.tiles.ActionBuilders
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.Futures

/**
 * A Wear Tile to launch straight into scoring (dossier §3.8). A single tap opens
 * the app to resume or start a match — the fastest path onto the court.
 */
class MarqueTileService : TileService() {
    private val version = "1"

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val text = LayoutElementBuilders.Text.Builder()
            .setText("Score")
            .build()

        val launch = ModifiersBuilders.Clickable.Builder()
            .setId("open")
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setPackageName("app.marque.padel")
                            .setClassName("app.marque.wear.MainActivity")
                            .build()
                    )
                    .build()
            )
            .build()

        val layout = LayoutElementBuilders.Box.Builder()
            .setModifiers(ModifiersBuilders.Modifiers.Builder().setClickable(launch).build())
            .addContent(text)
            .build()

        val tile = TileBuilders.Tile.Builder()
            .setResourcesVersion(version)
            .setTileTimeline(
                TimelineBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TimelineBuilders.TimelineEntry.Builder()
                            .setLayout(LayoutElementBuilders.Layout.Builder().setRoot(layout).build())
                            .build()
                    )
                    .build()
            )
            .build()
        return Futures.immediateFuture(tile)
    }

    override fun onTileResourcesRequest(
        requestParams: RequestBuilders.ResourcesRequest
    ): ListenableFuture<ResourceBuilders.Resources> =
        Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion(version).build())
}
