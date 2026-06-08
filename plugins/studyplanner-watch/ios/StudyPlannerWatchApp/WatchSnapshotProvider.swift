import Foundation
import WatchConnectivity

final class WatchSnapshotProvider: NSObject, ObservableObject, WCSessionDelegate {
  @Published private(set) var snapshot: StudyPlannerWatchSnapshot

  private let store: StudyPlannerWatchSnapshotStore
  private let payloadKey = "studyplannerWatchSnapshot"

  init(store: StudyPlannerWatchSnapshotStore = StudyPlannerWatchSnapshotStore()) {
    self.store = store
    self.snapshot = store.load() ?? .noData()
    super.init()
  }

  func activate() {
    snapshot = store.load() ?? .noData()

    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()

    if let context = session.receivedApplicationContext[payloadKey] as? [String: Any],
       let nextSnapshot = store.save(dictionary: context) {
      snapshot = nextSnapshot
    }
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    DispatchQueue.main.async {
      self.snapshot = self.store.load() ?? .noData()
    }
  }

  func session(
    _ session: WCSession,
    didReceiveApplicationContext applicationContext: [String: Any]
  ) {
    receive(applicationContext)
  }

  func session(
    _ session: WCSession,
    didReceiveMessage message: [String: Any]
  ) {
    receive(message)
  }

  private func receive(_ message: [String: Any]) {
    guard let payload = message[payloadKey] as? [String: Any],
          let nextSnapshot = store.save(dictionary: payload) else {
      return
    }

    DispatchQueue.main.async {
      self.snapshot = nextSnapshot
    }
  }
}
