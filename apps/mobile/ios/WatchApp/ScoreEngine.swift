import Foundation

/// Full, config-driven port of the canonical TypeScript scoring engine
/// (`packages/scoring-engine`). Rules are DATA (RuleSetConfig) exactly as on the
/// phone, so the watch handles every deuce mode, tiebreaks with correct serve
/// rotation, super-tiebreak deciders, mini-sets and best-of — with zero divergence.
///
/// This port is validated against the shared golden-vector fixture
/// (`fixtures/golden-vectors.json`) in ScoreEngineTests — the enforceable
/// phone/watch parity contract. Keep it in lockstep with the TS engine; when the
/// engine changes, regenerate the fixture and this test proves agreement.

// MARK: - Config (decodes the same JSON the phone stores)

enum DeuceMode: String, Codable { case advantage, golden, star }

struct PointConfig: Codable {
    let ladder: [String]
    let winAtIndex: Int
    let pointMargin: Int
    let deuce: DeuceMode
    let starMaxAdvantages: Int?
}

struct TiebreakConfig: Codable {
    let targetPoints: Int
    let pointMargin: Int
    let firstServerPoints: Int
    let serveEvery: Int
    let changeEndsEvery: Int
}

struct SetConfig: Codable {
    let gamesToWin: Int
    let gameMargin: Int
    let tiebreakAtGames: Int?
    let tiebreak: TiebreakConfig?
    let maxGames: Int?
}

struct FinalSetConfig: Codable {
    let kind: String // full | superTiebreak | miniSet
    let set: SetConfig?
    let superTiebreak: TiebreakConfig?
}

struct MatchConfig: Codable {
    let bestOf: Int
    let regularSet: SetConfig
    let finalSet: FinalSetConfig
    let playOutAfterMatchPoint: Bool
}

struct ServeConfig: Codable {
    let format: String
    let gameServeCycle: [Int]
    let slotSide: [Int]
}

struct RuleSetConfig: Codable {
    let id: String
    let version: Int
    let point: PointConfig
    let match: MatchConfig
    let serve: ServeConfig
}

// MARK: - State

struct TiebreakScore: Codable, Equatable { var points: [Int]; var winner: Int? }
struct GameScore: Codable, Equatable { var points: [Int]; var winner: Int? }

struct SetScore: Codable, Equatable {
    var games: [Int]
    var tiebreak: TiebreakScore?
    var isTiebreak: Bool
    var winner: Int?
    var kind: String // regular | final
}

enum Outcome: Equatable {
    case inProgress
    case completed(winner: Int)
    case retired(winner: Int, retiree: Int)
    var winner: Int? {
        switch self {
        case .inProgress: return nil
        case let .completed(w): return w
        case let .retired(w, _): return w
        }
    }
}

struct MatchState: Equatable {
    var players: [String]
    var sets: [SetScore]
    var setsWon: [Int]
    var currentSetIndex: Int
    var currentGame: GameScore
    var gamesStartedTotal: Int
    var serverSlot: Int
    var servingSide: Int
    var outcome: Outcome
    var complete: Bool
    var seq: Int
}

enum Action {
    case pointTo(Int)
    case replay
    case penalty(side: Int, unit: String)
    case retire(side: Int)
    case undo
}

// MARK: - Engine

struct ScoreEngine {
    let cfg: RuleSetConfig

    private func other(_ s: Int) -> Int { s == 0 ? 1 : 0 }
    private var setsNeeded: Int { Int(ceil(Double(cfg.match.bestOf) / 2.0)) }

    // points.ts
    private func deciderThreshold() -> Int {
        switch cfg.point.deuce {
        case .advantage: return Int.max
        case .golden: return cfg.point.winAtIndex - 1
        case .star: return cfg.point.winAtIndex - 1 + (cfg.point.starMaxAdvantages ?? 0)
        }
    }

