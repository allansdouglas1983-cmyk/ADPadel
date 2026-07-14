import Foundation
import SwiftUI

/// Owns the live match on the watch using the FULL config-driven engine. State
/// is a fold of an append-only action log (identical to the phone), so undo is
/// perfect and crash-resume is byte-identical. Persists after every action and
/// mirrors the snapshot to the phone.
final class MatchStore: ObservableObject {
    @Published private(set) var state: MatchState

    private var cfg: RuleSetConfig
    private var engine: ScoreEngine
    private var players: [String]
    private var log: [LoggedAction] = []
    private let key = "marque.watch.snapshot"

    init() {
        cfg = DefaultConfig.golden
        engine = ScoreEngine(cfg: cfg)
        players = ["A1", "B1", "A2", "B2"]
        state = ScoreEngine(cfg: DefaultConfig.golden).initialState(["A1", "B1", "A2", "B2"])
        restore()
    }

    private func refold() {
        var s = engine.initialState(players)
        for entry in log { s = engine.reduce(s, entry.action) }
        state = s
    }

    func point(to side: Int) {
        log.append(LoggedAction(type: "point", side: side, unit: nil))
        refold()
        persistAndSync()
        WKHaptics.play(state.complete ? .success : .click)
    }

    func undo() {
        guard !log.isEmpty else { return }
        log.removeLast()
        refold()
        persistAndSync()
    }

    func replay() {
        log.append(LoggedAction(type: "replay", side: nil, unit: nil))
        refold()
        persistAndSync()
    }

    func newMatch() {
        log = []
        refold()
        persistAndSync()
    }

    // MARK: Persistence + sync

    private func snapshot() -> WatchSnapshot {
        WatchSnapshot(configId: cfg.id, players: players, log: log)
    }

    private func persistAndSync() {
        if let data = try? JSONEncoder().encode(snapshot()) {
            UserDefaults.standard.set(data, forKey: key)
        }
        WatchConnectivityManager.shared.sync(snapshot())
    }

    private func restore() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let snap = try? JSONDecoder().decode(WatchSnapshot.self, from: data) else { return }
        players = snap.players
        log = snap.log
        refold()
    }
}

#if canImport(WatchKit)
import WatchKit
enum WKHaptics {
    static func play(_ type: WKHapticType) { WKInterfaceDevice.current().play(type) }
}
#else
enum WKHaptics {
    enum WKHapticType { case click, success }
    static func play(_ type: WKHapticType) {}
}
#endif
