import Foundation
import SwiftUI

enum StudyPlannerWatchSnapshotState: String, Codable {
  case ready
  case setup
  case needsReview = "needs_review"
  case syncDisabled = "sync_disabled"
  case empty
}

struct StudyPlannerWatchSnapshotItem: Codable, Hashable, Identifiable {
  var id: String { "\(kind)-\(label)-\(title)" }

  var title: String
  var value: String
  var detail: String
  var label: String
  var color: String
  var kind: String
  var progress: Double?
}

struct StudyPlannerWatchSnapshotLabels: Codable, Hashable {
  var appName: String
  var nextDue: String
  var nextClass: String
  var exam: String
  var focus: String
  var semester: String
  var today: String
}

struct StudyPlannerWatchSnapshot: Codable, Hashable {
  var schemaVersion: Int
  var generatedAt: String
  var locale: String
  var state: StudyPlannerWatchSnapshotState
  var accentColor: String
  var backgroundColor: String
  var hero: StudyPlannerWatchSnapshotItem
  var semesterPulse: StudyPlannerWatchSnapshotItem
  var focus: StudyPlannerWatchSnapshotItem
  var todayProgress: StudyPlannerWatchSnapshotItem
  var nextAssignment: StudyPlannerWatchSnapshotItem
  var nextClass: StudyPlannerWatchSnapshotItem
  var examCountdown: StudyPlannerWatchSnapshotItem
  var rings: [StudyPlannerWatchSnapshotItem]
  var labels: StudyPlannerWatchSnapshotLabels

  static func noData() -> StudyPlannerWatchSnapshot {
    let setup = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.no_data.title"),
      value: String(localized: "watch.no_data.value"),
      detail: String(localized: "watch.no_data.detail"),
      label: String(localized: "watch.what_matters_next"),
      color: "#1476FF",
      kind: "setup",
      progress: 0
    )
    let focus = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.no_focus"),
      value: String(localized: "watch.ready"),
      detail: String(localized: "watch.open_iphone"),
      label: String(localized: "watch.focus"),
      color: "#22C55E",
      kind: "focus",
      progress: 0
    )
    let semester = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.semester"),
      value: String(localized: "watch.no_data.value"),
      detail: String(localized: "watch.no_data.detail"),
      label: String(localized: "watch.semester"),
      color: "#21B8A7",
      kind: "semester",
      progress: 0
    )
    let today = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.today_progress"),
      value: String(localized: "watch.clear"),
      detail: String(localized: "watch.no_data.detail"),
      label: String(localized: "watch.today"),
      color: "#8B3DFF",
      kind: "today",
      progress: 0
    )
    let nextDue = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.no_assignment"),
      value: String(localized: "watch.all_clear"),
      detail: String(localized: "watch.open_iphone"),
      label: String(localized: "watch.next_due"),
      color: "#1476FF",
      kind: "assignment",
      progress: 0
    )
    let nextClass = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.no_class"),
      value: String(localized: "watch.add_schedule"),
      detail: String(localized: "watch.open_iphone"),
      label: String(localized: "watch.next_class"),
      color: "#1476FF",
      kind: "class",
      progress: 0
    )
    let exam = StudyPlannerWatchSnapshotItem(
      title: String(localized: "watch.no_exam"),
      value: String(localized: "watch.safe"),
      detail: String(localized: "watch.no_exam_detail"),
      label: String(localized: "watch.exam"),
      color: "#FF5A1F",
      kind: "exam",
      progress: 0
    )

    return StudyPlannerWatchSnapshot(
      schemaVersion: 1,
      generatedAt: ISO8601DateFormatter().string(from: Date()),
      locale: Locale.current.identifier,
      state: .setup,
      accentColor: "#1476FF",
      backgroundColor: "#070A12",
      hero: setup,
      semesterPulse: semester,
      focus: focus,
      todayProgress: today,
      nextAssignment: nextDue,
      nextClass: nextClass,
      examCountdown: exam,
      rings: [semester, focus, today],
      labels: StudyPlannerWatchSnapshotLabels(
        appName: "StudyPlanner",
        nextDue: String(localized: "watch.next_due"),
        nextClass: String(localized: "watch.next_class"),
        exam: String(localized: "watch.exam"),
        focus: String(localized: "watch.focus"),
        semester: String(localized: "watch.semester"),
        today: String(localized: "watch.today")
      )
    )
  }
}

struct StudyPlannerWatchSnapshotStore {
  private let appGroupIdentifier = "group.com.mattnewman.studyplanner"
  private let storedSnapshotKey = "studyplanner.watch.snapshot.v1"
  private let expoTimelineKey = "__expo_widgets_studyplanner.watch_timeline"

  var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  func load() -> StudyPlannerWatchSnapshot? {
    if let data = defaults?.data(forKey: storedSnapshotKey),
       let snapshot = try? JSONDecoder().decode(StudyPlannerWatchSnapshot.self, from: data) {
      return snapshot
    }

    guard let timeline = defaults?.array(forKey: expoTimelineKey) as? [[String: Any]],
          let props = timeline
            .compactMap({ entry -> (timestamp: Int, props: [String: Any])? in
              guard let timestamp = entry["timestamp"] as? Int,
                    let props = entry["props"] as? [String: Any] else {
                return nil
              }
              return (timestamp, props)
            })
            .sorted(by: { $0.timestamp > $1.timestamp })
            .first?
            .props,
          let data = try? JSONSerialization.data(withJSONObject: props),
          let snapshot = try? JSONDecoder().decode(StudyPlannerWatchSnapshot.self, from: data) else {
      return nil
    }

    return snapshot
  }

  func save(_ snapshot: StudyPlannerWatchSnapshot) {
    guard let data = try? JSONEncoder().encode(snapshot) else { return }
    defaults?.set(data, forKey: storedSnapshotKey)
  }

  func save(dictionary: [String: Any]) -> StudyPlannerWatchSnapshot? {
    guard let data = try? JSONSerialization.data(withJSONObject: dictionary),
          let snapshot = try? JSONDecoder().decode(StudyPlannerWatchSnapshot.self, from: data) else {
      return nil
    }

    save(snapshot)
    return snapshot
  }
}

extension Color {
  init(studyPlannerHex hex: String) {
    let sanitized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var value: UInt64 = 0
    Scanner(string: sanitized).scanHexInt64(&value)

    let red: UInt64
    let green: UInt64
    let blue: UInt64

    if sanitized.count == 6 {
      red = (value & 0xFF0000) >> 16
      green = (value & 0x00FF00) >> 8
      blue = value & 0x0000FF
    } else {
      red = 20
      green = 118
      blue = 255
    }

    self.init(
      red: Double(red) / 255,
      green: Double(green) / 255,
      blue: Double(blue) / 255
    )
  }
}