    private func resolveGamePoint(_ pts: [Int]) -> Int? {
        let hi = max(pts[0], pts[1]); let lo = min(pts[0], pts[1])
        let lead = hi - lo; let leader = pts[0] > pts[1] ? 0 : 1
        if lo >= deciderThreshold() { return lead >= 1 ? leader : nil }
        if hi >= cfg.point.winAtIndex && lead >= cfg.point.pointMargin { return leader }
        return nil
    }

    // tiebreak.ts
    private func tiebreakWinner(_ pts: [Int], _ tb: TiebreakConfig) -> Int? {
        let hi = max(pts[0], pts[1]); let lead = abs(pts[0] - pts[1])
        if hi >= tb.targetPoints && lead >= tb.pointMargin { return pts[0] > pts[1] ? 0 : 1 }
        return nil
    }

    private func tiebreakServeCursor(_ opener: Int, _ played: Int, _ tb: TiebreakConfig, _ len: Int) -> Int {
        if played < tb.firstServerPoints { return opener % len }
        let swaps = (played - tb.firstServerPoints) / tb.serveEvery + 1
        return (opener + swaps) % len
    }

    // engine.ts: configForSet
    private func configForSet(_ kind: String) -> SetConfig {
        if kind == "regular" { return cfg.match.regularSet }
        let fs = cfg.match.finalSet
        switch fs.kind {
        case "full": return fs.set ?? cfg.match.regularSet
        case "miniSet":
            return fs.set ?? SetConfig(gamesToWin: 4, gameMargin: 2, tiebreakAtGames: 4,
                                       tiebreak: cfg.match.regularSet.tiebreak, maxGames: nil)
        default: // superTiebreak
            return SetConfig(gamesToWin: 1, gameMargin: 1, tiebreakAtGames: 0,
                             tiebreak: fs.superTiebreak, maxGames: nil)
        }
    }

    private func openSet(_ index: Int) -> SetScore {
        let kind = index == cfg.match.bestOf - 1 ? "final" : "regular"
        let setCfg = configForSet(kind)
        let startsTB = setCfg.tiebreakAtGames == 0
        return SetScore(games: [0, 0],
                        tiebreak: startsTB ? TiebreakScore(points: [0, 0], winner: nil) : nil,
                        isTiebreak: startsTB, winner: nil, kind: kind)
    }

    private func withServer(_ s: MatchState) -> MatchState {
        var st = s
        let len = cfg.serve.gameServeCycle.count
        let set = st.sets[st.currentSetIndex]
        if set.isTiebreak, let tb = set.tiebreak {
            let tbCfg = configForSet(set.kind).tiebreak!
            let opener = st.gamesStartedTotal % len
            let played = tb.points[0] + tb.points[1]
            let cursor = tiebreakServeCursor(opener, played, tbCfg, len)
            let slot = cfg.serve.gameServeCycle[cursor % len]
            st.serverSlot = slot; st.servingSide = cfg.serve.slotSide[slot]
        } else {
            let slot = cfg.serve.gameServeCycle[st.gamesStartedTotal % len]
            st.serverSlot = slot; st.servingSide = cfg.serve.slotSide[slot]
        }
        return st
    }

    func initialState(_ players: [String]) -> MatchState {
        var base = MatchState(players: players, sets: [openSet(0)], setsWon: [0, 0],
                              currentSetIndex: 0, currentGame: GameScore(points: [0, 0], winner: nil),
                              gamesStartedTotal: 0, serverSlot: cfg.serve.gameServeCycle[0], servingSide: 0,
                              outcome: .inProgress, complete: false, seq: 0)
        base = withServer(base)
        return base
    }

    private func closeSet(_ s: MatchState, _ winner: Int, _ gamesStartedTotal: Int) -> MatchState {
        var st = s
        st.setsWon[winner] += 1
        st.gamesStartedTotal = gamesStartedTotal
        st.currentGame = GameScore(points: [0, 0], winner: nil)
        let matchWon = st.setsWon[winner] >= setsNeeded
        if matchWon {
            st.outcome = .completed(winner: winner); st.complete = true
            if !cfg.match.playOutAfterMatchPoint { return st }
        }
        let nextIndex = s.currentSetIndex + 1
        st.sets.append(openSet(nextIndex))
        st.currentSetIndex = nextIndex
        return withServer(st)
    }

