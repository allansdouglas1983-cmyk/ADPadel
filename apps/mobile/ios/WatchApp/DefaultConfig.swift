import Foundation

/// The default rule set used for a standalone watch match (recreational golden
/// point + super-tiebreak). The phone can push a different RuleSetConfig over
/// WatchConnectivity when a match starts; until then this is used. Kept as JSON
/// so it is byte-identical to a phone preset.
enum DefaultConfig {
    static let goldenSuperTBJSON = """
    {
      "id": "padel.golden.bo3.superTB",
      "version": 1,
      "point": { "ladder": ["0","15","30","40"], "winAtIndex": 4, "pointMargin": 2, "deuce": "golden" },
      "match": {
        "bestOf": 3,
        "regularSet": { "gamesToWin": 6, "gameMargin": 2, "tiebreakAtGames": 6,
          "tiebreak": { "targetPoints": 7, "pointMargin": 2, "firstServerPoints": 1, "serveEvery": 2, "changeEndsEvery": 6 } },
        "finalSet": { "kind": "superTiebreak",
          "superTiebreak": { "targetPoints": 10, "pointMargin": 2, "firstServerPoints": 1, "serveEvery": 2, "changeEndsEvery": 6 } },
        "playOutAfterMatchPoint": false
      },
      "serve": { "format": "doubles", "gameServeCycle": [0,1,2,3], "slotSide": [0,1,0,1] }
    }
    """

    static func decode(_ json: String) -> RuleSetConfig {
        // Force-try is acceptable for the built-in default; phone-pushed configs
        // are validated before use.
        // swiftlint:disable:next force_try
        return try! JSONDecoder().decode(RuleSetConfig.self, from: Data(json.utf8))
    }

    static var golden: RuleSetConfig { decode(goldenSuperTBJSON) }
}

/// A serializable action log entry, so the watch can persist + re-fold for undo.
struct LoggedAction: Codable {
    let type: String // point | replay | penalty | retire
    let side: Int?
    let unit: String?

    var action: Action {
        switch type {
        case "point": return .pointTo(side ?? 0)
        case "replay": return .replay
        case "penalty": return .penalty(side: side ?? 0, unit: unit ?? "point")
        case "retire": return .retire(side: side ?? 0)
        default: return .replay
        }
    }
}

/// A compact match snapshot for persistence and phone sync (players + config id
/// + action log). The phone folds the same log to reach identical state.
struct WatchSnapshot: Codable {
    var configId: String
    var players: [String]
    var log: [LoggedAction]
}
