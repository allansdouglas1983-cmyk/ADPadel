import Foundation
import HealthKit

/// Runs a HealthKit workout session for the duration of a match so the player
/// gets heart-rate and calorie credit (dossier §3.7). Padel maps to the tennis
/// activity type. Live HR is published for optional on-screen display.
@MainActor
final class WorkoutManager: NSObject, ObservableObject {
    static let shared = WorkoutManager()

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    @Published var heartRate: Double = 0
    @Published var activeCalories: Double = 0

    func requestAuthorization() async {
        let types: Set = [
            HKQuantityType(.heartRate),
            HKQuantityType(.activeEnergyBurned),
            HKObjectType.workoutType(),
        ]
        try? await healthStore.requestAuthorization(toShare: [HKObjectType.workoutType()], read: types)
    }

    func start() {
        let config = HKWorkoutConfiguration()
        config.activityType = .tennis // padel is not a distinct HK type; tennis is closest
        config.locationType = .indoor
        guard let session = try? HKWorkoutSession(healthStore: healthStore, configuration: config) else { return }
        self.session = session
        builder = session.associatedWorkoutBuilder()
        builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
        builder?.delegate = self
        session.startActivity(with: Date())
        builder?.beginCollection(withStart: Date()) { _, _ in }
    }

    func end() {
        session?.end()
        builder?.endCollection(withEnd: Date()) { [weak self] _, _ in
            self?.builder?.finishWorkout { _, _ in }
        }
    }
}

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        for type in collectedTypes {
            guard let quantityType = type as? HKQuantityType,
                  let stats = workoutBuilder.statistics(for: quantityType) else { continue }
            Task { @MainActor in
                if quantityType == HKQuantityType(.heartRate) {
                    let unit = HKUnit.count().unitDivided(by: .minute())
                    self.heartRate = stats.mostRecentQuantity()?.doubleValue(for: unit) ?? self.heartRate
                } else if quantityType == HKQuantityType(.activeEnergyBurned) {
                    self.activeCalories = stats.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? self.activeCalories
                }
            }
        }
    }
}