    private func closeGame(_ s: MatchState, _ winner: Int) -> MatchState {
        var st = s
        let set = st.sets[st.currentSetIndex]
        let setCfg = configForSet(set.kind)
        var games = set.games; games[winner] += 1
        let gamesStartedTotal = st.gamesStartedTotal + 1

        if let tbAt = setCfg.tiebreakAtGames, tbAt > 0, games[0] == tbAt, games[1] == tbAt {
            st.gamesStartedTotal = gamesStartedTotal
            st.currentGame = GameScore(points: [0, 0], winner: nil)
            var ns = set; ns.games = games; ns.isTiebreak = true
            ns.tiebreak = TiebreakScore(points: [0, 0], winner: nil)
            st.sets[st.currentSetIndex] = ns
            return withServer(st)
        }

        let lead = games[winner] - games[other(winner)]
        var won = games[winner] >= setCfg.gamesToWin && lead >= setCfg.gameMargin
        if let cap = setCfg.maxGames, games[winner] >= cap { won = true }

        if !won {
            st.gamesStartedTotal = gamesStartedTotal
            st.currentGame = GameScore(points: [0, 0], winner: nil)
            var ns = set; ns.games = games
            st.sets[st.currentSetIndex] = ns
            return withServer(st)
        }
        var ns = set; ns.games = games; ns.winner = winner
        st.sets[st.currentSetIndex] = ns
        return closeSet(st, winner, gamesStartedTotal)
    }

    private func tiebreakPoint(_ s: MatchState, _ side: Int) -> MatchState {
        var st = s
        let set = st.sets[st.currentSetIndex]
        let tbCfg = configForSet(set.kind).tiebreak!
        var pts = set.tiebreak!.points; pts[side] += 1
        if let winner = tiebreakWinner(pts, tbCfg) {
            var games = set.games; games[winner] += 1
            let gamesStartedTotal = st.gamesStartedTotal + 1
            var ns = set; ns.games = games; ns.tiebreak = TiebreakScore(points: pts, winner: winner)
            ns.isTiebreak = false; ns.winner = winner
            st.sets[st.currentSetIndex] = ns
            return closeSet(st, winner, gamesStartedTotal)
        }
        var ns = set; ns.tiebreak = TiebreakScore(points: pts, winner: nil)
        st.sets[st.currentSetIndex] = ns
        return withServer(st)
    }

    private func awardPoint(_ s: MatchState, _ side: Int) -> MatchState {
        let set = s.sets[s.currentSetIndex]
        if set.isTiebreak { return tiebreakPoint(s, side) }
        var pts = s.currentGame.points; pts[side] += 1
        if let winner = resolveGamePoint(pts) { _ = winner; return closeGame(s, side) }
        var st = s; st.currentGame = GameScore(points: pts, winner: nil); return st
    }

    private func isFrozen(_ s: MatchState) -> Bool {
        guard s.complete else { return false }
        if cfg.match.playOutAfterMatchPoint, case .completed = s.outcome { return false }
        return true
    }

    func reduce(_ s: MatchState, _ action: Action) -> MatchState {
        func bump(_ x: MatchState) -> MatchState { var y = x; y.seq = s.seq + 1; return y }
        switch action {
        case .undo: return s
        case .replay: return bump(s)
        case let .retire(side):
            if case .inProgress = s.outcome {
                var st = s; st.outcome = .retired(winner: other(side), retiree: side); st.complete = true
                return bump(st)
            }
            return bump(s)
        case let .penalty(side, unit):
            if isFrozen(s) { return bump(s) }
            let beneficiary = other(side)
            let set = s.sets[s.currentSetIndex]
            if unit == "game" && !set.isTiebreak { return bump(closeGame(s, beneficiary)) }
            return bump(awardPoint(s, beneficiary))
        case let .pointTo(side):
            if isFrozen(s) { return bump(s) }
            return bump(awardPoint(s, side))
        }
    }
}
