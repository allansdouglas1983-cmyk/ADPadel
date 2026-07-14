import SwiftUI
import WidgetKit

/// A watchOS complication that launches straight into a match from the face
/// (dossier §3.7). Built with WidgetKit (the modern complication API). Shows the
/// wordmark; tapping opens the app to resume or start scoring.
struct MarqueComplicationEntry: TimelineEntry {
    let date: Date
}

struct MarqueComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> MarqueComplicationEntry { .init(date: Date()) }
    func getSnapshot(in context: Context, completion: @escaping (MarqueComplicationEntry) -> Void) {
        completion(.init(date: Date()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MarqueComplicationEntry>) -> Void) {
        completion(Timeline(entries: [.init(date: Date())], policy: .never))
    }
}

struct MarqueComplicationView: View {
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            Text("M").font(.system(size: 20, weight: .black, design: .rounded))
        }
        .widgetLabel("Marque")
    }
}

@main
struct MarqueComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "MarqueComplication", provider: MarqueComplicationProvider()) { _ in
            MarqueComplicationView()
        }
        .configurationDisplayName("Marque")
        .description("Start scoring from your watch face.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
    }
}
