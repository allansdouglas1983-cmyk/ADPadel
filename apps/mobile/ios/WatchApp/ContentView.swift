import SwiftUI

/// Wrist-first scoring: two giant tap zones (tap your side to score, long-press
/// to undo), a glanceable score, and haptics on game/set/match. Dark by default.
struct ContentView: View {
    @StateObject private var store = MatchStore()

    var body: some View {
        VStack(spacing: 2) {
            zone(side: 0, points: store.state.pointsA, games: store.state.gamesA, sets: store.state.setsA)
            zone(side: 1, points: store.state.pointsB, games: store.state.gamesB, sets: store.state.setsB)
        }
        .ignoresSafeArea()
    }

    private func zone(side: Int, points: Int, games: Int, sets: Int) -> some View {
        Button {
            store.point(to: side)
        } label: {
            VStack {
                Text(pointLabel(points))
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .monospacedDigit()
                Text("\(sets)  ·  \(games)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .buttonStyle(.plain)
        .background(side == 0 ? Color(white: 0.11) : Color(white: 0.16))
        .onLongPressGesture { store.undo() }
        .accessibilityLabel(side == 0 ? "Point to you" : "Point to opponents")
    }

    /// 0/15/30/40 ladder, mirroring the engine's display helper.
    private func pointLabel(_ raw: Int) -> String {
        switch raw {
        case 0: return "0"
        case 1: return "15"
        case 2: return "30"
        default: return "40"
        }
    }
}
