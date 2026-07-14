import SwiftUI

/// Wrist-first scoring rendered from the full engine state: two giant tap zones
/// (tap your side to score, long-press to undo), a glanceable score with the
/// correct ladder/deuce/tiebreak label and a serve indicator, haptics on
/// game/set/match. Dark by default.
struct ContentView: View {
    @StateObject private var store = MatchStore()

    var body: some View {
        VStack(spacing: 2) {
            zone(side: 0)
            zone(side: 1)
        }
        .ignoresSafeArea()
    }

    private func zone(side: Int) -> some View {
        let s = store.state
        let set = s.sets[s.currentSetIndex]
        return Button {
            store.point(to: side)
        } label: {
            VStack(spacing: 4) {
                Text(pointLabel(side: side))
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Text(setsLine(side: side))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
                if s.servingSide == side {
                    Circle().fill(Color.yellow).frame(width: 8, height: 8)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(.plain)
        .background(side == 0 ? Color(white: 0.11) : Color(white: 0.16))
        .onLongPressGesture { store.undo() }
        .accessibilityLabel(side == 0 ? "Point to you" : "Point to opponents")
        .disabled(set.winner != nil && s.complete)
    }

    /// Games in each completed set for `side`, e.g. "6 4".
    private func setsLine(side: Int) -> String {
        store.state.sets.map { String($0.games[side]) }.joined(separator: "  ")
    }

    /// The point label: tiebreak count, or 0/15/30/40/AD from the ladder.
    private func pointLabel(side: Int) -> String {
        let s = store.state
        let set = s.sets[s.currentSetIndex]
        if set.isTiebreak, let tb = set.tiebreak {
            return String(tb.points[side])
        }
        let a = s.currentGame.points[0], b = s.currentGame.points[1]
        let ladder = ["0", "15", "30", "40"]
        let hi = max(a, b)
        if hi < ladder.count {
            let idx = side == 0 ? a : b
            return ladder[min(idx, ladder.count - 1)]
        }
        if a == b { return "40" }
        let mine = side == 0 ? a : b
        let theirs = side == 0 ? b : a
        return mine > theirs ? "AD" : "40"
    }
}
