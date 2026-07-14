import Foundation
import WatchConnectivity

/// Bridges the watch's live match to the phone. Sends the WatchSnapshot (players
/// + config id + action log) via `updateApplicationContext` (latest-wins). The
/// phone folds the SAME log through its engine to reach identical state — true
/// parity, no reconciliation guesswork. All WCSession calls run on the main
/// thread; the watch keeps scoring standalone and re-syncs when reachable.
final class WatchConnectivityManager: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchConnectivityManager()

    @Published var lastReceived: WatchSnapshot?

    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }

    func sync(_ snapshot: WatchSnapshot) {
        guard WCSession.default.activationState == .activated else { return }
        if let data = try? JSONEncoder().encode(snapshot) {
            try? WCSession.default.updateApplicationContext(["snapshot": data])
        }
    }

    // MARK: WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        guard let data = applicationContext["snapshot"] as? Data,
              let snap = try? JSONDecoder().decode(WatchSnapshot.self, from: data) else { return }
        DispatchQueue.main.async { self.lastReceived = snap }
    }
}
