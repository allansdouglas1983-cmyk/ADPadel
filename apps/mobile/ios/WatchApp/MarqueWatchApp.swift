import SwiftUI

/// watchOS app entry point. Added as a native target in the Xcode workspace
/// created by `expo prebuild` (RN cannot run on watchOS). A complication and a
/// HealthKit workout session are wired here; the scoring UI lives in ContentView.
@main
struct MarqueWatchApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
