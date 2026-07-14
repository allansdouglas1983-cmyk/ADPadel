import XCTest
@testable import MarqueWatch

/// Runs the SHARED golden-vector fixture (generated from the canonical TS engine)
/// through the Swift port and asserts byte-for-byte agreement at every step.
/// This is the enforceable phone/watch parity contract on the Apple side.
///
/// The fixture is copied into the test bundle from
/// packages/scoring-engine/fixtures/golden-vectors.json (see the build phase).
final class ScoreEngineTests: XCTestCase {

    struct StepSnap: Decodable, Equatable {
        let points: [Int]
        let tiebreak: [Int]?
        let sets: [[Int]]
        let setsWon: [Int]
        let serverSlot: Int
        let complete: Bool
        let winner: Int?
    }
    struct FixtureAction: Decodable { let type: String; let side: Int?; let unit: String? }
    struct Vector: Decodable {
        let name: String
        let config: RuleSetConfig
        let players: [String]
        let actions: [FixtureAction]
        let steps: [StepSnap]
    }
    struct Fixture: Decodable { let version: Int; let vectors: [Vector] }

    private func snap(_ s: MatchState) -> StepSnap {
        let set = s.sets[s.currentSetIndex]
        return StepSnap(
            points: s.currentGame.points,
            tiebreak: set.tiebreak.map { $0.points },
            sets: s.sets.map { $0.games },
            setsWon: s.setsWon,
            serverSlot: s.serverSlot,
            complete: s.complete,
            winner: s.outcome.winner
        )
    }

    private func action(_ a: FixtureAction) -> Action {
        switch a.type {
        case "POINT_TO": return .pointTo(a.side ?? 0)
        case "PENALTY": return .penalty(side: a.side ?? 0, unit: a.unit ?? "point")
        case "RETIRE": return .retire(side: a.side ?? 0)
        default: return .replay
        }
    }

    func testGoldenVectors() throws {
        let url = Bundle(for: type(of: self)).url(forResource: "golden-vectors", withExtension: "json")!
        let fixture = try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: url))
        XCTAssertGreaterThanOrEqual(fixture.vectors.count, 12)

        for v in fixture.vectors {
            let engine = ScoreEngine(cfg: v.config)
            var state = engine.initialState(v.players)
            XCTAssertEqual(snap(state), v.steps[0], "initial state mismatch: \(v.name)")
            for (i, a) in v.actions.enumerated() {
                state = engine.reduce(state, action(a))
                XCTAssertEqual(snap(state), v.steps[i + 1], "step \(i) mismatch in \(v.name)")
            }
        }
    }
}
