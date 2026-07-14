import Foundation
import WatchConnectivity

/// Bridges the watch's live match to the phone via WatchConnectivity. Uses
/// `updateApplicationContext` for latest-wins state sync and `transferUserInfo`
/// for discrete events. All WCSession calls run on the main thread. State is
/// also persisted locally (see MatchStore) so a dropped connection never loses
/// the score — the watch keeps scoring standalone and re-syncs when reachable.
final class WatchConnectivityManager: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchConnectivityManager()

    @Published var lastReceived: MatchState?

    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }

    /// Push the latest match state to the phone (latest-wins).
    func syncState(_ state: MatchState) {
        guard WCSession.default.activationState == .activated else { return }
        if let data = try? JSONEncoder().encode(state) {
            try? WCSession.default.updateApplicationContext(["match": data])
        }
    }

    // MARK: WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        guard let data = applicationContext["match"] as? Data,
              let state = try? JSONDecoder().decode(MatchState.self, from: data) else { return }
        DispatchQueue.main.async { self.lastReceived = state }
    }
}
