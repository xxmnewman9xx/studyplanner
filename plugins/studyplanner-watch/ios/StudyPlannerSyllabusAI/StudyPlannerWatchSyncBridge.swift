import Foundation
import WatchConnectivity

final class StudyPlannerWatchSyncBridge: NSObject, WCSessionDelegate {
  private let timelineKey = "__expo_widgets_studyplanner.watch_timeline"
  private let payloadKey = "studyplannerWatchSnapshot"
  private let defaults = UserDefaults(suiteName: "group.com.mattnewman.studyplanner")
  private var lastPayloadData: Data?

  func activate() {
    guard WCSession.isSupported() else { return }

    let session = WCSession.default
    session.delegate = self
    session.activate()

    if let defaults {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(defaultsDidChange),
        name: UserDefaults.didChangeNotification,
        object: defaults
      )
    }

    sendLatestSnapshot()
  }

  @objc private func defaultsDidChange() {
    sendLatestSnapshot()
  }

  private func sendLatestSnapshot() {
    guard let snapshot = latestSnapshot(),
          let data = try? JSONSerialization.data(withJSONObject: snapshot, options: [.sortedKeys]),
          data != lastPayloadData else {
      return
    }

    lastPayloadData = data
    let payload = [payloadKey: snapshot]
    let session = WCSession.default

    if session.activationState == .activated {
      try? session.updateApplicationContext(payload)
      if session.isReachable {
        session.sendMessage(payload, replyHandler: nil, errorHandler: nil)
      }
    }
  }

  private func latestSnapshot() -> [String: Any]? {
    guard let timeline = defaults?.array(forKey: timelineKey) as? [[String: Any]] else {
      return nil
    }

    return timeline
      .compactMap { entry -> (timestamp: Int, props: [String: Any])? in
        guard let timestamp = entry["timestamp"] as? Int,
              let props = entry["props"] as? [String: Any] else {
          return nil
        }
        return (timestamp, props)
      }
      .sorted { $0.timestamp > $1.timestamp }
      .first?
      .props
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    sendLatestSnapshot()
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }
}
