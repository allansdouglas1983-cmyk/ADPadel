import Foundation
import SwiftUI

/// Owns the live match on the watch. Persists to UserDefaults after every action
/// (synchronously) so a crash or dead battery resumes byte-identically, and
/// mirrors state to the phone via WatchConnectivity.
final class MatchStore: ObservableObject {
    @Published private(set) var state = MatchState()
    private let engine = ScoreEngine()
    private let key = "marque.watch.match"

    init() { restore() }

    func point(to side: Int) {
        state = engine.pointTo(side, state)
        persist()
        WatchConnectivityManager.shared.syncState(state)
        WKHaptics.play(state.complete ? .success : .click)
    }

    func undo() {
        state = engine.undo(state)
        persist()
        WatchConnectivityManager.shared.syncState(state)
    }

    func reset() {
        state = MatchState()
        persist()
    }

    private func persist() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func restore() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let saved = try? JSONDecoder().decode(MatchState.self, from: data) else { return }
        state = saved
    }
}

#if canImport(WatchKit)
import WatchKit
enum WKHaptics {
    static func play(_ type: WKHapticType) { WKInterfaceDevice.current().play(type) }
}
#else
enum WKHaptics { enum WKHapticType { case click, success }
    static func play(_ type: WKHapticType) {} }
#endif
